const CodedError = require('../Error');
const router		 = require('express').Router();
const v					 = require('../validation');
const auth			 = require('../auth');
const Loan			 = require('../loan');
const db				 = require('../db');
const constant	 = require('../constant');
const moment		 = require('moment-jalaali');
const config		 = require('config');
const {
	param,
	body,
	validationResult
} = require('express-validator/check');
const {
	// isAdmin,
	getDateFromJSON,
	isBankAdmin,
	handle_result,
	handle_fail,
	handle_error,
} = require('../utils');

// Bring Models
const Transaction = require('../Models/transaction');
const Visit = require('../Models/visit');
const Bank = require('../Models/bank');
const Export = require('../Models/export');

// Validation
const transactionValidation = [
	param('bankUsername')
	.exists().withMessage('بانکی انتخاب نشده است'),

	param('transactionType')
	.isIn([
		constant.transactions.INITIAL,
		constant.transactions.LOAN,
		constant.transactions.PAYMENT
	]).withMessage('نوع تراکنش غیرمجاز است'),

	body('value')
	.isFloat({min: -999999999.0, max: 999999999.0}).withMessage('رقم وارد شده صحیح نیست'),
];
const transactionValidationEdit = [
	param('bankUsername')
	.exists().withMessage('بانکی انتخاب نشده است'),

	param('transactionId')
	.isInt({min: 0}).withMessage('شماره تراکنش صحیح نیست'),

	/* body('value')
	.isFloat({min: -999999999.0, max: 999999999.0}).withMessage('رقم وارد شده صحیح نیست'),

	body('status')
	.optional()
	.isIn([constant.status.PENDING, constant.status.ACCEPTED, constant.status.DECLINED])
	.withMessage('وضعیت تراکنش نامعلوم است'), */
];
const transactionValidationAdmin = [
	param('bankUsername')
	.exists().withMessage('بانکی انتخاب نشده است'),

	param('transactionType')
	.isIn([
		constant.transactions.INITIAL,
		constant.transactions.LOAN,
		constant.transactions.PAYMENT
	]).withMessage('نوع تراکنش غیرمجاز است'),

	/* body('id')
	.isInt({min: 0}).withMessage('شماره حساب اشتباه است'), */

	body('value')
	.isFloat({min: -999999999.0, max: 999999999.0}).withMessage('رقم وارد شده صحیح نیست'),
];
const transactionValidationLoan = [
	param('bankUsername')
	.exists().withMessage('بانکی انتخاب نشده است'),

	param('loanId')
	.isInt({min: 0}).withMessage('شماره وام اشتباه است'),

	param('instalmentType')
	.isIn([
		constant.transactions.INSTALMENT,
		constant.transactions.COMMISSION,
		constant.transactions.PENALTY
	]).withMessage('نوع تراکنش غیرمجاز است'),

	/* body('id')
	.isInt({min: 0}).withMessage('شماره حساب اشتباه است'), */

	body('value')
	.isFloat({min: -999999999.0, max: 999999999.0}).withMessage('رقم وارد شده صحیح نیست'),
];

function handleLoan(req, options){
	let value				= req.body.value;
	let loan = new Loan({
		price: value,
		duration: req.body.duration,
		commission: req.body.commission || 0,
		penalty: req.body.penalty || 0,
		profit: req.body.profit || 0,
	});
	options.duration = req.body.duration;
	options.commission = req.body.commission;
	options.profit = req.body.profit;
	options.penalty = req.body.penalty;
	options.instalment = loan.getInstalment();
	options[constant.banks.REIMBURSEMENT] = loan.getReimbursement();
	return options;
}

function handleLoanExgratia(options){
	options.exgratia = 1;
	options[constant.transactions.FULLYPAID] = 1;
	return options;
}

