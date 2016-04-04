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
	amount = Number(amount || 10);
	start = Number(start || 0);
	return getProfileFromHandle(user)
	.then(profile => keyFunc(profile))
	.then(key => redis.redisLRange(key, start, start + amount - 1))
	.then(arr => Promise.all(arr.map(key => redis.redisHGet(genMessagesHashKey(), key))))
	.then(arr => arr.filter(a => a!==null));
}

function readSingleMessage(key) {
	return redis.redisHGet(genMessagesHashKey(), key)
	.then(response => JSON.parse(response));
}

function readIncomingMessages(user, start, amount) {
	return readMessages(user, start, amount, genMessagesSentToId);
}

function readOutgoingMessages(user, start, amount) {
	return readMessages(user, start, amount, genMessagesSentFromId);
}

function pushMessage(toUser, fromUser, messageObject) {
	fromUser = fromUser || '@AnonymousUser';
	const messageId = fromUser + '_'+ Date.now();

	if (messageObject === undefined) return Promise.reject(Error('No Message'));
	if (typeof messageObject !== 'object') return Promise.reject(Error('Server Error - Message needs to be an object'));

	messageObject.messageId = messageId;

	return Promise.all([getProfileFromHandle(fromUser), getProfileFromHandle(toUser)])
	.then(details => {
		if (fromUser === '@AnonymousUser' && details[1].receiveAnon !== true) {
			throw Error(toUser + ' cannot receive anonymous messages.');
		}
		return {
			messageHashTableKey: genMessagesHashKey(),
			fromUserDetails: details[0],
			fromUser: genMessagesSentFromId(details[0]),
			toUser: genMessagesSentToId(details[1])
		};
	})
	.then(keys => {

		messageObject.from = keys.fromUserDetails.username;
		messageObject.fromDisplayName = keys.fromUserDetails.displayName;
		return redis.redisHSet(keys.messageHashTableKey, messageId, JSON.stringify(messageObject))
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
	pushMessage,
	readSingleMessage
};
