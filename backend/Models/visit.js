const constant = require('../constant');
const uaParser = require('ua-parser-js');


visit = {
	addDevice(client, user_agent){
		return Promise.resolve(true);

		/* const query =
			`INSERT INTO ${constant.tables.DEVICES} (os, os_ver, device, browser, browser_ver)
				VALUES ($1::text, $2::integer, $3::text, $4::text, $5::integer)
			ON CONFLICT (os, os_ver, browser, browser_ver, device)
				DO UPDATE SET count=${constant.tables.DEVICES}.count+1;`;
		const ua = uaParser(user_agent);
		const args = [
			ua.os.name ? ua.os.name : 'NA',
			!isNaN(parseInt(ua.os.version)) ? parseInt(ua.os.version) : 0,
			ua.device.type ? ua.device.type : 'NA',
			ua.browser.name ? ua.browser.name : 'NA',
			!isNaN(parseInt(ua.browser.major)) ? parseInt(ua.browser.major) : 0
		];
		return client.query(query, args)
			.then(result => result && result.rowCount > 0); */
	},

	add(client, key, headers){
		return Promise.resolve(true);

		/*const len = 3;
		const keys = `
			'${key}',
			'${constant.visits.TODAY}',
			'${constant.visits.TOTAL}'
			`;
		const query =
			`UPDATE ${constant.tables.OPT}
			SET value=${constant.tables.OPT}.value::BIGINT+1
			WHERE key IN (${keys});`;
		return client.query(query)
			.then(result => {
				if(result.rowCount !== len)
					throw new Error(`همه‌ی سطرها بروز نشدند: ${key} => count: ${result.rowCount}/${len}`);
				return visit.addDevice(client, headers['user-agent']);
			});
			*/
	},

	get(client){
		const keys =
			`'${constant.visits.TODAY}',
			'${constant.visits.YESTERDAY}',
			'${constant.visits.LASTWEEK}',
			'${constant.visits.TOTAL}',
			'${constant.visitors.TODAY}',
			'${constant.visitors.YESTERDAY}',
			'${constant.visitors.LASTWEEK}',
			'${constant.visitors.TOTAL}'`;
		const query = `SELECT key, value FROM ${constant.tables.OPT} WHERE key IN (${keys}) LIMIT ${keys.length};`;
		return client.query(query)
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت اطلاعات با مشکل مواجه شد');

				return result.rows.reduce((obj, row) => {
					obj[row.key] = row.value;
					return obj;
				}, {});
			});
	},
};

module.exports = visit;