function handleGetAllTransactions(req){
	const user = req.user;
	const options = {};
	options.page = req.query.page ? parseInt(req.query.page) : 0;
	options.transactionType = req.params.transactionType;
	options.status = req.query.status;
	options.fullyPaid = req.query.fullypaid ? parseInt(req.query.fullypaid) : 0;

	// UserId
	if(isBankAdmin(user.role)){
		options.searchId = req.query.uid;
		// options.bankUserId = req.query.uid;
	} else {
		options.searchId = req.query.uid;
		options.userId = user.user_id; // this IS userId, req.user.id is bankUserId
		if(!options.userId || options.userId <= 0)
			// return handle_fail(res, 'دسترسی برای شما غیرمجاز است', 403);
			throw new CodedError(403, 'دسترسی برای شما غیرمجاز است');
		// For Instalment transaction, Show Loans of user, created by themselves or others
		if(options.searchId && parseInt(options.searchId) === options.userId) {
			delete options.userId;
		}
	}
	// StartAt
	if(req.query.start_at){
		if(req.query.start_at > 0) {
			const d = new Date(parseInt(req.query.start_at));
			options.startAt = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
		} else {
			// return handle_fail(res, 'تاریخ شروع را به صورت صحیح وارد کنید', 415);
			throw new CodedError(415, 'تاریخ شروع را به صورت صحیح وارد کنید');
		}
	}

	// EndAt
	if(req.query.end_at){
		if(req.query.end_at > 0) {
			const d = new Date(parseInt(req.query.end_at));
			options.endAt = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
		} else {
			// return handle_fail(res, 'تاریخ پایان را به صورت صحیح وارد کنید', 415);
			throw new CodedError(415, 'تاریخ پایان را به صورت صحیح وارد کنید');
		}
	}
	return options;
}


// Get LoanCount/PaymentCount/Balance/... of bank
/* router.get('/:bankUsername/balance', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	let bankId = req.user.bank_id;
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		Transaction.getBalance(client, bankId)
			.then(balance => handle_result(res, null, balance, balance))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
}); */

// Get all loanS
router.get('/:bankUsername/loans', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	let user = req.user;
	let bankId = req.user.bank_id;
	let bankUserId = 0;
	if(isBankAdmin(user.role)){
		bankUserId = req.query.uid;
	} else {
		bankUserId = user.id; // this IS bankUserid, req.userId is userId
		if(!bankUserId || bankUserId <= 0)
			return handle_fail(res, 'دسترسی برای شما غیرمجاز است', 403);
	}

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		Transaction.getLoans(client, bankId, bankUserId)
			.then(loans => handle_result(res, 'loans', loans, loans))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSLOANS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Export transactions
router.get('/:bankUsername/export/:transactionType?', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	const bankId = req.user.bank_id;
	let options = {};
	try{
		options = handleGetAllTransactions(req);
	} catch (err){
		return handle_fail(res, err.message, err.code);
	}


	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		let bank = null;
		Bank.getById(client, bankId)
			.then(b => {
				if(!b)
					throw new CodedError(404, 'بانک یافت نشد');
				bank = b;
				return Transaction.getAll(client, bankId, options);
			})
			.then(ts => transactions = ts)
			.then(() => client.release())
			.then(() => {
				const createdBy = req.user.full_name;
				const title = bank.name;
				const rows = transactions;
				const description = [
					options.bankUserId && rows.length > 0 ? `تمامی تراکنش‌های ${rows[0].full_name}` : '',
					options.transactionType ? `از دسته‌ی ${constant.persian.transactions[options.transactionType]}` : '',
					options.startAt ? `از تاریخ ${moment(parseInt(req.query.start_at)).format('jYYYY/jMM/jDD')}` : '',
					options.endAt ? `تا تاریخ ${moment(parseInt(req.query.end_at)).format('jYYYY/jMM/jDD')}` : '',
				];

				Export.pdf({
					username: req.user.username,
					createdBy,
					title,
					description,
					rows,
					cb: (err, result) => {
						if(err)
							throw new Error('ساخت PDF با مشکل مواجه شد');
						return handle_result(res, 'path', result, `${config.avatar.cdn.export}pdf/${result}`);
					}
				});
			})
			.catch(err => {
				if(client.release.name !== 'throwOnRelease')
					client.release();
				return handle_fail(res, err.message, err.code);
			});
			// .then(() => Visit.add(client, constant.visits.BANKSEXPORT, req.headers))
			// .catch(err => handle_error(res, err.message));
	});
});

