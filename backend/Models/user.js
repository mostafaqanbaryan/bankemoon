const CodedError = require('../Error');
const constant	 = require('../constant');
const db				 = require('../db');
const log				 = require('../log');
const cache			 = require('../cache');
const bcrypt		 = require('bcrypt');
const config		 = require('config');
const fs				 = require('fs');
const {
	bcrypt_password_sync,
	sanitize,
	activationCode
}= require('../utils');

// Models
const SMS		= require('./sms');
const Email = require('../Email');

module.exports = {
	add(client, fields, creator_id=0){
		let query = `INSERT INTO ${constant.tables.USERS} (`;

		// hash password
		fields.password = bcrypt_password_sync(fields.password);

		// Update in database
		let args = Object.values(fields).map(value => value ? value.trim().toLowerCase() : null);
		return sanitize.phone(fields.phone)
			.then(phone => {
				fields.phone = phone;
				return (fields.email ? sanitize.email(fields.email) : true);
			})
			.then(email=> {
				if(email !== true)
					fields.email = email;
				return (fields.username ? sanitize.username(fields.username) : true);
			})
			.then(username => {
				if(username !== true)
					fields.username = username;
			})
			// Create query
			.then(() => {
				// Create query base on fields
				query += Object.keys(fields);
				query += ') VALUES (';
				query += Object.values(fields).map((value,i) => `$${i+1}`);

				// Close query for security, I think...
				query += ') RETURNING id;';
			})
			.then(() => client.query('BEGIN'))
			// Check for username duplicate
			.then(result => fields.username ? this.getByUsername(client, fields.username, true) : null)
			// Check for phone duplicate
			.then(result => {
				if(result)
					throw new CodedError(409, 'نام کاربری متعلق به فرد دیگری است');
				return this.getByPhone(client, fields.phone, true);
			})
			// Check for email duplicate
			.then(result => {
				if(result)
					throw new CodedError(409, 'تلفن همراه برای فرد دیگری ثبت شده است');
				return fields.email ? this.getByEmail(client, fields.email, true) : null;
			})
			// Register
			.then(result => {
				if(result)
					throw new CodedError(409, 'ایمیل برای فرد دیگری ثبت شده است');
				return client.query(query, args);
			})
			// Send SMS
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(500, 'عضویت با مشکل مواجه شد');

				let userId = result.rows[0].id;
				if(creator_id)
					return this.sendWelcome(client, userId, fields.phone, creator_id);
				return this.sendActivation(client, userId, fields.phone);
			})
			.then(result => client.query('COMMIT'))
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	sendActivation(client, userId, phone){
		// Send SMS
		const rand = activationCode();
		return this.setOption(client, userId, 'activation-code', rand)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'ثبت کد عضویت با مشکل مواجه شد');
				return SMS.sendActivation(phone, rand);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'ارسال پیام کوتاه با مشکل مواجه شد');
				return true;
			});
	},

	sendWelcome(client, userId, phone, creatorId){
		// Add creator
		const rand = activationCode();
		return this.setOption(client, userId, 'creator_id', creatorId)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'ثبت ایجاد کننده با مشکل مواجه شد');
				return this.setOption(client, userId, 'activation-code', rand)
			})
			// Get Creator
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'ثبت کد عضویت با مشکل مواجه شد');
				return this.getById(client, creatorId);
			})
			// Send SMS
			.then(creator => {
				if(!creator)
					throw new CodedError(404, 'ایجاد کننده یافت نشد');
				return SMS.sendWelcome(phone, creator.first_name + ' ' + creator.last_name, rand);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'ارسال پیام کوتاه با مشکل مواجه شد');
				return true;
			});
	},

	update(client, fields, where){
		let args = [];
		let query = `UPDATE ${constant.tables.USERS} SET `;

		if(fields.password) {
			fields.password = bcrypt_password_sync(fields.password);
		} else {
			delete fields.password;
		}

		// Update in database
		// return fields.phone ? sanitize.phone(fields.phone) : null
		return (fields.phone ? sanitize.phone(fields.phone) : Promise.resolve(null))
			.then(phone => {
				if(phone) fields.phone = phone;
				else delete fields.phone;
				return (fields.email ? sanitize.email(fields.email) : null);
			})
			.then(email => {
				if(email) fields.email = email;
				else delete fields.email;

				// Create query base on fields
				for(let name in fields){
					query += args.length > 0 ? ',' : '';
					query += name + '=$' + (args.length+1);
					args.push(fields[name]);
				}

				// Create query WHERE clause
				if(where){
					query += ' WHERE ';
					let field_len = args.length;
					for(let name in where){
						query += args.length > field_len ? ' AND ' : '';
						query += name + '=$' + (args.length+1);
						args.push(where[name]);
					}
				}

				// Close query for security, I think...
				query += ' RETURNING *;';
				return client.query(query, args);
			})
			.then(res => res && res.rowCount > 0 ? res.rows[0] : null);
	},

	delete(client, uid){
		let args	= [uid];
		let query = `DELETE FROM ${constant.tables.USERS} WHERE id = $1 RETURNING avatar;`;
		const memory = cache.getClient();

		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'حذف کاربر انجام نشد');
				if(result.rows[0].avatar)
					 return fs.unlinkSync(config.avatar.path.user + avatar);
			})
			.then(() => memory.hdel(constant.memory.users.SNAPSHOT, uid))
			.then(() => memory.hdel(constant.memory.users.BADGES, uid))
			.then(() => true);
	},

	activeEmail(client, userId, email){
		const code = activationCode();
		return client.query('BEGIN')
			.then(() => this.setOption(client, userId, 'email-activation', email))
			.then(isCreated => {
				if(!isCreated)
					throw new CodedError(500, 'بروزرسانی ایمیل با مشکل مواجه شد');
				return this.setOption(client, userId, 'email-activation-code', code);
			})
			.then(isCreated => {
				if(!isCreated)
					throw new CodedError(500, 'کد فعالسازی ایجاد نشد');
				return this.getById(client, userId);
			})
			.then(user => {
				if(!user)
					throw new CodedError(500, 'ریافت اطلاعات کاربری با مشکل مواجه شد');
				return Email.activation(user, email, code);
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'ایمیل فعالسازی ارسال نشد');
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	updateEmail(client, userId, code){
		return client.query('BEGIN')
			.then(() => this.getOption(client, userId, 'email-activation-code'))
			.then(optionCode => {
				if(!optionCode)
					throw new CodedError(404, 'کد فعالسازی وجود ندارد');
				if(optionCode !== code)
					throw new CodedError(401, 'کد وارد شده اشتباه است');
				return this.getOption(client, userId, 'email-activation');
			})
			.then(optionEmail => {
				if(!optionEmail)
					throw new CodedError(404, 'ایمیلی ثبت نشده است');
				const where = { id: userId };
				const fields = {
					email: optionEmail,
					email_validate: true,
				};
				return this.update(client, fields, where);
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'قتب ایمیل انجام نشد');
				return this.deleteOption(client, userId, 'email-activation');
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'حذف ایمیل انجام نشد');
				return this.deleteOption(client, userId, 'email-activation-code');
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'حذف کد انجام نشد');
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	updatePassword(client, userId, oldPassword, newPassword){
		let query = `UPDATE ${constant.tables.USERS} SET password=$1 WHERE id=$2;`;
		return client.query('BEGIN')
			.then(() => this.getById(client, userId, true))
			.then(user => {
				if(!user)
					throw new CodedError(404, 'کاربر یافت نشد');
				return bcrypt.compare(oldPassword, user.password);
			})
			.then(result => {
				if(!result)
					throw new CodedError(401, 'رمز عبور فعلی اشتباه است');

				const args = [bcrypt_password_sync(newPassword), userId];
				return client.query(query, args);
			})
			.then(result => {
				if(!result || result.rowCount <= 0)
					throw new CodedError(500, 'بروزرسانی رمز عبور انجام نشد');
				return client.query('COMMIT');
			})
			.catch(err => {
				client.query('ROLLBACK');
				throw err;
			});
	},

	forgotPassword(client, phoneNumber){
		const args = [phoneNumber];
		const rand = activationCode();

		return this.getByPhone(client, phoneNumber)
			// Get user by Phone
			.then(user => {
				if(!user)
					throw new CodedError(404, 'چنین کاربری وجود ندارد');
				const userId = user.id;
				return this.setOption(client, userId, 'activation-code', rand);
			})
			// Send SMS
			.then(isSet => {
				if(!isSet)
					throw new CodedError(500, 'فعالسازی با مشکل مواجه شد');
				return SMS.sendForgotPassword(phoneNumber, rand);
			})
			.then(result => {
				if(!result)
					throw new CodedError(500, 'پیام کوتاه ارسال نشد');
				return true;
			});
	},

	searchUsers(client, key, value){
		let func = () => Promise.reject(new CodedError(415, 'دسته‌ی وارد شده صحیح نیست'));
		if(key === 'id')
			func = this.getById;
		else if(key === 'username')
			func = this.getByUsername;
		else if(key === 'phone')
			func = getByPhone;
		return func(client, value);
	},

	getById(client, uid, returnNull=false){
		let args	= [uid];
		let query =
			`SELECT
				USERS.*,
				CONCAT('0', USERS.phone) AS phone,
				OPT.value AS two_step_verification
			FROM ${constant.tables.USERS} USERS
			LEFT JOIN ${constant.tables.USERSOPT} OPT
				ON OPT.user_id=USERS.id AND OPT.key='2sv'
			WHERE
				USERS.id=$1
			LIMIT 1;`;

		// Search database
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(404, 'کاربر وجود ندارد');
				return result.rows[0];
			})
			.catch(err => {
				if(err.code === 404)
					if(returnNull)
						return null;
				throw err;
			});
	},

	getByEmail(client, email, returnNull=false){
		// email = sanitize.email(email);
		let args	= [email];
		let query = `SELECT *, CONCAT('0', phone) AS phone FROM ${constant.tables.USERS} WHERE email = $1 LIMIT 1;`;

		/* if(!email)
			throw new Error('ایمیل را به صورت صحیح وارد کنید'); */

		// Search database
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(404, 'کاربر وجود ندارد');
				return result.rows[0];
			})
			.catch(err => {
				if(err.code === 404)
					if(returnNull)
						return null;
				throw err;
			});
	},

	getByUsername(client, username, returnNull=false){
		// username = sanitize.username(username);
		username = username && username.toLowerCase();
		let args	= [username];
		let query = `SELECT *, CONCAT('0', phone) AS phone FROM ${constant.tables.USERS} WHERE username = $1 LIMIT 1;`;
		/* if(!username)
			throw new Error('نام کاربری باید حداقل شامل 5 کاراکتر باشد'); */

		// Search database
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(404, 'کاربر وجود ندارد');
				return result.rows[0];
			})
			.catch(err => {
				if(err.code === 404)
					if(returnNull)
						return null;
				throw err;
			});
	},

	getByPhone(client, phone, returnNull=false){
		let args	= [phone];
		let query = `SELECT *, CONCAT('0', phone) AS phone FROM ${constant.tables.USERS} WHERE phone = $1 LIMIT 1;`;

		// Search database
		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(404, 'کاربر وجود ندارد');
				return result.rows[0];
			})
			.catch(err => {
				if(err.code === 404)
					if(returnNull)
						return null;
				throw err;
			});
	},

	/* getBySecurityNumber(client, securityNumber, returnNull=false){
		let args = [securityNumber];
		let query = `SELECT user_id FROM ${constant.tables.USERSOPT} WHERE key='security_number' AND value=$1 LIMIT 1`;

		if(securityNumber.length < 6)
			throw new CodedError(400, 'کد ملی را به صورت صحیح وارد کنید');

		return client.query(query, args)
			.then(result => {
				if(!result || result.rowCount <= 0 || !result.rows[0].id)
					throw new CodedError(404, 'کاربر وجود ندارد');
				return result.rows[0];
			})
			.catch(err => {
				if(err.code === 404)
					if(returnNull)
						return null;
				throw err;
			});
	}, */

	getBadges(client, uid){
		let args	= [uid];
		let badgeKeys =
			`'${constant.users.badge.MESSAGES}',
				'${constant.users.badge.TICKETS}',
				'${constant.users.badge.BANKS}'`;
		let query =
			`SELECT
				key, value::int
			FROM ${constant.tables.USERSOPT} AS BANKSUSERS
			WHERE
				user_id=$1 AND
				key IN (${badgeKeys})
			LIMIT 3;`;

		return client.query(query, args)
			.then(result => {
				let obj = {
					[constant.users.badge.MESSAGES.substr(3)]: 0,
					[constant.users.badge.TICKETS.substr(3)]: 0,
					[constant.users.badge.BANKS.substr(3)]: 0,
				};
				result.rows.forEach(row => {
					obj[row.key.substr(3)] = row.value;
				});
				return obj;
			});
			/* .catch(err => {
				log.error(err);
				return false;
			}); */
	},

	getRole(client, uid){
		const query =
			`SELECT label
			FROM ${constant.tables.USERSOPT} OPT
			INNER JOIN ${constant.tables.ROLES} ROLES
				ON ROLES.id = OPT.value::INT
			WHERE
				OPT.key='${constant.ROLE}' AND
				user_id = $1
			LIMIT 1;`;
		return client.query(query, [uid])
			.then(result => result && result.rowCount > 0 ? result.rows[0].label : null);
	},

	/*
	 * @return @Boolean isSet
	 */
	setOption(client, uid, key, value){
		let args	= [uid, key, value];
		let query =
			`INSERT INTO ${constant.tables.USERSOPT} (user_id, key, value) VALUES ($1, $2, $3)
			ON CONFLICT(user_id, key) DO UPDATE SET value=EXCLUDED.value;`;

		return client.query(query, args)
			.then(result => result.rowCount > 0)
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	getOption(client, uid, key, timeLimit=0){
		let args	= [uid, key];
		let query;
		if(timeLimit)
			query = `SELECT value FROM ${constant.tables.USERSOPT} WHERE
				user_id=$1 AND
				key=$2 AND
				updated_at + INTERVAL '${timeLimit}' SECOND > NOW()
				LIMIT 1;`;
		else
			query = `SELECT value FROM ${constant.tables.USERSOPT} WHERE
				user_id=$1 AND
				key=$2
				LIMIT 1;`;

		return client.query(query, args)
			.then(result => result.rows.length > 0 ? result.rows[0].value : null)
			.catch(err => {
				log.error(err);
				return false;
			});
	},

	deleteOption(client, uid, key){
		let args	= [uid, key];
		let query = `DELETE FROM ${constant.tables.USERSOPT} WHERE user_id=$1 AND key=$2`;

		return client.query(query, args)
			.then(result => result.rowCount > 0)
			.catch(err => {
				log.error(err);
				return false;
			});
	},
};
