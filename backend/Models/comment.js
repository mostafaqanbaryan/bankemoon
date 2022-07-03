const constant	 = require('../constant');
const db				 = require('../db');
const log				 = require('../log');
const CodedError = require('../Error');

module.exports = {
	add(client, postId, fields){
		let args	 = [];
		let values = '';
		/* let query_meta =
		`INSERT INTO ${constant.tables.POSTSCOMMENTS}
			(post_id, comment_id) VALUES
			((SELECT id FROM ${constant.tables.POSTS} WHERE id=$1 LIMIT 1), $2);`; */
		let queryLock = `SELECT value FROM ${constant.tables.POSTSOPT} WHERE key='${constant.posts.COMMENT_LOCK}' AND post_id=$1 LIMIT 1`;
		let query	= `INSERT INTO ${constant.tables.COMMENTS} (`;

		// Create query base on fields
		for(let name in fields){
			query += args.length > 0 ? ',' : '';
			values += args.length > 0 ? ',' : '';

			args.push(fields[name]);
			query += name;
			values += '$' + args.length;
		}

		// Close query for security, I think...
			query += `,status) VALUES (` + values + `, (
					SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.PENDING}' LIMIT 1
				));`;

		return client.query(queryLock, [postId])
			.then(result => {
				if(!result	|| !result.rows || (result.rowCount > 0 && result.rows[0].value))
					throw new CodedError(403, 'نظرات این پست بسته است');
				return client.query(query, args);
			})
			.then(result => result.rowCount > 0);
	},

	getAll(client, limit, offset){
		let args = [limit, offset];
		let query = 
		`SELECT 
			USERS.first_name,
			USERS.last_name,
			USERS.username,
			COMMENTS.id,
			COMMENTS.author_id,
			COMMENTS.parent_id,
			COMMENTS.content,
			COMMENTS.status,
			COMMENTS.created_at
		FROM ${constant.tables.COMMENTS} AS COMMENTS
		INNER JOIN ${constant.tables.USERS} AS USERS
			ON COMMENTS.author_id = USERS.id
		WHERE
			COMMENTS.status=(
				SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.PENDING}' LIMIT 1
			)
		ORDER BY created_at DESC
		LIMIT $1::integer
		OFFSET $2::integer;`;
		return client.query(query, args)
			.then(result => result.rows);
	},

	get(client, pid){
		let args	= [pid];
		let query =
			`SELECT
				COMMENTS.created_at,
				COMMENTS.id,
				COMMENTS.content,
				COMMENTS.parent_id,
				COMMENTS.fullname
			FROM ${constant.tables.COMMENTS} AS COMMENTS
			WHERE
				COMMENTS.post_id=$1 AND
				COMMENTS.status=(
					SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.ACCEPTED}' LIMIT 1
				);`;

		return client.query(query, args)
			.then(result => result.rows);
	},

	getById(client, bid){
		let args	= [bid];
		let query =
			`SELECT 
				COMMENTS.id AS id,
				COMMENTS.value AS value,
				COMMENTS.type AS type,
				first_name, last_name, username, user_id
			FROM ${constant.tables.COMMENTS} AS COMMENTS
			INNER JOIN ${constant.tables.USERS} AS USERS
			ON COMMENTS.user_id = USERS.id
			WHERE COMMENTS.bank_id=$1 ORDER BY id DESC;`;

		return client.query(query, args)
			.then(result => result.rows);
	},

	update(client, fields, where){
		let args = [];
		let query = `UPDATE ${constant.tables.COMMENTS} SET `;

		// Create query base on fields
		for(let name in fields){
			if(!fields[name]) continue;
			query += args.length > 0 ? ',' : '';
			query += name + '=$' + (args.length+1);
			args.push(fields[name]);
		}

		// Create query WHERE clause
		if(where){
			query += ' WHERE ';
			let field_len = args.length;
			for(let name in where){
				query += args.length > field_len ? ' AND ' : '';
				query += name + '=$' + (args.length+1);
				args.push(where[name]);
			}
		}

		// Close query for security, I think...
		query += ';';

		// Update in database
		return client.query(query, args)
			.then(result => result.rowCount > 0);
	},

	delete(client, where){
		let args			 = [];
		let query_meta = `DELETE FROM ${constant.tables.POSTSCOMMENTS} WHERE comment_id = $1;`;
		let query			 = `DELETE FROM ${constant.tables.COMMENTS} `;
		let commentId  = where.id;

		// Create query WHERE clause
		if(where){
			query += 'WHERE ';
			let field_len = args.length;
			for(let name in where){
				query += args.length > field_len ? ' AND ' : '';
				query += name + '=$' + (args.length+1);
				args.push(where[name]);
			}
		}

		// Close query for security, I think...
		query += ';';

		// Update in database
		return client.query('BEGIN')
			// DELETE COMMENT
			.then(() => client.query(query, args))
			.then(result => result.rowCount > 0 ? true : false)
			.then(isDeleted => {
				if(!isDeleted)
					throw new Error('عملیات با مشکل مواجه شد');
			})
			// DELETE META
			.then(() => client.query(query_meta, [commentId]))
			.then(result => result.rowCount > 0 ? true : false)
			.then(isDeleted => {
				if(!isDeleted)
					throw new Error('عملیات با مشکل مواجه شد');

				client.query('COMMIT');
				return true;
			})
			.catch(err => {
				client.query('ROLLBACK');
				return err.message;
			});
	},
};
