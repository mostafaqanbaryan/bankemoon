const passport = require('passport');
const config	 = require('config');
const Session  = require('./Models/session');
const utils		 = require('./utils');
const db			 = require('./db');
const constant = require('./constant');

const auth = {
	authenticate(req, res, next){
		passport.authenticate('bearer', config.get('PASSPORT'), (err, session, info) => {
			if(err)
				return utils.handle_fail(res, err.message, 401);

			if(!session) {
				return utils.handle_fail(res, 'ابتدا وارد شوید', 401);
			} else {
				req.userId = session.user_id;
				req.sessionId = session.session_id;
				return next();
			}
		})(req, res, next);
	},

	adminValidation(req, res, next){
		db.getClient((err, client, done) => {
			if(err)
				return utils.handle_fail(res, err.message);

			const args = [req.userId];
			const query = `SELECT value FROM ${constant.tables.USERSOPT} WHERE user_id=$1 AND key='${constant.ROLE}' LIMIT 1;`;
			client.query(query, args)
				.then(result => {
					if(result && result.rowCount > 0 && result.rows[0].value > 0){
						req.userRole = result.rows[0].value;
						return next();
					} else {
						return utils.handle_fail(res, 'دسترسی مجاز نیست', 403, true);
					}
				})
				.catch(err => handle_fail(res, err))
				.then(() => client.release());
		});
	},
};

module.exports = auth;
