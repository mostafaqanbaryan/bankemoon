const CodedError = require('../Error');
const constant	 = require('../constant');
const db				 = require('../db');
const cache			 = require('../cache');
const log				 = require('../log');
const {
	handle_error,
	capitalize,
	addFloat,
	decFloat,
	getDifferenceByMonth,
} = require('../utils');

// Models
const Bank = require('./bank');

function getDelayed(loan){
	let dA = new Date(loan.created_at_bank);
	let dAN = new Date();
	// let penalty = loan.penalty;
	// let instalment = loan.instalment;
	let howManyInstalmentPaidUntilToday = loan.i_co ? parseInt(loan.i_co) : 0;
	let howManyInstalmentShouldPayUntilToday = getDifferenceByMonth(dA, dAN);
	return howManyInstalmentShouldPayUntilToday - howManyInstalmentPaidUntilToday;
}

function updateDelayed(client, transactionId){
	const args = [transactionId];
	const query = `SELECT * FROM ${constant.tables.TRANSACTIONS} TRANSACTIONS WHERE TRANSACTIONS.id=$1 LIMIT 1;`;
	const queryOptions =
		`SELECT
			key, value
		FROM ${constant.tables.TRANSACTIONSOPT} OPT
		WHERE
			OPT.transaction_id=$1 AND
			OPT.key IN ('instalment', 'penalty', '${constant.transactions.FULLYPAID}', '${constant.banks.INSTALMENT_COUNT}')
		LIMIT 4`;

	// Get Loan
	let loan = null;
	return client.query(query, args)
		// Get options
		.then(result => {
			if(!result || result.rowCount <= 0)
				throw new CodedError(404, 'چنین وامی وجود ندارد');
			loan = result.rows[0];
			return client.query(queryOptions, args);
		})
		.then(result => {
			if(!result || result.rowCount <= 0)
				throw new CodedError(404, 'چنین وامی وجود ندارد');
			loan = result.rows.reduce((obj, r) => {
				obj[r.key] = r.value;
				return obj;
			}, loan);
			let delayed = getDelayed(loan);
			return transaction.setOption(client, loan.id, 'delayed', delayed);
		});
}

