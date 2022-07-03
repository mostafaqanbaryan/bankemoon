const CodedError = require('../Error');
const router		 = require('express').Router();
const db				 = require('../db');
const v					 = require('../validation');
const constant	 = require('../constant');
const authFunc	 = require('../auth');
const bcrypt		 = require('bcrypt');
const uuidv4		 = require('uuid/v4');
// const Email	 = require("../email/index.jsx");
const {
	check,
	validationResult
} = require('express-validator/check');
const {
	now,
	handle_result,
	handle_fail,
	bcrypt_password,
} = require('../utils');


// Models
const User = require('../Models/user');
const Bank = require('../Models/bank');
const Session = require('../Models/session');

const v_name = [
	check('firstName')
	.isLength({min: 3}).withMessage('نام خود را به صورت صحیح وارد کنید')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage('نام باید از حروف فارسی تشکیل شده باشد'),

	check('lastName')
	.isLength({min: 3}).withMessage('نام خانوادگی خود را به صورت صحیح وارد کنید')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage('نام خانوادگی باید از حروف فارسی تشکیل شده باشد'),

	/* check('userName')
	.isLength({min: 3}).withMessage('نام کاربری خود را به صورت صحیح وارد کنید')
	.matches(/^(?=[A-Za-z])([A-Za-z0-9_]{5,})$/).withMessage('نام کاربری باید از حروف انگلیسی و اعداد تشکیل شده باشد'), */
];

const v_password = [
	check('password')
	.exists()
	.isLength({min: 8}).withMessage('طول رمز عبور باید حداقل 8 کاراکتر باشد')
	.matches(/(((?=\d)\d[a-zA-Z])|((?=[a-zA-Z])\w\d))/).withMessage('استفاده از حروف انگلیسی در رمز عبور اجباری است')
];

const v_phone = [
	check('phoneNumber')
	.isLength({min: 11, max: 11}).withMessage('شماره همراه را به صورت 11 رقمی وارد کنید')
	.matches(/09\d{9}/).withMessage('شماره همراه را به صورت صحیح وارد کنید'),
];

const v_passwordExists = [
	check('password')
	/* .custom((password, {req}) => {
		// For updating user without updating password
		if(!req.body.password || req.body.password === '')
			return true;

		let result = [];

		// Check for minimum length
		if(password.length < 8)
			result.push('طول رمز عبور باید حداقل 8 کاراکتر باشد');

		// Check for letter existance
		let match = password.match(/[a-zA-Z]+/);
		if(!match || match.length <= 0 || match[0] === '')
			result.push('استفاده از حروف انگلیسی در رمز عبور اجباری است');

		// Check for number existance
		match = password.match(/[0-9]+/);
		if(!match || match.length <= 0 || match[0] === '')
			result.push('استفاده از اعداد در رمز عبور اجباری است');
		
		if(result.length > 0){
			throw new CodedError(result);
		}
		return password;
	}) */
	.custom((password, {req}) => {
		// For updating user without updating password
		if(!req.body.password || req.body.password === '')
			return true;

		// Check for minimum length
		if(password.length < 8)
			throw new CodedError(422, 'طول رمز عبور باید حداقل 8 کاراکتر باشد');
		return password;
	})
	.custom((password, {req}) => {
		// For updating user without updating password
		if(!req.body.password || req.body.password === '')
			return true;

		// Check for letter existance
		let match = password.match(/[a-zA-Z]+/);
		if(!match || match.length <= 0 || match[0] === '')
			throw new CodedError(422, 'استفاده از حروف انگلیسی در رمز عبور اجباری است');
		return password;
	})
	.custom((password, {req}) => {
		// For updating user without updating password
		if(!req.body.password || req.body.password === '')
			return true;

		// Check for number existance
		match = password.match(/[0-9]+/);
		if(!match || match.length <= 0 || match[0] === '')
			throw new CodedError(422, 'استفاده از اعداد در رمز عبور اجباری است');
		return password;
	})
];

