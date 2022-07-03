let authFunc			= require('../auth');
let admins				= require('./admins');
let posts					= require('./posts');
let comments			= require('./comments');
let banks					= require('./banks');
let transactions	= require('./transactions');
let auth					= require('./auth');
let bots					= require('./bots');
let users					= require('./users');
let messages			= require('./messages');
let tickets				= require('./tickets');
//let admin_tickets = require('./tickets'); // ***** This has to be admin ticket routes
let captcha				= require('./captcha');
let sessions			= require('./sessions');
let contacts			= require('./contacts');
let constant			= require('../constant');
let v							= require('../validation');

module.exports = app => {
	app.use('/bots', bots);

	app.use('/admin', authFunc.authenticate);
	app.use('/admin', authFunc.adminValidation);
	// app.use('/admin', admin_tickets);
	app.use('/admin', admins);

	app.use('/contact', contacts);

	app.use('/posts', comments);
	app.use('/posts', posts);

	app.use('/banks', authFunc.authenticate);
	app.use('/banks', banks);

	app.use('/transactions', authFunc.authenticate);
	// app.use('(/transactions/admin/:bankUsername|/transactions/:bankUsername)', v.isLoggedInUserBankMember);
	// app.use('/transactions/admin/:bankUsername', v.isLoggedInUserBankAdmin);
	app.use('/transactions/:bankUsername', v.isUser(constant.role.BANKMEMBER));
	app.use('/transactions', transactions);

	app.use('/auth', auth);

	app.use('/users', authFunc.authenticate);
	app.use('/users', messages);
	app.use('/users', tickets);
	app.use('/users', users);

	app.use('/captcha', captcha);

	app.use('/sessions', authFunc.authenticate);
	app.use('/sessions', sessions);
};
