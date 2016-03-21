const REDIS = require('redis');
const denodeify = require('denodeify');
const redis = (function () {
	if (process.env.REDISTOGO_URL) {
		const rtg = require('url').parse(process.env.REDISTOGO_URL);
		const redis = REDIS.createClient(rtg.port, rtg.hostname);

		redis.auth(rtg.auth.split(':')[1]);
		return redis;
	} else {
	 	return REDIS.createClient();
	}
}());

module.exports = {
	redisGet: denodeify(redis.get).bind(redis),
	redisSet: denodeify(redis.set).bind(redis)
};
