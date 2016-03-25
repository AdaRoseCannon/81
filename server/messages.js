const redis = require('./redis');
const getProfileFromHandle = require('./twitter-auth').getProfileFromHandle;


// A list of message hashes sent to the user
function genMessagesSentFromId(profile) {
	return 'v1.2.0_messages_from_' + profile.id;
}

// A list of message hashes sent to the user
function genMessagesSentToId(profile) {
	return 'v1.2.0_messages_for_' + profile.id;
}

// A hash of all messages
function genMessagesHashKey() {
	return 'v1.2.0_messages_hash_table';
}

function readMessages(user, start, amount, keyFunc) {
	keyFunc = keyFunc || genMessagesSentToId;
	amount = amount || 10;
	start = start || 1;
	return getProfileFromHandle(user)
	.then(profile => keyFunc(profile))
	.then(key => redis.redisLRange(key, -((amount - 1) + start), -start))
	.then(arr => Promise.all(arr.map(key => redis.redisHGet(genMessagesHashKey(), key))))
	.then(arr => arr.filter(a => a!==null));
}

function readIncomingMessages(user, start, amount) {
	return readMessages(user, start, amount, genMessagesSentToId);
}

function readOutgoingMessages(user, start, amount) {
	return readMessages(user, start, amount, genMessagesSentFromId);
}

function pushMessage(toUser, fromUser, string) {
	fromUser = fromUser || '@AnonymousUser';
	const messageId = fromUser + '_'+ Date.now();

	if (string === undefined) return Promise.reject(Error('No Message'));
	return Promise.all([getProfileFromHandle(fromUser), getProfileFromHandle(toUser)])
	.then(details => ({
		messageHashTableKey: genMessagesHashKey(),
		fromUser: genMessagesSentFromId(details[0]),
		toUser: genMessagesSentToId(details[1])
	}))
	.then(keys => {
		return redis.redisHSet(keys.messageHashTableKey, messageId, string)
		.then(() => Promise.all([
			redis.redisLPush(keys.fromUser, messageId),
			redis.redisLPush(keys.toUser, messageId)
		]))
		.then(() => messageId);
	});
}

module.exports = {
	readIncomingMessages,
	readOutgoingMessages,
	pushMessage
};
