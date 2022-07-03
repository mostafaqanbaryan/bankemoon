const bunyan = require('bunyan');
const fs		 = require('fs');

// Config file
const config = require('config');
// const title = config.get('TITLE') || 'Bankemoon';
const title = config.TITLE || 'Bankemoon';

// Bunyan initialize
let l;
if(process.env.NODE_ENV === process.env.NODE_TEST)
	l = console;
else
	l = bunyan.createLogger({name: title});

const log = {
	info: msg => {
		l.info(msg);
	},

	warn: msg => {
		l.warn(msg);
	},

	error: msg => {
		l.error(msg);
	},

	save: (name, msg, status) => {
		const folderPath = `/tmp/${title}/`;
		const filePath = folderPath + name + '.log';
		// Create temp
		if(!fs.existsSync(folderPath))
			fs.mkdirSync(folderPath);

		// Create file
		let d = new Date();
		let timestamp =
			d.getFullYear() + '-' +
			(d.getMonth()+1).toString().padStart(2, 0) + '-' +
			d.getDate().toString().padStart(2, 0) + ' ' +
			d.getHours().toString().padStart(2, 0) + ':' +
			d.getMinutes().toString().padStart(2, 0) + ':' +
			d.getSeconds().toString().padStart(2, 0);
		let text = `[${timestamp}] {${status}}  `;
		text += msg.toString();
		text += '\n';
		fs.appendFile(filePath, text, err => {
			// l.warn(msg);
			if(err)
				l.error(err);
		});
	},
};

module.exports = log;
