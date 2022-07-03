const CodedError = require('../Error');
const router		 = require('express').Router();
const db				 = require('../db');
const cache			 = require('../cache');
const fs				 = require('fs');
const v					 = require('../validation');
const auth			 = require('../auth');
const config		 = require('config');
const multer		 = require('multer');
const sharp			 = require('sharp');
const utils			 = require('../utils');
const {
	check,
	body,
	validationResult
} = require('express-validator/check');
const {
	handle_result,
	handle_fail,
	handle_error,
} = require('../utils');

/*
 * Todo
 * Cache allMembers
 *
 */

// Config file
const constant = require('../constant');

// Bring Bank Model
const Transaction = require('../Models/transaction');
const Message = require('../Models/message');
const Visit = require('../Models/visit');
const Bank = require('../Models/bank');
const User = require('../Models/user');
const upload = multer({
	dest: config.avatar.path.bank,
	fileFilter: (req, file, cb) => {
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

// Validations
const bankValidation = [
	// Safty Check
	check('name')
	.isLength({min: 3}).withMessage('طول نام فارسی باید حداقل 3 حرف باشد')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage("نام فارسی باید از کاراکترهای فارسی تشکیل شده باشد"),

	check('initial')
	.optional()
	.isInt({min: -999999999, max: 999999999}).withMessage('حداکثر مبلغ سرمایه 999,999,999 تومان می‌باشد'),

	check('description')
	.isLength({max: 64}),
];
const bankUserNameValidation = [
	check('username')
	.isLength({min: 5}).withMessage('طول نام انگلیسی باید حداقل 3 حرف باشد')
	.matches(/^[a-zA-Z0-9_]+$/).withMessage('حروف مجاز برای نام انگلیسی شامل اعداد و حروف انگلیسی و _ می‌باشد')
];
const userValidation = [
	body('key')
	.exists().withMessage('کلید را انتخاب کنید'),

	body('value')
	.exists().withMessage('مقدار درستی وارد نشده است'),
];
const adminValidation = [
	body('id')
	.exists().withMessage('ماره کاربری را وارد کنید')
	.isInt({min: 0}).withMessage('شماره وارد شده معتبر نیست'),
];
const messageValidation = [
	body('subject')
	.exists().withMessage('موضوع پیام را وارد کنید')
	.isLength({min: 3}).withMessage('موضوع پیام کوتاه است'),

	body('content')
	.exists().withMessage('متن پیام را وارد کنید')
	.isLength({min: 10}).withMessage('متن پیام کوتاه است'),

	body('ids')
	.exists().withMessage('کاربری وارد نشده است')
	.isJSON().withMessage('کاربران را به صورت صحیح وارد کنید'),

	body('toAllUsers')
	.exists().withMessage('مقدار ارسالی را وارد کنید')
	.isBoolean().withMessage('مقدار ارسالی مشکل دارد')
];

function getBankInfoFromDB(bankUsername, userId){
	let client = null;
	return db.getClientAsync()
		.then(c => client = c)
		.then(() => Bank.getInfo(client, bankUsername, userId))
		.then(bank => {
			bank.info.avatar = bank.info.avatar ? `${config.avatar.cdn.bank}/${bank.info.avatar}` : null;
			client.release();
			return bank;
		})
		.catch(err => {
			if(client)
				client.release();
			throw err;
		});
}

function getAdmins(memory, bankId){
	return getAdminsFromCache(memory, bankId)
		.then(admins => {
			if(admins)
				return admins;
			return getAdminsFromDB(memory, bankId);
		});
}

function getAdminsFromCache(memory, bankId){
	return memory.hget(constant.memory.banks.ADMINS, bankId)
		.then(admins => {
			if(admins)
				return JSON.parse(admins);
		});
}

function getAdminsFromDB(memory, bankId){
	let client = null;
	return db.getClientAsync()
		.then(c => client = c)
		.then(() => Bank.getAdmins(client, bankId))
		.then(admins => {
			memory.hset(constant.memory.banks.ADMINS, bankId, JSON.stringify(admins));
			client.release();
			return admins;
		})
		.catch(err => {
			if(client)
				client.release();
			throw err;
		});
}

function getBalance(memory, bankId){
	return getBalanceFromCache(memory, bankId)
		.then(balance => {
			if(balance)
				return balance;
			return getBalanceFromDB(memory, bankId);
		});
}

function getBalanceFromCache(memory, bankId){
	return memory.hget(constant.memory.banks.BALANCE, bankId)
		.then(balance => {
			if(balance)
				return JSON.parse(balance);
		});
}

function getBalanceFromDB(memory, bankId){
	let client = null;
	return db.getClientAsync()
		.then(c => client = c)
		.then(() => Transaction.getBalance(client, bankId))
		.then(result => {
			if(!result)
				throw new CodedError(500, 'دریافت اطلاعات با مشکل ایجاد شد');
			memory.hset(constant.memory.banks.BALANCE, bankId, JSON.stringify(result));
			client.release();
			return result;
		})
		.catch(err => {
			if(client)
				client.release();
			throw err;
		});
}

// Show/Search all banks
router.get('/', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		const key = req.query.type;
		const value = req.query.value;
		const page = req.query.page ? parseInt(req.query.page) : 1;

		// Get all
		if(!key || !value){
			Bank.getAll(client, req.userId, page)
				.then(result => {
					const banks = result.banks.map(b => {
						b.avatar = b.avatar ? `${config.avatar.cdn.bank}/${b.avatar}` : null;
						return b;
					});
					result.banks = banks;
					return handle_result(res, null, banks, result);
				})
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => Visit.add(client, constant.visits.ALLBANKS, req.headers))
				.catch(err => handle_error(res, err.message, err.code))
				.then(() => client.release());
		}

		// Search
		else {
			Bank.searchBanks(client, key, value)
				.then(result => {
					const banks = result.map(b => {
						b.avatar = b.avatar ? `${config.avatar.cdn.bank}/${b.avatar}` : null;
						return b;
					});
					return handle_result(res, 'banks', banks, banks);
				})
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => Visit.add(client, constant.visits.ALLBANKS, req.headers))
				.catch(err => handle_error(res, err.message, err.code))
				.then(() => client.release());
		}
	});
});

