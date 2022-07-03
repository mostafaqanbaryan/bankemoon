const CodedError = require('../Error');
const constant	 = require('../constant');
const db				 = require('../db');
const cache			 = require('../cache');
const config		 = require('config');
const fs				 = require('fs');
const {
	handle_error
} = require('../utils');

const User = require('./user');
const Admin = require('./admin');
const Message = require('./message');
/*
 * Todo
 * work on caching getAll
 */

function message(name){
	const subject = `چه خوب که ${name} رو ساختید...`;
	const content = `
با عرض سلام...
در ابتدا باید تشکر کنیم که ${constant.name.fa} رو برای مدیریت قرض‌الحسنه‌ی خودتون در نظر گرفتید.
برای اینکه بتونید تجربه‌ی خوبی در ${constant.name.fa} داشته باشید، ما آموزش‌های زیادی رو در مورد بخش‌های مختلف تهیه کردیم که می‌تونید از بخش <a href='/tutorials/'>آموزش‌ها</a> به صورت کامل مطالعه کنید.
در صورتی که به مشکلی برخوردید و یا پیشنهادی در هر زمینه داشتید، حتما به ما <a href='/tickets/'>تیکت</a> بزنید.
	`;
	return { subject, content };
}

function getByName(client, name){
	let args	= [name];
	let query = `SELECT * FROM ${constant.tables.BANKS} WHERE name = $1 LIMIT 1;`;

	// Search database
	return client.query(query, args)
		.then(result => result.rowCount > 0);
}

function searchByName(client, name){
	let args	= [name + '%'];
	let query =
		`SELECT
			BANKS.*,
			COUNT.value AS user_count
		FROM ${constant.tables.BANKS} BANKS
		INNER JOIN ${constant.tables.BANKSOPT} COUNT
			ON COUNT.bank_id=BANKS.id AND COUNT.key='${constant.banks.USER_COUNT}'
		WHERE name LIKE $1
		LIMIT 9;`;

	// Search database
	return client.query(query, args)
		.then(result => result.rows);
}

function getByUsername(client, username){
	let args	= [username];
	let query = `SELECT id FROM ${constant.tables.BANKS} WHERE username = $1 LIMIT 1;`;

	// Search database
	return client.query(query, args)
		.then(result => result.rows.length > 0 ? result.rows[0] : null);
}

function searchByUsername(client, username){
	let args	= [(username.charAt(0) === '@' ? username.substr(1) : username) + '%'];
	let query =
		`SELECT
			BANKS.*,
			COUNT.value AS user_count
		FROM ${constant.tables.BANKS} BANKS
		INNER JOIN ${constant.tables.BANKSOPT} COUNT
			ON COUNT.bank_id=BANKS.id AND COUNT.key='${constant.banks.USER_COUNT}'
		WHERE username LIKE $1
		LIMIT 9;`;

	// Search database
	return client.query(query, args)
		.then(result => result.rows);
}

function searchMembersByKey(client, bankId, type, search){
	let args	= [bankId];
	let query  =
		`SELECT
			SEARCH.created_at,
			SEARCH.bank_user_id AS id,
			SEARCH.status,
			SEARCH.role,
			SEARCH.subset_count,
			CONCAT(USERS.first_name, ' ', USERS.last_name) AS full_name,
			USERS.id AS user_id,
			USERS.username,
			USERS.email,
			USERS.avatar,
			CONCAT('0', USERS.phone) AS phone,
			BALANCE.value AS balance
		FROM ${constant.tables.BANKSUSERSSEARCH} AS SEARCH
		INNER JOIN ${constant.tables.USERS} AS USERS
			ON USERS.id = SEARCH.user_id
		LEFT JOIN ${constant.tables.BANKSUSERSOPT} AS BALANCE
			ON BALANCE.bank_user_id = SEARCH.bank_user_id AND BALANCE.key='${constant.users.BALANCE}'
		WHERE bank_id=$1 AND parent_id IS NOT DISTINCT FROM NULL AND `;
	if(type === 'username') {
		args.push((search.charAt(0) === '@' ? search.substr(1) : search) + '%');
		query += `SEARCH.username LIKE $2`;
	}
	else if(type === 'phone') {
		args.push((search.charAt(0) === '0' ? search.substr(1) : search) + '%');
		query += `SEARCH.phone::text LIKE $2`;
	}
	else if(type === 'name') {
		args.push(search + '%');
		query += `SEARCH.full_name LIKE $2`;
	}
	else if(type === 'id') {
		if(isNaN(parseInt(search)))
			return Promise.reject(new CodedError(415, 'عدد را به صورت صحیح وارد کنید'));
		args.push(search);
		query += `SEARCH.user_id=$2`;
	}
	else 
		throw new CodedError(415, 'دسته‌ی وارد شده صحیح نیست');

	query += ' LIMIT 9';
	return client.query(query, args)
		.then(result => result.rows);
}

