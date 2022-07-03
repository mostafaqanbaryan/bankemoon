const router		 = require('express').Router();
const fs				 = require('fs');
const db				 = require('../db');
const cache			 = require('../cache');
const v					 = require('../validation');
const uuidv4		 = require('uuid/v4');
const CodedError = require('../Error');
const config		 = require('config');
const multer		 = require('multer');
const sharp			 = require('sharp');
const {
	check,
	validationResult
} = require('express-validator/check');
const {
	now,
	handle_result,
	handle_fail,
	handle_error,
	bcrypt_password,
	activationCode
} = require('../utils');

/*
 * Todo
 *
 * Only admin could see /users/
 * Check DELETE safety
 */

// Bring Model
const User	 = require('../Models/user');
const Visit  = require('../Models/visit');
const upload = multer({
	dest: config.avatar.path.user,
	fileFilter: (req, file, cb) => {
		/* let canvas = require('canvas');
		let image = canvas.Image;
		image.onload = () => {
			cb(null, true);
		};
		image.onerror = () => {
			cb(null, false);
		};
		image.src = URL.createObjectURL(file);
		image.src = file;*/
		if(!file.originalname.match(/\.jpg$/))
			return cb(new CodedError(415, 'فایل معتبر نیست'));
		cb(null, true);
	},
	limits: {
		fieldSize: 128 * 1024, //128 Kb
		fileSize: 128 * 1024, //128 Kb
		files: 1,
	}
}).single('file');

// Config file
const constant = require('../constant');

// Validations
/* const v_name = [
	check('firstName')
	.isLength({min: 3}).withMessage('نام خود را به صورت صحیح وارد کنید')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage('نام باید از حروف فارسی تشکیل شده باشد'),

	check('lastName')
	.isLength({min: 3}).withMessage('نام خانوادگی خود را به صورت صحیح وارد کنید')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage('نام خانوادگی باید از حروف فارسی تشکیل شده باشد'),

	check('userName')
	.isLength({min: 3}).withMessage('نام کاربری خود را به صورت صحیح وارد کنید')
	.matches(/^(?=[A-Za-z])([A-Za-z0-9_]{5,})$/).withMessage('نام کاربری باید از حروف انگلیسی و اعداد تشکیل شده باشد'),
]; */

const v_passwordExists = [
	check('password')
	.custom((password, {req}) => {
		// Check for minimum length
		if(password.length < 8)
			throw new Error('طول رمز عبور باید حداقل 8 کاراکتر باشد');
		return password;
	})
	.custom((password, {req}) => {
		// Check for letter existance
		let match = password.match(/[a-zA-Z]+/);
		if(!match || match.length <= 0 || match[0] === '')
			throw new Error('استفاده از حروف انگلیسی در رمز عبور اجباری است');
		return password;
	})
	.custom((password, {req}) => {
		// Check for number existance
		match = password.match(/[0-9]+/);
		if(!match || match.length <= 0 || match[0] === '')
			throw new Error('استفاده از اعداد در رمز عبور اجباری است');
		return password;
	}),
	check('oldPassword')
	.isLength({min: 8}).withMessage('رمز عبور قبلی را به صورت صحیح وارد کنید')
];

const v_email = [
	check('email')
	.isEmail()
	.isLength({min: 3})
	.withMessage('ایمیل خود را به صورت صحیح وارد کنید')
];

const v_username = [
	check('username')
	.isLength({min: 5}).withMessage('نام کاربری خود را به صورت صحیح وارد کنید')
	.matches(/^(?=[A-Za-z])([A-Za-z0-9_]{5,})$/).withMessage('نام کاربری باید از حروف انگلیسی و اعداد تشکیل شده باشد'),
];

const v_code = [
	check('code')
	.isInt()
	.isLength({min: 6, max: 6})
	.withMessage('کد فعالسازی را به صورت صحیح وارد کنید')
];

const v_two_step = [
	check('value')
	.isBoolean()
	.withMessage('مقدار وارد شده صحیح نیست')
];

// Functions
const getSnapshotFromDB = function(memory, userId){
	let client = null;
	let user = {};
	return db.getClientAsync()
		.then(c => client = c)
		.then(() => User.getById(client, userId))
		.then(u => {
			if(!u) 
				throw new CodedError(404, 'کاربر یافت نشد');

			user = {
				id: u.id,
				full_name: u.first_name + (u.last_name ? ' ' + u.last_name : ''),
				username: u.username,
				phone: u.phone,
				// avatar: u.avatar ? `${config.avatar.cdn.user}/${u.avatar}` : null
				avatar: u.avatar
			};
			return User.getRole(client, userId);
		})
		.then(role => {
			if(role)
				user.role = role;
			memory.hset(constant.memory.users.SNAPSHOT, userId, JSON.stringify(user));
			client.release();
			return user;
		})
		.catch(err => {
			if(client)
				client.release();
			throw err;
		});
};

const getBadgesFromDB = function(memory, userId){
	let client = null;
	return db.getClientAsync()
		.then(c => client = c)
		.then(() => User.getBadges(client, userId))
		.then(badges => {
			memory.hset(constant.memory.users.BADGES, userId, JSON.stringify(badges));
			client.release();
			return badges;
		})
		.catch(err => {
			if(client)
				client.release();
			throw err;
		});
};

// Snapshot
router.get('/snapshot', (req, res) => {
	const memory = cache.getClient();
	const result = {};
	return memory.hget(constant.memory.users.SNAPSHOT, req.userId)
		.then(user => {
			if(user)
				return JSON.parse(user);
			return getSnapshotFromDB(memory, req.userId);
		})
		.then(user => {
			result.user = user;
			result.user.avatar = user.avatar ? config.avatar.cdn.user + user.avatar : null;
			return memory.hget(constant.memory.users.BADGES, req.userId);
		})
		.then(badges => {
			if(badges)
				return JSON.parse(badges);
			return getBadgesFromDB(memory, req.userId);
		})
		.then(badges => {
			result.badges = badges;
			return handle_result(res, null, result.user, result);
		})
		.catch(err => handle_fail(res, err.message, err.code));
});