// Show all plans
/* router.get('/plans', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		const page = req.query.page ? parseInt(req.query.page) : 1;
		Bank.getAll(client, req.userId, page)
			.then(result => {
				const banks = result.banks.map(b => {
					b.avatar = b.avatar ? `${config.avatar.cdn.bank}/${b.avatar}` : null;
					return b;
				});
				result.banks = banks;
				return handle_result(res, null, banks, result);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSPLANS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
}); */

// Add new bank
router.post('/', bankValidation, bankUserNameValidation, /*v.duplicateBankName,*/ (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// Create fields
	let fields = {
		name				: req.body.name,
		username		: req.body.username,
	};

	// Create options
	let options = {
		initial : req.body.initial,
	};

	// Create bank & Add it to user & set current(JWT) user as admin
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.add(client, fields, options, req.userId)
			.then(isCreated => {
				if(!isCreated)
					throw new CodedError(500, 'ساخت بانک با مشکل مواجه شد');
				return isCreated;
			})
			.then(isCreated => handle_result(res, null, isCreated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// BankInfo
router.get('/:bankUsername', (req, res) => {
	const bankUsername = req.params.bankUsername;
	return getBankInfoFromDB(bankUsername, req.userId)
		.then(bank => handle_result(res, 'bank', bank, bank))
		.catch(err => handle_fail(res, err.message, err.code));
});

// Bank Options (Desc/Rules/Shaba)
router.get('/:bankUsername/options', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.getOptions(client, req.params.bankUsername, req.userId)
			.then(rows => {
				if(rows){
					let options = {};
					rows.forEach(row => row.value ? options[row.key] = row.value : false);
					handle_result(res, 'options', options, options);
				}else{
					handle_result(res, 'options', {}, {});
				}
			})
			.catch(err => handle_fail(res, err))
			.then(() => client.release());
	});
});

// Bank Info (Admins/Transaction balance)
router.get('/:bankUsername/info', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	const memory = cache.getClient();
	const bankId = req.user.bank_id;
	const result = {};
	getAdmins(memory, bankId)
		.then(admins => result.admins = admins)
		.then(() => getBalance(memory, bankId))
		.then(balance => result.balance = balance)
		.then(() => handle_result(res, null, result, result))
		.catch(err => handle_fail(res, err.message, err.code));
});