function searchMembersQuick(client, bankId, search){
	let args	= [bankId];
	let query =
	`SELECT 
		SEARCH.created_at,
		SEARCH.bank_user_id AS id,
		SEARCH.user_id,
		SEARCH.parent_id,
		--SEARCH.username,
		CONCAT('0', SEARCH.phone) AS phone,
		SEARCH.full_name
	FROM ${constant.tables.BANKSUSERSSEARCH} SEARCH
	WHERE
		--SEARCH.parent_id IS NOT DISTINCT FROM NULL AND
		SEARCH.bank_id=$1 AND `;
	const firstChar = search.charAt(0);
	if(firstChar === '@') {
		args.push(search.substr(1) + '%');
		query += `SEARCH.username LIKE $2`;
	}
	else if(firstChar === '0') {
		args.push(search.substr(1) + '%');
		query += `SEARCH.phone::text LIKE $2`;
	}
	else {
		args.push(search + '%');
		query += `SEARCH.full_name LIKE $2`;
	}
	query += ` LIMIT 3;`;

	return client.query(query, args)
		.then(result => result.rows);
}

function psqlToArray(bankIds){
	let temp	= bankIds.replace('{', '').replace('}', '');
	return temp.split(',').map(id => parseInt(id));
}

function getAllBanks(client, memory, bankIds, perPage){
	let limit = perPage * 2;
	return getAllBanksFromCache(memory)
		.then(result => {
			if(result)
				return result;
			return getAllBanksFromDB(client, memory, limit);
		})
		.then(array => {
			if(!array)
				throw new CodedError(500, 'دریافت بانک با مشکل مواجه شد');
			return {rows: array.filter(row => !bankIds.includes(row.id))};
		});
}

function getAllBanksFromDB(client, memory, limit){
	const query =
		`SELECT 
			BANKS.created_at,
			BANKS.id,
			BANKS.name,
			BANKS.username,
			BANKS.avatar,
			NULL AS status,
			OPT.value AS user_count
		FROM ${constant.tables.BANKS} BANKS
		INNER JOIN ${constant.tables.BANKSOPT} OPT
			ON OPT.bank_id = BANKS.id AND OPT.key = '${constant.banks.USER_COUNT}'
		ORDER BY
			BANKS.created_at DESC
		LIMIT ${limit};`;
	return client.query(query)
		.then(result => {
			if(!result)
				throw new CodedError(500, 'دریافت اطلاعات بانک با مشکل مواجه شد');
			memory.hset(constant.memory.banks.ALL, '1', JSON.stringify(result.rows));
			return result.rows;
		});
}

function getAllBanksFromCache(memory){
	return memory.hget(constant.memory.banks.ALL, '1')
		.then(result => {
			if(result)
				return JSON.parse(result);
		});
}


function addMember(client, bankId, userId, config={}){
	return client.query(`BEGIN`)
		.then(result => getBankUserId(client, bankId, userId))
		.then(buId => {
			if(buId > 0) {
				throw new CodedError(409, 'کاربر قبلا اضافه شده است');
			}
			return addBankUser(client, bankId, userId, config.status, config.role);
		})
		.then(bankUserId => {
			if(bankUserId <= 0)
				throw new CodedError(500, 'افزودن کاربر با مشکل مواجه شد');
			client.query('COMMIT');
			return bankUserId;
		})
		.catch(err => {
			client.query('ROLLBACK');
			throw err;
		});
}

