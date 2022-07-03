const pdf = require('html-pdf');
const ejs = require('ejs');
const moment = require('moment-jalaali');
const config = require('config');
const constant = require('../constant');
const log = require('../log');

module.exports = {
	pdf(obj){
		obj.moment = moment;
		obj.constant = constant;
		ejs.renderFile(process.cwd() + '/Export/transactions.ejs', obj, null, (err, html) => {
			if(err) {
				log.error(err);
				throw new Error('خواندن قالب با مشکل مواجه شد');
			}

			const fileName = `${obj.username}-${Date.now()*100}.pdf`;
			const filePath = `${config.avatar.path.export}/pdf/${fileName}`;
			const options = {
				format: 'A4',
				base: `file://${process.cwd()}/Export/`
			};
			pdf.create(html, options).toFile(filePath, (err, result) => obj.cb(err, fileName));
		});
	},
};