function addWOBeginCommit(client, { createdAtBank, bankId, userId, type, value, options={} }){
	value = parseFloat(value);
	let args_uId_valid	 = [bankId, userId];
	let args_parent	 = [options.parentId];
	let args_exgratia	 = [-value];
	let args	 = [createdAtBank.toJSON(), value, options.parentId, options.creatorId, type, options.status];
	let query_uId_valid = `SELECT id, status FROM ${constant.tables.BANKSUSERS} WHERE bank_id=$1 AND user_id=$2 LIMIT 1;`;
	let query_parent =
		`SELECT
			1 AS isValid,
			OPT.value::float AS reimbursement,
			BALANCE.value::float AS loan_balance,
			PENALTY.value::float AS penalty_balance,
			FULLYPAID.value::int AS fully_paid
		FROM ${constant.tables.TRANSACTIONS} TRANS
		INNER JOIN ${constant.tables.TRANSACTIONSOPT} OPT
			ON OPT.transaction_id = TRANS.id AND OPT.key='${constant.banks.REIMBURSEMENT}'
		LEFT JOIN ${constant.tables.TRANSACTIONSOPT} BALANCE
			ON BALANCE.transaction_id = TRANS.id AND BALANCE.key='${constant.banks.LOAN_BALANCE}'
		LEFT JOIN ${constant.tables.TRANSACTIONSOPT} PENALTY
			ON PENALTY.transaction_id = TRANS.id AND PENALTY.key='dailyPenalty'
		LEFT JOIN ${constant.tables.TRANSACTIONSOPT} FULLYPAID
			ON FULLYPAID.transaction_id = TRANS.id AND FULLYPAID.key='${constant.transactions.FULLYPAID}'
		WHERE
			TRANS.id=$1 AND TRANS.bank_user_id=$2
		LIMIT 1;`;
	let query_exgratia =
		`UPDATE ${constant.tables.BANKSUSERSOPT} OPT
			SET value=OPT.value::float + $1
		WHERE
			bank_user_id=$2 AND
			key='${constant.users.BALANCE}'`;
	let query	= `INSERT INTO ${constant.tables.TRANSACTIONS} (created_at_bank, bank_user_id, value, parent_id, creator_id, type, status)
		VALUES ($1, $7, $2, $3, $4, (
			SELECT id FROM ${constant.tables.TYPES} WHERE label=$5 LIMIT 1
		), (
			SELECT id FROM ${constant.tables.STATUS} WHERE label=$6 LIMIT 1
		));`;
	let transactionId = 0;
	let bankUserId = 0;
	let reimbursement = 0;
	let loanBalance = 0;
	let fullyPaid = false;
	const memory = cache.getClient();

	// Check for validity of userId and bankUserId
	return client.query(query_uId_valid, args_uId_valid)
		// Check user for not being declind/pending/banned/...
		.then(result => {
			console.log(query_uId_valid, args_uId_valid);
			if(!result || result.rowCount <= 0 || (result.rows[0] && result.rows[0].status))
				throw new CodedError(403, 'کاربر متعلق به این بانک نیست');
			bankUserId = result.rows[0].id;
			args_exgratia.push(bankUserId);
			args_parent.push(bankUserId);
			args.push(bankUserId);
			Bank.getBankUserOption(client, bankUserId, 'status');
		})
		// Check validity of parent
		.then(result => {
			if(result)
				throw new CodedError(403, 'کاربر عضو بانک نیست');
			return options.parentId ? client.query(query_parent, args_parent) : true;
		})
		// Check Exgratia And FullyPaid loan
		.then(result => {
			if(result !== true && (!result || result.rowCount <= 0 || !result.rows[0].isvalid))
				throw new CodedError(403, 'وام متعلق به این کاربر نیست');
			if(result !== true){
				const row = result.rows[0];
				reimbursement = row.reimbursement + row.penalty_balance;
				loanBalance = row.loan_balance;
				if(row.fully_paid > 0)
					throw new CodedError(415, 'وام قبلا تسویه شده است');
			}
			if(options.exgratia > 0)
				return client.query(query_exgratia, args_exgratia);
			return true;
		})
		// Add Transaction
		.then(result => {
			return client.query(query, args);
		})
		// Get transactionId
		.then(result => {
			query = `SELECT currval('${constant.tables.TRANSACTIONS}_id_seq');`;
			return client.query(query);
		})
		// Update delay for instalment
		.then(result => {
			if(!result || result.rowCount <= 0 || !result.rows[0].currval)
				throw new CodedError(500, 'افزودن تراکنش با مشکل مواجه شد');

			transactionId = result.rows[0].currval;
			if(options.parentId)
				return updateDelayed(client, options.parentId);
			else
				return true;
		})
		// Check FULLYPAID
		.then(result => {
			if(!result)
				throw new CodedError(500, 'بروزرسانی دیرکرد با مشکل مواجه شد');

			fullyPaid = options.parentId && (loanBalance *10) + (value*10) >= (reimbursement *10);
			if(fullyPaid) {
				return transaction.setOption(client, options.parentId, constant.transactions.FULLYPAID, 1);
			}
			return true;
		})
		// Add options if exist
		.then(result => {
			if(!result)
				throw new CodedError(500, 'افزودن تسویه با مشکل مواجه شد');

			return Promise.all(
				Object.keys(options).map(key => {
					if(options[key] && key !== 'status' && key !== 'parentId' && key !== 'creatorId') {
						return transaction.setOption(client, transactionId, key, options[key]);
					}
					else
						return true;
				})
			);
		})
		.then(result => {
			if(result.includes(false))
				throw new CodedError(500, 'بروزرسانی تنظیمات با مشکل مواجه شد');
			return memory.hget(constant.memory.banks.BALANCE, bankId);
		})
		.then(balance => {
			if(balance){
				const b = JSON.parse(balance);
				// Balance
				b[constant.banks.BALANCE] = b[constant.banks.BALANCE] ? addFloat(b[constant.banks.BALANCE], value) : value;
				// Transactions Count
				b[constant.banks.TRANSACTION_COUNT] = b[constant.banks.TRANSACTION_COUNT] ? b[constant.banks.TRANSACTION_COUNT] + 1 : 1;
				// Loans Count
				if(type === constant.transactions.LOAN)
					b[constant.banks.LOAN_COUNT] = b[constant.banks.LOAN_COUNT] ? b[constant.banks.LOAN_COUNT] + 1 : 1;
				// FullyPaid
				if(fullyPaid)
					b[constant.banks.FULLYPAIDLOAN_COUNT] = b[constant.banks.FULLYPAIDLOAN_COUNT] ? b[constant.banks.FULLYPAIDLOAN_COUNT] + 1 : 1;
				// Commission
				if(type === constant.transactions.COMMISSION)
					b[constant.banks.COMMISSION_BALANCE] = b[constant.banks.COMMISSION_BALANCE] ? addFloat(b[constant.banks.COMMISSION_BALANCE], value) : value;
				// Penalty
				if(type === constant.transactions.PENALTY)
					b[constant.banks.PENALTY_BALANCE] = b[constant.banks.PENALTY_BALANCE] ? addFloat(b[constant.banks.PENALTY_BALANCE], value) : value;
				memory.hset(constant.memory.banks.BALANCE, bankId, JSON.stringify(b));
			}
			return transactionId;
		});
}

function addToAllSubsets(client, bankId, parentId){
	const args = [bankId, parentId];
	const query = `SELECT id FROM ${constant.tables.BANKSUSERS} WHERE bank_id=$1 AND parent_id=$2;`;

	return client.query(query, args)
		.then(result => {
			if(!result || result.rowCount <= 0)
				throw new CodedError(404, 'زیرمجموعه‌ای وجود ندارد');
			const ids = result.rows.map(row => row.id);
			return ids;
		});
}