// Edit bank
router.patch('/:bankUsername', v.isUser(constant.role.BANKADMIN), /*v.duplicateBankName,*/ bankValidation, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}


	// Update fields
	let fields = {
		name: req.body.name,
	};

	let options = {
		description: req.body.description,
		rules: req.body.rules,
		shaba: req.body.shaba,
		owner: req.body.owner,
	};

	// Where Clause
	let where = {
		username: req.params.bankUsername
	};

	// Integration with database
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.update(client, fields, where, options)
			.then(isEdited => handle_result(res, null, isEdited, null))
			.catch(err => handle_fail(res, err))
			.then(() => Visit.add(client, constant.visits.BANKSEDIT, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Add admin to bank
router.post('/:bankUsername/admins', v.isUser(constant.role.BANKADMIN), adminValidation, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	const bankUsername = req.params.bankUsername;
	let adminId  = req.userId;
	let adminRole = req.user.role;
	let clientId = req.body.id;
	let bankId = req.user.bank_id;
	let bankUser = null;
	const memory = cache.getClient();

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.getMember(client, bankId, clientId)
			.then(bu => {
				bankUser = bu;
				if(!bankUser)
					throw new CodedError(403, 'کاربر عضو بانک نیست');

				// Cannot Demote upper hands
				if(bankUser.role === 'Creator')
					throw new CodedError(403, 'امکان تنزیل موسس وجود ندارد');

				return Bank.updateBankUser(client, bankUser.bank_user_id, null, constant.role.BANKADMIN, bankUsername);
			})
			.then(isAdded => handle_result(res, null, isAdded, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => memory.hget(constant.memory.banks.ADMINS, bankId))
			.then(admins => {
				if(admins){
					const a = JSON.parse(admins);
					a.admins.push({
						user_id: bankUser.user_id,
						full_name: bankUser.first_name + ' ' + bankUser.last_name,
						phone: bankUser.phone,
						role: constant.role.BANKADMIN
					});
					return memory.hset(constant.memory.banks.ADMINS, bankId, a);
				}
			});
	});
});

// Remove admin from bank
router.delete('/:bankUsername/admins/:clientId', v.isUser(constant.role.CREATOR), (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	const bankUsername = req.params.bankUsername;
	let adminId  = req.userId;
	let clientId = req.params.clientId;
	let bankId = req.user.bank_id;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.getMember(client, bankId, clientId)
			.then(bankUser => {
				if(!bankUser)
					throw new CodedError(403, 'کاربر عضو بانک نیست');

				// Cannot Demote upper hands
				if(bankUser.role === 'Creator')
					throw new CodedError(403, 'امکان تنزیل موسس وجود ندارد');

				return Bank.updateBankUser(client, bankUser.bank_user_id, null, null, bankUsername);
			})
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => memory.hget(constant.memory.banks.ADMINS, bankId))
			.then(admins => {
				if(admins){
					const a = JSON.parse(admins);
					a.admins = a.admins.filter(admin => admin.user_id !== clientId);
					return memory.hset(constant.memory.banks.ADMINS, bankId, a);
				}
			});
	});
});


