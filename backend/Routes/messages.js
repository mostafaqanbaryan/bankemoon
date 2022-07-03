const router		 = require('express').Router();
const db				 = require('../db');
const cache			 = require('../cache');
const CodedError = require('../Error');
const {
	handle_result,
	handle_fail,
	handle_error
} = require('../utils');

// Models
const Message = require('../Models/message');
const Visit = require('../Models/visit');
const constant = require('../constant');

// Show Messages
router.get('/messages', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		Message.getAll(client, req.userId)
			.then(messages => {
				if(messages) {
					return handle_result(res, 'messages', messages, messages);
				} else {
					return handle_result(res, 'messages', [], []);
				}
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.MESSAGES, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Show Message
router.get('/messages/:messageId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		const messageId = req.params.messageId;
		const memory = cache.getClient();
		const userId = req.userId;
		let decBadge = false;
		Message.get(client, userId, messageId)
			.then(message => {
				if(!message)
					throw new CodedError(404, 'پیام یافت نشد');
				decBadge = message.status !== constant.status.READED;
				delete message.status;
				return handle_result(res, 'message', message, message);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.MESSAGES, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release())
			.then(() => {
				if(decBadge)
					return memory.hget(constant.memory.users.BADGES, userId);
			})
			.then(user => {
				if(user){
					const u = JSON.parse(user);
					u.messages -= 1;
					memory.hset(constant.memory.users.BADGES, userId, JSON.stringify(u));
				}
			});
	});
});

// Delete Message
router.delete('/messages/:messageId', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, err.message);

		const messageId = req.params.messageId;
		Message.delete(client, req.userId, messageId)
			.then(isDeleted => handle_result(res, null, isDeleted, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
});

module.exports = router;
