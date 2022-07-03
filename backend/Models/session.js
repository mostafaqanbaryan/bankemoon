const constant	 = require('../constant');
const CodedError = require('../Error');
const db				 = require('../db');
const cache			 = require('../cache');
const log				 = require('../log');
const utils			 = require('../utils');
const uuidv4		 = require('uuid/v4');

// Models
const Visit = require('./visit');

module.exports = {
	get(client, session_id, user_id, user_agent){
		let args	= [session_id, user_id, user_agent];
		let query = `SELECT * FROM ${constant.tables.SESSIONS} WHERE session_id=$1::text AND user_id=$2::integer AND user_agent=$3::text LIMIT 1;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rows.length > 0 ? result.rows[0] : null)
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	getAllSessionsByUserId(client, uid){
		let args	= [uid];
		let query =
			`SELECT
				created_at,
				updated_at,
				id,
				session_id,
				user_agent,
				ip
			FROM ${constant.tables.SESSIONS}
			WHERE user_id=$1
			ORDER BY id DESC;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rows);
	},

	create(client, user_id, user_agent, ip){
		const session_id = (uuidv4() + uuidv4()).split('-').sort().join('');
		const args = [ip, session_id, user_id, user_agent];
		const query = `INSERT INTO ${constant.tables.SESSIONS} (ip, session_id, user_id, user_agent) VALUES($1::text, $2::text, $3::integer, $4::text);`;
		return client.query(query, args)
			.then(res => {
				if(!res || res.rowCount <= 0)
					throw new CodedError(500, 'ورود انجام نگرفت');
				return Visit.addDevice(client, user_agent);
			})
			.then(isAdded => {
				if(!isAdded)
					throw new CodedError(500, 'ساخت سشن انجام نگرفت');
				return {
					user_id,
					session_id
				};
			});
	},

	update(client, session_id, user_id, ip){
		let args	= [ip, session_id, user_id];
		let query = `UPDATE ${constant.tables.SESSIONS} SET ip=$1::text WHERE session_id=$2::text AND user_id=$3::integer;`;
		// Update in database
		return client.query(query, args)
			.then(res => res && res.rowCount > 0)
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	delete(client, id, user_id){
		let args	= [id, user_id];
		let query = `DELETE FROM ${constant.tables.SESSIONS} WHERE id=$1::integer AND user_id=$2::integer RETURNING session_id;`;
		return client.query(query, args)
			.then(res => {
				if(res && res.rowCount > 0){
					const memory = cache.getClient();
					const key = `session:${res.rows[0].session_id}`;
					memory.del(key); 
					return true;
				}
			});
	},

	deleteBySessionId(client, session_id){
		let args	= [session_id];
		let query = `DELETE FROM ${constant.tables.SESSIONS} WHERE session_id=$1::text;`;
		return client.query(query, args)
			.then(res => {
				if(res && res.rowCount > 0){
					const memory = cache.getClient();
					const key = `session:${session_id}`;
					memory.del(key); 
					return true;
				}
			});
	},
};