// Register user
router.post('/register', v.captchaValidation, v_name, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// Update fields
	let password = uuidv4().substr(0, 15);
	let fields = {
		first_name: req.body.firstName,
		last_name: req.body.lastName,
		username: req.body.userName,
		email: req.body.email,
		phone: req.body.phoneNumber,
		password
	};

	// Insert to databse
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		User.add(client, fields)
			.then(isAdded => {
				if(!isAdded)
					throw new CodedError(500, 'عضویت با مشکل مواجه شد');
				return handle_result(res, null, isAdded, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Register user By bankAdmin
router.put('/register/:bankUsername', authFunc.authenticate, v.isUser(constant.role.BANKADMIN), v_name, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	const bankUsername = req.params.bankUsername;
	const adminUserId = req.userId;
	const bankId = req.user.bank_id;
	const password = uuidv4().substr(0, 15);
	if(!adminUserId)
		return handle_fail(res, 'شماره کاربر وجود ندارد', 403);

	const fields = {
		first_name: req.body.firstName,
		last_name: req.body.lastName,
		phone: req.body.phoneNumber,
		password
	};

	// Insert to databse
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		User.add(client, fields, adminUserId)
			.then(isAdded => {
				if(!isAdded)
					throw new CodedError(500, 'عضویت با مشکل مواجه شد');
				return Bank.addMemberByType(client, bankId, 'phonenumber', fields.phone);
			})
			.then(isAdded => {
				if(!isAdded)
					throw new CodedError(500, 'افتتاح حساب با مشکل مواجه شد');
				return handle_result(res, null, isAdded, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Login user
router.post('/login'/*, getIp*/, v.captchaValidation, v_phone, v_password, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	let phone = req.body.phoneNumber;
	let password = req.body.password;
	let usr = null;
	if(!phone || phone.toString().search(/^\d{11}$/) === -1)
		return handle_fail(res, 'شماره را به صورت صحیح وارد کنید', 422);

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		User.getByPhone(client, phone, true)
			.then(user =>{
				// Wrong phoneNumber
				if(!user)
					throw new CodedError(401, 'اطلاعات حساب کاربری صحیح نیست');

				usr = user;
				return bcrypt.compare(password, user.password);
			})
			.then(isMatch => {
				if(isMatch)
					return Session.create(client, usr.id, req.headers['user-agent'], req.clientIp);
				// throw new CodedError(401, 'رمز عبور اشتباه است');
					throw new CodedError(401, 'اطلاعات حساب کاربری صحیح نیست');
			})
			.then(session => {
				if(session)
					return handle_result(res, null, session, session);
				throw new CodedError(500, 'ایجاد سشن با مشکل مواجه شد');
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

router.post('/forgot-password'/*, getIp*/, v.captchaValidation, v_phone, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	const phoneNumber = req.body.phoneNumber;
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		User.forgotPassword(client, phoneNumber)
			.then(isSent => handle_result(res, null, isSent, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

router.post('/reset-password'/*, getIp*/, v.captchaValidation, v_password, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	const code = req.body.code;
	const password = req.body.password;
	const phoneNumber = req.body.phoneNumber;
	if(code.search(/^\d{6}$/) !== 0)
		return handle_fail(res, 'کد صحیح نیست', 406);

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		const fields = {
			password,
			phone_validate: true
		};
		const where = {
			phone: phoneNumber
		};

		let userId = 0;
		User.getByPhone(client, phoneNumber)
			.then(user => {
				if(!user)
					throw new CodedError(404, 'این شماره ثبت نشده است');
				userId = user.id;
				return User.getOption(client, userId, 'activation-code', 10*60); // 10 Min
			})
			.then(option => {
				if(!option){
					throw new CodedError(410, 'درخواست شما باطل شده است\nدوباره از «بخش فراموش کردن رمز عبور» اقدام کنید');
				}
				else if(option !== code){
					throw new CodedError(410, 'کد فعالسازی اشتباه است');
				}
				return User.update(client, fields, where);
			})
			.then(isUpdated => {
				if(!isUpdated)
					throw new CodedError(500, 'رمز عبور بروز نشد\nدوباره امتحان کنید');
				return User.deleteOption(client, userId, 'activation-code');
			})
			.then(isDeleted => {
				if(!isDeleted)
					throw new CodedError(500, 'عملیات با مشکل مواجه شد');
				return handle_result(res, null, isDeleted, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

module.exports = router;
