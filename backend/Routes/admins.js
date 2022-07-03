const router											= require('express').Router();
const db													= require('../db');
const cache												= require('../cache');
const CodedError									= require('../Error');
const config											= require('config');
const fs													= require('fs');
const v														= require('../validation');
const multer											= require('multer');
const sharp												= require('sharp');
const { check, validationResult } = require('express-validator/check');
const {
	handle_result,
	handle_fail,
	bcrypt_password,
	activationCode,
	sanitize,
} = require('../utils');

// Bring Model
const Admin = require('../Models/admin');
const Contact = require('../Models/contact');
const Bank = require('../Models/bank');
const Post = require('../Models/post');
const User = require('../Models/user');
const File = require('../Models/file');
const Ticket = require('../Models/ticket');
const upload = multer({
	dest: config.avatar.path.post,
	fileFilter: (req, file, cb) => {
		if(!file.originalname.match(/\.jpg$/))
			return cb(new CodedError(415, 'فایل معتبر نیست'));
		cb(null, true);
	},
	limits: {
		fieldSize: 256 * 1024, //256 Kb
		fileSize: 256 * 1024, //256 Kb
		files: 1,
	}
}).single('file');

// Config file
const constant = require('../constant');

const postValidation = [
	// Safty Check
	check('title').isLength({min: 3}).withMessage('طول عنوان باید حداقل ۳ حرف باشد') ,
	check('slug').isLength({min: 3}).withMessage('طول نامک باید حداقل ۳ حرف باشد'),
	check('excert').isLength({min: 3, max: 150}).withMessage('طول خلاصه باید حداقل ۳ حرف باشد'),
	check('content').isLength({min: 10}).withMessage('طول متن باید حداقل ۱۰ حرف باشد'),
	check('category').exists().withMessage('دسته‌بندی انتخاب نشده است'),
];

const userValidation = [
	check('first_name')
	.isLength({min: 3}).withMessage('نام خود را به صورت صحیح وارد کنید')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage('نام باید از حروف فارسی تشکیل شده باشد'),

	check('last_name')
	.isLength({min: 3}).withMessage('نام خانوادگی خود را به صورت صحیح وارد کنید')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage('نام خانوادگی باید از حروف فارسی تشکیل شده باشد'),

	check('username')
	.isLength({min: 3}).withMessage('نام کاربری خود را به صورت صحیح وارد کنید')
	.matches(/^(?=[A-Za-z])([A-Za-z0-9_]{5,})$/).withMessage('نام کاربری باید از حروف انگلیسی و اعداد تشکیل شده باشد'),
];

