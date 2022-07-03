const CodedError = require('./Error');
const {
	handle_fail,
	handle_result,
	sanitize,
	isAdmin,
	isBankAdmin} = require('./utils');
const log			 = require('./log');
const db			 = require('./db');
const cache		 = require('./cache');
const util		 = require('util');

// Bring Models
const User		= require('./Models/user');
const Bank		= require('./Models/bank');
const Post		= require('./Models/post');
const Captcha = require('./Models/captcha');

// Config
const constant = require('./constant');

const getUserFromDB = function(bankUsername, userId){
	const args	 = [bankUsername, userId];
	const query  =
		`SELECT
			*
		FROM ${constant.tables.BANKSUSERSSEARCH} AS SEARCH
		WHERE bank_id=(SELECT id FROM ${constant.tables.BANKS} WHERE username=$1 LIMIT 1) AND user_id=$2
		LIMIT 1;`;
	let client = null;
	return db.getClientAsync()
		.then(c => client = c)
		.then(() => client.query(query, args))
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0] || result.rows[0].status)
					throw new CodedError(403, 'ابتدا باید عضو بانک شوید');

				let user	= result.rows[0];
				user.role = user.role || constant.role.BANKMEMBER;
				user.id = user.bank_user_id;
				return user;
			})
		.then(user => {
			client.release();
			return user;
		})
		.catch(err => {
			if(client)
				client.release();
			throw err;
		});
};

const getUserFromCache = function(memoryGet){
	return memoryGet()
		.then(user => {
			if(user)
				return JSON.parse(user);
		});
};

module.exports = {
	isUser: expectedRole => (req, res, next) => {
		const userId = req.userId;
		const bankUsername = req.params.bankUsername;
		const memory = cache.getClient();
		const key = constant.memory.banks.BANKSUSERS(bankUsername);
		const memorySet = user => memory.hset(key, userId, JSON.stringify(user));
		const memoryGet = () => memory.hget(key, userId);

		if(!expectedRole || !constant.role.level[expectedRole])
			return handle_fail(res, 'چنین مقامی وجود ندارد', 404);

		switch(expectedRole){
			case constant.role.CREATOR:
			case constant.role.BANKADMIN:
			case constant.role.BANKMEMBER:
				return getUserFromCache(memoryGet)
					.then(user => {
						if(user)
							return user;
						return getUserFromDB(bankUsername, userId);
					})
					.then(user => {
						if(!user.bank_user_id) {
							throw new CodedError(403, 'ابتدا باید عضو بانک شوید');
						}
						else if(!expectedRole || !constant.role.level[expectedRole]) {
							throw new CodedError(404, 'چنین مقامی وجود ندارد');
						}
						else if(constant.role.level[expectedRole] > constant.role.level[user.role]) {
							memorySet(user);
							throw new CodedError(403, 'دسترسی برای شما مجاز نیست');
						}
						else {
							memorySet(user);
							req.user = user;
							next();
						}
					})
					.catch(err => {
						// Release db
						/* if(client)
							client.release(); */
						return handle_fail(res, err.message, err.code);
					});
			default:
				return handle_fail(res, 'چنین مقامی وجود ندارد', 404);
		}
	},

	isPostedUser: expectedRole => (req, res, next) => {
		const userId = req.body.id;
		const bankUsername = req.params.bankUsername;
		const memory = cache.getClient();
		const key = constant.memory.banks.BANKSUSERS(bankUsername);
		const memorySet = user => memory.hset(key, userId, JSON.stringify(user));
		const memoryGet = () => memory.hget(key, userId);

		if(!userId || userId <= 0)
			return handle_fail(res, 'شماره کاربر را به صورت صحیح وارد کنید', 422);
		if(!expectedRole || !constant.role.level[expectedRole])
			return handle_fail(res, 'چنین مقامی وجود ندارد', 404);

		switch(expectedRole){
			case constant.role.CREATOR:
			case constant.role.BANKADMIN:
			case constant.role.BANKMEMBER:
				return getUserFromCache(memoryGet)
					.then(user => {
						if(user)
							return user;
						return getUserFromDB(bankUsername, userId);
					})
					.then(user => {
						if(!user.bank_user_id) {
							throw new CodedError(403, 'ابتدا باید کاربر را در بانک عضو کنید');
						}
						else if(!expectedRole || !constant.role.level[expectedRole]) {
							throw new CodedError(404, 'چنین مقامی وجود ندارد');
						}
						else if(constant.role.level[expectedRole] > constant.role.level[user.role]) {
							memorySet(user);
							throw new CodedError(403, 'دسترسی برای کاربر مجاز نیست');
						}
						else {
							memorySet(user);
							req.postedUser = user;
							next();
						}
					})
					.catch(err => {
						// Release db
						/* if(client)
							client.release(); */
						return handle_fail(res, err.message, err.code);
					});
			default:
				return handle_fail(res, 'چنین مقامی وجود ندارد', 404);
		}
	},

	duplicatePost(req, res, next){
		// For editing purpose, make exception for itself
		if(!req.body.title || !req.body.slug)
			return next(); // Catch by verifier

		let pid		= req.params.postId || 0;
		let title = req.body.title;
		let slug	= sanitize.slug(req.body.slug);

		// Get bank by name
		db.getClient((err, client, done) => {
			// Check for title
			Post.getByTitle(client, title, pid)
			.then(post => {
				if(post)
					throw new CodedError(409, 'این عنوان برای پست دیگری انتخاب شده است');

				// Check for slug
				return Post.getBySlug(client, slug, pid);
			})
			.then(post => {
				if(post)
					throw new CodedError(409, 'این نامک برای پست دیگری انتخاب شده است');
				return next();
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
		});
	},

	captchaValidation(req, res, next){
		if(process.env.NODE_ENV === process.env.NODE_TEST || process.env.NODE_ENV === process.env.NODE_DEVELOPMENT)
			return next();
		let captchaId = req.body.captchaId;
		let captchaValue = req.body.captchaValue;
		let clientIp = req.clientIp;
		let userAgent = req.headers['user-agent'];

		/* db.getClient((err, client, done) => {
			if(err)
				return handle_fail(res, err); */

			Captcha.validation(client, captchaId, captchaValue, clientIp, userAgent)
				.then(isValid => {
					if(!isValid)
						throw new CodedError(401, 'کد امنیتی وارد شده اشتباه است');
					return next();
				})
				.catch(err => handle_fail(res, err.message, err.code));
				// .then(() => client.release());
		// });
	},
};
