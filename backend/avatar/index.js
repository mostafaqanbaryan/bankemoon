const db						 = require('../db');
const {handle_error} = require('../utils');
const config				 = require('config');
const constant			 = require('../constant');

// Bring in models
const User = require('../Models/user');
const Bank = require('../Models/bank');

/* function adorable(uid){
	return `https://api.adorable.io/avatars/128/${uid}@${config.get('TITLE')}.png`;
} */

module.exports = {
	getUserAvatar(client, uid){
		return User.getOption(client, uid, constant.options.AVATAR)
			.then(avatar => {
				if(avatar)
					return avatar;
				// else
					// return adorable(uid);
			})
			.catch(err => handle_error(err.message));
	},

	/* getBankAvatar(client, bid){
		return Bank.getOption(client, bid, constant.options.AVATAR)
			.then(avatar => {
				if(avatar)
					return avatar;
				else
					return adorable('b'+bid);
			})
			.catch(err => handle_error(err.message));
	}, */

};
