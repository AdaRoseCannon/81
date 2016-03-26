/* global Headers, $ */

/*
* This is used by the service worker and the browser script.
*/

import { getItem, setItem } from 'localforage';

const jsonHeader = new Headers({
	'Content-Type': 'application/json',
	'Accept': 'application/json'
});

const sentMessages = new Map();
const receivedMessages = new Map();
const correspondents = new Set();

sentMessages.upToDate = false;
receivedMessages.upToDate = false;

function save() {
	return Promise.all([
		setItem('sent-messages', JSON.stringify(Array.from(sentMessages.entries))),
		setItem('recieved-messages', JSON.stringify(Array.from(receivedMessages.entries))),
		setItem('correspondents', JSON.stringify(Array.from(correspondents.values)))
	]);
}

function init() {

	window.addEventListener('unload', save);

	getItem('sent-messages')
	.then(value => JSON.parse(value))
	.then(arr => arr.forEach(
		pair => sentMessages.set(pair[0], pair[1])
	))
	.catch(e => console.log(e));

	getItem('recieved-messages')
	.then(value => JSON.parse(value))
	.then(arr => arr.forEach(
		pair => receivedMessages.set(pair[0], pair[1])
	))
	.catch(e => console.log(e));

	getItem('correspondents')
	.then(value => JSON.parse(value))
	.then(arr => arr.forEach(
		correspondent => correspondents.add(correspondent)
	))
	.catch(e => console.log(e));

	getItem('last-correspondent')
	.then(value => $('#emoji__recipient').value = value);
}

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
			correspondents.add(m.from);
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
	setItem('last-correspondent', username);
	return fetch('/api/send-message', {
		method: 'POST',
		credentials: 'same-origin',
		headers: jsonHeader,
		body: JSON.stringify({username, message})
	})
	.then(checkForErrors);
}

function sendPhoto(username, photo) {
	setItem('last-correspondent', username);
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
	sendPhoto,
	init
};
