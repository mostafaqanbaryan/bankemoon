const redis = require('redis');
const util = require('util');
const log = require('../log');

// Create Client
client = redis.createClient({
	password: process.env.REDIS,
});

// Handle error
client.on('error', e => {
	// console.log('####***************3', e);
	log.error(e.message);
});

const obj = {
	get: util.promisify(client.get).bind(client),
	set: util.promisify(client.set).bind(client),
	del: util.promisify(client.del).bind(client),

	hgetall: util.promisify(client.hgetall).bind(client),
	hmset: util.promisify(client.hmset).bind(client),
	hmget: util.promisify(client.hmget).bind(client),
	hset: util.promisify(client.hset).bind(client),
	hget: util.promisify(client.hget).bind(client),
	hdel: util.promisify(client.hdel).bind(client),

	hincrby: util.promisify(client.hincrby).bind(client),

	lpush: util.promisify(client.lpush).bind(client),
	lrange: util.promisify(client.lrange).bind(client),

	ltrim: util.promisify(client.ltrim).bind(client),
	flushdb: util.promisify(client.flushdb).bind(client),
};

// Methods
module.exports = {
	getClient: () => obj,
};

