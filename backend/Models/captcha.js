const constant		= require('../constant');
const db					= require('../db');
const cache				= require('../cache');
const log					= require('../log');
const Captcha			= require('../captcha');
const uuidv4			= require('uuid/v4');
const limitCount	= 5;
const limitMinute = 10;
const memoryKey		= 'captcha:';

module.exports = {
	create(client, ip, ua){
		// return this.checkLimit(client, ip)
			// .then(isLimited => {
				// if(isLimited > limitCount)
					// return false;
		const c = new Captcha();
		const url = c.getUrl();
		const value = c.getText();
		const uuid = uuidv4();
		const memory = cache.getClient();
		/* let query = `INSERT INTO ${constant.tables.CAPTCHA}
								(uuid, value, ip) VALUES ($1, $2, $3)
								ON CONFLICT (ip) DO UPDATE SET
								uuid=$1,
								value=$2;`;
		let args = [uuid, value, ip];
		return client.query(query, args)
			.then(result => result ? res : null); */
		// });
		const res = {
			uuid,
			url,
		};
		return memory.set(memoryKey + ip, JSON.stringify({ value, uuid, ua }), 'EX', 5 * 60) // 5 Min
			.then(() => res);
	},

	validation(client, uuid, value, ip, ua){
		/*let args	= [uuid, value, ip];
		let query =
			`SELECT value FROM ${constant.tables.CAPTCHA} WHERE
				uuid=$1 AND
				value=$2 AND
				ip=$3 AND
				updated_at + INTERVAL '${limitMinute}' MINUTE >= NOW()
			LIMIT 1;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rows.length > 0); */
		const memory = cache.getClient();
		return memory.get(memoryKey + ip)
			.then(result => result && JSON.parse(result))
			.then(result => {
				memory.del(memoryKey + ip);
				return result && result.uuid === uuid && result.value === value && result.ua === ua;
			});
	},

	/* checkLimit(client, ip){
		let args	= [ip];
		let query = `SELECT COUNT(*) FROM ${constant.tables.CAPTCHA} WHERE ip=$1;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rows.length > 0 ? result.rows[0].count : null)
			.catch(err => {
				log.error(err);
				return false;
			});
	}, */

	/* delete(client, uuid){
		let args	= [uuid];
		let query = `DELETE FROM ${constant.tables.CAPTCHA} WHERE uuid = $1;`;
		return client.query(query, args);
	}, */

	/* clean(client){
		let query = `DELETE FROM ${constant.tables.CAPTCHA} WHERE created_at < (NOW() - INTERVAL '${limitMinute} MINUTES');`;
		return client.query(query, null);
	}, */
};

