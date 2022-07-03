const router		= require('express').Router();
const log				= require('../log');
const db				= require('../db');
const {
	now,
	handle_result,
	handle_fail,
} = require('../utils');

// Bring Model
const Captcha = require('../Models/captcha');

// Create captcha
router.get('/', (req, res) => {
	/* db.getClient((err, client, done) => {
		// Error happend in getting client
		if(err)
			return handle_fail(res, err); */

		Captcha.create(client, req.clientIp, req.headers['user-agent'])
			.then(result => handle_result(res, null, result, result, {
					code: 401,
					msg: "تلاش شما برای ورود بیشتر از حد مجاز است؛ لطفا چند دقیقه‌ی دیگر امتحان کنید"
			}))
			.catch(err => handle_fail(res, err.message, err.code));
			/* .then(() => client.release());
	}); */
});

module.exports = router;
