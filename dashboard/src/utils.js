// const PDate = require('persian-date');
const moment = require('moment-jalali');
const md5 = require('md5');

let utils = {
	sanitize:{
		title(str){
			return str.replace(' ', '-').replace('--', '-').replace('/', '').replace('\\', '');
		},
		money(str){
			return str && (str.length > 0 || str > 0)
				? str.toString().replace(/((^0+)|([^0-9.]))/g, '')
				: '';
		},
		number(str){
			return str && (str.length > 0 || str > 0)
				? str.toString().replace(/(^0+(?!\.)|([^0-9.]))/g, '')
				: 0;
		},
		phone(str){
			return str && (str.length > 0 || str > 0)
				? str.toString().replace(/^0/, '').replace(/-/g, '')
				: '';
		},
	},

	persian: {
		month(num){
			const month = [
				'',
				'روردین',
				'اردیبهشت',
				'خرداد',
				'تیر',
				'مرداد',
				'شهریور',
				'مهر',
				'آبان',
				'آذر',
				'دی',
				'بهمن',
				'اسفند',
			];
			const nnum = parseInt(num, 10);
			return !isNaN(nnum) || nnum <= 12 ? month[nnum] : num;
		}
	},

	avatar: {
		bank(avatar, username){
			if(avatar){
				return utils.cdn(avatar);
				// return avatar;
			}else {
				const email = username + '@bankemoon.com';
				const hash = md5(email);
				return 'https://www.gravatar.com/avatar/' + hash + '?d=identicon';
			}
		},
		user(avatar, phoneNumber){
			if(avatar){
				return utils.cdn(avatar);
				// return avatar;
			}else {
				const email = md5(phoneNumber) + '@bankemoon';
				return `https://api.adorable.io/avatars/128/${email}.png`;
			}
		}
	},

	cdn(url){
		return 'http://cdn.localhost:8000/' + (url.startsWith('/') ? url.substr(1) : url);
	},

	basename(str){
		let spl = str.split('/').reverse();
		if(spl[0] !== '')
			return spl[0];
		else if(spl.length > 2)
			return spl[1];
	},

	money(num){
		return num || num === 0 ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
	},

	phone(num){
		if(!num)
			return '0' + num;
		let str = num.toString();
		let array = [];
		array.push(str.substr(0, 4));
		array.push(str.substr(4, 3));
		array.push(str.substr(7, 4));
		array = array.filter(a => a.length > 0);

		// return '0' + array.join('-');
		return array.join('-');
	},

	equalColumns(col, remainder, len, current){
		if(remainder === 0)
			return 12 / col;
		else if(current < (len - remainder))
			return 12 / col;
		else
			return 12 / remainder;
	},

	numberToPersian(number){
		let yek = [
			'', 'یک', 'دو', 'سو', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'
		];
		let bein = [
			'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'
		];
		let dah = [
			'', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'
		];
		let sad = [
			'', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'
		];

		let nums = number.toString().split('').reverse();
		let res = [];

		if(nums.length === 3){
			res.push(sad[nums[2]]);
			if(nums[1] === '1'){
				res.push(bein[nums[0]]);
			}else{
				if(dah[nums[1]])
					res.push(dah[nums[1]]);
				if(yek[nums[0]])
					res.push(yek[nums[0]]);
			}
		}else if(nums.length === 2){
			if(nums[1] === '1'){
				res.push(bein[nums[0]]);
			}else{
				res.push(dah[nums[1]]);
				if(yek[nums[0]])
					res.push(yek[nums[0]]);
			}
		}else if(nums.length === 1){
			res.push(yek[nums[0]].replace('یک', 'اول'));
		}else{
			return number;
		}

		res = res.join(' و ');
		// if(long){
			if(nums.pop() === '1' && nums.length === 0)
				return res;
			else
				// return res + 'مین';
				return res + 'م';
		/* }else{
			return res + 'م'; */
		// }
	},


	/* type(str){
		switch(str){
			case 'Payment':
			case 'payment':
				return 'سپرده';
			case 'Instalment':
			case 'instalment':
				return 'قسط وام';
			case 'Loan':
			case 'loan':
				return 'وام';
			default:
				return str;
		}
	}, */

	getUrlTail(){
		const params = window.location.pathname.split('/');
		let type = '';
		if(params.length > 0)
			type = params[params.length-1] ? params[params.length-1] : params[params.length-2];
		return type;
	},

	capitalize(str){
		return str.replace(/(^|\s)\S/g, l => l.toUpperCase());
	},

	getRandomBackground(){
		const count = 22;
		const rand = Math.random();
		const num = Math.floor(rand * (count-1)) + 1;
		return utils.cdn(`/img/background/${num}.jpeg`);
	},

	obsoleteDays(str){
		let d = new Date(str).getTime();
		let c = new Date.getTime() - d;
		return Math.floor(c / 24 / 60 / 60);
	},

	/* getDateArray(date){  // 2018-06-24T06:31:09.125Z
		let d = date.toString().match(/^(\d{4})\-(\d{2})\-(\d{2})t(\d{2})\:(\d{2})\:(\d{2})\.\d+z$/i);
		let day = 0, month = 0, year = 0, hour = 0, min = 0, sec = 0;
		if(d.length === 7){
			year	= d[1];
			month = d[2]-1;
			day		= d[3];
			hour	= d[4];
			min		= d[5];
			sec		= d[6];
			return {
				year, month, day, hour, min, sec
			};
		}
		return date;
	}, */

	/* getDate(str){
		const d = this.getDateArray(str);
		return Date.UTC(d.year, d.month, d.day, d.hour, d.min, d.sec);
	}, */

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
		// return jalali.utc().format(format);
		return jalali.format(format);
	},

	Miladi2ShamsiObject(date){
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
		const jalali =  new moment(date);
		return {
			year: jalali.format('jYY'),
			month: jalali.format('jMM'),
			day: jalali.format('jDD'),
			/* hour: jalali.jHours(),
			min: jalali.jMinutes(),
			sec: jalali.jSeconds() */
		};
	},

	getDifference(f, s){
		const diff = (f - s) / 1000;
		const result = {};
		/* if(diff < 60) {
			result.value = diff; // sec
			result.label = 'ثانیه';
		} else if (diff < 3600){
			result.value = diff / 60; // min
			result.label = 'دقیقه';
		} else if (diff < 60*60*24){
			result.value = diff / 60 / 60; // hour
			result.label = 'ساعت';*/
		if(diff < 60*60*24){
			result.value = 0;
			result.label = 'امروز';
		} else if (diff < 60*60*24*30){
			result.value = diff / 60 / 60 / 24; // day
			result.label = 'روز';
		} else if (diff < 60*60*24*30*12){
			result.value = diff / 60 / 60 / 24 / 30; // month
			result.label = 'ماه';
		} else {
			result.value = diff / 60 / 60 / 24 / 30 / 12; // year
			result.label = 'سال';
		}
		result.value = Math.ceil(result.value);
		return result;
	},

	isBankAdmin(role){
		return role && (role === 'BankAdmin' || role === 'Creator');
	},

	addFloat(f, s){
		return ((f * 10) + (s * 10)) / 10;
	}
};

export default utils;
