const axios = require('axios');
const CodedError = require('../Error');
// const soap = require('soap');

const instance = axios.create({
	baseURL: 'https://portal.avanak.ir/webservice3/',
	timeout: 10000,
	headers: { 'Content-Type': 'application/json' }
});


module.exports = {
	getUrl(){
		return 'https://portal.avanak.ir/webservice3.asmx?WSDL';
	},

	getData(obj){
		let data = obj || {};
		data.UserName = '';
		data.Password = '';
		data.serverid = '20';
		return data;
	},

	getCredit(){
		const url = 'GetCredit';
		const data = this.getData();
		return soap.createClientAsync(this.getUrl(), { disableCache: true })
			.then(client => {
				if(!client)
					throw new CodedError(503, 'اتصال SOAP برقرار نشد');
				return client.GetCreditAsync(data);
			})
			.then(result => {
				return
					result &&
					result.length > 0 &&
					result[0] &&
					result[0].hasOwnProperty('GetCreditResult') &&
					result[0].GetCreditResult > 5;
			});
	},

	checkValue(res){
		switch(res){
			case 0:
			case '0':
				throw new CodedError(401, 'ErrorID 0: Unauthorized');
			case 2:
			case '2':
				throw new CodedError(500, 'ErrorID 2: Not enough credit');
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
			/* case 1:
				return true; */
			default:
				return res;
		}
	},

	send(phone, text){
		if(process.env.NODE_ENV === 'test')
			return Promise.resolve(true);

		const data = this.getData({ text, number: phone });
		// return soap.createClientAsync(this.getUrl())
		return instance.post('/QuickSendWithTTS', data)
			/* .then(client => {
				if(!client)
					throw new CodedError(503, 'اتصال SOAP برقرار نشد');
				return client.QuickSendWithTTS(data);
			}) */
			.then(result => {
				// if(!result || result.length < 1 || !result[0].hasOwnProperty('SendSmsResult'))
					// throw new CodedError(500, 'ارسال پیام با مشکل مواجه شد');
				console.log(result);
				return true;
				/* return this.checkValue(result[0].SendSmsResult);
			})
			.then(result => {
				console.log('XXXXX', result);
				return result > 0 ? result : 0; */
			});
	},

	sendActivation(phone, code){
		/* let text = "سامانه قرض‌الحسنه فامیلی بانکمون\n";
		text += "کد فعالسازی: ";
		text += code;
		text += "\nwww.bankemoon.com"; */
		let text = `کد فعالسازی:
6 5 8 5 4 6
www dot بانْکِمون dot کامْ`;
		return this.send(phone, text);
	},

	sendForgotPassword(phone, code){
		/* let text = "سامانه قرض‌الحسنه فامیلی بانکمون\n";
		text += "کد فعالسازی: ";
		text += code;
		text += "\nwww.bankemoon.com"; */
		let text = `کد فراموشی: ${code}
مدیریت قرض‌الحسنه فامیلی بانکمون
www.bankemoon.com`;
		return this.send(phone, text);
	},
};

