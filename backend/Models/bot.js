const CodedError = require('../Error');
const constant	 = require('../constant');
const db				 = require('../db');
const cache			 = require('../cache');
const {
	handle_error
} = require('../utils');

module.exports = {
	getBanks(client, page=1, limit=10){
		const offset = (page-1) * limit;
		const query =
			`SELECT 
				BANKS.created_at,
				BANKS.id,
				BANKS.name,
				BANKS.username,
				BANKS.avatar,
				SEARCH.full_name,
				SEARCH.phone,
				USERCOUNT.value AS user_count,
				DESCR.value AS description
			FROM ${constant.tables.BANKS} BANKS
			INNER JOIN ${constant.tables.BANKSOPT} USERCOUNT
				ON USERCOUNT.bank_id = BANKS.id AND USERCOUNT.key = '${constant.banks.USER_COUNT}'
			LEFT JOIN ${constant.tables.BANKSUSERSSEARCH} SEARCH
				ON SEARCH.bank_id=BANKS.id AND SEARCH.role='${constant.role.CREATOR}'
			LEFT JOIN ${constant.tables.BANKSOPT} DESCR
				ON DESCR.bank_id = BANKS.id AND DESCR.key = 'description'
			ORDER BY
				BANKS.created_at DESC,
				BANKS.id DESC
			LIMIT ${limit}
			OFFSET ${offset};`;
		return client.query(query)
			.then(result => {
				if(!result)
					throw new CodedError(500, 'دریافت اطلاعات بانک با مشکل مواجه شد');
				return result.rows;
			});
	},
};
