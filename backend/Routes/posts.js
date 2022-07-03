const router = require('express').Router();
const db		 = require('../db');
const config  = require('config');
const cache  = require('../cache');
const v			 = require('../validation');
const auth	 = require('../auth');
const {
	handle_result,
	handle_fail,
	handle_error
} = require('../utils');

// Config file
const constant = require('../constant');

// Bring Post Model
const Post = require('../Models/post');
const User = require('../Models/user');


/* const commentValidation = [
	// Safty Check
	check('content').isLength({min: 3}).withMessage('طول متن باید حداقل ۳ حرف باشد'),
]; */

function getPostsFromCache(isCachable, memory, type){
	const posts = {};
	if(!isCachable)
		return Promise.resolve(posts);
	return memory.hget(constant.memory.posts.ALL, type)
		.then(result => {
			if(result)
				posts.posts = JSON.parse(result);
			return memory.hget(constant.memory.posts.COUNT, type);
		})
		.then(result => {
			if(result)
				posts.total = JSON.parse(result);
			return posts;
		});
}

// Show posts for footer
router.get('/snapshot', (req, res) => {
	// Variables
	const memory = cache.getClient();
	return memory.hget(constant.memory.posts.ALL, 'snap')
		.then(posts => {
			if(posts) {
				posts = JSON.parse(posts);
				return handle_result(res, 'posts', posts, posts);
			} else {
				// Database
				db.getClient((err, client, done) =>{
					// Error happend in getting client
					if(err)
						return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد');

					Post.getSnapshot(client)
						.then(rows => {
							if(rows)
								memory.hset(constant.memory.posts.ALL, 'snap', JSON.stringify(rows));
							return handle_result(res, 'posts', rows, rows);
						})
						.catch(err => handle_fail(res, err.message, err.code))
						.then(() => client.release());
				});
			}
		})
		.catch(err => handle_fail(res, err.message, err.code));
});

// Show post
router.get('/:postSlug', (req, res) => {
	db.getClient((err, client, done) =>{
		// Error happend in getting client
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد');

		let post = null;
		Post.getBySlug(client, req.params.postSlug)
			.then(p => {
				post = p;
				if(post.picture)
					post.picture = config.avatar.cdn.post + post.picture;
				return handle_result(res, 'post', p, p);
			})
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => {
				if(post)
					return Post.addVisit(client, post.id);
				return null;
			})
			.catch(err => handle_error(res, err))
			.then(() => client.release());
	});
});

// Show posts
router.get('/', (req, res) => {
	// Variables
	const page = req.query.page ? parseInt(req.query.page) : 1;
	let type = req.query.type || null;
	const memory = cache.getClient();
	const isCachable = page === 1;
	const rowsPerPage = 15;

	switch(type) {
		case 'tutorials':
			type = 'Tutorials';
			break;
		case 'news':
			type = 'News';
			break;
		default:
			return handle_fail(res, 'نوع پست را مشخص کنید', 415);
	}

	
	getPostsFromCache(isCachable, memory, type)
		.then(result => {
			if(result && result.posts && result.total) {
				result.posts = result.posts.map(p => {
					if(p.picture)
						p.picture = config.avatar.cdn.post + p.picture;
					return p;
				});
				result.rowsPerPage = rowsPerPage;
				return handle_result(res, null, result, result);
			} else {
				// Database
				db.getClient((err, client, done) =>{
					// Error happend in getting client
					if(err)
						return handle_fail(res, 'ارتباط با دیتابیس برقرار نشد');

					Post.getAll(client, type, page)
						.then(rows => {
							if(isCachable){
								memory.hset(constant.memory.posts.COUNT, type, rows.total);
								memory.hset(constant.memory.posts.ALL, type, JSON.stringify(rows.posts));
							}
							rows.rowsPerPage = rowsPerPage;
							rows.posts = rows.posts.map(p => {
								if(p.picture)
									p.picture = config.avatar.cdn.post + p.picture;
								return p;
							});
							return handle_result(res, null, rows, rows);
						})
						.catch(err => handle_fail(res, err.message, err.code))
						.then(() => client.release());
				});
			}
		})
		.catch(err => handle_fail(res, err.message, err.code));
});

module.exports = router;
