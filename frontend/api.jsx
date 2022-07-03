import axios from 'axios';


class API{
	static isSucceed(obj){
		return obj.status === 'success';
	}

	static isCanceled(obj){
		return obj.status === 'canceled';
	}

	static isLimited(obj){
		return obj.status === 'limited';
	}

	static isUnauth(obj){
		return obj.code === 401;
	}

	static isNetworkError(obj){
		return obj.code === 500;
	}

	static Result(cb, promise){
		return promise
			.then(result => {
				if(API.isNetworkError(result) && typeof cb.error  === 'function')
					return cb.error(result);
				else if(API.isUnauth(result) && typeof cb.unAuth  === 'function')
					return cb.unAuth ? cb.unAuth(result) : cb.error(result);
				else if(API.isSucceed(result) && typeof cb.succeed  === 'function')
					return cb.succeed(result);
				else if(API.isLimited(result) && typeof cb.limited  === 'function')
					return cb.limited ? cb.limited(result) : cb.error(result);
				else if(!API.isCanceled(result))
					return cb.error(result);
			})
			.catch(err => {
				return cb.error(err);
			});
	}

	constructor(){
		this.tokens = [];
		this.instance = axios.create({
			baseURL: 'http://api.localhost:8000',
			timeout: 20000,
			// onDownloadProgress: handleProgress,
			// onUploadProgress: handleProgress,
			// data: {}
		});
	}

	token(key){
		const ct = axios.CancelToken;
		const source = ct.source();
		key = key ? key : Math.random();
		this.tokens[key] = source;
		return source.token;
	}

	cancel(key=null){
		if(key === null){
			this.cancelAll();
		}else{
			this.cancelByKey(key);
		}
	}

	cancelAll(){
		for(let key in this.tokens)
			this.tokens[key].cancel();
		this.tokens = {};
	}

	cancelByKey(key){
		if(this.tokens.hasOwnProperty(key)){
			this.tokens[key].cancel();
			delete this.tokens[key];
		}
	}

	get(obj){
		this.cancelByKey(obj.key);
		const token = this.token(obj.key);
		const url = obj.url;
		const params = obj.data ? obj.data : {};
		const headers = getHeaders(obj.serverSide);
		return this.instance.get(url, {
			params,
			headers, 
			cancelToken: token,
			})
			.then(res => this.handleSuccess(obj, res))
			.catch(err => this.handleError(obj, err));
	}

	post(obj){
		this.cancelByKey(obj.key);
		const token = this.token(obj.key);
		const data = getData(obj);
		const headers = getHeaders(obj.serverSide);
		return this.instance.post(obj.url, data, {
			headers,
			cancelToken: token
		})
			.then(res => this.handleSuccess(obj, res))
			.catch(err => this.handleError(obj, err));
	}

	patch(obj){
		this.cancelByKey(obj.key);
		const token = this.token(obj.key);
		const data = getData(obj);
		const headers = getHeaders(obj.serverSide);
		return this.instance.patch(obj.url, data, {
			headers,
			cancelToken: token
		})
			.then(res => this.handleSuccess(obj, res))
			.catch(err => this.handleError(obj, err));
	}

	put(obj){
		this.cancelByKey(obj.key);
		const token = this.token(obj.key);
		const data = getData(obj);
		const headers = getHeaders(obj.serverSide);
		return this.instance.put(obj.url, data, {
			headers,
			cancelToken: token
		})
			.then(res => this.handleSuccess(obj, res))
			.catch(err => this.handleError(obj, err));
	}

	file(obj){
		this.cancelByKey(obj.key);
		const token = this.token(obj.key);
		const headers = getHeaders(obj.serverSide);
		const data = obj.hasOwnProperty('formData') ? obj.formData : new FormData();
		data.append('file', obj.file);
		delete headers['Content-Type'];
		return this.instance.put(obj.url, data, {
			headers,
			cancelToken: token
		})
			.then(res => this.handleSuccess(obj, res))
			.catch(err => this.handleError(obj, err));
	}

	delete(obj){
		this.cancelByKey(obj.key);
		const token = this.token(obj.key);
		const url = obj.url;
		const params = obj.data ? obj.data : {};
		const headers = getHeaders(obj.serverSide);
		/* let data = '';
		if(obj.data)
			url += '/?' + encodeData(obj.data); */

		return this.instance.delete(url, {
			params,
			headers,
			cancelToken: token
			})
			.then(res => this.handleSuccess(obj, res))
			.catch(err => this.handleError(obj, err));
	}

	getCaptcha(obj){
		const url = '/captcha';
		return this.get({
			url,
			key: obj.key
		}).then(res => {
			return res;
		})
			.catch(err => {
				if(this.isLimited(err))
					return err;
				return err.response;
			});
	}

	handleSuccess(obj, res){
		// Prevenet cancelation after finishing the job
		if(obj.key)
			delete this.tokens[obj.key];
		return res && res.data;
	}

	handleError(obj, err){
		// Prevenet cancelation after finishing the job
		const code = err.response ? err.response.status : 500;
		if(obj.key)
			delete this.tokens[obj.key];

		if(err && err.message === 'Network Error')
			return {
				code: 503, //Service unavailable
				status: 'error',
				message: 'ارتباط با سرور برقرار نشد'
			};

		if(axios.isCancel(err))
			return {
				code: 408, //Timeout
				status: 'canceled',
				message: 'عملیات توسط کاربر لغو شد'
			};

		if(code === 500){
			let message = '';
			if(err.response && err.response.hasOwnProperty('data'))
				message = err.response.data.message;
			else if(err.response && err.response.hasOwnProperty('message'))
				message = err.response.message;
			else
				message = err.message;
			return {
				code, // Internal server error
				message,
				status: 'error',
			};
		}

		let data = err.response.data;

		if(err && err.response && API.isLimited(err.response.data)) {
			err.response.data.timeout = err.response.headers['retry-after'];
			data.code = 429;
		}else{
			data.code = err.response.status;
		}



		return err && err.response && err.response.data;
	}
}


let getHeaders = (serverSide=false) => {
	if(!serverSide){
		const sessionId = window.localStorage.getItem('sessionId') || window.sessionStorage.getItem('sessionId');
		const userId = window.localStorage.getItem('userId') || window.sessionStorage.getItem('userId');
		return {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + sessionId,
			'User-ID': userId
		};
	}
	return {
		'Content-Type': 'application/json',
	};
};

let encodeData = obj => {
	return Object.keys(obj).map(key => {
		return [key, obj[key]].map(encodeURIComponent).join('=');
	});
};

let getData = obj => {
	if(obj.formData)
		return formDataToJson(obj);
	const json = {};
	obj.jsonData && Object.keys(obj.jsonData).forEach(key => {
		const value = obj.jsonData[key];
		if(value && (value > 0 || value.trim() !== '')) {
			json[key] = obj.jsonData[key];
		}
	});
	return json;
};

let formDataToJson = obj => {
	let formData = obj.formData;
	let json = '';
	json = {};
	formData.forEach((value, key) => {
		if(value && (value > 0 || value.trim() !== ''))
			json[key] = value;
	});
	return json;
};

let sanitizeValue = value => {
	// String
	if(value.hasOwnProperty('replace')){
		return value.replace('"', '\"');
	}
	// File
	else{
		if(value.length > 0)
			return value[0];
		else
			return null;
	}
};

export default API;
