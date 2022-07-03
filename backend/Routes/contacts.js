const {
	sanitize,
	handle_result,
	handle_fail,
	isAdmin }												= require('../utils');
const router											= require('express').Router();
const db													= require('../db');
const v														= require('../validation');
const auth												= require('../auth');
const { check, validationResult } = require('express-validator/check');

// Config file
const constant = require('../constant');

// Bring Post Model
const Contact = require('../Models/contact');

const validation = [
	check('content').isLength({min: 10}).withMessage('طول متن باید حداقل 10 حرف باشد'),
	check('subject').isLength({min: 5, max: 32}).withMessage('عنوان پیام خیلی کوتاه است'),
	check('fullname').isLength({min: 10, max: 32}).withMessage('نام و نام خانوادگی را به صورت صحیح وارد کنید'),
	check('email').isEmail({max: 32}).withMessage('ایمیل خود را به صورت صحیح وارد کنید'),
	check('phone').matches(/^09\d{9}$/).withMessage('شماره همراه خود را به صورت صحیح وارد کنید'),
];

// Show comments
/*router.get('/', (req, res) => {
	db.getClient((err, client, done) =>{
		Comment.get(client, req.params.postId)
			.then(rows => {
				return handle_result(res, 'comments', rows, rows);
			})
			.catch(err => handle_fail(res, err))
			.then(() => client.release());
	});
});*/

// Add contact
router.post('/', validation, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}
	
	// Variables
	let parentId = req.body.parent_id || null;
	let fields = {
		fullname : req.body.fullname,
		email		 : req.body.email,
		phone		 : req.body.phone,
		subject  : req.body.subject,
		content  : req.body.content,
	};

	db.getClient((err, client, done) => {
		Contact.add(client, fields)
			.then(isAdded => handle_result(res, null, isAdded, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Delete contact
/*router.delete('/:postId/comments/:commentId', auth.authenticate, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	let where			= {};
	let user			= req.user;
	let commentId = req.params.commentId;

	if(isAdmin(user.role)){
		where  = {
			id : commentId,
		};
	}else{
		where  = {
			id				: commentId,
			author_id : user.id,
			status		: constant.status.PENDING
		};
	}
	db.getClient((err, client, done) => {
		Comment.delete(client, where)
			.then(isDeleted => {
				if(!isDeleted)
					throw new Error('چنین نظری وجود ندارد');
				return handle_result(res, null, isDeleted, null);
			})
			.catch(err => handle_fail(res, err.message))
			.then(() => client.release());
	});
});*/


module.exports = router;

