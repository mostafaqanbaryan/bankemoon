const constant	 = require('../constant');
const db				 = require('../db');
const cache			 = require('../cache');
const CodedError = require('../Error');

const controlCache = postId => {
	const memory = cache.getClient();
	return Promise.all([
		memory.hget('posts:json', 'news'),
		memory.hget('posts:json', 'tutorials'),
		memory.hget('posts:json', 'snapshot'),
	])
	.then(result => {
		if(!result || result.length !== 3)
			throw new CodedError(500, 'دریافت کش با مشکل مواجه  شد');
		const obj = {};
		const promises = [];
		obj.news = result[0] ? JSON.parse(result[0]) : null;
		obj.tutorials = result[1] ? JSON.parse(result[1]) : null;
		obj.snapshot = result[2] ? JSON.parse(result[2]) : null;

		Object.keys(obj).forEach(key => {
			const array = obj[key];
			for(let i = 0; i < array; i++){
				if(array[i].id === postId) {
					promises.push(memory.hdel('posts:json', key));
					promises.push(memory.hincrby('posts:count', key, -1));
					break;
				}
			}
		});
		return Promise.all(promises);
	});
};

module.exports = {
	add(client, fields){
		let args	 = [];
		let values = '';
		let query	= `INSERT INTO ${constant.tables.POSTS} (`;

		// Create query base on fields
		for(let name in fields){
			query += args.length > 0 ? ',' : '';
			values += args.length > 0 ? ',' : '';

			args.push(fields[name]);
			query += name;
			values += '$' + args.length;
		}

		// Close query for security, I think...
		query += ') VALUES (' + values + ') RETURNING id;';

		return client.query(query, args)
			.then(result => {
				const memory = cache.getClient();
				memory.hdel('posts:json', fields.category);
				memory.hincrby('posts:count', fields.category, 1);
				return result.rowCount > 0 ? result.rows[0].id : 0;
			});
	},

	addVisit(client, pid){
		const query =
			`INSERT INTO ${constant.tables.POSTSOPT} (post_id, key, value) VALUES ($1, '${constant.posts.VISITCOUNT}', 1)
				ON CONFLICT (post_id, key) DO UPDATE SET value=${constant.tables.POSTSOPT}.value::INT+1;`;
		return client.query(query, [pid])
			.then(result => result.rowCount > 0);
	},

	getSnapshot(client){
		const query =
			`SELECT
				POSTS.excert,
				POSTS.slug,
				POSTS.title
			FROM ${constant.tables.POSTS} POSTS
			ORDER BY
				POSTS.created_at DESC
			LIMIT 3;`;

		return client.query(query)
			.then(result => result.rows);
	},

	getAll(client, type, page=1, limit=15){
		const offset = limit * (page - 1);
		const args = [];
		const postType = constant.posts[type.toUpperCase()];
		// const countName = postType ? 'COUNT_' + postType.toUpperCase() : 'COUNT';
		const countName = 'COUNT_' + postType.toUpperCase();
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
				PICTURE.alt as picture_alt,
				PICTURE.title as picture_title,
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
			`;
		if(postType) {
			args.push(postType);
			query += ` WHERE POSTS.category=$${args.length} `;
		}
		args.push(limit, offset);
		query +=
			` ORDER BY
				POSTS.created_at DESC
			LIMIT
				$${args.length-1}::integer
			OFFSET
				$${args.length}::integer;`;

		const queryCount =
			`SELECT value FROM ${constant.tables.OPT}
				WHERE key='${constant.posts[countName]}'
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

	get(client, pid){
		let args	= [pid];
		let query =
			`SELECT
				POSTS.id,
				POSTS.title,
				POSTS.slug,
				POSTS.excert,
				POSTS.content,
				POSTS.category,
				PICTURE.id AS picture_id,
				PICTURE.path AS picture_path,
				PICTURE.alt AS picture_alt,
				PICTURE.title AS picture_title,
				CONCAT(AUTHOR.first_name, ' ', AUTHOR.last_name) AS full_name
			FROM ${constant.tables.POSTS} AS POSTS
			INNER JOIN ${constant.tables.USERS} AS AUTHOR
				ON AUTHOR.id = POSTS.author_id
			LEFT JOIN ${constant.tables.FILES} AS PICTURE
				ON PICTURE.id=POSTS.picture_id
			WHERE
				POSTS.id=$1
			LIMIT 1;`;

		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'پست یافت نشد');
				const post = result.rows[0];
				post.category = post.category.split(',');
				return post;
			});
	},

	getByTitle(client, title, pid=0){
		let args	= [title, pid];
		let query =
			`SELECT * FROM ${constant.tables.POSTS} AS POSTS
			WHERE POSTS.title=$1 AND id<>$2 LIMIT 1;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows[0] : null);
	},

	getBySlug(client, slug, pid=0){
		let args	= [slug];
		let query =
			`SELECT
				POSTS.created_at,
				POSTS.updated_at,
				POSTS.id,
				POSTS.category,
				POSTS.title,
				POSTS.slug,
				POSTS.excert,
				POSTS.content,
				PICTURE.path AS picture,
				PICTURE.alt AS picture_alt,
				PICTURE.title AS picture_title,
				LOCK.value::boolean AS comment_lock
			FROM ${constant.tables.POSTS} AS POSTS
			LEFT JOIN ${constant.tables.POSTSOPT} LOCK
				ON LOCK.post_id = POSTS.id AND LOCK.key='${constant.posts.COMMENT_LOCK}'
			LEFT JOIN ${constant.tables.FILES} PICTURE
				ON PICTURE.id = POSTS.picture_id
			WHERE
				POSTS.slug=$1`;
		if(pid){
			args.push(pid);
			query += ` AND POSTS.id<>$2`;
		}
		query += ` LIMIT 1;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows[0] : null);
	},

	update(client, fields, where){
		let args = [];
		let query = `UPDATE ${constant.tables.POSTS} SET `;

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
			.then(result => {
				controlCache(where.id);
				return result.rowCount > 0;
			});
	},

	delete(client, where){
		let args = [];
		let query = `DELETE FROM ${constant.tables.POSTS} `;

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
		return client.query(query, args)
			.then(result => {
				controlCache(where.id);
				return result.rowCount > 0;
			});
	},

};