// Get badges
router.get('/badges', (req, res) => {
	const memory = cache.getClient();
	memory.hget(constant.memory.users.BADGES, req.userId)
		.then(badges => {
			if(badges)
				return JSON.parse(badges);
			return getBadgesFromDB(memory, req.userId);
		})
		.then(badges => handle_result(res, 'badges', badges, badges))
		.catch(err => handle_fail(res, err.message, err.code));
});

// Show all users
/* router.get('/', (req, res) => {
	db.getClient((err, client, done) => {
		// Error happend in getting client
		if(err)
			return handle_fail(res, err);

		let query = `SELECT first_name, last_name, username, email, phone FROM ${constant.tables.USERS} ORDER BY first_name ASC, last_name ASC;`;

		// Get users
		return client.query(query)
			.then(users => handle_result(res, 'users', users.rows, users.rows))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
}); */

// Show me
router.get('/me', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err);

		let user = {};
		User.getById(client, req.userId)
			.then(u => {
				if(!u)
					throw new CodedError(404, 'کاربر یافت نشد');

				user = u;
				user.avatar = user.avatar ? `${config.avatar.cdn.user}/${user.avatar}` : null;
				delete user.password;
				return handle_result(res, 'user', user, user);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.PROFILE, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});


// Update Password
router.put('/me/password', v_passwordExists, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	const userId = req.userId;
	const oldPassword = req.body.oldPassword;
	const newPassword = req.body.password;

	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err);

		return User.updatePassword(client, userId, oldPassword, newPassword)
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Toggle 2-step Verification
router.put('/me/two-step-verification', v_two_step, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err);

		// Update fields
		const value = req.body.value;
		const userId = req.userId;

		User.setOption(client, userId, '2sv', value)
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Active Email
router.put('/me/email', v_email, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err);

		// Update fields
		const email = req.body.email;
		const userId = req.userId;

		User.activeEmail(client, userId, email)
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Update Username
router.put('/me/username', v_username, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err);

		// Update fields
		const username = req.body.username;
		const fields = {
			username 
		};
		const where = {
			id: req.userId
		};

		User.getByUsername(client, username, true)
			.then(user => {
				if(user)
					throw new CodedError(409, 'این نام متعلق به شخص دیگری است');
				return User.update(client, fields, where);
			})
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Set default Email as Active Email
router.patch('/me/email', v_code, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err);

		// Update fields
		const code = req.body.code;
		const userId = req.userId;

		User.updateEmail(client, userId, code)
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Upload avatar
router.put('/me/avatar', (req, res) => {
	upload(req, res, err => {
		// Handle exceptions
		if(err) {
			let message = err.message;
			if(message.indexOf('large') !== -1)
				message = 'حداکثر حجم مجاز 128 کیلوبایت است';
			return handle_fail(res, message, 415);
		}

		// Upload succeed
		const userId = req.userId;
		const file = req.file;
		const avatarFilename = file.filename+'.jpg';
		const avatarPath = config.avatar.path.user + avatarFilename;
		const memory = cache.getClient();

		// Resize and delete unsized file
		return sharp(file.path)
			.resize(96, 96)
			.crop(sharp.strategy.entropy)
			.toFile(avatarPath)
			.catch(err => { throw new CodedError(415, 'عکس معتبر نیست'); })
			.then(() => {
				// Integrate with database
				db.getClient((err, client, done) => {
					if(err)
						throw new CodedError(500, 'ارتباط با دیتابیس برقرار نشد');

					const fields = {
						avatar: avatarFilename
					};
					const where = {
						id: userId
					};

					// Delete old avatar
					User.getById(client, userId)
						// Update avatar
						.then(user => {
							if(user.avatar)
								fs.unlinkSync(config.avatar.path.user + user.avatar);
							return User.update(client, fields, where);
						})
						.then(isUpdated => handle_result(res, 'avatar', isUpdated, config.avatar.cdn.user + avatarFilename))
						.catch(err => handle_fail(res, err.message, err.code))
						.then(() => client.release());
				});
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => fs.unlinkSync(file.path))
			.then(() => memory.hget(constant.memory.users.SNAPSHOT, userId))
			.then(user => {
				if(user){
					const u = JSON.parse(user);
					u.avatar = avatarFilename;
					memory.hset(constant.memory.users.SNAPSHOT, userId, JSON.stringify(u));
				}
			});
	});
});

// Delete avatar
router.delete('/me/avatar', (req, res) => {
	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			throw new CodedError(500, 'ارتباط با دیتابیس برقرار نشد');

		const memory = cache.getClient();
		const userId = req.userId;
		const fields = {
			avatar: null
		};
		const where = {
			id: userId
		};

		// Delete old avatar
		User.getById(client, userId)
			// Update avatar
			.then(user => {
				if(user.avatar)
					fs.unlinkSync(config.avatar.path.user + user.avatar);
				return User.update(client, fields, where);
			})
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => memory.hget(constant.memory.users.SNAPSHOT, userId))
			.then(user => {
				if(user){
					const u = JSON.parse(user);
					u.avatar = null;
					memory.hset(constant.memory.users.SNAPSHOT, userId, JSON.stringify(u));
				}
			});
	});
});

// Delete user
router.delete('/me', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		const userId = req.userId;
		User.delete(client, userId)
			.then(isDeleted => handle_result(res, null, isDeleted, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
	});
});


module.exports = router;
