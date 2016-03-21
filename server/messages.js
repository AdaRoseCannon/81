const redis = require('./redis');
const getProfileFromHandle = require('./twitter-auth').getProfileFromHandle;

// get the key for the redis store for messages
function genMessagesForId(profile) {
	return 'v1.0.0_messages_for_' + profile.id;
}

function readMessages(user, start, amount) {
	amount = amount || 10;
	start = start || 0;
	return getProfileFromHandle(user)
	.then(profile => genMessagesForId(profile))
	.then(key => redis.redisLRange(key, -(amount + start), -start));
}

function pushMessage(user, string) {
	return getProfileFromHandle(user)
	.then(profile => genMessagesForId(profile))
	.then(key => redis.redisLPush(key, string));
}

module.exports = {
	readMessages,
	pushMessage
};