function getBankUserId(client, bankId, userId){
	let args = [bankId, userId];
	let query = `SELECT id FROM ${constant.tables.BANKSUSERS} WHERE bank_id=$1 AND user_id=$2 LIMIT 1;`;

	return client.query(query, args)
		.then(result => result.rowCount > 0 ? result.rows[0].id : 0);
}

function addBankUser(client, bankId, userId, status=null, role=null){
	let args	 = [bankId, userId, status, role];
	let query = `INSERT INTO ${constant.tables.BANKSUSERS} (bank_id, user_id, status, role) VALUES($1::integer, $2::integer, (
			SELECT id FROM ${constant.tables.STATUS} WHERE label=$3 LIMIT 1
		), (
			SELECT id FROM ${constant.tables.TYPES} WHERE label=$4 LIMIT 1
		)) RETURNING id;`;
	return client.query(query, args)
		.then(result => result.rowCount > 0 ? result.rows[0].id : 0);
}

module.exports = {
	add(client, fields, options, creatorId){
		let args				= [];
		let values			= '';
		let query_transaction =
			`INSERT INTO ${constant.tables.TRANSACTIONS} (bank_user_id, creator_id, value, type, status)
				VALUES ($1, $2, $3::float, (
					SELECT id FROM ${constant.tables.TYPES} WHERE label='${constant.transactions.INITIAL}' LIMIT 1
				), (
					SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.ACCEPTED}' LIMIT 1
				));`;
		let query_admin = `INSERT INTO ${constant.tables.BANKSUSERS} (bank_id, user_id, role) VALUES ($1, $2, (
				SELECT id FROM ${constant.tables.ROLES} WHERE label='${constant.role.CREATOR}' LIMIT 1
			)) RETURNING id;`;
		let query_bank	= `INSERT INTO ${constant.tables.BANKS} (`;
		let bankId			= 0;
		let bankUserId	= 0;
		const memory = cache.getClient();

		// Create query base on fields
		for(let name in fields){
			query_bank += args.length > 0 ? ',' : '';
			values += args.length > 0 ? ',' : '';

			args.push(fields[name]);
			query_bank += name;
			values += '$' + args.length;
		}

		// Close query for security, I think...
		query_bank += ') VALUES (' + values + ') RETURNING id;';

		// Begin Transaction
		return client.query('BEGIN')
			// Check for duplicate username
			.then(result => getByUsername(client, fields.username))
			// Check for duplicate name
			.then(bank => {
				if(bank)
					throw new CodedError(409, 'نام انگلیسی متعلق به بانک دیگری است');
				//console.log('NAME/DUPLICATE');
				return getByName(client, fields.name);
			})
			// Create Bank
			.then(bank => {
				if(bank)
					throw new CodedError(409, 'نام فارسی متعلق به بانک دیگری است');
				//console.log('BANK', query_bank, args);
				return client.query(query_bank, args);
			})
			// Add Creator
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(500, 'ساخت بانک با مشکل مواجه شد');

				// Not using this.addMember, 'cause it has it own BEGIN-COMMIT
				bankId = result.rows[0].id;
				//console.log('ADMIN', query_admin, [bankId, creatorId]);
				return client.query(query_admin, [bankId, creatorId]);
			})
			// Add Initial transaction
			.then(result => {
				if(result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(500, 'ساخت موسس با مشکل مواجه شد');

				bankUserId = result.rows[0].id;
				if(options.initial){
					//console.log('TRANS', query_transaction, [bankUserId, creatorId, options.initial]);
					if(options.initial > 0)
						return client.query(query_transaction, [bankUserId, creatorId, options.initial]);
					else
						return false;
				}else{
					return true;
				}
			})
			// Add options
			.then(result => {
				if(result !== true && (result === false || result.code))
					throw new CodedError(500, 'ساخت تراکنش با مشکل مواجه شد');

				delete options.initial;
				return Promise.all(
					Object.keys(options).map(key => {
						//console.log(bankId, key, options[key]);
						return this.addOption(client, bankId, key, options[key]);
					})
				);
			})
			// Send message
			.then(result => {
				if(result.includes(false))
					throw new Error(500, 'اعمال تنظیمات انجام نشد');
				const m = message(fields.name);
				return Message.add(client, bankId, 1, m.subject, m.content, [creatorId]);
			})
			// Commit
			.then(result => {
				if(!result)
					throw new Error(500, 'ارسال پیام انجام نشد');
				//console.log('COMMIT');
				client.query('COMMIT');
				return memory.hget(constant.memory.banks.ALL, 1); // Page 1
			})
			.then(banks => {
				if(banks){
					const b = JSON.parse(banks);
					if(b.length > 18)
						b.pop();
					b.unshift({
						created_at: new Date().toJSON(),
						id: bankId,
						name: fields.name,
						username: fields.username,
						avatar: null,
						user_count: 1,
						status: null,
					});
					//console.log('MEMORY');
					memory.hset(constant.memory.banks.ALL, 1, JSON.stringify(b)); // Page 1
				}
				return true;
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	update(client, fields, where, options={}){
		let args = [];
		let query = `UPDATE ${constant.tables.BANKS} SET `;
		let bankId = 0;

		// Create query base on fields
		for(let name in fields){
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
		query += ' RETURNING id;';

		// Update in database
		return client.query('BEGIN')
			.then(result => client.query(query, args))
			.then(result => {
				if(result.rowCount <= 0)
					throw new CodedError(500, 'بروزرسانی با مشکل مواجه شد');
				bankId = result.rows[0].id;
				let promises = Object.keys(options).map(key => {
					return options[key]
						? this.addOption(client, bankId, key, options[key])
						: this.deleteOption(client, bankId, key)
				});
				return Promise.all(promises);
			})
			.then(result => {
				if(result.includes(false))
					throw new CodedError(500, 'افزودناطلاعات با مشکل مواجه شد');
				const memory = cache.getClient();
				memory.del(constant.memory.banks.ALL);
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	delete(client, bankId){
		let args	= [bankId];
		return client.query(`DELETE FROM ${constant.tables.BANKS} WHERE id = $1 RETURNING avatar;`, args)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'حذف بانک انجام نگرفت');
				if(result.rows[0].avatar)
					 fs.unlinkSync(config.avatar.path.bank + avatar);
				const memory = cache.getClient();
				memory.del(constant.memory.banks.ALL);
				return true;
			});
	},


	getAll(client, uid, page=1){
		page = isNaN(page) ? 1 : page;
		let limit = 9;
		let offset = (page-1) * limit;
		let args = [uid];
		let queryBankIds = `SELECT value FROM ${constant.tables.USERSOPT} WHERE key='banks' AND user_id=$1 LIMIT 1;`;
		let queryUsersBank =
			`SELECT 
				BANKS.created_at,
				BANKS.id,
				BANKS.name,
				BANKS.username,
				BANKS.avatar,
				OPT.value AS user_count,
				COALESCE(SEARCH.status, SEARCH.bank_user_id::text) AS status
			FROM ${constant.tables.BANKSUSERSSEARCH} SEARCH
			INNER JOIN ${constant.tables.BANKSOPT} OPT
				ON OPT.bank_id = SEARCH.bank_id AND OPT.key = '${constant.banks.USER_COUNT}'
			INNER JOIN ${constant.tables.BANKS} BANKS
				ON BANKS.id = SEARCH.bank_id
			WHERE
				SEARCH.user_id = $1 AND
				SEARCH.bank_id = ANY($2::integer[])
			ORDER BY
				SEARCH.status,
				SEARCH.created_at
			LIMIT ${limit} OFFSET ${offset};`;
		let queryBanks =
			`SELECT 
				BANKS.created_at,
				BANKS.id,
				BANKS.name,
				BANKS.username,
				BANKS.avatar,
				NULL AS status,
				OPT.value AS user_count
			FROM ${constant.tables.BANKS} BANKS
			INNER JOIN ${constant.tables.BANKSOPT} OPT
				ON OPT.bank_id = BANKS.id AND OPT.key = '${constant.banks.USER_COUNT}'
			WHERE BANKS.id <> ALL($1::integer[])
			ORDER BY
				BANKS.created_at DESC,
				BANKS.id DESC
			LIMIT ${limit} OFFSET $2;`;


		let banks = [];
		let bankIds = '{}';
		let split = [];
		const memory = cache.getClient();

		// Get user bank Ids
		return client.query(queryBankIds, args)
			// Get user banks
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت اطلاعات حساب با مشکل مواجه شد');

				// Only show userBanks if any exists
				if(result.rowCount > 0) {
					bankIds = result.rows[0].value;
					split = psqlToArray(bankIds);
					return client.query(queryUsersBank, [uid, bankIds]);
				}
				return { rows: [] };
			})
			// Get other banks
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت اطلاعات بانک‌ها با مشکل مواجه شد');

				banks = result.rows;
				if(banks.length < limit){
					if(page === 1)
						return getAllBanks(client, memory, split, limit);
					return client.query(queryBanks, [bankIds, offset-split.length]);
				}
				return {rows: []};
			})
			// Get total count
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت شمارش بانک‌ها با مشکل مواجه شد');
				banks = banks.concat(result.rows);
				return memory.hget(constant.memory.banks.ALL, constant.banks.COUNT);
			})
			.then(total => {
				if(!total)
					return this.getBanksTotal(client);
				return total;
			})
			.then(total => {
				memory.hset(constant.memory.banks.ALL, constant.banks.COUNT, total);
				return {banks, total};
			});
	}, 

	getBanksTotal(client){
		const query = `SELECT value::int FROM ${constant.tables.OPT} WHERE key='${constant.banks.COUNT}' LIMIT 1;`;
		return client.query(query)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'دریافت شمارش بانک‌ها با مشکل مواجه شد');
				return result.rows[0].value;
			});
	},


	getById(client, bid){
		let args	= [bid];
		let query = `SELECT * FROM ${constant.tables.BANKS} WHERE id=$1 LIMIT 1;`;

		// Search database
		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows[0] : null);
	},

	searchBanks(client, key, value){
		let func = () => Promise.reject(new CodedError(415, 'دسته‌ی وارد شده صحیح نیست'));
		if(key === 'id')
			func = this.getById;
		else if(key === 'username')
			func = searchByUsername;
		else if(key === 'name')
			func = searchByName;
		return func(client, value);
	},

	searchMembers(client, bankId, value, key=null){
		if(key)
			return searchMembersByKey(client, bankId, key, value);
		return searchMembersQuick(client, bankId, value);
	},

	getInfo(client, bankUsername, userId){
		let args	= [bankUsername, userId];
		let badges = `('${constant.users.badge.DELAYEDLOANS}', '${constant.banks.badge.REQUESTS}')`;
		let query = `
			SELECT 
				SEARCH.bank_user_id AS id,
				BANKS.created_at,
				BANKS.id AS bank_id,
				BANKS.name,
				BANKS.username,
				BANKS.avatar,
				SEARCH.user_id,
				SEARCH.status,
				SEARCH.role
			FROM ${constant.tables.BANKS} BANKS
			LEFT JOIN ${constant.tables.BANKSUSERSSEARCH} SEARCH
				ON SEARCH.bank_id = BANKS.id AND SEARCH.user_id = $2
			WHERE BANKS.username=$1
			LIMIT 1;`;
		let queryBadges =
			`SELECT
				key, value::INT
			FROM ${constant.tables.BANKSUSERSOPT}
			WHERE
				bank_user_id = $1 AND
				key IN ${badges}
			LIMIT 1;`;
		let queryBadgesAdmin =
			`SELECT
				key, value::INT
			FROM ${constant.tables.BANKSOPT}
			WHERE
				bank_id = $1 AND
				key IN ${badges}
			LIMIT 2;`;

		// Search database
		const bank = {};
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'اطلاعات بانک یافت نشد');
				bank.info = result.rows[0];

				// If admin, Show all user's Badges
				if(bank.info.role === 'BankAdmin' || bank.info.role === 'Creator')
					return client.query(queryBadgesAdmin, [bank.info.bank_id]);
				return client.query(queryBadges, [bank.info.id]);
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت شمارنده‌ها با مشکل مواجه شد');

				bank.badges = result.rows.reduce((obj, row) => {
					obj[row.key.substr(3)] = row.value;
					return obj;
				}, {});
				return bank;
			});
	},

	getOptions(client, bankUsername, userId){
		let args	= [bankUsername, userId];
		let query = `
			SELECT 
				OPT.key,
				CASE WHEN OPT.key = 'shaba' AND (OPTSTATUS.id IS NOT NULL OR BANKSUSERS.id IS NULL) THEN NULL
						 WHEN OPT.key = 'owner' AND (OPTSTATUS.id IS NOT NULL OR BANKSUSERS.id IS NULL) THEN NULL
						 ELSE OPT.value
				END
			FROM ${constant.tables.BANKSOPT} OPT
			LEFT JOIN ${constant.tables.BANKSUSERS} BANKSUSERS
				ON BANKSUSERS.user_id = $2 AND BANKSUSERS.bank_id=OPT.bank_id
			LEFT JOIN ${constant.tables.BANKSUSERSOPT} OPTSTATUS
				ON OPTSTATUS.bank_user_id = BANKSUSERS.id AND OPTSTATUS.key='status'
			WHERE OPT.key IN ('description', 'rules', 'shaba', 'owner') AND
				OPT.bank_id = (SELECT id FROM ${constant.tables.BANKS} WHERE username=$1 LIMIT 1);`;

		// Search database
		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows : null);
			/* .catch(err => {
				handle_error(err);
				return false;
			}); */
	},

	addMemberByType(client, bankId, key, value, config={}){
		if(key.toLowerCase() === 'phonenumber') {
			return User.getByPhone(client, value)
				.then(user => addMember(client, bankId, user.id, config));
		} else if(key.toLowerCase() === 'username') {
			return User.getByUsername(client, value)
				.then(user => addMember(client, bankId, user.id, config));
		}
	},

	addSubset(client, bankId, userIdParent, bankUserClientId){
		let args	 = [bankId, userIdParent, bankUserClientId];
		let query = `UPDATE ${constant.tables.BANKSUSERS} SET parent_id=$2 WHERE bank_id=$1 AND id=$3;`;
		let queryChildren = `UPDATE ${constant.tables.BANKSUSERS} SET parent_id=$2 WHERE bank_id=$1 AND parent_id=$3;`;
		let queryParent = `SELECT id FROM ${constant.tables.BANKSUSERS} WHERE bank_id=$1 AND user_id=$2 LIMIT 1;`;

		return client.query('BEGIN')
			// Check parent exist
			.then(() => client.query(queryParent, [bankId, userIdParent]))
			// Update subset's children to new parent
			.then(result => {
				if(!result || result.rows <= 0)
					throw new CodedError(404, 'سرپرست وجود ندارد');
				return client.query(queryChildren, args);
			})
			// Update subset to new parent
			.then(result => {
				if(!result)
					throw new CodedError(500, 'بروزرسانی زیرمجموعه‌ها به سرپرست جدید انجام نشد');
				return client.query(query, args);
			})
			.then(result => {
				if(result.rowCount <= 0)
					throw new CodedError(500, 'بروزرسانی به سرپرست جدید انجام نشد');
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
				/* handle_error(err);
				throw new CodedError(409, 'کاربر قبلا اضافه شده است'); */
			});
	},

	deleteMember(client, bankId, bankUserId){
		let args	 = [bankId, bankUserId];
		let query  = `DELETE FROM ${constant.tables.BANKSUSERS} WHERE bank_id=$1 AND id=$2;`;
		let queryChildren  =
			`UPDATE ${constant.tables.BANKSUSERS} SET parent_id=NULL WHERE
				parent_id=$1;`;

		return client.query('BEGIN')
			.then(() => client.query(queryChildren, [bankUserId]))
			.then(result => {
				if(!result)
					throw new CodedError(500, 'بروزرسانی زیرمجموعه‌ها انجام نشد');
				return client.query(query, args);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'کاربر وجود ندارد');
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	deleteSubset(client, bankId, userIdParent, userClientId){
		let args	 = [bankId, userIdParent, userClientId];
		let query = `UPDATE ${constant.tables.BANKSUSERS} SET parent_id=NULL WHERE bank_id=$1 AND parent_id=$2 AND user_id=$3;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0)
			.catch(err => {
				// handle_error(err);
				throw new CodedError(409, 'کاربر قبلا حذف شده است');
			});
	},


	getMember(client, bankId, userId){
		let args	 = [bankId, userId];
		let query  =
			`SELECT
			*
			FROM ${constant.tables.BANKSUSERSSEARCH} AS SEARCH
			WHERE bank_id=$1 AND user_id=$2
			LIMIT 1;`;

		return client.query(query, args)
			.then(result => result && result.rowCount > 0 ? result.rows[0] : null);
	},

	getMembers(client, bankId, where=null, page=1){
		page = isNaN(page) ? 1 : page;
		let limit = 15;
		let offset = (page-1) * limit;
		let args	 = [bankId];
		let queryCount =
			`SELECT
				value AS user_count
			FROM ${constant.tables.BANKSOPT}
			WHERE
				bank_id=$1 AND key='${constant.banks.USER_COUNT}'
			LIMIT 1;`;
		let query  =
			`SELECT
				SEARCH.created_at,
				SEARCH.bank_user_id AS id,
				SEARCH.status,
				SEARCH.role,
				SEARCH.subset_count,
				CONCAT(USERS.first_name, ' ', USERS.last_name) AS full_name,
				USERS.id AS user_id,
				--USERS.username,
				--USERS.email,
				USERS.avatar,
				CONCAT('0', USERS.phone) AS phone,
				RTRIM(RTRIM(to_char(BALANCE.value::FLOAT, 'fm999999999999.00'), '0'), '.') AS balance
			FROM ${constant.tables.BANKSUSERSSEARCH} AS SEARCH
			INNER JOIN ${constant.tables.USERS} AS USERS
				ON USERS.id = SEARCH.user_id
			LEFT JOIN ${constant.tables.BANKSUSERSOPT} AS BALANCE
				ON BALANCE.bank_user_id = SEARCH.bank_user_id AND BALANCE.key='${constant.users.BALANCE}'
			WHERE bank_id=$1 `;
			
			
		if(where){
			Object.keys(where).forEach((key, i) => {
				switch(key){
					case 'status':
						query += ` AND SEARCH.status=$${i+2} `;
						break;
					case 'role':
						query += ` AND SEARCH.role=$${i+2} `;
						break;
				}
			});

			args = args.concat(Object.values(where));
		}else{
			query += ' AND SEARCH.status IS NOT DISTINCT FROM NULL AND SEARCH.parent_id IS NOT DISTINCT FROM NULL ';
		}

		query += ` ORDER BY full_name LIMIT ${limit} OFFSET ${offset};`;
		let user_count = 0;
		return client.query(queryCount, [bankId])
			.then(result => {
				if(!result || result.rowCount <= 0 || result.rows[0].admin_count <= 0)
					throw new CodedError(404, 'مدیری وجود ندارد');

				user_count = result.rows[0].user_count;
				return client.query(query, args);
			})
			.then(result => {
				return {users: result.rows, user_count};
			});
	},

	getSubsets(client, bankId, parentId){
		let args	 = [bankId, parentId];
		let query  =
			`SELECT
				BANKSUSERS.id AS id,
				BANKSUSERS.parent_id,
				CONCAT(USERS.first_name, ' ', USERS.last_name) AS full_name,
				-- USERS.username,
				CONCAT('0', USERS.phone) AS phone,
				BALANCE.value AS balance,
				USERS.id AS user_id,
				USERS.avatar
			FROM ${constant.tables.BANKSUSERS} AS BANKSUSERS
			INNER JOIN ${constant.tables.USERS} AS USERS
				ON USERS.id = BANKSUSERS.user_id
			LEFT JOIN ${constant.tables.BANKSUSERSOPT} AS BALANCE
				ON BALANCE.bank_user_id = BANKSUSERS.id AND BALANCE.key='${constant.users.BALANCE}'
			WHERE
				BANKSUSERS.parent_id = $2 AND
				BANKSUSERS.status IS NOT DISTINCT FROM NULL AND
				bank_id=$1`;

		return client.query(query, args)
			.then(result => result.rows);
	},

	getAdmins(client, bankId){
		let args	 = [bankId];
		let queryCount =
			`SELECT
				value AS admin_count
			FROM ${constant.tables.BANKSOPT}
			WHERE
				bank_id=$1 AND key='${constant.banks.ADMIN_COUNT}'
			LIMIT 1;`;
		let query  =
			`SELECT
				SEARCH.user_id,
				SEARCH.full_name,
				CONCAT('0', SEARCH.phone) AS phone,
				SEARCH.role
			FROM ${constant.tables.BANKSUSERSSEARCH} AS SEARCH
			WHERE SEARCH.role IN ('${constant.role.CREATOR}', '${constant.role.BANKADMIN}') AND
				SEARCH.bank_id=$1
			ORDER BY role DESC LIMIT `;

		let admin_count = 0;
		return client.query(queryCount, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || result.rows[0].admin_count <= 0)
					throw new CodedError(404, 'مدیری وجود ندارد');

				admin_count = result.rows[0].admin_count;
				query += `${admin_count};`;
				return client.query(query, args);
			})
			.then(result => {
				return {admins: result.rows, admin_count};
			});
	},

	sendJoinRequest(client, bankUsername, userId){
		return getByUsername(client, bankUsername)
			.then(bank => {
				if(!bank || !bank.id || bank.id <= 0)
					throw new CodedError(404, 'بانک وجود ندارد');
				return addMember(client, bank.id, userId, {status: constant.status.PENDING});
			});
	},

	getJoinRequests(client, bankId){
		return this.getMembers(client, bankId, { status: constant.status.PENDING });
	},

	getBankUserOption(client, bankUserId, key){
		let args = [bankUserId, key];
		let query = `SELECT * FROM ${constant.tables.BANKSUSERSOPT} WHERE bank_user_id=$1 AND key=$2 LIMIT 1;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows[0] : null);
			/* .catch(err => {
				handle_error(err);
				return false;
			}); */
	},

	/* deleteBankUserOption(client, bankUserId, key){
		let args = [bankUserId, key];
		let query = `DELETE FROM ${constant.tables.BANKSUSERSOPT} WHERE bank_user_id=$1 AND key=$2;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0);
			[>.catch(err => {
				handle_error(err.message);
				return false;
			});<]
	}, */

	updateBankUser(client, bankUserId, status, role, bankUsername){
		let args	 = [bankUserId, status, role];
		let query =
			`UPDATE ${constant.tables.BANKSUSERS} SET 
				status=(SELECT id FROM ${constant.tables.STATUS} WHERE label=$2 LIMIT 1),
				role=(SELECT id FROM ${constant.tables.ROLES} WHERE label=$3 LIMIT 1)
			WHERE id=$1 RETURNING id, user_id;`;
		const memory = cache.getClient();

		return client.query(query, args)
			.then(result => {
				if(result.rowCount > 0) {
					memory.hdel(constant.memory.banks.BANKSUSERS(bankUsername), result.rows[0].user_id);
					return true;
				}
				throw new CodedError(404, 'کاربر وجود ندارد');
			});
			/* .catch(err => {
				throw new CodedError(500, 'تایید درخواست با مشکل مواجه شد');
			}); */
	},

	/* deleteBankUser(client, bankUsername, userId){
		[>let args	 = [bankUsername, userId];
		let query = `INSERT INTO ${constant.tables.BANKSUSERS} (bank_id, user_id) VALUES(
			( SELECT id FROM ${constant.tables.BANKS} WHERE username=$1 LIMIT 1), $2
		) LIMIT 1 RETURNING id;`;
		return client.query(query, args)
			.then(result => result.rowCount > 0 ? result.rows[0].id : 0);<]
	}, */

	/*
	 * @return @Boolean isSet
	 */
	addOption(client, bid, key, value){
		let args	= [bid, key, value];
		let query =
			`INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES ($1, $2, $3)
			ON CONFLICT(bank_id, key) DO UPDATE SET value=EXCLUDED.value;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0)
			.catch(err => {
				handle_error(err);
				throw err;
			});
	},

	getOption(client, bid, key){
		let args	= [bid, key];
		let query = `SELECT value FROM ${constant.tables.BANKSOPT} WHERE bank_id=$1 AND key=$2 LIMIT 1;`;

		return client.query(query, args)
			.then(result => result.rows.length > 0 ? result.rows[0] : null)
			.then(row => row.value ? row.value : null)
			.catch(err => {
				handle_error(err);
				return false;
			});
	},

	deleteOption(client, bid, key){
		let args	= [bid, key];
		let query = `DELETE FROM ${constant.tables.BANKSOPT} WHERE bank_id=$1 AND key=$2;`;

		return client.query(query, args)
			// .then(result => result.rowCount > 0)
			.then(result => true)
			.catch(err => {
				handle_error(err);
				throw err;
			});
	},
};
