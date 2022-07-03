const constant	 = require('../constant');
const CodedError = require('../Error');
const db				 = require('../db');

module.exports = {
	add(client, fields){
		let args	 = [];
		let argsDuplicate	 = [fields.subject, fields.content];
		let values = '';
		let queryDuplicate = `SELECT id FROM ${constant.tables.CONTACTS} WHERE subject=$1 AND content=$2 LIMIT 1;`;
		let query	= `INSERT INTO ${constant.tables.CONTACTS} (`;

		// Create query base on fields
		for(let name in fields){
			query += args.length > 0 ? ',' : '';
			values += args.length > 0 ? ',' : '';

			args.push(fields[name]);
			query += name;
			values += '$' + args.length;
		}

		// Close query for security, I think...
		query += ', status) VALUES (' + values + `, (SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.PENDING}' LIMIT 1));`;

		return client.query(queryDuplicate, argsDuplicate)
			.then(result => {
				if(!result || result.rowCount > 0)
					throw new CodedError(429, 'پیام شما قبلا ارسال شده است');
				return client.query(query, args);
			})
			.then(result => result.rowCount > 0);
	},

	getAll(client){
		let query =
			`SELECT
				CONTACTS.id,
				CONTACTS.fullname,
				CONTACTS.email,
				CONTACTS.phone,
				CONTACTS.subject,
				STATUS.label AS status
			FROM ${constant.tables.CONTACTS} CONTACTS
			INNER JOIN ${constant.tables.STATUS} STATUS
				ON STATUS.id = CONTACTS.status
			ORDER BY
				STATUS.id ASC, CONTACTS.created_at DESC;`;

		return client.query(query)
			.then(result => result.rows);
	},

	get(client, contactId){
		const args = [contactId];
		const queryUpdate = `
			UPDATE ${constant.tables.CONTACTS} SET status=(
				SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.READED}' LIMIT 1
			) WHERE id=$1;`;
		const query =
			`SELECT
				CONTACTS.content,
				STATUS.label AS status
			FROM ${constant.tables.CONTACTS} AS CONTACTS
			INNER JOIN ${constant.tables.STATUS} AS STATUS
				ON CONTACTS.status = STATUS.id
			WHERE
				CONTACTS.id=$1
			LIMIT 1;`;

		let contact = null;
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0])
					throw new CodedError(404, 'پیام یافت نشد');
				contact = result.rows[0];

				// Update status
				if(contact.status !== constant.status.READED)
					return client.query(queryUpdate, args);
				return null;
			})
			.then(() => {
				// delete contact.status;
				return contact;
			});
	},

	delete(client, contactId){
		let args	= [contactId];
		let query = `DELETE FROM ${constant.tables.CONTACTS} WHERE id=$1;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rowCount > 0);
	},
};