// Search users by fullname/phone/username
router.get('/:bankUsername/clients/search/:query', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	let bankUsername = req.params.bankUsername;
	let user = req.user;
	let bankId = user.bank_id;
	let query = req.params.query;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.searchMembers(client, bankId, query)
			.then(users => handle_result(res, 'users', users, users))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show requests
router.get('/:bankUsername/clients/pending', v.isUser(constant.role.BANKADMIN), (req, res) => {
	let bankUsername = req.params.bankUsername;
	let userId = req.userId;
	let bankId = req.user.bank_id;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.getJoinRequests(client, bankId)
			.then(clients => handle_result(res, null, clients, clients))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSREQUESTS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Show subsets
router.get('/:bankUsername/clients/:parentId', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	let userId = req.userId;
	let parentId = req.params.parentId;
	let bankId = req.user.bank_id;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.getSubsets(client, bankId, parentId)
			.then(subsets => {
				subsets = subsets.map(s => {
					if(s.avatar)
						s.avatar = config.avatar.cdn.user + s.avatar;
					return s;
				});
				return handle_result(res, 'subsets', subsets, subsets);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show users
router.get('/:bankUsername/clients/', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	const key = req.query.type;
	const value = req.query.value;
	const page = req.query.page ? parseInt(req.query.page) : 1;
	const bankId = req.user.bank_id;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		// Get all
		if(!key || !value){
			Bank.getMembers(client, bankId, null, page)
				.then(users => {
					users.users = users.users.map(u => {
						if(u.avatar)
							u.avatar = config.avatar.cdn.user + u.avatar;
						return u;
					});
					return handle_result(res, null, users, users);
				})
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => Visit.add(client, constant.visits.BANKSUSERS, req.headers))
				.catch(err => handle_error(res, err.message))
				.then(() => client.release());
		}

		// Search
		else {
			Bank.searchMembers(client, bankId, value, key)
				.then(users => handle_result(res, 'users', users, users))
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => client.release());
		}
	});
});


// Add Subset by Admin
router.put('/:bankUsername/clients/:parentId', v.isUser(constant.role.BANKADMIN), v.isPostedUser(constant.role.BANKMEMBER), (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// let admin = req.user;
	let userIdParent = parseInt(req.params.parentId); // userId
	let bankUserClientId = req.postedUser.id;
	let bankId = req.user.bank_id;
	if(!userIdParent)
		return handle_fail(res, 'سرپرست وجود ندارد', 404);
	if(req.postedUser.user_id === userIdParent)
		return handle_fail(res, 'فرد نمی‌تواند زیرمجموعه‌ی خود باشد', 415);

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.addSubset(client, bankId, userIdParent, bankUserClientId)
			.then(result => handle_result(res, null, result, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Add User to bank by Admin
router.put('/:bankUsername/clients', v.isUser(constant.role.BANKADMIN), userValidation, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// let admin	= req.userId;
	let key = req.body.key.toLowerCase();
	let value = req.body.value;
	let initial = req.body.initial;
	let bankId = req.user.bank_id;

	if(/*key !== 'id' && */key !== 'phonenumber' && key !== 'username')
		return handle_fail(res, 'کلید مشخص شده معتبر نیست', 405);

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.addMemberByType(client, bankId, key, value)
			.then(bankUserId => {
				if(!bankUserId)
					throw new CodedError(500, 'عملیات انجام نشد') ;

				// Add Initial Transaction
				return initial && initial > 0
					? Transaction.add(client, bankUserId, constant.transactions.INITIAL, initial)
					: true;
			})
			.then(result => handle_result(res, null, result, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSINVITATIONS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Add request by User
router.post('/:bankUsername/clients', (req, res) => {
	const bankUsername = req.params.bankUsername;
	const userId = req.userId;
	// const memory = cache.getClient();

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.sendJoinRequest(client, bankUsername, userId)
			.then(isAdded => {
				if(!isAdded)
					throw new CodedError(500, 'ارسال درخواست عضویت با مشکل مواجه شد');
				/* return memory.hget(constant.memory.banks.INFO, bankUsername);
			})
			.then(bankInfo => {
				if(bankInfo){
					const b = JSON.parse(bankInfo);
					b.info.requests = b.info.requests ? b.info.requests + 1 : 1;
					memory.hset(constant.memory.banks.INFO, bankUsername, JSON.stringify(b));
				} */
				return handle_result(res, null, true, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Accept request by Admin
router.post('/:bankUsername/clients/:requestId', v.isUser(constant.role.BANKADMIN), (req, res) => {
	let adminId = req.userId;
	let bankUsername = req.params.bankUsername;
	let bankUserId = req.params.requestId;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.updateBankUser(client, bankUserId, null, null, bankUsername)
			.then(isUpdated => {
				if(!isUpdated)
					throw new CodedError(500, 'تایید درخواست با مشکل مواجه شد');
				return handle_result(res, null, true, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Decline request by Admin
router.patch('/:bankUsername/clients/:requestId', v.isUser(constant.role.BANKADMIN), (req, res) => {
	let adminId = req.userId;
	let bankUsername = req.params.bankUsername;
	let bankUserId = req.params.requestId;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.updateBankUser(client, bankUserId, constant.status.DECLINED, null, bankUsername)
			.then(isUpdated => {
				if(!isUpdated)
					throw new CodedError(500, 'رد درخواست با مشکل مواجه شد');
				/* return memory.hget(constant.memory.banks.INFO, bankUsername);
			})
			.then(bankInfo => {
				if(bankInfo){
					const b = JSON.parse(bankInfo);
					b.bank.info.requests = b.bank.info.requests ? b.bank.info.requests - 1 : 0;
					memory.hset(constant.memory.banks.INFO, bankUsername, JSON.stringify(b));
				} */
				return handle_result(res, null, true, null);
			})
			.catch(err => handle_fail(res, 'کاربر این درخواست عضو باتک نیست', 404))
			.then(() => client.release());
	});
});

// Send message
router.post('/:bankUsername/message', v.isUser(constant.role.BANKADMIN), messageValidation, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	let adminId  = req.userId;
	let content = req.body.content;
	let subject = req.body.subject;
	let toAllUsers = req.body.toAllUsers === 'true';
	let userIds = JSON.parse(req.body.ids);
	let bankId = req.user.bank_id;
	let memory = cache.getClient();

	if(userIds.length <= 0 && !toAllUsers)
		return handle_fail(res, 'کاربری انتخاب نشده است', 415);

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		if(toAllUsers){
			Message.addToAllUsers(client, bankId, adminId, subject, content)
				.then(isSent => handle_result(res, null, isSent, null))
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => Visit.add(client, constant.visits.BANKSMESSAGES, req.headers))
				.catch(err => handle_error(res, err.message))
				.then(() => client.release())
				.then(() => memory.del(constant.memory.users.BADGE));
		} else {
			Message.add(client, bankId, adminId, subject, content, userIds)
				.then(isSent => handle_result(res, null, isSent, null))
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => Visit.add(client, constant.visits.BANKSMESSAGES, req.headers))
				.catch(err => handle_error(res, err.message))
				.then(() => client.release());
		}
	});
});

// Upload avatar
router.put('/:bankUsername/avatar', v.isUser(constant.role.BANKADMIN), (req, res) => {
	upload(req, res, err => {
		// Handle exceptions
		if(err) {
			let message = err.message;
			if(message.indexOf('large') !== -1)
				message = 'حداکثر حجم مجاز 128 کیلوبایت است';
			return handle_fail(res, message, 415);
		}

		// Upload succeed
		const bankId = req.user.bank_id;
		const file = req.file;
		const avatarFilename = file.filename+'.jpg';
		const avatarPath = config.avatar.path.bank + avatarFilename;

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
						id: bankId
					};

					// Delete old avatar
					Bank.getById(client, bankId)
						// Update avatar
						.then(bank => {
							if(bank.avatar)
								fs.unlinkSync(config.avatar.path.bank + bank.avatar);
							return Bank.update(client, fields, where);
						})
						.then(isUpdated => handle_result(res, 'avatar', isUpdated, config.avatar.cdn.bank + avatarFilename))
						.catch(err => handle_fail(res, err.message, err.code))
						.then(() => client.release());
				});
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => fs.unlinkSync(file.path));
	});
});


// Delete bank
router.delete('/:bankUsername', v.isUser(constant.role.CREATOR), (req, res) => {
	let bankId = req.user.bank_id;
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.delete(client, bankId)
			.then(isDeleted => handle_result(res, null, isDeleted, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Delete avatar
router.delete('/:bankUsername/avatar', v.isUser(constant.role.BANKADMIN), (req, res) => {
	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			throw new CodedError(500, 'ارتباط با دیتابیس برقرار نشد');

		const bankId = req.user.bank_id;
		const fields = {
			avatar: null
		};
		const where = {
			id: bankId
		};

		// Delete old avatar
		Bank.getById(client, bankId)
			// Update avatar
			.then(bank => {
				if(bank.avatar)
					fs.unlinkSync(config.avatar.path.bank + bank.avatar);
				return Bank.update(client, fields, where);
			})
			.then(isUpdated => handle_result(res, null, isUpdated, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Remove Subset from bank by Admin
router.delete('/:bankUsername/clients/:parentId/subsets/:clientId', v.isUser(constant.role.BANKADMIN), (req, res) => {
	let adminId = req.userId;
	let userClientId = req.params.clientId;
	let userIdParent = req.params.parentId; // userId
	let bankId = req.user.bank_id;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.deleteSubset(client, bankId, userIdParent, userClientId)
			.then(isDeleted => {
				if(isDeleted)
					return handle_result(res, null, isDeleted, null);
				throw new CodedError(404, 'چنین کاربری وجود ندارد');
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Remove User from bank by user
router.delete('/:bankUsername/clients', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	// let userId = req.userId;
	let bankUserId = req.user.id;
	let bankId = req.user.bank_id;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.deleteMember(client, bankId, bankUserId)
			.then(isDeleted => {
				if(isDeleted)
					return handle_result(res, null, isDeleted, null);
				throw new CodedError(404, 'چنین کاربری وجود ندارد');
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Remove User from bank by admin
router.delete('/:bankUsername/clients/:requestId', v.isUser(constant.role.BANKADMIN), (req, res) => {
	let adminId = req.userId;
	let requestId = req.params.requestId;
	let bankId = req.user.bank_id;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.deleteMember(client, bankId, requestId)
			.then(isDeleted => {
				if(isDeleted)
					return handle_result(res, null, isDeleted, null);
				throw new CodedError(404, 'چنین کاربری وجود ندارد');
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Remove Subset from bank by user
router.delete('/:bankUsername/clients/:parentId/subset/:subsetId', v.isUser(constant.role.BANKMEMBER), (req, res) => {
});

module.exports = router;
