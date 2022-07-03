const router = require('express').Router();
const uaParser = require('ua-parser-js');
const db		 = require('../db');
const CodedError = require('../Error');
const constant = require('../constant');
const {
	handle_result,
	handle_fail,
	handle_error,
} = require('../utils');


// Bring Model
const Session = require('../Models/session');
const Visit = require('../Models/visit');

// Show all sessions
router.get('/', (req, res) => {
	db.getClient((err, client, done) => {
		Session.getAllSessionsByUserId(client, req.userId)
			.then(sessions => {
				sessions = sessions.map(s => {
					if(s.session_id === req.sessionId)
						s.active = true;
					delete s.session_id;
					const ua = uaParser(s.user_agent);
					s.user_agent = `${ua.device.vendor || ''} ${ua.device.model || ''} ${ua.os.name || 'PC'} ${!isNaN(parseInt(ua.os.version)) ? parseInt(ua.os.version) : ''}`;
					return s;
				});
				return handle_result(res, 'sessions', sessions, sessions);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => Visit.add(client, constant.visits.SESSIONS, req.headers))
			.catch(err => handle_error(res, err.message))
			.then(() => client.release());
	});
});

// Delete session by sessionId
router.delete('/', (req, res) => {
	db.getClient((err, client, done) => {
		Session.deleteBySessionId(client, req.sessionId)
			.then(isDeleted => {
				if(!isDeleted)
					throw new CodedError(404, 'سشن وجود ندارد');
				return handle_result(res, null, isDeleted, null);
			})
			.catch(err => handle_fail(res, err.message, err.code));
	});
});

// Delete session by id
router.delete('/:id', (req, res) => {
	db.getClient((err, client, done) => {
		Session.delete(client, req.params.id, req.userId)
			.then(isDeleted => {
				if(!isDeleted)
					throw new CodedError(404, 'سشن وجود ندارد');
				return handle_result(res, null, isDeleted, null);
			})
			.catch(err => handle_fail(res, err.message, err.code));
	});
});

module.exports = router;

