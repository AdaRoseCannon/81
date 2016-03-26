/* global Headers */

const jsonHeader = new Headers({
	'Content-Type': 'application/json',
	'Accept': 'application/json'
});

const sentMessages = new Map();
const receivedMessages = new Map();
sentMessages.upToDate = false;
receivedMessages.upToDate = false;

function checkForErrors(r) {
	if (!r.ok) {
		return r.json().then(j => {
			throw Error(j.error);
		});
	} else {
		return r;
	}
}


// Update the server with our subscription details
function sendSubscriptionToServer(subscription) {

	// make fetch request with cookies to get user id.
	return fetch(`/api/subscribe?sub=${
		encodeURIComponent(
			JSON.stringify(
				subscription.toJSON()
			)
		)}`, {
		credentials: 'same-origin'
	})
	.then(checkForErrors);
}

// get messages from the server
function getMessages({start, amount, cache, sent} = {}) {
	const map = sent ? sentMessages : receivedMessages;
	return fetch(`/api/get${sent ? '-sent' : ''}-messages?start=${start || 0}&amount=${amount || 10}${cache ? '&sw-cache' : ''}`, {
		method: 'POST',
		credentials: 'same-origin',
		headers: jsonHeader
	})
	.then(checkForErrors)
	.then(r => r.json())
	.then(json => {

		// need to maintain two of these one for sent and one for recieved
		map.upToDate = false;
		json.forEach(m => {
			m.sent = !!sent;
			if (map.has(m.messageId)) {
				map.upToDate = true;
			}
			map.set(m.messageId, m);
		});

		// store in idb then return
		return json.filter(m => typeof m === 'object');
	});
}

/*
* Fetch messages.
*/
function getAllMessages(cached) {
	return Promise.all([
		(cached ? Promise.resolve([]) : getMessages()),
		(cached ? Promise.resolve([]) : getMessages({sent: true})),
	]).
	then(() => {
		const sent = Array.from(sentMessages.values());
		const received = Array.from(receivedMessages.values());
		return sent.concat(received).sort((a,b) => b.timestamp - a.timestamp);
	});
}

function sendMesage(username, message) {
	return fetch('/api/send-message', {
		method: 'POST',
		credentials: 'same-origin',
		headers: jsonHeader,
		body: JSON.stringify({username, message})
	})
	.then(checkForErrors);
}

function sendPhoto(username, photo) {
	return fetch('/api/send-message', {
		method: 'POST',
		credentials: 'same-origin',
		headers: jsonHeader,
		body: JSON.stringify({username, message: photo, type: 'photo'})
	})
	.then(checkForErrors);
}

export {
	sendSubscriptionToServer,
	getAllMessages,
	getMessages,
	sendMesage,
	sendPhoto
};