const bankValidation = [
	// Safty Check
	check('name')
	.isLength({min: 3}).withMessage('طول نام فارسی باید حداقل 3 حرف باشد')
	.matches(/^[^a-zA-Z0-9_\-\*\+\&\%\$\#\@\?]+$/).withMessage("نام فارسی باید از کاراکترهای فارسی تشکیل شده باشد"),

	check('username')
	.isLength({min: 5}).withMessage('طول نام انگلیسی باید حداقل 3 حرف باشد')
	.matches(/^[a-zA-Z0-9_]+$/).withMessage('حروف مجاز برای نام انگلیسی شامل اعداد و حروف انگلیسی و _ می‌باشد'),

	check('initial')
	.optional()
	.isInt({min: -999999999, max: 999999999}).withMessage('حداکثر مبلغ سرمایه 999,999,999 تومان می‌باشد'),

	check('description')
	.isLength({max: 64}),
];

const pictureValidation = [
	// Safty Check
	check('title').isLength({min: 3}).withMessage('طول عنوان باید حداقل 3 حرف باشد') ,
	check('alt').isLength({min: 3}).withMessage('طول متن جایگزین باید حداقل 3 حرف باشد') ,
];

/*
 * CREATE TABLE factors FOR PAYING ONLINE
 *
 * Panel for Sending message to users
 */

// Dashboard
router.get('/snapshot', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		const result = {};
		Admin.getVisits(client)
			.then(visits => {
				result.visits = visits;
				// return Admin.getFactors(client);
				return Promise.resolve([]);
			})
			.then(transactions => {
				result.transactions = transactions;
				return Admin.getVisitors(client);
			})
			.then(visitors => {
				result.visitors = visitors;
				return Admin.getDevices(client);
			})
			.then(devices => {
				result.devices = devices;
				return handle_result(res, null, result, result);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show all posts
router.get('/posts', (req, res) => {
	// Variables
	const page = req.query.page || 1;

	// Database
	db.getClient((err, client, done) =>{
		// Error happend in getting client
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد');

		Admin.getPosts(client, page)
			.then(rows => handle_result(res, null, rows, rows))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show single Post
router.get('/posts/:postId', (req, res) => {
	db.getClient((err, client, done) =>{
		// Error happend in getting client
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد');

		Post.get(client, req.params.postId)
			.then(post => {
				if(post.picture_path)
					post.picture_path = config.avatar.cdn.post + post.picture_path;
				return handle_result(res, 'post', post, post);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show all users
router.get('/users', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		const key = req.query.type;
		const value = req.query.value;
		const page = req.query.page || 1;
		// Get all
		if(!key || !value){
			Admin.getUsers(client, page)
				.then(users => handle_result(res, null, users, users))
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => client.release());
		}

		// Search
		else {
			User.searchUsers(client, key, value)
				.then(user => {
					if(!user)
						throw new CodedError(404, 'کاربر یافت نشد');
					// const users = result.map(u => {
						user.avatar = user.avatar ? `${config.avatar.cdn.user}/${user.avatar}` : null;
						// return u;
					// });
					return handle_result(res, 'users', user, [user]);
				})
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => client.release());
		}
	});
});

// Show all banks
router.get('/banks', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		const key = req.query.type;
		const value = req.query.value;
		const page = req.query.page || 1;
		// Get all
		if(!key || !value){
			Admin.getBanks(client, page)
				.then(result => {
					const banks = result.banks.map(b => {
						b.avatar = b.avatar ? `${config.avatar.cdn.bank}/${b.avatar}` : null;
						return b;
					});
					result.banks = banks;
					return handle_result(res, null, banks, result);
				})
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => client.release());
		}

		// Search
		else {
			Bank.searchBanks(client, key, value)
				.then(result => {
					if(!result)
						throw new CodedError(404, 'بانک یافت نشد');
					const banks = result.map(b => {
						b.avatar = b.avatar ? `${config.avatar.cdn.bank}/${b.avatar}` : null;
						return b;
					});
					return handle_result(res, 'banks', banks, banks);
				})
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => client.release());
		}
	});
});

// Show all tickets
router.get('/tickets', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Admin.getTickets(client)
			.then(tickets => handle_result(res, 'tickets', tickets, tickets))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show ticket
router.get('/tickets/:ticketId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Admin.getTicket(client, req.params.ticketId)
			.then(ticket => handle_result(res, 'ticket', ticket, ticket))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show all contacts
router.get('/contacts', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Contact.getAll(client)
			.then(contacts => handle_result(res, 'contacts', contacts, contacts))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show contact
router.get('/contacts/:contactId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Contact.get(client, req.params.contactId)
			.then(contact => handle_result(res, 'contact', contact, contact))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show all logs
router.get('/logs', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Admin.getLogs(client)
			.then(logs => handle_result(res, 'logs', logs, logs))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Edit banks
router.patch('/banks/:bankId', bankValidation, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}


	// Update fields
	const memory = cache.getClient();
	const fields = {
		name: req.body.name,
		username: req.body.username,
	};

	const options = {
		description: req.body.description,
		rules: req.body.rules,
		avatar: req.body.avatar,
	};

	// Where Clause
	const where = {
		id: req.params.bankId
	};

	// Integration with database
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Bank.update(client, fields, where, options)
			.then(isEdited => handle_result(res, null, isEdited, null))
			.catch(err => handle_fail(res, err))
			.then(() => client.release())
			.then(() => {
				memory.hdel(constant.memory.banks.ALL, where.id);
				// memory.hdel(constant.memory.banks.INFO, where.id);
			});
	});
});


// Insert post
router.post('/posts', postValidation, v.duplicatePost, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	
	// Variables
	const memory = cache.getClient();
	const fields = {
		title			 : req.body.title,
		slug			 : sanitize.slug(req.body.slug),
		excert		 : req.body.excert,
		content		 : req.body.content,
		author_id  : req.userId,
		category	 : req.body.category,
		picture_id : req.body.picture_id
	};

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Post.add(client, fields)
			.then(postId => {
				if(!postId || postId <= 0)
					throw new CodedError(500, 'پست اضافه نشد');
				return handle_result(res, 'id', postId, postId);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => {
				hdel(constant.memory.posts.ALL, fields.category);
				hdel(constant.memory.posts.ALL, 'snap');
				return hget(constant.memory.posts.COUNT, fields.category);
			})
			.then(count => {
				if(count){
					const c = JSON.parse(count);
					c[fields.category] = c[fields.category] ? c[fields.category] + 1 : 1;
					return hset(constant.memory.posts.COUNT, fields.category, JSON.stringify(c));
				}
			});
	});
});

// Reply to Ticket
router.post('/tickets/:ticketId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد', 500);

		const content = req.body.content;
		const ticketId = req.params.ticketId;
		const memory = cache.getClient();

		Ticket.replyAnswer(client, req.userId, ticketId, content)
			// .then(response => handle_result(res, 'response', response, response))
			.then(response => {
				memory.hdel(constant.memory.users.BADGES, req.userId);
				return handle_result(res, 'response', response, response);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Upload picture
router.put('/picture', pictureValidation, (req, res) => {
	upload(req, res, err => {
		// Handle exceptions
		if(err) {
			let message = err.message;
			if(message.indexOf('large') !== -1)
				message = 'حداکثر حجم مجاز 256 کیلوبایت است';
			return handle_fail(res, message, 415);
		}

		// Upload succeed
		const userId = req.userId;
		const file = req.file;
		const avatarFilename = file.filename+'.jpg';
		const avatarPath = config.avatar.path.post + avatarFilename;
		fs.renameSync(config.avatar.path.post + file.filename, avatarPath);

		// Integrate with database
		db.getClient((err, client, done) => {
			if(err)
				return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

			const fields = {
				path: avatarFilename,
				type: 'post',
				alt: req.body.alt,
				title: req.body.title,
				uploaderId: userId,
			};
			File.add(client, fields)
			.then(pictureId => handle_result(res, null, pictureId, { id: pictureId, path: config.avatar.cdn.post + avatarFilename }))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
		});
	});
});

// Update post
router.patch('/posts/:postId', postValidation, v.duplicatePost, (req, res) =>{
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	
	// Variables
	const memory = cache.getClient();
	const fields = {
		title			 : req.body.title,
		slug			 : sanitize.slug(req.body.slug),
		excert		 : req.body.excert,
		content		 : req.body.content,
		// author_id	: req.userId,
		category	 : req.body.category,
		picture_id : req.body.picture_id
	};

	// Where clause
	const where = {
		id: req.params.postId
	};

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Post.update(client, fields, where)
			.then(isEdited => handle_result(res, null, isEdited, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => {
				memory.del(constant.memory.posts.ALL);
				memory.del(constant.memory.posts.COUNT);
			});
	});
});

// Update user
router.patch('/users/:userId', userValidation, (req, res) => {
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
		let fields = {
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			username: req.body.username,
			phone: req.body.phone,
			email: req.body.email,
			phone_validate: req.body.phone_validate === 'true',
			email_validate: req.body.email_validate === 'true',
		};

		// Where Clause
		let where = {
			id: req.params.userId,
		};

		const memory = cache.getClient();
		return User.update(client, fields, where)
			.then(isUpdated => {
				return handle_result(res, null, isUpdated, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => memory.hdel(constant.memory.users.SNAPSHOT, req.params.userId));
	});
});

// Close ticket
router.patch('/tickets/:ticketId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Admin.closeTicket(client, req.params.ticketId)
			.then(isClosed => handle_result(res, null, isClosed, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Delete post
router.delete('/posts/:postId', (req, res) => {
	// Where clause
	const memory = cache.getClient();
	const where = {
		id: req.params.postId
	};

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Post.delete(client, where)
			.then(isDeleted => {
				if(isDeleted){
					return handle_result(res, null, isDeleted, null);
				}else{
					throw new Error(isDeleted);
				}
			})
			.catch(err => handle_fail(res, err.message))
			.then(() => client.release())
			.then(() => {
				del(constant.memory.posts.ALL);
				del(constant.memory.posts.COUNT);
			});
	});
});

// Delete picture/file
router.delete('/picture/:pictureId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		File.delete(client, req.params.pictureId)
			.then(isDeleted => handle_result(res, null, isDeleted, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Delete user
router.delete('/users/:userId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		const memory = cache.getClient();
		User.delete(client, req.params.userId)
			.then(result => result.rowCount)
			.then(rowCount => handle_result(res, null, rowCount, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => memory.hdel(constant.memory.users.SNAPSHOT, req.params.userId))
			.then(() => memory.hdel(constant.memory.users.BADGES, req.params.userId));
	});
});

// Delete user avatar
router.delete('/users/:userId/avatar', (req, res) => {
	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			throw new CodedError(500, 'ارتباط با دیتابیس برقرار نشد');

		const memory = cache.getClient();
		const userId = req.params.userId;
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

// Delete bank
router.delete('/banks/:bankId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		const bankId = req.params.bankId;
		const memory = cache.getClient();
		Bank.delete(client, bankId)
			.then(isDeleted => handle_result(res, null, isDeleted, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release())
			.then(() => {
				memory.del(constant.memory.banks.ALL, bankId);
				// memory.hdel(constant.memory.banks.INFO, bankId);
			});

	});
});

// Delete bank avatar
router.delete('/banks/:bankId/avatar', (req, res) => {
	// Integrate with database
	db.getClient((err, client, done) => {
		if(err)
			throw new CodedError(500, 'ارتباط با دیتابیس برقرار نشد');

		const bankId = req.params.bankId;
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

// Delete ticket
router.delete('/tickets/:ticketId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Admin.deleteTicket(client, req.params.ticketId)
			.then(userId => {
				const memory = cache.getClient();
				memory.hdel(constant.memory.users.BADGES, userId);
				return handle_result(res, null, userId > 0, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Delete ticket message
router.delete('/tickets/:ticketId/messages/:messageId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Admin.deleteTicketMessage(client, req.params.ticketId, req.params.messageId)
			.then(userId => {
				const memory = cache.getClient();
				memory.hdel(constant.memory.users.BADGES, userId);
				return handle_result(res, null, userId > 0, null);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show contact
router.delete('/contacts/:contactId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد', 500);

		Contact.delete(client, req.params.contactId)
			.then(result => handle_result(res, null, result, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});


module.exports = router;