function isValid(client, bankId, transactionId){ // 1 week validation
	let args = [bankId, transactionId];
	let query =
		`SELECT
			*
		FROM ${constant.tables.TRANSACTIONS} AS TRANS
		INNER JOIN ${constant.tables.BANKSUSERS} BANKSUSERS
			ON BANKSUSERS.id = TRANS.bank_user_id AND BANKSUSERS.bank_id=$1
		WHERE TRANS.id=$2 AND (NOW() - TRANS.created_at < (INTERVAL '1 WEEK'))
		LIMIT 1;`;
	return client.query(query, args)
		.then(result => result.rowCount > 0 ? result.rows[0] : null);
}

const transaction = {
	setPenaltyNightly(client){
		let queryType = `SELECT id FROM ${constant.tables.TYPES} WHERE label='${constant.transactions.LOAN}' LIMIT 1;`;
		let queryLoan =
			`SELECT
				TRANSACTIONS.*,
				OPT.value AS i_co,
				OPTI.value AS instalment,
				OPTP.value AS penalty
			FROM ${constant.tables.TRANSACTIONS} TRANSACTIONS
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} OPTP
				ON OPTP.transaction_id = TRANSACTIONS.id AND OPTP.key='penalty'
			INNER JOIN ${constant.tables.TRANSACTIONSOPT} OPTI
				ON OPTI.transaction_id = TRANSACTIONS.id AND OPTI.key='instalment'
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} OPTF
				ON OPTF.transaction_id = TRANSACTIONS.id AND OPTF.key='${constant.transactions.FULLYPAID}'
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} OPT
				ON OPT.transaction_id = TRANSACTIONS.id AND OPT.key='${constant.banks.INSTALMENT_COUNT}'
			WHERE
				type=$1 AND
				created_at_bank < NOW() - interval '29 day' AND
				created_at_bank > NOW() - interval '1 year' AND
				OPTF.id IS NOT DISTINCT FROM NULL;`;
		let typeLoanId = 0;
		let total = 0;
		let penaltyValues = [];
		let delayValues = [];
		return client.query('BEGIN')
			.then(() => client.query(queryType))
			// Get not fully paid loans
			.then(result => {
				typeLoanId = result.rows[0].id;
				return client.query(queryLoan, [typeLoanId/*, fullyPaidIds*/]);
			})
			.then(result => {
				total = result.rowCount;
				return result.rows.reduce((acc, loan) => {
					let delayed = getDelayed(loan);
					let penalty = loan.penalty;
					let instalment = loan.instalment;

					/* Because this executes every night for 1 day
					 * profit calculation does the work of spliting profits
					 * for example:
					 * if we have 2 month delay, 'cause this did execute every night of this 2 month
					 * it calculated 1 instalment for first month
					 * and 2 instalment for second month
					 * but if we wanted to do this on-demand
					 * we had to do all the instalments for all the delayed time (2 instalments for 1st and 2nd month)
					 */
					if(delayed > 0 && penalty > 0){
						let delayPrice = (instalment * 10 * delayed) / 10;
						let numerator = (delayPrice * 10 * penalty * 10 * 1) /100;
						let denominator = 30 * 100;
						let penaltyValue = Math.ceil((numerator * 10) / (denominator * 10));
						acc.push({
							id: loan.id,
							dailyPenalty: penaltyValue,
							delayed,
						});
					}else{
						acc.push({
							id: loan.id,
							delayed,
						});
					}
					return acc;
				}, []);
			})
			// create VALUES for query
			.then(array => {
				if(!array)
					return [];

				for(let i = 0; i < array.length; i++){
					let row = array[i];
					if(row.dailyPenalty)
						penaltyValues.push(`(${row.id}, 'dailyPenalty', ${row.dailyPenalty})`);
					if(row.delayed && row.delayed > 0)
						delayValues.push(`(${row.id}, 'delayed', ${row.delayed})`);
				}
			})
			// Add Penalties
			.then(() => {
				if(penaltyValues.length === 0)
					return true;
				let queryPenalty =
					`INSERT INTO ${constant.tables.TRANSACTIONSOPT} (transaction_id, key, value) VALUES ${penaltyValues.join(',')}
						ON CONFLICT (transaction_id, key) DO UPDATE SET value=(${constant.tables.TRANSACTIONSOPT}.value::float+EXCLUDED.value::float);`;
				return client.query(queryPenalty);
			})
			// Delete Delayed
			.then(result => {
				if(result !== true && (!result || result.rowCount <= 0)) {
					throw new CodedError(500, 'افزودن دیرکرد با مشکل مواجه شد');
				}
				let queryAllDelays =
					`DELETE FROM ${constant.tables.TRANSACTIONSOPT} WHERE key='delayed';`;
				return client.query(queryAllDelays);
			})
			// Add Delayed
			.then(result => {
				if(delayValues.length === 0)
					return true;
				let queryDelay =
					`INSERT INTO ${constant.tables.TRANSACTIONSOPT} (transaction_id, key, value) VALUES ${delayValues.join(',')};`;
				return client.query(queryDelay);
			})
			.then(result => {
				if(result !== true && (!result || result.rowCount <= 0)) {
					throw new CodedError(500, 'افزودن تاخیر با مشکل مواجه شد');
				}
				return client.query('COMMIT');
			})
			.then(result => {
				if(!result) {
					throw new CodedError(500, 'تایید نهایی انجام نشد');
				}
				return total;
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	add(client, { createdAtBank, bankId, userId, type, value, options={} }){
		const args = { createdAtBank, bankId, userId, type, value, options };
		return client.query('BEGIN')
			.then(result => addWOBeginCommit(client, args))
			.then(result => {
				if(!result || result <= 0)
					throw new CodedError(500, 'تراکنش ایجاد نشد');

				client.query('COMMIT');
				return result;
			})
			.catch(err => {
				client.query('ROLLBACK');
				if(err.detail)
					throw new CodedError(err.detail, err.message);
				else
					throw err;
			});
	},

	adds(client, { createdAtBank, bankId, userIds, type, value, options={} }){
		return client.query('BEGIN')
			.then(() => {
				let ids = [];
				// Get userIds of subsets
				if(userIds && userIds.hasOwnProperty('all'))
					ids = userIds.all.map(parentId => addToAllSubsets(client, bankId, parentId));
				return Promise.all(ids);
			})
			.then(result => {
				let promises = [];
				let ids = [];
				// Result is array of arrays, So we do a 1 deminsion thing
				if(result && result.length > 0)
					result.forEach(row => row && row.length > 0 && row.forEach(id => ids.push(id)));
				// Add persons IDs
				if(userIds && userIds.hasOwnProperty('persons'))
					ids = ids.concat(userIds.persons);

				// Create Transactions
				return ids.reduce((acc, id) => {
					return acc.then(res => {
						if(!res)
							throw new CodedError(500, `ساخت تراکنش ${id} با مشکل مواجه شد`);
						const args = {
							createdAtBank,
							userId: id, 
							bankId,
							type,
							value,
							options
						};
						return addWOBeginCommit(client, args);
					});
				}, Promise.resolve(-5));
				/* else {
					return -55;
				} */
			})
			.then(result => {
				if(!result || result <= 0)
					throw new CodedError(500, 'تراکنش ایجاد نشد');

				client.query('COMMIT');
				return result;
			})
			.catch(err => {
				client.query('ROLLBACK');
				if(err.detail)
					throw new CodedError(err.detail, err.message);
				else
					throw err;
			});
	},

	get(client, transactionId, bankUserId=0, getChild=false){
		let args = [transactionId];
		let where = [];
		let queryTransaction =
			`SELECT
				TRANSACTIONS.*,
				RTRIM(RTRIM(to_char(TRANSACTIONS.value::FLOAT, 'fm999999999999.00'), '0'), '.') AS value,
				PARENT.value AS parent_value,
				PARENT_DURATION.value AS parent_duration,
				STATUS.label AS status,
				TYPES.label AS type
			FROM ${constant.tables.TRANSACTIONS} TRANSACTIONS
			LEFT JOIN ${constant.tables.TRANSACTIONS} PARENT
				ON PARENT.id = TRANSACTIONS.parent_id
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} PARENT_DURATION
				ON PARENT_DURATION.transaction_id = PARENT.id AND key='duration'
			INNER JOIN ${constant.tables.TYPES} TYPES
				ON TYPES.id = TRANSACTIONS.type
			INNER JOIN ${constant.tables.STATUS} STATUS
				ON STATUS.id = TRANSACTIONS.status
			WHERE
				`;
		let queryOptions =
			`SELECT
				key,
				value
			FROM ${constant.tables.TRANSACTIONSOPT} AS OPT
			WHERE OPT.transaction_id=$1 AND key <> 'admin_id'`;
		let queryAdmin =
			`SELECT
				value AS id,
				CONCAT(ADMIN.first_name, ' ', ADMIN.last_name) AS full_name
			FROM ${constant.tables.TRANSACTIONSOPT} AS OPT
			INNER JOIN ${constant.tables.USERS} AS ADMIN
				ON ADMIN.id = OPT.value::integer
			WHERE OPT.transaction_id=$1 AND key='admin_id' LIMIT 1;`;

		// Transaction ID
		where.push(`TRANSACTIONS.id=$${args.length}`);

		// User Specific
		if(bankUserId){
			args.push(bankUserId);
			where.push(`(TRANSACTIONS.bank_user_id=$${args.length} OR TRANSACTIONS.creator_id=$${args.length})`);
		}

		if(getChild){
			queryTransaction =
				`SELECT
					TRANSACTIONS.*,
					RTRIM(RTRIM(to_char(TRANSACTIONS.value::FLOAT, 'fm999999999999.00'), '0'), '.') AS value,
					CHILD.created_at_bank AS child_created_at,
					RTRIM(RTRIM(to_char(CHILD.value::FLOAT, 'fm999999999999.00'), '0'), '.') AS child_value,
					STATUS.label AS status,
					TYPES.label AS type
				FROM ${constant.tables.TRANSACTIONS} TRANSACTIONS
				LEFT JOIN ${constant.tables.TRANSACTIONS} CHILD
					ON CHILD.parent_id = TRANSACTIONS.id AND
					CHILD.type=(SELECT id FROM ${constant.tables.TYPES} WHERE label='${constant.transactions.INSTALMENT}' LIMIT 1)
				INNER JOIN ${constant.tables.TYPES} TYPES
					ON TYPES.id = TRANSACTIONS.type
				INNER JOIN ${constant.tables.STATUS} STATUS
					ON STATUS.id = TRANSACTIONS.status
				WHERE `;
			queryTransaction += where.join(' AND ');
			queryTransaction +=
			` ORDER BY
					CHILD.id DESC
				LIMIT 1;`;
		} else {
			queryTransaction += where.join(' AND ');
			queryTransaction += ` LIMIT 1;`;
		}

		queryOptions += ';';

		const transaction = {};
		return client.query(queryTransaction, args)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'تراکنش پیدا نشد');
				transaction.transaction = result.rows[0];
				return client.query(queryOptions, [transactionId]);
			})
			.then(result => {
				transaction.options = {};
				result.rows.forEach(row => transaction.options[row.key] = row.value > 0 ? parseFloat(row.value) : row.value);
				return client.query(queryAdmin, [transactionId]);
			})
			.then(result => {
				if(result && result.rowCount > 0)
					transaction.options.admin = result.rows[0];
				transaction.options.created_at_in_month = getDifferenceByMonth(transaction.transaction.created_at_bank, new Date());
				return transaction;
			});
	},

	getAll(client, bankId, options={}){
		let args	= [];
		let where = [];
		let limit = 20;
		let offset = limit * (options.page-1);
		let query =
			`SELECT 
				TRANSACTIONS.created_at_bank,
				TRANSACTIONS.id AS id,
				SEARCH.bank_user_id,
				SEARCH.parent_id,
				--SEARCH.username,
				SEARCH.user_id,
				SEARCH.full_name,
				CREATOR.user_id AS creator_id,
				CREATOR.full_name AS creator,
				TYPES.label AS type,
				STATUS.label AS status,
				RTRIM(RTRIM(to_char(TRANSACTIONS.value::FLOAT, 'fm999999999999.00'), '0'), '.') AS value
			FROM ${constant.tables.TRANSACTIONS} AS TRANSACTIONS
			INNER JOIN ${constant.tables.BANKSUSERSSEARCH} AS SEARCH
				ON SEARCH.bank_user_id = TRANSACTIONS.bank_user_id
			INNER JOIN ${constant.tables.TYPES} AS TYPES
				ON TYPES.id = TRANSACTIONS.type
			INNER JOIN ${constant.tables.STATUS} AS STATUS
				ON STATUS.id = TRANSACTIONS.status
			INNER JOIN ${constant.tables.BANKSUSERSSEARCH} AS CREATOR
				ON CREATOR.bank_user_id = TRANSACTIONS.creator_id `;

		// FullyPaid Loans
		if(options.transactionType === 'loan' && options.fullyPaid===-1){
			query +=
			` LEFT JOIN ${constant.tables.TRANSACTIONSOPT} AS FULLYPAID
					ON FULLYPAID.transaction_id = TRANSACTIONS.id AND key='${constant.transactions.FULLYPAID}'`;
			if(options.fullyPaid === -1)
				where.push(`FULLYPAID.value IS NOT DISTINCT FROM NULL `);
			else
				where.push(`FULLYPAID.value=1`);
		}

		// Where clause
		query += ` WHERE `;

		// Show transactions created by User for SearchID
		if(options.userId && options.searchId){
			args.push(options.searchId);
			where.push(`SEARCH.user_id=$${args.length}`);
			args.push(options.userId);
			// where.push(`TRANSACTIONS.creator_id=$${args.length}`);
			where.push(`CREATOR.user_id=$${args.length}`);
		}
		// Show Transactions created by or created for User
		else if(options.userId){
			args.push(options.userId);
			// where.push(`(TRANSACTIONS.bank_user_id=$${args.length} OR TRANSACTIONS.creator_id=$${args.length})`);
			// where.push(`(CREATOR.user_id=$${args.length} OR TRANSACTIONS.creator_id=$${args.length})`);
			where.push(`(CREATOR.user_id=$${args.length} OR SEARCH.user_id=$${args.length})`);
		}
		// Show Transactions created for SearchId
		else if(options.searchId){
			args.push(options.searchId);
			where.push(`SEARCH.user_id=$${args.length}`);
		}
		// Select all
		// else{
		args.push(bankId);
		where.push(`SEARCH.bank_id=$${args.length}`);
		// }

		// Type
		if(options.transactionType){
			if(options.transactionType === constant.transactions.INSTALMENT){
				where.push(`TRANSACTIONS.type IN (
					(SELECT id FROM ${constant.tables.TYPES} WHERE label='${constant.transactions.INSTALMENT}' LIMIT 1),
					(SELECT id FROM ${constant.tables.TYPES} WHERE label='${constant.transactions.PENALTY}' LIMIT 1),
					(SELECT id FROM ${constant.tables.TYPES} WHERE label='${constant.transactions.COMMISSION}' LIMIT 1)
				)`);
			}else{
				args.push(options.transactionType);
				where.push(`TRANSACTIONS.type= (SELECT id FROM ${constant.tables.TYPES} WHERE label=$${args.length} LIMIT 1)`);
			}
		}

		// StartAt
		if(options.startAt){
			args.push(options.startAt);
			where.push(`TRANSACTIONS.created_at_bank >= $${args.length}`);
		}

		// EndAt
		if(options.endAt){
			args.push(options.endAt);
			where.push(`TRANSACTIONS.created_at_bank < $${args.length}`);
		}

		if(options.status){
			args.push(capitalize(options.status));
			where.push(`TRANSACTIONS.status=(SELECT id FROM ${constant.tables.STATUS} WHERE label=$${args.length} LIMIT 1)`);
		}

		query += where.join(' AND ');
		query += ' ORDER BY id DESC';

		// Pagination
		if(options.page)
			query += ` LIMIT ${limit} OFFSET ${offset};`;

		const transactions = {};
		return client.query(query, args)
			.then(result => result.rows);
	},

	getLoans(client, bankId, bankUserId=0){
		let args	= [bankId];
		let query =
			`SELECT 
				TRANSACTIONS.created_at_bank,
				TRANSACTIONS.id AS id,
				--SEARCH.bank_user_id,
				SEARCH.user_id,
				SEARCH.username,
				SEARCH.full_name,
				RTRIM(RTRIM(to_char(TRANSACTIONS.value::FLOAT, 'fm999999999999.00'), '0'), '.') AS value,
				array_agg(OPT.key) AS keys,
				array_agg(OPT.value) AS values
			FROM ${constant.tables.TRANSACTIONS} AS TRANSACTIONS
			INNER JOIN ${constant.tables.BANKSUSERSSEARCH} AS SEARCH
				ON SEARCH.bank_user_id = TRANSACTIONS.bank_user_id
			INNER JOIN ${constant.tables.TRANSACTIONSOPT} AS OPT
				ON OPT.transaction_id = TRANSACTIONS.id
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} AS DELAYED
				ON DELAYED.transaction_id = TRANSACTIONS.id AND DELAYED.key='delayed'
			WHERE
				SEARCH.bank_id=$1 AND
				TRANSACTIONS.type=(SELECT id FROM ${constant.tables.TYPES} WHERE label='${constant.transactions.LOAN}' LIMIT 1) AND
				TRANSACTIONS.status=(SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.ACCEPTED}' LIMIT 1)`;

		if(bankUserId > 0) {
			args.push(bankUserId);
			query += ' AND SEARCH.bank_user_id = $2 ';
		}

		query += `
			GROUP BY
				TRANSACTIONS.id,
				SEARCH.bank_user_id,
				DELAYED.value
			ORDER BY
				DELAYED.value DESC NULLS LAST,
				TRANSACTIONS.created_at_bank DESC;`;

		return client.query(query, args)
			.then(result => {
				const now = new Date();
				return result.rows.map(row => {
					row.options = {};
					row.options.created_at_in_month = getDifferenceByMonth(row.created_at_bank, now);
					if(row.keys){
						let keys = row.keys;
						let values = row.values;
						keys.forEach((key, i) => row.options[key] = parseFloat(values[i]));
						delete row.keys;
						delete row.values;
					}
					return row;
				});
			});
	},

	getBalance(client, bankId){
		let args	= [bankId];
		let query =
			`SELECT 
				BANKSOPT.key,
				BANKSOPT.value
			FROM ${constant.tables.BANKSOPT} AS BANKSOPT
			INNER JOIN ${constant.tables.BANKS} AS BANKS
				ON BANKS.id = BANKSOPT.bank_id 
			WHERE BANKS.id=$1 AND BANKSOPT.key IN (
				'${constant.banks.BALANCE}',
				'${constant.banks.PENALTY_BALANCE}',
				'${constant.banks.COMMISSION_BALANCE}',
				'${constant.banks.LOAN_COUNT}',
				'${constant.banks.FULLYPAIDLOAN_COUNT}',
				'${constant.banks.TRANSACTION_COUNT}'
			)
			LIMIT 6;`;

		return client.query(query, args)
			.then(result => {
				let obj = {};
				result.rows.forEach(row => obj[row.key] = parseFloat(row.value));
				return obj;
			});
	},

	// Don't need cache, 'cause BALANCE does not modified
	update(client, bankId, transactionId, status, options){
		let args = [status, transactionId];
		let query = `UPDATE ${constant.tables.TRANSACTIONS} SET status=(
			SELECT id FROM ${constant.tables.STATUS} WHERE label=$1 LIMIT 1
		) WHERE id=$2::integer;`;

		// Check for admin access to Transaction
		return client.query('BEGIN')
			.then(() => isValid(client, bankId, transactionId))
			// Update Transaction
			.then(transaction => {
				if(!transaction)
					throw new CodedError(404, 'تراکنش وجود ندارد');
				return client.query(query, args);
			})
			// Update options
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'بروزرسانی تراکنش با مشکل مواجه شد');

				return Promise.all(
					Object.keys(options).map(key => {
						if(options[key])
							return transaction.setOption(client, transactionId, key, options[key]);
						else
							return true;
					})
				);
			})
			// Commit
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'بروزرسانی تنظیمات با مشکل مواجه شد');
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				if(err.detail)
					throw new CodedError(err.detail, err.message);
				throw err;
			});
	},

	delete(client, bankId, transactionId){
		let args = [transactionId];
		let query =
			`DELETE FROM ${constant.tables.TRANSACTIONS} WHERE id=$1 RETURNING value::float;`;
		let queryType =
			`SELECT
				TYPES.label,
				TRANS.parent_id,
				OPT.value::int AS fully_paid
			FROM ${constant.tables.TRANSACTIONS} TRANS
			INNER JOIN ${constant.tables.TYPES} TYPES
				ON TRANS.type = TYPES.id
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} OPT
				ON OPT.transaction_id = TRANS.id AND OPT.key='${constant.transactions.FULLYPAID}'
			WHERE TRANS.id=$1
			LIMIT 1;`;
		let query_parent =
			`SELECT
				OPT.value::float AS reimbursement,
				BALANCE.value::float AS loan_balance,
				PENALTY.value::float AS penalty_balance
			FROM ${constant.tables.TRANSACTIONS} TRANS
			INNER JOIN ${constant.tables.TRANSACTIONSOPT} OPT
				ON OPT.transaction_id = TRANS.id AND OPT.key='${constant.banks.REIMBURSEMENT}'
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} BALANCE
				ON BALANCE.transaction_id = TRANS.id AND BALANCE.key='${constant.banks.LOAN_BALANCE}'
			LEFT JOIN ${constant.tables.TRANSACTIONSOPT} PENALTY
				ON PENALTY.transaction_id = TRANS.id AND PENALTY.key='dailyPenalty'
			WHERE
				TRANS.id=$1
			LIMIT 1;`;

		const memory = cache.getClient();
		let parentId = 0;
		let price = 0;
		let reimbursement = 0;
		let loanBalance = 0;
		let fullyPaidPerent = false;
		let fullyPaidSelf = false;
		let type;
		return client.query('BEGIN')
			// Check validation
			.then(() => isValid(client, bankId, transactionId))
			// Get Type
			.then(transaction => {
				if(!transaction)
					throw new CodedError(404, 'تراکنش وجود ندارد');
				return client.query(queryType, args);
			})
			// Get Parent
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(404, 'تراکنش وجود ندارد');

				type = result.rows[0].label;
				fullyPaidSelf = result.rows[0].fully_paid > 0;
				if(/*type === 'instalment' &&*/ result.rows[0].parent_id) {
					parentId = result.rows[0].parent_id;
					return client.query(query_parent, [parentId]);
				}
				return true;
			})
			// Delete Transaction
			.then(result => {
				if(result !== true && (!result || result.rowCount <= 0))
					throw new CodedError(404, 'وام یافت نشد');

				if(result !== true){
					reimbursement = result.rows[0].reimbursement + result.rows[0].penalty_balance;
					loanBalance = result.rows[0].loan_balance;
				}
				return client.query(query, args);
			})
			// Update delayed for loan
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'حذف تراکنش انجام نشد');
				price = result.rows[0].value;
				if(parentId > 0)
					return updateDelayed(client, parentId);
				else 
					return true;
			})
			// Remove FULLYPAID from Loan
			.then(result => {
				if(!result)
					throw new CodedError(500, 'بروزرسانی دیرکرد با مشکل مواجه شد');

				fullyPaidParent = (loanBalance *10) - (price*10) < (reimbursement *10);
				if(fullyPaidParent) {
					return transaction.deleteOption(client, parentId, constant.transactions.FULLYPAID);
				}
				return true;
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'بروزرسانی تسویه انجام نشد');
				// memory.hdel(constant.memory.banks.BALANCE, bankId);
				client.query('COMMIT');
				return memory.hget(constant.memory.banks.BALANCE, bankId);
			})
			.then(result => {
				if(result){
					const b = JSON.parse(result);
					// Balance
					b[constant.banks.BALANCE] = b[constant.banks.BALANCE] ? decFloat(b[constant.banks.BALANCE], price) : -price;
					// Transactions Count
					b[constant.banks.TRANSACTION_COUNT] = b[constant.banks.TRANSACTION_COUNT] ? b[constant.banks.TRANSACTION_COUNT] - 1 : -1;
					// Loans Count
					if(type === constant.transactions.LOAN)
						b[constant.banks.LOAN_COUNT] = b[constant.banks.LOAN_COUNT] ? b[constant.banks.LOAN_COUNT] - 1 : -1;
					// FullyPaid
					if(fullyPaidParent || fullyPaidSelf)
						b[constant.banks.FULLYPAIDLOAN_COUNT] = b[constant.banks.FULLYPAIDLOAN_COUNT] ? b[constant.banks.FULLYPAIDLOAN_COUNT] - 1 : -1;
					// Commission
					if(type === constant.transactions.COMMISSION)
						b[constant.banks.COMMISSION_BALANCE] = b[constant.banks.COMMISSION_BALANCE] ? decFloat(b[constant.banks.COMMISSION_BALANCE], price) : -price;
					// Penalty
					if(type === constant.transactions.PENALTY)
						b[constant.banks.PENALTY_BALANCE] = b[constant.banks.PENALTY_BALANCE] ? decFloat(b[constant.banks.PENALTY_BALANCE], price) : -price;
					memory.hset(constant.memory.banks.BALANCE, bankId, JSON.stringify(b));
				}
				return true;
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	/*delete_old(client, bid, tid, executer_id){
		// Need these for later
		// When connected to Gateway Payment
		// Users have to delete transactions by themselves
		/*
		let transactionId = 0;
		let bankId				= 0;
		let userId				= 0;
		try{
			transactionId = parseInt(tid.toString().match(/^\d+$/)[0]);
			bankId				= parseInt(bid.toString().match(/^\d+$/)[0]);
			userId				= parseInt(executer_id.toString().match(/^\d+$/)[0]);
		}catch(e){
			return Promise.reject(new Error('مقادیر وارد شده اشتباه است'));
		}
		let query =
			`DO $$
				DECLARE himself integer;
				DECLARE bankadmin integer;
				DECLARE siteadmin integer;
				BEGIN
						himself:=(SELECT 1 FROM ${constant.tables.TRANSACTIONS}
							WHERE id=${transactionId} AND bank_id=${bankId} AND user_id=${userId} LIMIT 1);

						siteadmin:=(SELECT 1 FROM ${constant.tables.USERS} AS USERS
							INNER JOIN ${constant.tables.USERSOPT} AS USERSOPT
								ON USERS.id=USERSOPT.user_id
							WHERE
								USERS.id=${userId} AND
								USERSOPT.key='role' AND
								USERSOPT.value='${constant.role.SITEADMIN}'
							LIMIT 1);

						bankadmin:=(SELECT 1 FROM ${constant.tables.USERS} AS USERS
							INNER JOIN ${constant.tables.BANKSUSERS} AS BANKSUSERS
								ON USERS.id=BANKSUSERS.user_id
							WHERE
								BANKSUSERS.user_id=${userId} AND
								BANKSUSERS.role='${constant.role.BANKADMIN}'
							LIMIT 1);
					IF himself=1 OR siteadmin=1 OR bankadmin=1
					THEN
						DELETE FROM ${constant.tables.TRANSACTIONS} 
						WHERE id=${transactionId} AND bank_id=${bankId};
					END IF;
				END$$;`;<]
		// Args
		let args	= [tid, bid];
		let query = `DELETE FROM ${constant.tables.TRANSACTIONS} WHERE id=$1 AND bank_id=$2;`;

		return client.query(query, args)
			.then(result => result.rowCount)
			.catch(err => handle_error(err));
	}, */

	setTransactionStatus(client, transactionId, status){
		let args = [transactionId, status];
		let query = `INSERT INTO ${constant.tables.TRANSACTIONSOPT} (transaction_id, key, value) VALUES ($1, 'status', (
			SELECT id FROM ${constant.tables.STATUS} WHERE label=$2 LIMIT 1
		)) ON CONFLICT (transaction_id, key) DO UPDATE SET value=EXCLUDED.value;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0);
			/* .catch(err => {
				handle_error(err);
				return false;
			}); */
	},

	setOption(client, transactionId, key, value){
		let args	= [transactionId, key, value];
		let query =
			`INSERT INTO ${constant.tables.TRANSACTIONSOPT} (transaction_id, key, value) VALUES ($1, $2, $3)
			ON CONFLICT(transaction_id, key) DO UPDATE SET value=EXCLUDED.value;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0);
			/* .catch(err => {
				handle_error(err);
				throw err;
			}); */
	},

	getOption(client, transactionId, key){
		let args	= [transactionId, key];
		let query = `SELECT value FROM ${constant.tables.TRANSACTIONSOPT} WHERE transaction_id=$1 AND key=$2 LIMIT 1;`;

		return client.query(query, args)
			.then(result => result.rows.length > 0 ? result.rows[0] : null)
			.then(row => row.value ? row.value : null)
			.catch(err => {
				handle_error(err);
				return false;
			});
	},

	deleteOption(client, transactionId, key){
		let args	= [transactionId, key];
		let query = `DELETE FROM ${constant.tables.TRANSACTIONSOPT} WHERE transaction_id=$1 AND key=$2;`;

		return client.query(query, args)
			// .then(result => result.rowCount > 0)
			.then(result => true)
			.catch(err => {
				handle_error(err);
				throw err;
			});
	},
};

module.exports = transaction;
