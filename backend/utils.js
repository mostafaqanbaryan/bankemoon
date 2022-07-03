const CodedError = require('./Error');
const db			 = require('./db');
const log			 = require('./log');
const config	 = require('config');
// const passport = require('passport');
const bcrypt	 = require('bcrypt');
const constant = require('./constant');
// const requestIp= require('request-ip');
const Session = require('./Models/session');

/*
 * Custom Functions
 */

const filterList = [
	'is',
	'err',
	'value',
	'null',
	'but',
	'violates',
	'unhandled',
	'enoent',
	'query',
	'must',
	'trigger',
	'exist',
	'syntax',
	'column',
	'undefined',
	'ambiguous',
];

let utils = {
	sanitize: {
		slug(str){
			return str.toLowerCase().replace(/[\?\!\~\`\|\"\'\;\:\\\/\@\<\>\.\,\{\}\[\]\#\$\%\^\&\*\(\)\_\+\=]+/g, ' ').replace(/[\s]+/g, '-');
		},
		/* phone(str) {
			let number = str.match(/\d{10}$/);
			if(number && number.length > 0 && number[0][0] == 9)
				return number[0];
			throw new Error('شماره همراه را به صورت 11 رقمی وارد کنید');
				// return null;
		}, */
		phone(str) {
			return new Promise((resolve, reject) => {
				let number = str.match(/\d{10}$/);
				if(number && number.length > 0 && number[0][0] == 9) {
					return resolve(number[0]);
				}
				return reject(new CodedError(422, 'شماره همراه را به صورت 11 رقمی وارد کنید'));
			});
		},
		username(str) {
			return new Promise((resolve, reject) => {
				if(str && str.match(/^(?=[a-z])([a-z0-9_]{5,})$/i))
					resolve(str.toLowerCase());
				reject(new CodedError(422, 'نام کاربری حداقل باید دارای 5 کاراکتر بوده، با حروف شروع شده و شامل ارقام, حروف انگلیسی و _ باشد'));
			});
			// return null;
		},
		email(str) {
			return new Promise((resolve, reject) => {
				if(str && str.length > 6 && str.match(/^[a-z0-9_\.]+@[a-z]+\.[a-z]{2,5}$/i))
					resolve(str);
				reject('ایمیل را به صورت صحیح وارد کنید');
			});
			// return null;
		},
		ip(str){
			if(str){
				let i = str.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
				if(i && i.length > 0)
					return i[0];
			}
			return str;
		}
	},

	activationCode(){
		return Math.floor(Math.random() * (932174-162438) + 162438);
	},

	handle_result(res, name, testObj, elem, err={code: 404, msg: 'یافت نشد'}){
		if(testObj){
			if(name){
				res.status(200).json({
					status: 'success', 
					data: {
						[name]: elem
					}
				});
			}else{
				res.status(200).json({
					status: 'success', 
					data: elem
				});
			}
		}else{
			res.status(err.code).json({
				status: 'fail',
				message: err.msg
			});
		}
	},

	// For debug
	handle_fail(res, err, status=500/*, isFail=false*/){
		status = parseInt(status);
		status = (!status || status < 100 || status > 600) ? 500 : status;
		let isFail = status.toString().substr(0, 1) !== '5' ? true : false;
		let lower = err.toString().toLowerCase();
		let unhandled = false;
		for(let i in filterList){
			if(lower.indexOf(filterList[i]) !== -1) {
				unhandled = true;
				break;
			}
		}

		// Unhandled errors
		if(unhandled){
			utils.handle_error(res, err);
			return res.status(500).json({
				status: 'error',
				message: 'عملیات با مشکل مواجه شد'
			});
		}
		else if(isFail){
			if(process.env.NODE_ENV !== 'production')
				log.warn(err);
			return res.status(status).json({
				status: 'fail',
				message: err
			});
		}else{
			log.error(err);
			return res.status(status).json({
				status: 'error',
				message: err
			});
		}
	},

	// For production
	handle_error(res, err){
		let obj = {};
		let q = res.socket && res.socket._httpMessage ? res.socket._httpMessage.req : res.req;
		obj.clientIP = q.clientIp;
		obj.HEADERS  = q.headers;
		obj.URL			 = q.originalUrl;
		obj.METHOD	 = q.method;
		obj.QUERY		 = q.query;
		obj.BODY		 = q.body;
		obj.FILE		 = q.file;
		obj.MESSAGE	 = err;
		log.error(obj);
	},

	now(){
		return Date().now()/1000;
	},

	getDateFromJSON(json){
		let d = new Date(json);
		let res = new Date();
		if(!isNaN(d.getTime()))
			 res = d;
		res.setTime(res.getTime() - (res.getTimezoneOffset()*60*1000));
		return res;
	},

	getIp(req, res, next){
		// let i = utils.sanitize.ip(requestIp.getClientIp(req));
		if(process.env.NODE_ENV === 'test'){
			req.clientIp = '127.0.0.1';
			return next();
		}
		let i = utils.sanitize.ip(req.headers['x-real-ip']);
		req.clientIp = i;
		next();
	},

	bcrypt_password(password){
		return new Promise((resolve, reject) => {
			// Generate salt
			bcrypt.genSalt(config.get('SALT'), (err, salt) => {
				if(err)
					return reject(err);

				// Create hash base on salt
				bcrypt.hash(password, salt, (err, hash) => {
					if(err)
						return reject(err);
					return resolve(hash);
				});
			});
		});
	},

	bcrypt_password_sync(password){
		// Generate salt
		let salt = bcrypt.genSaltSync(config.get('SALT'));
		// Create hash base on salt
		return bcrypt.hashSync(password, salt);
	},

	/* isAdmin(role){
		return role && role === constant.role.SITEADMIN;
	},*/

	isBankAdmin(role){
		return role && (role === constant.role.BANKADMIN || role === constant.role.CREATOR);
	},

	getDifferenceByMonth(dA, dAN){
		let DAYear = dA.getFullYear(),
				DANYear = dAN.getFullYear(),
				DAMonth = dA.getMonth(),
				DANMonth = dAN.getMonth(),
				DADay = dA.getDate(),
				DANDay = dAN.getDate();

		let diffYear = DANYear - DAYear;
		let diffMonth = DANMonth - DAMonth;
		let diffDay = DANDay - DADay;
		let moreThanAMonthByDay = diffDay >= 0;
		let delayMonth = 0;

		if(DAYear === DANYear && DAMonth === DANMonth) {
			delayMonth = 0;
		} else if(DAYear === DANYear) {
			if(moreThanAMonthByDay)
				delayMonth = diffMonth;
			else
				delayMonth = diffMonth - 1;
		} else {
			if(moreThanAMonthByDay)
				delayMonth = diffYear * 12 + diffMonth;
			else
				delayMonth = diffYear * 12 + diffMonth - 1;
		}
		return parseInt(delayMonth);
	},

	capitalize(str){
		return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
	},

	decFloat(f, s){
		return ((f * 10) - (s * 10)) / 10;
	},

	addFloat(f, s){
		return ((f * 10) + (s * 10)) / 10;
	}
};

module.exports = utils;
