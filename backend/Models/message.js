const constant = require('../constant');
const db			 = require('../db');
const cache		 = require('../cache');
const log			 = require('../log');
const utils		 = require('../utils');

module.exports = {
	addToAllUsers(client, bankId, senderId, subject, content){
		const args = [bankId, senderId, subject, content];
		const query =
			`SELECT
				id
			FROM ${constant.tables.MESSAGES}
			WHERE
				bank_id=$1 AND
				sender_id=$2 AND
				subject=$3 AND
				content=$4
			LIMIT 1;`;
		const queryStatus = `SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.NOTREADED}' LIMIT 1;`;
		const argsAddToAll = [bankId]; 
		const queryAddToAll = `INSERT INTO ${constant.tables.MESSAGESUSERS} (user_id, message_id, status)
			SELECT user_id, $2, $3 FROM ${constant.tables.BANKSUSERS} WHERE bank_id=$1 LIMIT 1;`;

		return client.query(`BEGIN`)
			// See if message is duplicate
			.then(() => client.query(query, args))
			// Create message
			.then(result => {
				if(!result || result.rowCount <= 0 || result.rows[0].id <= 0)
					return this.addMessage(client, bankId, senderId, subject, content);
				else
					return result.rows[0].id;
			})
			// Get status
			.then(mId => {
				argsAddToAll.push(mId);
				return client.query(queryStatus);
			})
			// Send message to users
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(404, 'وضعیت یافت نشد');
				const status = result.rows[0].id;
				argsAddToAll.push(status);
				return client.query(queryAddToAll, argsAddToAll);
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'ارسال پیام با مشکل مواجه شد');
				const memory = cache.getClient();
				memory.del(constant.memory.users.BADGES);
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	addMessageUser(client, messageId, userId){
		const args = [messageId, userId];
		const query = `INSERT INTO ${constant.tables.MESSAGESUSERS} (message_id, user_id, status) VALUES ($1, $2,(
				SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.NOTREADED}' LIMIT 1
			)
		);`;
		return client.query(query, args)
			.then(result => result && result.rowCount > 0);
	},

	add(client, bankId, senderId, subject, content, userIds){
		const args = [bankId, senderId, subject, content];
		const query =
			`SELECT
				id
			FROM ${constant.tables.MESSAGES}
			WHERE
				bank_id=$1 AND
				sender_id=$2 AND
				subject=$3 AND
				content=$4
			LIMIT 1;`;
		let messageId = 0;

		return client.query(`BEGIN`)
			// See if message is duplicate
			.then(() => client.query(query, args))
			// Create message
			.then(result => {
				if(!result || result.rowCount <= 0 || result.rows[0].id <= 0)
					return this.addMessage(client, bankId, senderId, subject, content);
				else
					return result.rows[0].id;
			})
			// Send message to users
			.then(mId => {
				messageId = mId;
				return userIds.reduce((acc, userId) => {
					return acc.then(result => {
						if(!result)
							throw new CodedError(500, 'پیام به کاربر ارسال نشد');
						return this.addMessageUser(client, messageId, userId);
					});
				}, Promise.resolve(true));
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'ارسال پیام با مشکل مواجه شد');
				const memory = cache.getClient();
				memory.del(constant.memory.users.BADGES);
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	addMessage(client, bankId, senderId, subject, content){
		const args = [bankId, senderId, subject, content];
		const query = `INSERT INTO ${constant.tables.MESSAGES} (bank_id, sender_id, subject, content) VALUES ($1, $2, $3, $4) RETURNING id;`;
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || result.rows[0].id <= 0)
					throw new CodedError(500, 'افزودن پیام با مشکل مواجه شد');
				return result.rows[0].id;
			});
	},

	getAll(client, uid){
		let args	= [uid];
		let query = `SELECT
				MESSAGESUSERS.created_at,
				MESSAGESUSERS.id,
				MESSAGES.subject,
				BANKS.username AS bank_username,
				BANKS.name AS bank_name,
				USERS.username sender_username,
				CONCAT(USERS.first_name, ' ', USERS.last_name) AS sender_full_name,
				STATUS.label AS status
			FROM ${constant.tables.MESSAGESUSERS} AS MESSAGESUSERS
			INNER JOIN ${constant.tables.MESSAGES} AS MESSAGES
				ON MESSAGES.id = MESSAGESUSERS.message_id
			INNER JOIN ${constant.tables.USERS} AS USERS
				ON USERS.id = MESSAGES.sender_id
			INNER JOIN ${constant.tables.STATUS} AS STATUS
				ON STATUS.id = MESSAGESUSERS.status
			LEFT JOIN ${constant.tables.BANKS} AS BANKS
				ON BANKS.id = MESSAGES.bank_id
			WHERE MESSAGESUSERS.user_id=$1
			ORDER BY MESSAGESUSERS.status DESC, MESSAGESUSERS.created_at DESC;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rows);
			/* .catch(err => {
				log.error(err);
				return false;
			}); */
	},

	get(client, uid, messageUserId){
		const args = [uid, messageUserId];
		const queryUpdate = `
			UPDATE ${constant.tables.MESSAGESUSERS} SET status=(
				SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.READED}' LIMIT 1
			) WHERE user_id=$1 AND id=$2;`;
		const query =
			`SELECT
				MESSAGES.content,
				STATUS.label AS status
			FROM ${constant.tables.MESSAGESUSERS} AS MESSAGESUSERS
			INNER JOIN ${constant.tables.MESSAGES} AS MESSAGES
				ON MESSAGESUSERS.message_id = MESSAGES.id
			INNER JOIN ${constant.tables.STATUS} AS STATUS
				ON MESSAGESUSERS.status = STATUS.id
			WHERE
				MESSAGESUSERS.user_id=$1 AND
				MESSAGESUSERS.id=$2
			LIMIT 1;`;

		let message = null;
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0])
					throw new CodedError(404, 'پیام یافت نشد');
				message = result.rows[0];

				// Update status
				if(message.status !== constant.status.READED)
					return client.query(queryUpdate, args);
				return null;
			})
			.then(() => {
				// delete message.status;
				return message;
			});
	},

	delete(client, uid, messageUserId){
		const argsMessageUser = [uid, messageUserId];
		const queryMessageUser = `DELETE FROM ${constant.tables.MESSAGESUSERS} WHERE user_id=$1 AND id=$2 RETURNING message_id;`;
		const argsMessage = [];
		const queryMessage =
			`DELETE
			FROM ${constant.tables.MESSAGES}
			WHERE
				id=$1 AND
				(SELECT 1 FROM ${constant.tables.MESSAGESUSERS} WHERE message_id=$1 LIMIT 1) IS NOT DISTINCT FROM NULL;`;

		// Delete messageUser
		return client.query(queryMessageUser, argsMessageUser)
			// Delete message
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].message_id)
					throw new CodedError(404, 'پیام وجود ندارد');
				const messageId = result.rows[0].message_id;
				argsMessage.push(messageId);
				return client.query(queryMessage, argsMessage);
			});
			/* .catch(err => {
				log.error(err);
				return false;
			}); */
	},
};

