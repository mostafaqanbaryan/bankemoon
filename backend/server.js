const app						 = require('express')();
// const rateLimiter		 = require('./ratelimiter');
const mountRoutes		 = require('./Routes');
const db						 = require('./db');
const cache					 = require('./cache');
const bodyParser		 = require('body-parser');
const passport			 = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;
const cors					 = require('cors');
const config				 = require('config');
const helmet				 = require('helmet');
const log						 = require('./log');
const {
	getIp,
	handle_fail
} = require('./utils');

// Bring Models
const Session = require('./Models/session');

// Get Client Ip
app.use(getIp);

// CORS - Prevent other sites for sending request to API
// app.use(cors(config.get('CORS')));
app.use(helmet());

// Rate Limiter
/* if(process.env.NODE_ENV !== process.env.NODE_TEST && process.env.NODE_ENV !== process.env.NODE_DEVELOPMENT)
	rateLimiter(app); */

// BodyParser Middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Passport
passport.initialize();

passport.use(new BearerStrategy({
	passReqToCallback: true
}, (req, session_id, done) => {

	const user_id		 = req.headers['user-id'];
	const user_agent = req.headers['user-agent'];
	const memory		 = cache.getClient();
	const key				 = `session:${session_id}`;
	if(!user_id || !Number.isInteger(Number.parseInt(user_id)))
		return done(null, false);


	memory.hgetall(key)
		.then(result => {
			// Cache
			if(result && result.id > 0 && result.ua && result.id === user_id && result.ua === user_agent){
				// Success
				return done(null, {
					session_id,
					user_id,
				});
			}

			// Database
			else {
				db.getClient((err, client) => {
					if(err)
						return handle_fail(res, err.message);

					Session.get(client, session_id, user_id, user_agent)
						.then(session => {
							if(!session) {
								// Delete session if exists
								Session.deleteBySessionId(client, session_id, user_id);
								return done(null, false);
							}

							// Update IP
							if(session.ip !== req.clientIp){
								return Session.update(client, session_id, user_id, req.clientIp)
									.then(isUpdated => {
										if(!isUpdated) {
											// Delete session if exists
											Session.deleteBySessionId(client, session_id, user_id);
											return done(null, false);
										}
										memory.hmset(key, {id: user_id, ua: user_agent});
										return done(null, {
											session_id,
											user_id,
										});
									});
							} else {
								memory.hmset(key, {id: user_id, ua: user_agent});
								return done(null, {
									session_id,
									user_id,
								});
							}
						})
						.catch(err => done(err.message, false))
						.then(() => client.release());
				});
			}
		});
}));


// Check for headers
if(process.env.NODE_ENV !== process.env.NODE_TEST && process.env.NODE_ENV !== process.env.NODE_DEVELOPMENT){
	app.use((req, res, next) => {
		/*if(req.headers['content-type'] !== 'application/json'){
			return res.status(406).json({
				status: 'error',
				message: 'Not Acceptable'
			});
		}*/

		let headers = {};
		// Prevent XSS Attacks
		headers['X-Content-Type-Options'] = 'nosniff';

		res.headers = headers;
		return next();
	});
}

// Bring Routes
mountRoutes(app);

// Long/Wrong JSON error
/* app.use((err, req, res, next) => {
	console.log(err);
	if(err instanceof SyntaxError && err.status === 400 && 'body' in err)
		return handle_fail(res, 'محتوای ارسال شده دقیق نیست', 415);
	else if(err.status === 404)
		return handle_fail(res, 'آدرس مورد نظر وجود ندارد', 404);
	return next();
}); */

// Long/Wrong JSON error
app.use((req, res) => {
	return handle_fail(res, 'آدرس مورد نظر وجود ندارد', 404);
});

// Listen to server
app.listen(config.get('PORT'), err => {
	log.info(`Server started on http://localhost:${config.get('PORT')}...`);
});

module.exports = app;
