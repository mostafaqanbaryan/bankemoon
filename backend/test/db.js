const server	 = require('../server');
const db			 = require('../db');
const cache		 = require('../cache');
const utils		 = require('../utils');
const constant = require('../constant');

// const Bank = require('../Models/bank');

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

const users = [
	{
		firstName: 'تست',
		lastName: 'تستیان اول',
		username: 'test_user_1',
		password: 'test_passw0rd_1',
		phoneNumber: '09112223331',
		balance: 10000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان دوم',
		username: 'test_user_2',
		password: 'test_passw0rd_2',
		phoneNumber: '09112223332',
		balance: 20000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان سوم',
		username: 'test_user_3',
		password: 'test_passw0rd_3',
		phoneNumber: '09112223333',
		balance: 30000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان چهارم',
		username: 'test_user_4',
		password: 'test_passw0rd_4',
		phoneNumber: '09112223334',
		balance: 40000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان پنجم',
		username: 'test_user_5',
		password: 'test_passw0rd_5',
		phoneNumber: '09112223335',
		balance: 50000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان ششم',
		username: 'test_user_6',
		password: 'test_passw0rd_6',
		phoneNumber: '09112223336',
		balance: 60000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان هفتم',
		username: 'test_user_7',
		password: 'test_passw0rd_7',
		phoneNumber: '09112223337',
		balance: 70000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان هفتم',
		username: 'test_user_8',
		password: 'test_passw0rd_8',
		phoneNumber: '09112223338',
		balance: 80000,
	},
];
const unregistered = [
	{
		firstName: 'تست',
		lastName: 'تستیان ثبت‌نام نشده',
		username: 'test_unregistered_1',
		password: 'test_passw0rd_1',
		phoneNumber: '09212223331',
		balance: 110000,
	},
	{
		firstName: 'تست',
		lastName: 'تستیان ثبت‌نام نشد',
		username: 'test_unregistered_2',
		password: 'test_passw0rd_2',
		phoneNumber: '09212223332',
		balance: 120000,
	},
];
const banks = [
	{
		name: 'انک تست اول',
		username: 'test_bank_user_1',
	},
	{
		name: 'انک تست دوم',
		username: 'test_bank_user_2',
	},
	{
		name: 'انک تست سوم',
		username: 'test_bank_user_3',
	},
	{
		name: 'انک تست چهارم',
		username: 'test_bank_user_4',
	},
];
let sessions = [];
let bankUserIds = {};

let authorization = i => 'Bearer ' + (i === 'wrong'
	? '1234567890123456789123456789012345678900123456789012345678901234'
	: sessions[i].sessionId
);
let addSession = obj => sessions.push(obj);
let addBankUserId = (bankUsername, key, value) => {
	bankUserIds[bankUsername] = bankUserIds[bankUsername] ? bankUserIds[bankUsername] : {};
	bankUserIds[bankUsername][key] = value;
};


speedTest = () => {
	// W/O Full where
	db.getClient((err, client) => {
		let time = 0.0;

		for(let i = 1; i <= 10000; i++){
			let dt = utils.now();
			let query = "SELECT * FROM li_sessions AS S WHERE S.session_id='4adc4d9d4db9543771fca3ba388a5e25fc6c825fa21ebf5c40b0e510668e4396' LIMIT 1;";
			client.query(query)
				.then(res => {
					time += utils.now() - dt;
					if(i === 10000) {
						console.log('--------------------Select W/O FULL where---------------------');
						console.log('loop %d: ', i, time);
						console.log('avg: ', time / i);
					}
				});
		}
	});

	// W Full where
	db.getClient((err, client) => {
		let time = 0.0;

		for(let i = 1; i <= 10000; i++){
			let dt = utils.now();
			let query = `SELECT * FROM li_sessions AS S WHERE S.session_id='4adc4d9d4db9543771fca3ba388a5e25fc6c825fa21ebf5c40b0e510668e4396'
			AND user_id='1' AND user_agent='PostmanRuntime /7.1.1'
			LIMIT 1;`;
			client.query(query)
				.then(res => {
					time += utils.now() - dt;
					if(i === 10000) {
						console.log('--------------------Select With FULL where---------------------');
						console.log('loop %d: ', i, time);
						console.log('avg: ', time / i);
					}
				});
		}
	});

	// Inner join W/O Full where
	db.getClient((err, client) => {
		let time = 0.0;

		for(let i = 1; i <= 10000; i++){
			let dt = utils.now();
			let query = `SELECT * FROM li_sessions AS S
			INNER JOIN li_users AS U
			ON U.id = S.user_id
			WHERE S.session_id='4adc4d9d4db9543771fca3ba388a5e25fc6c825fa21ebf5c40b0e510668e4396' LIMIT 1;`;
			client.query(query)
				.then(res => {
					time += utils.now() - dt;
					if(i === 10000) {
						console.log('--------------------Inner join W/O FULL where---------------------');
						console.log('loop %d: ', i, time);
						console.log('avg: ', time / i);
					}
				});
		}
	});

	// Inner join W Full where
	db.getClient((err, client) => {
		let time = 0.0;

		for(let i = 1; i <= 10000; i++){
			let dt = utils.now();
			let query = `SELECT * FROM li_sessions AS S
			INNER JOIN li_users AS U
			ON U.id = S.user_id
			WHERE S.session_id='4adc4d9d4db9543771fca3ba388a5e25fc6c825fa21ebf5c40b0e510668e4396'
			AND S.user_id='1' AND S.user_agent='PostmanRuntime /7.1.1'
			LIMIT 1;`;
			client.query(query)
				.then(res => {
					time += utils.now() - dt;
					if(i === 10000) {
						console.log('--------------------Inner join With FULL where---------------------');
						console.log('loop %d: ', i, time);
						console.log('avg: ', time / i);
					}
				});
		}
	});
};


