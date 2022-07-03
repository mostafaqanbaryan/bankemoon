const constant = require('../constant');
const config	 = require('config');
const db			 = require('../db');
const fs			 = require('fs');

module.exports = {
	add(client, {path, type, alt, title, uploaderId}){
		let args	 = [path, type, alt, title, uploaderId];
		let values = '';
		let query =
			`INSERT INTO ${constant.tables.FILES}
				(path, type, alt, title, uploader_id) VALUES ($1, $2, $3, $4, $5)
			RETURNING id;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows[0].id : 0);
	},

	delete(client, fileId){
		const getFile = `SELECT path FROM ${constant.tables.FILES} WHERE id=$1 LIMIT 1;`;
		const deleteFile = `DELETE FROM ${constant.tables.FILES} WHERE id=$1;`;
		const updatePosts = `UPDATE ${constant.tables.POSTS} SET picture_id=NULL WHERE picture_id=$1;`;

		return client.query('BEGIN')
			.then(() => client.query(updatePosts, [fileId]))
			.then(result => {
				if(!result)
					throw new CodedError(500, 'بروزرسانی پست با مشکل مواجه شد');
				return client.query(getFile, [fileId]);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'فایل پیدا نشد');
				const path = result.rows[0].path;
				const li = path.lastIndexOf('.');
				const fileName = path.substr(0, li);
				fs.unlinkSync([process.cwd(), fileName].join('/'));
				return client.query(deleteFile, [fileId]);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'فایل حذف نشد');
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},
};
