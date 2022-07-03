const constant = require('../constant');
const CodedError = require('../Error');
const Message = require('./message');
const cache = require('../cache');


module.exports = {
	/* sendMessage(client, senderId, bankId, receiverId, subject, content){
		const args = [senderId, subject, content, bankId];
		const query =
			`SELECT
				id
			FROM ${constant.tables.MESSAGES}
			WHERE
				sender_id=$1 AND
				subject=$2 AND
				content=$3 AND
				bank_id=$4
			LIMIT 1;`;
		let messageId = 0;

		return client.query(`BEGIN`)
			// See if message is duplicate
			.then(() => client.query(query, args))
			// Create message
			.then(result => {
				if(!result || result.rowCount <= 0 || result.rows[0].id <= 0)
					return Message.addMessage(client, bankId, senderId, subject, content);
				else
					return result.rows[0].id;
			})
			// Send message to users
			.then(mId => {
				messageId = mId;
				return Message.addMessageUser(client, messageId, receiverId);
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'ارسال پیام با مشکل مواجه شد');
				const memory = cache.getClient();
				memory.hdel(constant.memory.users.BADGES, receiverId);
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	}, */

	getVisits(client){
		const keys =
			`'${constant.visits.TODAY}',
			'${constant.visits.YESTERDAY}',
			'${constant.visits.LASTWEEK}',
			'${constant.visits.TOTAL}',
			'${constant.visitors.TODAY}',
			'${constant.visitors.YESTERDAY}',
			'${constant.visitors.LASTWEEK}',
			'${constant.visitors.TOTAL}'`;
		const query = `SELECT key, value FROM ${constant.tables.OPT} WHERE key IN (${keys}) LIMIT ${keys.length};`;
		return client.query(query)
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت اطلاعات با مشکل مواجه شد');

				return result.rows.reduce((obj, row) => {
					obj[row.key] = row.value;
					return obj;
				}, {});
			});
	},

	getVisitors(client){
		const query =
			`SELECT 
				count(id) AS c
			FROM ${constant.tables.SESSIONS} WHERE updated_at::date=current_date;`;
		return client.query(query)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'دریافت اطلاعات با مشکل مواجه شد');
				return {today: result.rows[0].c};
			});
	},

	getDevices(client){
		const query =
			`SELECT 
				os, os_ver, browser, browser_ver, device, count
			FROM ${constant.tables.DEVICES} WHERE created_at::date > (current_date - interval '1 month');`;
		return client.query(query)
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت اطلاعات با مشکل مواجه شد');
				return result.rows;
			});
	},

	getFactors(client){
		const query =
			`SELECT
				FACTORS.*,
				CREATOR.full_name AS full_name,
				BANKS.name AS bank_name,
				SHABA.value AS shaba,
				OWNER.value AS owner_fullname
			FROM ${constant.tables.FACTORS} FACTORS
			INNER JOIN ${constant.tables.BANKSUSERSSEARCH} CREATOR
				ON CREATOR.bank_user_id = FACTORS.creator_id
			INNER JOIN ${constant.tables.BANKS} BANKS
				ON BANKS.id = FACTORS.bank_id
			INNER JOIN ${constant.tables.BANKSOPT} SHABA
				ON SHABA.bank_id = FACTORS.bank_id AND SHABA.key='shaba'
			INNER JOIN ${constant.tables.BANKSOPT} OWNER
				ON OWNER.bank_id = FACTORS.bank_id AND OWNER.key='owner'
			WHERE
				status=(SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.PAYED}' LIMIT 1);`;
		return client.query(query)
			.then(result => result.rows);
	},

	getPosts(client, page=1){
		const limit = 15;
		const offset = limit * (page - 1);
		const args = [limit, offset];
		let query =
			`SELECT
				POSTS.created_at,
				POSTS.id,
				POSTS.excert,
				POSTS.slug,
				POSTS.title,
				POSTS.category,
				--CONCAT(AUTHOR.first_name, ' ', AUTHOR.last_name) AS full_name,
				PICTURE.path as picture,
				VISIT.value AS visit_count,
				COMMENT.value AS comment_count
			FROM ${constant.tables.POSTS} POSTS
			INNER JOIN ${constant.tables.USERS} AUTHOR
				ON AUTHOR.id=POSTS.author_id
			LEFT JOIN ${constant.tables.FILES} PICTURE
				ON PICTURE.id=POSTS.picture_id
			LEFT JOIN ${constant.tables.POSTSOPT} VISIT
				ON VISIT.post_id=POSTS.id AND VISIT.key='${constant.posts.VISITCOUNT}'
			LEFT JOIN ${constant.tables.POSTSOPT} COMMENT
				ON COMMENT.post_id=POSTS.id AND COMMENT.key='${constant.posts.COMMENTCOUNT}'
			ORDER BY
				POSTS.created_at DESC
			LIMIT
				$${args.length-1}::integer
			OFFSET
				$${args.length}::integer;`;

		const queryCount =
			`SELECT value FROM ${constant.tables.OPT}
				WHERE key='${constant.posts.COUNT}'
				LIMIT 1;`;

		const res = {};
		return client.query(queryCount)
			// Count
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت تعداد پست‌ها با مشکل مواجه شد');
				res.total = result.rowCount > 0 ? result.rows[0].value : 0;
				if(res.total > 0)
					return client.query(query, args);
				else
					return {rows: []};
			})
			// Posts
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت پست‌ها با مشکل مواجه شد');
				res.posts = result.rows;
				return res;
			});
	},

	getBanks(client, page=1){
		const limit = 50;
		const offset = limit * (page-1);
		const queryCount = `SELECT value FROM ${constant.tables.OPT} WHERE key='${constant.banks.COUNT}' LIMIT 1;`;
		const query =
			`SELECT
				BANKS.*,
				USERCOUNT.value AS user_count,
				DESCR.value AS description,
				ROLE.value AS role
			FROM ${constant.tables.BANKS} BANKS
			INNER JOIN ${constant.tables.BANKSOPT} USERCOUNT
				ON USERCOUNT.bank_id = BANKS.id AND USERCOUNT.key='${constant.banks.USER_COUNT}'
			LEFT JOIN ${constant.tables.BANKSOPT} DESCR
				ON DESCR.bank_id = BANKS.id AND DESCR.key='description'
			LEFT JOIN ${constant.tables.BANKSOPT} ROLE
				ON ROLE.bank_id = BANKS.id AND ROLE.key='role'
			LEFT JOIN ${constant.tables.BANKSOPT} PLAN
				ON PLAN.bank_id = BANKS.id AND PLAN.key='plan'
			ORDER BY
				BANKS.updated_at DESC
			LIMIT ${limit}
			OFFSET ${offset}`;
		const banks = {};

		return client.query(queryCount)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'بانکی پیدا نشد');
				banks.total = result.rows[0].value;
				return client.query(query);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'بانکی پیدا نشد');
				banks.banks = result.rows;
				return banks;
			});
	},

	getUsers(client, page=1){
		const limit = 50;
		const offset = limit * (page-1);
		const queryCount = `SELECT value FROM ${constant.tables.OPT} WHERE key='${constant.users.COUNT}' LIMIT 1;`;
		const query =
			`SELECT
				id,
				first_name,
				last_name,
				username,
				email,
				phone,
				email_validate,
				phone_validate
			FROM ${constant.tables.USERS} USERS
			ORDER BY
				first_name ASC,
				last_name ASC
			LIMIT ${limit}
			OFFSET ${offset}`;

		// Get users
		const users = {};
		return client.query(queryCount)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'کاربری پیدا نشد');
				users.total = result.rows[0].value;
				return client.query(query);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'کاربری پیدا نشد');
				users.users = result.rows;
				return users;
			});
	},

	getLogs(client){
		const query =
			`SELECT
				created_at, name, total, status
			FROM ${constant.tables.LOGS}
			ORDER BY created_at DESC
			LIMIT 20;`;
		return client.query(query)
			.then(result => result.rows);
	},

	getTickets(client){
		const query =
			`SELECT
				TICKETS.updated_at,
				TICKETS.id AS id,
				TICKETS.subject,
				CONCAT(CREATOR.first_name, ' ', CREATOR.last_name) AS full_name,
				STATUS.label AS status,
				DEPARTMENTS.label AS department
			FROM ${constant.tables.TICKETS} TICKETS
			INNER JOIN ${constant.tables.USERS} CREATOR
				ON CREATOR.id = TICKETS.user_id
			INNER JOIN ${constant.tables.DEPARTMENTS} DEPARTMENTS
				ON DEPARTMENTS.id = TICKETS.department_id
			INNER JOIN ${constant.tables.STATUS} STATUS
				ON STATUS.id = TICKETS.status
			WHERE
				status<>(SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.CLOSED}' LIMIT 1);`;
		return client.query(query)
			.then(result => result.rows);
	},

	getTicket(client, ticketId){
		let args	= [ticketId];
		let query =
			`SELECT
				--TICK.created_at,
				TICK.id,
				TICK.content,
				CONCAT(USERS.first_name, ' ', USERS.last_name) AS admin_full_name
			FROM ${constant.tables.TICKETSMESSAGES} AS TICK
			LEFT JOIN ${constant.tables.USERS} AS USERS
				ON USERS.id = TICK.admin_id
			WHERE TICK.ticket_id=$1
			ORDER BY TICK.created_at DESC;`;

		return client.query(query, args)
			.then(result => ({messages: result.rows}));
	},

	closeTicket(client, ticketId){
		let args	= [ticketId];
		let query =
			`UPDATE ${constant.tables.TICKETS} SET status=(
				SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.CLOSED}' LIMIT 1
			) WHERE id=$2`;

		// Search database
		return client.query(query, args)
			.then(result => result.rowCount > 0);
	},

	deleteTicket(client, ticketId){
		let args	= [ticketId];
		let query = `DELETE FROM ${constant.tables.TICKETS} WHERE id=$1 RETURNING user_id;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows[0].user_id : 0);
	},

	deleteTicketMessage(client, ticketId, messageId){
		let args	= [ticketId, messageId];
		let query = `DELETE FROM ${constant.tables.TICKETSMESSAGES} WHERE ticket_id=$1 AND id=$2;`;
		let select = `SELECT user_id FROM ${constant.tables.TICKETS} WHERE id=$1 LIMIT 1;`;

		return client.query(query, args)
			.then(result => {
				if(result.rowCount <= 0)
					throw new CodedError(500, 'تیکت ارسال نشد');
				return client.query(select, [ticketId]);
			})
			.then(result => result.rowCount > 0 ? result.rows[0].user_id : 0);
	},
};
