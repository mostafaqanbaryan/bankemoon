const router	 = require('express').Router();
const db			 = require('../db');
const cache		 = require('../cache');
const config	 = require('config');
const fs			 = require('fs');
const constant = require('../constant');
const {
	handle_fail,
	handle_result
} = require('../utils');

const Bot = require('../Models/bot');
const Bank = require('../Models/bank');
const Transaction = require('../Models/transaction');

router.get('/banks', (req, res, next) => {
	const secret = req.query.secret || null;
	const num = parseInt(req.query.page);
	const page = num && !isNaN(num) ? parseInt(num) : 1;
	const rowsPerPage = 10;

	// Get all for googleBot
	if(secret && secret === process.env.BANKS_SECRET){
		const f = {};
		db.getClient((err, client) => {
			if(err)
				return handle_fail(res, 'ارتباط با دیتابیس با مشکل مواجه شد', 500);

			Bot.getBanks(client, page, rowsPerPage)
				.then(banks => {
					f.banks = banks.map(b => {
						b.avatar = b.avatar ? `${config.avatar.bank}/${b.avatar}` : null;
						return b;
					});
					const memory = cache.getClient();
					return memory.hget(constant.memory.banks.ALL, constant.banks.COUNT);
				})
				.then(total => {
					if(!total)
						return Bank.getBanksTotal(client);
					return total;
				})
				.then(total => {
					f.total = total;
					f.rowsPerPage = rowsPerPage;
					return handle_result(res, null, f, f);
				})
				.catch(err => handle_fail(res, err.message, err.code))
				.then(() => client.release());
		});
	}else{
		next();
	}
});

/* router.get('/cron', (req, res) => {
	db.getClient((err, client, done) => {
		if(err)
			return handle_fail(res, 'ارتباط با دیتابیس ایجاد نشد');

		Transaction.setPenaltyNightly(client)
			.then(result => handle_result(res, null, result, null))
			.catch(err => handle_fail(res, err.message, err.code))
			.then(() => client.release());
	});
}); */

router.get('/export', (req, res, next) => {
	if(!req.query.path || !req.query.status || req.query.status.toLowerCase() !== 'ok' || !req.query.passcode || req.query.passcode !== 'DeleteByBB')
		return next();
	const folderPath = config.avatar.path.export + '/pdf/';
	const sp = req.query.path.split('/');
	const fileName = sp[sp.length-1];
	const filePath = folderPath + fileName;

	if(!fs.existsSync(filePath))
		return next();
	const isDeleted = fs.unlinkSync(filePath);
	return handle_result(res, null, isDeleted, null);
});

module.exports = router;