/*
 * BANK-0
 * User[0]: Creator
 * User[1]: Added By Creator
 * User[2]: Admin By Creator
 * User[3]: Added By Creator
 * User[4]: Added By JoinRequest
 * User[5]: Declined By JoinRequest
 * User[6]: Pending By JoinRequest
 * User[7]: Not A Member
 *
 *
 * BANK-1
 * User[0]: Creator
 * User[5]: Admin by Creator
 *
 *
 * BANK-2
 * User[6]: Creator
 *
 */

/* describe('test', ()=> {
	it('should success', done => {
		const bank = {
			id: 733,
			created_at: '2018-07-05T10:35:03.136Z',
			name: 'انک جدید',
			username: 'test_bank_user_1',
			avatar: null,
			user_id: 1116,
			status: null,
			role: null
		};
		bank.should.have.all.keys('avatar', 'created_at', 'id', 'name', 'role', 'status', 'user_id', 'username');
		done();
	});

	it('should return currval', done => {
		db.getClient((err, client) => {
			let queryInsert = 'insert into li_transactions(bank_user_id , value, type) values (54, 111111, 1);';
			let querySleep = `SELECT pg_sleep(4);`;
			let querySelect = `SELECT currval('li_transactions_id_seq');`;
			client.query(querySleep)
				.then(() => client.query(queryInsert))
				.then(result => console.log(result.rows))
				.then(() => client.query(querySleep))
				.then(() => client.query(querySelect))
				.then(result => console.log(result.rows))
				.then(() => client.query(querySleep))
				.then(() => client.query(queryInsert))
				.then(() => client.query(querySleep))
				.then(() => client.query(querySelect))
				.then(result => console.log(result.rows))
				.then(() => client.release())
				.then(() => done());
		});
	});
}); */


// Clean out table
before(done => {
	db.getClient((err, client) => {
		if(err)
			throw new Error(err);

		let queries = [
			`TRUNCATE TABLE ${constant.tables.USERS} CASCADE`,
			`TRUNCATE TABLE ${constant.tables.BANKS} CASCADE`,
			`TRUNCATE TABLE ${constant.tables.TRANSACTIONS} CASCADE`,
			`INSERT INTO ${constant.tables.USERS}
				(id, first_name, username, email, email_validate, password, phone, phone_validate) VALUES
				(
					1,
					'بانکمون',
					'bankemoon',
					'info@bankemoon.com',
					true,
					'qwerasdzxc123',
					'9121231234',
					true
				)
			;`,
			`INSERT INTO ${constant.tables.USERSOPT}
				(user_id, key, value) VALUES
				(1, '${constant.ROLE}', (SELECT id FROM ${constant.tables.ROLES} WHERE label='${constant.role.SITEADMIN}' LIMIT 1))
			;`,
			`INSERT INTO ${constant.tables.BANKS}
				(id, name, username) VALUES
				(1, 'بانکمون', 'bankemoon')
			;`,
			`INSERT INTO ${constant.tables.BANKSUSERS}
				(bank_id, user_id, role) VALUES
				(1, 1, (SELECT id FROM ${constant.tables.ROLES} WHERE label='${constant.role.CREATOR}' LIMIT 1))
			;`,
			`SELECT nextval('${constant.tables.BANKS}_id_seq');`,
			`SELECT nextval('${constant.tables.USERS}_id_seq');`,
			`SELECT nextval('${constant.tables.BANKSUSERS}_id_seq');`,
		];
		// Promise.all([client.query(queries[0])/*, client.query(queries[1])*/])
		Promise.all(queries.map(query => client.query(query)))
		.then(() => client.release())
		.then(() => cache.getClient())
		.then(c => c.flushdb())
		.then(() => done())
		.then(() => console.log('** Truncated tables **'));
	});
});
require('./user/registration')({ server, users });
require('./user/forgotPassword')({ server, users });
require('./user/activation')({ server, db, users });
require('./user/login')({ server, users, addSession });

require('./bank/creation')({ server, banks, sessions, authorization });
require('./bank/joinRequest')({ server, users, banks, sessions, authorization });
require('./bank/client')({ server, users, unregistered, banks, sessions, authorization });
require('./bank/admin')({ server, banks, sessions, authorization });
require('./bank/edit')({ server, banks, sessions, authorization });
require('./bank/getAll')({ server, sessions, authorization });
require('./bank/get')({ server, users, banks, sessions, authorization });

require('./transaction/creation')({ db, server, users, banks, sessions, authorization, addBankUserId, bankUserIds });
require('./bank/deleteClient')({ server, users, banks, sessions, authorization, bankUserIds});

require('./bank/subset')({ server, users, banks, sessions, authorization, bankUserIds });
require('./transaction/edit')({ db, server, users, banks, sessions, authorization, bankUserIds });
require('./bank/delete')({ server, banks, sessions, authorization });
require('./transaction/get')({ server, banks, sessions, authorization });

require('./session/getAll')({ server, users, sessions, authorization });
// require('./session/delete')({ server, users, sessions, authorization });

require('./bank/adminAccess')({ server, banks, sessions, authorization });