// Get all transactions of a bank
router.get('/:bankUsername/:transactionType?', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	const bankId = req.user.bank_id;
	let options = {};
	try{
		options = handleGetAllTransactions(req);
	} catch (err){
		return handle_fail(res, err.message, err.code);
	}

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		Transaction.getAll(client, bankId, options)
			.then(transactions => handle_result(res, 'transactions', transactions, transactions))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSTRANSACTIONS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Get transaction
router.get('/:bankUsername/:transactionType/:transactionId', v.isUser(constant.role.BANKMEMBER), (req, res) => {
	let user = req.user;
	let bankId = req.user.bank_id;
	let transactionType = req.params.transactionType;
	let transactionId = req.params.transactionId;
	let getChild = req.query.child;
	let bankUserId = 0;

	if(!isBankAdmin(user.role)){
		bankUserId = user.id; // this IS bankUserid, req.userId is userId
		if(!bankUserId || bankUserId <= 0)
			return handle_fail(res, 'دسترسی برای شما غیرمجاز است', 403);
	}

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		Transaction.get(client, transactionId, bankUserId, getChild)
			.then(options => handle_result(res, null, options, options))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Add Instalment By admin
router.put('/:bankUsername/loan/:loanId/:instalmentType',
	v.isUser(constant.role.BANKADMIN),
	v.isPostedUser(constant.role.BANKMEMBER),
	transactionValidationLoan, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	
	const type				= req.params.instalmentType;
	const loanId			= req.params.loanId;
	const admin_id		= req.userId;
	// const creatorId		= req.userId;
	const createdAtBank = getDateFromJSON(req.body.createdAtBank);
	const creatorId		= req.user.id; //bankUserId
	const bankId			= req.user.bank_id;
	// const bankUserId	= req.postedUser.bank_user_id;
	const userId	= req.postedUser.user_id;
	const value				= parseFloat(req.body.value);
	const description = req.body.description;
	const status			= req.body.status || constant.status.ACCEPTED;
	const options			= { parentId: loanId, creatorId, admin_id, status, description };

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		const args = { createdAtBank, bankId, userId, type, value, options };
		Transaction.add(client, args)
			.then(transactionId => {
				if(!transactionId || transactionId <= 0)
					throw new CodedError(500, 'عملیات انجام نشد');
				return handle_result(res, 'transaction', true, { id: transactionId });
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSTRANSACTION, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Add Instalment By client
router.post('/:bankUsername/loan/:loanId/:instalmentType',
	v.isUser(constant.role.BANKMEMBER),
	transactionValidationLoan, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	
	const user				= req.user;
	// const creatorId		= req.userId;
	const createdAtBank = getDateFromJSON(req.body.createdAtBank);
	const creatorId		= req.user.id; //bankUserId
	// const bankUserId	= user.bank_user_id;
	const userId	= user.user_id;
	const loanId			= req.params.loanId;
	const bankId			= req.user.bank_id;
	const type				= req.params.instalmentType;
	const status			= constant.status.PENDING;
	const value				= req.body.value;
	const description = req.body.description;
	const options			= { parentId: loanId, creatorId, status, description };

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		const args = { createdAtBank, bankId, userId, type, value, options };
		Transaction.add(client, args)
			.then(transactionId => {
				if(!transactionId || transactionId <= 0)
					throw new CodedError(500, 'عملیات انجام نشد');
				return handle_result(res, 'transaction', true, { id: transactionId });
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSTRANSACTION, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Add transaction By admin
router.put('/:bankUsername/:transactionType/',
	v.isUser(constant.role.BANKADMIN),
	// v.isPostedUser(constant.role.BANKMEMBER),
	transactionValidationAdmin, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	
	let admin_id	= req.userId;
	// let creatorId = req.userId;
	const creatorId		= req.user.id; //bankUserId
	let status		= constant.status.ACCEPTED;
	let type			= req.params.transactionType;

	let createdAtBank = getDateFromJSON(req.body.createdAtBank);
	let bankId			= req.user.bank_id;
	let userIds = JSON.parse(req.body.ids);
	let value				= req.body.value;
	let description = req.body.description;
	let options			= { creatorId, status, admin_id, description };
	let isExgratia = req.body.exgratia === true;
	if(type === 'loan'){
		value = -Math.abs(value);
		if(isExgratia)
			options = handleLoanExgratia(options);
		else if(typeof(req.body.duration) !== 'undefined')
			options = handleLoan(req, options);
		else
			return handle_fail(res, 'مدت زمان وام را وارد کنید', 409);
	}

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		const args = { createdAtBank, bankId, userIds, type, value, options };
		Transaction.adds(client, args)
			.then(transactionId => {
				// if(!transactionId || transactionId <= 0)
				if(!transactionId || transactionId <= 0)
					throw new CodedError(500, 'عملیات انجام نشد');
				return handle_result(res, 'transaction', true, { id: transactionId });
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSTRANSACTION, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Add transaction By client
router.post('/:bankUsername/:transactionType/',
	v.isUser(constant.role.BANKMEMBER),
	transactionValidation, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	
	let user					= req.user;
	// let bankUserId = user.bank_user_id;
	// let creatorId		= req.userId;
	const creatorId		= req.user.id; //bankUserId
	let createdAtBank = getDateFromJSON(req.body.createdAtBank);
	let bankId				= user.bank_id;
	let userIds		= JSON.parse(req.body.ids);
	let type					= req.params.transactionType;
	let status				= constant.status.PENDING;
	let value					= req.body.value;
	let description		= req.body.description;
	let options				= { creatorId, status, description };
	let isExgratia = req.body.exgratia === true;
	if(type === 'loan'){
		value = -Math.abs(value);
		if(isExgratia)
			options = handleLoanExgratia(options);
		else if(typeof(req.body.duration) !== 'undefined')
			options = handleLoan(req, options);
		else
			return handle_fail(res, 'مدت زمان وام را وارد کنید', 409);
	}

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		const args = { createdAtBank, bankId, userIds, type, value, options };
		Transaction.adds(client, args)
			.then(transactionId => {
				if(!transactionId || transactionId <= 0)
					throw new CodedError(500, 'عملیات انجام نشد');
				return handle_result(res, 'transaction', true, { id: transactionId });
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.BANKSTRANSACTION, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Accept Transaction
router.patch('/:bankUsername/:transactionId',
	v.isUser(constant.role.BANKADMIN),
	transactionValidationEdit, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	// let admin = req.user;
	let bankId = req.user.bank_id;
	let transactionId = req.params.transactionId;
	// let status = req.body.status;
	let status = constant.status.ACCEPTED;

	// let value = req.body.value;
	let options = {
		admin_id : req.userId
	};

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'اتصال به دیتابیس با مشکل مواجه شد', 500);

		Transaction.update(client, bankId, transactionId, status, options)
			.then(isEdited => {
				if(!isEdited)
					throw new CodedError(500, 'بروزرسانی تراکنش با مشکل مواجه شد');
				return handle_result(res, null, isEdited, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

router.delete('/:bankUsername/:transactionId',
	v.isUser(constant.role.CREATOR), (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	let admin					= req.user;
	let bankId				= admin.bank_id;
	let transactionId = req.params.transactionId;

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'اتصال به دیتابیس با مشکل مواجه شد', 500);

		Transaction.delete(client, bankId, transactionId)
			.then(isDeleted => {
				if(!isDeleted)
					throw new CodedError(404, 'تراکنش وجود ندارد');
				return handle_result(res, null, isDeleted, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

module.exports = router;
