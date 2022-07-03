function CodedError(code, message, fileName, lineNumber) {
	var instance = new Error(message, fileName, lineNumber);
	instance.code = code;
	Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
	if (Error.captureStackTrace) {
		Error.captureStackTrace(instance, CodedError);
	}
	return instance;
}

CodedError.prototype = Object.create(Error.prototype, {
	constructor: {
		value: Error,
		enumerable: false,
		writable: true,
		configurable: true
	}
});

if (Object.setPrototypeOf){
	Object.setPrototypeOf(CodedError, Error);
} else {
	CodedError.__proto__ = Error;
}

module.exports = CodedError;
