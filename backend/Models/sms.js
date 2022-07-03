const CodedError = require('../Error');
const soap = require('soap');
const cache = require('../cache');

module.exports = {
	getUrlSMS(){
		return 'http://api.payamak-panel.com/post/Send.asmx?wsdl';
	},

	getUrlCall(){
		return 'http://api.payamak-panel.com/post/Voice.asmx?wsdl';
	},

	getData(obj){
		let data = obj || {};
		data.username = process.env.SMS_USERNAME;
		data.password = process.env.SMS_PASSWORD;
		data.from = process.env.SMS_NUMBER;
		return data;
	},

	createClient(url){
		return soap.createClientAsync(url, { disableCache: true })
			.then(client => {
				if(!client)
					throw new CodedError(503, 'اتصال SOAP برقرار نشد');
				return client;
			});
	},

	checkValue(res){
		switch(res){
			case 0:
			case '0':
				throw new CodedError(401, 'ErrorID 0: Unauthorized');
			case 2:
			case '2':
				throw new CodedError(500, 'ErrorID 2: Insufficient credit');
			case 3:
			case '3':
				throw new CodedError(500, 'ErrorID 3: Hit daily limit');
			case 4:
			case '4':
				throw new CodedError(500, 'ErrorID 4: Hit limit');
			case 5:
			case '5':
				throw new CodedError(500, 'ErrorID 5: Sender Number\'s Wrong');
			case 6:
			case '6':
				throw new CodedError(500, 'ErrorID 6: System Update');
			case 7:
			case '7':
				throw new CodedError(500, 'ErrorID 7: Bad words');
			case 11:
			case '11':
				throw new CodedError(500, 'ErrorID 11: Send Failed');
			/*case 1:
				return true;*/
			default:
				return res;
		}
	},

	getDelivery(id){
		const url = 'GetDeliveries2';
		const data = this.getData({ recId: id.toString() });
		return this.createClient(this.getUrlSMS())
			.then(client => client.GetDelivery2Async(data))
			.then(result => {
				if(result && result.length > 0 && result[0].GetDelivery2Result)
					return true;
				// console.error('Delivery Error:', result.data.Value);
				return false;
			});
	},


	checkCredit(){
		const url = 'GetCredit';
		const data = this.getData();
		return this.createClient(this.getUrlSMS())
			.then(client => client.GetCreditAsync(data))
			.then(result => {
				if(result && result.length > 0 && result[0] && result[0].hasOwnProperty('GetCreditResult') && result[0].GetCreditResult > 50)
					return true;
				return this.sendCredit(result[0].GetCreditResult);
			});
	},

	sendCredit(num){
		if(process.env.NODE_ENV !== 'production')
			return Promise.resolve(true);

		const memory = cache.getClient();
		const key = 'sendCredit';
		const text = `فقط ${num} پیام باقی مانده است`;
		return memory.get(key)
			.then(value => {
				if(!value)
					return this.sendSMS(process.env.SMS_OWNER, text);
			})
			.then(isSent => {
				if(isSent)
					memory.set(key, 1, 'EX', 5 * 60); // 5 min
				return isSent;
			});
	},

	send(to, smsBody, speechBody){
		if(process.env.NODE_ENV !== 'production')
			return Promise.resolve(true);


		// const data = this.getData({ to, smsBody, speechBody, scheduleDate: date.toISOString() });
		const data = this.getData({ to, smsBody, speechBody });
		return this.checkCredit()
			.then(result => this.createClient(this.getUrlCall()))
			// .then(client => client.SendSMSWithSpeechTextBySchduleDateAsync(data))
			.then(client => client.SendSMSWithSpeechTextAsync(data))
			.then(result => {
				if(result && result.length > 0 && result[0])
					return result[0].SendSMSWithSpeechTextResult;
				throw new CodedError(500, 'پیام ارسال نشد');
			});
	},


	sendSMS(to, text){
		if(process.env.NODE_ENV !== 'production')
			return Promise.resolve(true);

		const data = this.getData({ to, text, isflash: false });
		/* return this.checkCredit()
			// Send message to user
			.then(result => this.createClient(this.getUrlSMS())) */
		return this.createClient(this.getUrlSMS())
			.then(client => client.SendSimpleSMS2Async(data))
			.then(result => {
				if(!result || result.length <= 0 || !result[0])
					throw new CodedError(503, 'ارتباط برقرار نشد');
				return this.checkValue(result[0].SendSimpleSMS2Result);
			})
			.then(result => result > 0 ? result : 0)
			// Check delivery
			.then(smsId => this.getDelivery(smsId));
	},

	/*sendCall(to, text){
		if(process.env.NODE_ENV !== 'production')
			return Promise.resolve(true);

		const data = this.getData({ to, text });
			// Send message to user
		return this.createClient(this.getUrlCall())
			// .then(client => client.
			.then(result => {
				if(!result || !result.data)
					throw new CodedError(503, 'ارتباط برقرار نشد');
				return this.checkValue(result.data.Value);
			})
			.then(result => result > 0 ? result : 0)
			// Check delivery
			.then(smsId => this.getDelivery(smsId));
	}, */

	sendActivation(phone, code){
		let text = `کد فعالسازی: ${code}
مدیریت قرض‌الحسنه فامیلی بانکمون
www.bankemoon.com`;
		let callCode = this.getCallCode(code);
		let call = `کد فعالسازی:
${callCode}
www dot بانْکِمون dot کامْ`;
		return this.send(phone, text, call);
	},

	sendForgotPassword(phone, code){
		let text = `کد فراموشی: ${code}
مدیریت قرض‌الحسنه فامیلی بانکمون
www.bankemoon.com`;
		let callCode = this.getCallCode(code);
		let call = `کد فعالسازی:
${callCode}
www dot بانْکِمون dot کامْ`;
		return this.send(phone, text, call);
	},

	sendWelcome(phone, fullName, code){
		let text = `سلام

شما توسط «${fullName}» به مدیریت قرض‌الحسنه فامیلی بانکمون دعوت شدید

کد فعالسازی: ${code}

www.bankemoon.com`;
		let callCode = this.getCallCode(code);
		let call = `سلام
شما توسط ${fullName} به بانْکِمون دعوت شده‌اید
کد فعالسازی:
${code}
www dot
بانْکِمون
dot کامْ`;
		return this.send(phone, text, call);
	},

	getCallCode(code){
		return code.toString().split('').join(' ');
	}
};
