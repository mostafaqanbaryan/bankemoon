const db			 = require('../db');
const cache		 = require('../cache');
const constant = require('../constant');
const log			 = require('../log');
const {
	handle_result,
	handle_fail,
	} = require('../utils');

//Models
const Transaction = require('../Models/transaction');
/* const Captcha = require('../Models/captcha');

function cleanCaptcha(){
	db.getClient((err, client, done) => {
		// Error happend in getting client
		if(err)
			return handle_fail(log, err);

		return Captcha.clean(client)
			.then(result => console.log(result))
			.catch(err => handle_fail(log, err))
			.then(() => client.release());
	});
} */

function logError(err){
	log.error('[CRON] ' + err);
}

function logDB(client, hasError, name, total){
	const query = `INSERT INTO ${constant.tables.LOGS} (name, status, total) VALUES ($1, $2, $3);`;
	const status = hasError ? 'ERROR' : 'INFO';
	const args = [name, status, total];
	return client.query(query, args)
		.then(result => result && result.rowCount > 0);
}

function handleResult(client, error, name, total=0){
	return logDB(client, error, name, total)
	.catch(err => logError(`[LogDB] => Name: ${name}, Total: ${total}, HasError: ${error}`));
}

function LoanPenalty(client){
	let hasError = null;
	let total = 0;
	let name = 'LoanPenalty';
	return Transaction.setPenaltyNightly(client)
		.then(t => total = t)
		.catch(err => {
			hasError = err;
			logError(err);
		})
		.then(() => handleResult(client, hasError, name, total));
}

function ClearCache(client){
	const memory = cache.getClient();
	const name = 'ClearCache';
	let hasError = null;
	return memory.del(constant.memory.banks.ALL)
		.then(() => memory.del(constant.memory.banks.BADGE))
		.then(() => memory.del(constant.memory.banks.BALANCE))
		.then(() => memory.del(constant.memory.banks.ADMINS))

		.then(() => memory.del(constant.memory.users.SNAPSHOT))
		.then(() => memory.del(constant.memory.users.BADGES))
		.catch(err => {
			hasError = err;
			logError(err);
		})
		.then(() => handleResult(client, hasError, name));
}

db.getClient((err, client, done) => {
	if(err)
		return logError('DB: ارتباط با دیتابیس برقرار نشد');

	LoanPenalty(client)
		.then(() => ClearCache(client))
		.then(() => client.release())
		.then(() => process.exit(0));
});
