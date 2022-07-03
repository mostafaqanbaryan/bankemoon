const router = require('express').Router();
const db		 = require('../db');
const cache  = require('../cache');
const {
	check,
	validationResult
} = require('express-validator/check');
const {
	handle_result,
	handle_fail,
	handle_error,
} = require('../utils');

// Models
const Ticket = require('../Models/ticket');
const Visit = require('../Models/visit');
const constant = require('../constant');
const memoryBadgeKey = 'badges';

// Validations
const v_ticket = [
	check('subject')
	.isLength({min: 3}).withMessage('عنوان پیام کوتاه است'),

	check('department')
	.exists().withMessage('حوزه به صورت صحیح انتخاب نشده است')
];

const v_content = [
	check('content')
	.isLength({min: 10}).withMessage('متن پیام کوتاه است'),
];

// New Ticket
router.post('/tickets', v_ticket, v_content, (req, res) => {
	// Check for errors
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return handle_fail(res, errors.array().map(obj => obj.msg).join("\n"), 422);
	}

	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد', 500);

		const department = req.body.department;
		const subject = req.body.subject;
		const content = req.body.content;

		Ticket.create(client, req.userId, department, subject, content)
			.then(ticket => handle_result(res, 'ticket', ticket, {id: ticket}))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Reply to Ticket
router.post('/tickets/:ticketId', v_content, (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد', 500);

		const content = req.body.content;
		const ticketId = req.params.ticketId;

		Ticket.replyQuestion(client, req.userId, ticketId, content)
			.then(response => handle_result(res, 'response', response, response))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Close Ticket
router.patch('/tickets/:ticketId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد', 500);

		const ticketId = req.params.ticketId;
		Ticket.close(client, req.userId, ticketId)
			.then(tickets => handle_result(res, 'tickets', tickets, tickets))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

// Show Tickets
router.get('/tickets', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد', 500);

		Ticket.getAll(client, req.userId)
			.then(tickets => {
				if(tickets) {
					return handle_result(res, 'tickets', tickets, tickets);
				} else {
					return handle_result(res, 'tickets', [], []);
				}
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.TICKETS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Show Ticket
router.get('/tickets/:ticketId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد', 500);

		const ticketId = req.params.ticketId;
		const memory = cache.getClient();
		let ticket = null;
		Ticket.getTicket(client, req.userId, ticketId)
			.then(t => {
				if(!t) {
					throw new CodedError(404, 'تیکت یافت نشد');
				}
				ticket = t;
				return Ticket.getResponses(client, req.userId, ticketId);
			})
			.then(responses => {
				if(!responses) {
					throw new CodedError(404, 'تیکت یافت نشد');
				}
				return handle_result(res, null, ticket, { ticket, responses });
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.TICKETS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release())
			.then(() => {
				if(ticket.status === constant.status.ANSWERED)
					return memory.hget(memoryBadgeKey, userId);
			})
			.then(user => {
				if(user){
					const u = JSON.parse(user);
					u.tickets -= 1;
					memory.hset(memoryBadgeKey, userId, JSON.stringify(u));
				}
			});
	});
});

// Delete Message
router.delete('/tickets/:ticketId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد', 500);

		const ticketId = req.params.ticketId;
		Ticket.delete(client, req.userId, ticketId)
			.then(isDeleted => handle_result(res, null, isDeleted, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

module.exports = router;

