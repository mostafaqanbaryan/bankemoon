const { Pool } = require('pg');
const log			 = require('../log');
const config	 = require('config');
const util		 = require('util');

// Create pool connection
const pool = new Pool({
	host: process.env.PGHOST,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	database: process.env.PGNAME,
});

// Pool Events Loop
if(process.env.NODE_ENV == 'development'){
	pool.on('connect', () => {
		log.info('Pool event connected');
	});

	pool.on('acquire', err => {
		log.info('Pool event acquired');
	});

	pool.on('remove', err => {
		log.warn('Pool event removed');
	});

	pool.on('error', err => {
		log.error(err);
	});
}

// Methods
const getClient = callback => pool.connect((err, client, done) => {

	// IF it takes more than 5 sec, Log it
	/*let status = 'Long';
	const query = client.query.bind(client);
	const timeout = setTimeout(() => {
		let text = JSON.stringify({
			query: client.lastQuery,
			params: client.params
		});
		log.save('db', text, status);
	}, 5000);

	client.query = function(text, params){
		client.lastQuery = text;
		client.params = params;
		client.release = err => {
			done(err);
			client.query = query;
		};
		return query.apply(client, arguments)
			.then(res => {
				clearTimeout(timeout);
				return res;
			}).catch(err => {
				status = 'Error';
				clearTimeout(timeout);
				return err;
			});
	};*/


	callback(err, client, done);
});


module.exports = {
	query: (text, params, cb) => {
		return new Promise((resolve, reject) => {
			// const start = Date.now();
			pool.query(text, params, (err, result) => {
				// const time = Date.now() - start;
				// console.log('Executed query: ', text, time, '\nrows: ', result.rowCount);
				if(err)
					reject(err);
				else
					resolve(result);
			});
		});
	},

	getClientAsync: util.promisify(getClient),
	getClient,
};

