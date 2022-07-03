const moment = require('moment-jalali');

const utils = {
	Miladi2Shamsi(date, format='YYYY/MM/DD HH:mm:ss', add=null){
		/* let d = this.getDateArray(date);
		let dt = new Date(d.year, d.month, d.day, d.hour, d.min, d.sec);
		dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
		if(add) {
			if(add.year)
				dt.setFullYear(dt.getFullYear() + parseInt(add.year));
			if(add.month)
				dt.setMonth(dt.getMonth() + parseInt(add.month));
			if(add.day)
				dt.setDate(dt.getDate() + parseInt(add.day));
		} */

		// const pdate = new PDate(dt);
		// return pdate.toLocale('en').format(format);
		// const jalali = new moment(date, 'YYYY-MM-DDTHH:mm:ss.msZ');
		const jalali = new moment(date);
		if(add) {
			if(add.year)
				jalali.add(add.year, 'year');
			if(add.month)
				jalali.add(add.month, 'month');
			if(add.day)
				jalali.add(add.day, 'days');
		}
		return jalali.utc().format(format);
	},
	cdn(str){
		// return `https://cdn.bankemoon.com/${str}`;
		return `http://cdn.localhost:8000/${str}`;
	},
};

export default utils;
