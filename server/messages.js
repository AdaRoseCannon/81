const redis = require('./redis');
const getProfileFromHandle = require('./twitter-auth').getProfileFromHandle;

// get the key for the redis store for messages
function genMessagesForId(profile) {
	return 'v1.0.0_messages_for_' + profile.id;
}

function readMessages(user) {
	getProfileFromHandle(user)
	.then(profile => genMessagesForId(profile))
	.then(key => redis.redisLRange(key, -100, 0));
}

function pushMessage(user, string) {
	getProfileFromHandle(user)
	.then(profile => genMessagesForId(profile))
	.then(key => redis.redisLPUSH(key, string));
}

module.exports = {
	readMessages,
	pushMessage
}
