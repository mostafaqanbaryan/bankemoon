const constant = require('../constant');
const db			 = require('../db');
const log			 = require('../log');
const utils		 = require('../utils');

module.exports = {
	getAll(client, uid){
		let args	= [uid];
		let query = `SELECT
				TICK.updated_at,
				TICK.id,
				TICK.subject,
				STATUS.label AS status
			FROM ${constant.tables.TICKETS} AS TICK
			INNER JOIN ${constant.tables.STATUS} AS STATUS
			ON STATUS.id = TICK.status
			WHERE user_id=$1
			ORDER BY TICK.updated_at DESC;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rows)
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	getTicket(client, uid, ticketId){
		let args	= [uid, ticketId];
		let query =
			`SELECT
				TICK.updated_at,
				TICK.id,
				TICK.subject,
				concat(USERS.first_name, ' ', USERS.last_name) AS full_name,
				DEPART.label AS department,
				STATUS.label AS status
			FROM ${constant.tables.TICKETS} AS TICK
			INNER JOIN ${constant.tables.STATUS} AS STATUS
				ON STATUS.id = TICK.status
			INNER JOIN ${constant.tables.USERS} AS USERS
				ON USERS.id = TICK.user_id
			INNER JOIN ${constant.tables.DEPARTMENTS} AS DEPART
				ON DEPART.id = TICK.department_id
			WHERE user_id=$1 AND TICK.id=$2
			LIMIT 1;`;

		// Search database
		let row = null;
		return client.query(query, args)
			.then(result => {
				if(result.rowCount <= 0)
					return null;
				row = result.rows[0];
				query = `UPDATE ${constant.tables.TICKETS} SET status=(
					SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.READED}' LIMIT 1
				) WHERE user_id=$1 AND id=$2 AND status=(
					SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.ANSWERED}' LIMIT 1
				);`;
				return client.query(query, args);
			})
			.then(result => row);
	},

	getResponses(client, uid, ticketId){
		let args	= [ticketId];
		let query =
		`SELECT
			TICK.created_at,
			TICK.content,
			ROLE.label AS role,
			concat(USERS.first_name, ' ', USERS.last_name) AS full_name
		FROM ${constant.tables.TICKETSMESSAGES} TICK
		LEFT JOIN ${constant.tables.USERS} USERS
			ON USERS.id = TICK.admin_id
		LEFT JOIN ${constant.tables.USERSOPT} OPT
			ON OPT.user_id = TICK.admin_id AND key='${constant.ROLE}'
		LEFT JOIN ${constant.tables.ROLES} ROLE
			ON OPT.value::smallint = ROLE.id
		WHERE TICK.ticket_id=$1
		ORDER BY TICK.id ASC`;

		// Search database
		return client.query(query, args)
			.then(result => {
				if(result.rowCount <= 0)
					return null;

				return result.rows;
			})
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	create(client, uid, department, subject, content){
		let args = [uid, department, subject];
		let query =
		`INSERT INTO ${constant.tables.TICKETS} (user_id, department_id, subject) VALUES ($1,
			(
				SELECT id FROM ${constant.tables.DEPARTMENTS} WHERE label=$2 LIMIT 1
			)
			, $3) RETURNING id`;
		let ticketId = 0;

		return client.query(query, args)
			.then(result => {
				if(!result || result.rows.length <= 0)
					return false;

				ticketId = result.rows[0].id;
				query = `INSERT INTO ${constant.tables.TICKETSMESSAGES} (ticket_id, content) VALUES ($1, $2)`;
				args = [ticketId, content];
				return client.query(query, args);
			})
			.then(result => result.rowCount > 0 && ticketId)
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	replyQuestion(client, uid, ticketId, content){
		let args = [uid, ticketId];
		let query =
		`SELECT user_id FROM ${constant.tables.TICKETS}
		WHERE
		user_id=$1 AND
		id=$2 AND
		status <> (SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.CLOSED}' LIMIT 1)
		LIMIT 1;`;

		return client.query(query, args)
			.then(result => {
					return null;

				query = `INSERT INTO ${constant.tables.TICKETSMESSAGES} (ticket_id, content) VALUES ($1, $2) RETURNING created_at;`;
				args = [ticketId, content];
				return client.query(query, args);
			})
			.then(result => result && result.rowCount > 0 && result.rows[0])
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	replyAnswer(client, adminId, ticketId, content){
		let args = [adminId, ticketId, content];
		let query = `INSERT INTO ${constant.tables.TICKETSMESSAGES} (admin_id, ticket_id, content) VALUES ($1, $2, $3);`;
		let select = `SELECT user_id FROM ${constant.tables.TICKETS} WHERE id=$1 LIMIT 1;`;

		return client.query(query, args)
			.then(result => {
				if(result.rowCount <= 0)
					throw new CodedError(500, 'تیکت ارسال نشد');
				return client.query(select, [ticketId]);
			})
			.then(result => result.rowCount > 0 ? result.rows[0].user_id : 0);
	},

	delete(client, uid, ticketId){
		let args	= [uid, ticketId];
		let query = `DELETE FROM ${constant.tables.TICKETS} WHERE user_id=$1 AND id=$2`;

		// Search database
		return client.query(query, args)
			.then(result => result.rowCount > 0);
	},

	close(client, uid, ticketId){
		let args	= [uid, ticketId];
		let query =
		`UPDATE ${constant.tables.TICKETS} SET status=(
			SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.CLOSED}' LIMIT 1
		) WHERE user_id=$1 AND id=$2`;

		// Search database
		return client.query(query, args)
			.then(result => result.rowCount > 0);
	},
};


