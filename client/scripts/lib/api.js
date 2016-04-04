/* global Headers, $ */

/*
* This is used by the service worker and the browser script.
*/

import { getItem, setItem } from 'localforage';
import { fetchNewMessages } from './messages';

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
	readyPromise.then(() => {
		return Promise.all([
			setItem('v1.0-sent-messages', Array.from(sentMessages.entries())),
			setItem('v1.0-recieved-messages', Array.from(receivedMessages.entries())),
			setItem('v1.0-correspondents', Array.from(correspondents.values()))
		]);
	});
}

let readyPromiseResolve;
let readyPromise = new Promise(function (resolve) {
	readyPromiseResolve = resolve;
});

function init() {

	Promise.all([
		getItem('v1.0-sent-messages')
		.then(r => r === null ? [] : r)
		.then(arr => arr.forEach(
			pair => sentMessages.set(pair[0], pair[1])
		))
		.catch(e => console.log(e)),

		getItem('v1.0-recieved-messages')
		.then(r => r === null ? [] : r)
		.then(arr => arr.forEach(
			pair => receivedMessages.set(pair[0], pair[1])
		))
		.catch(e => console.log(e)),

		getItem('v1.0-correspondents')
		.then(r => r === null ? [] : r)
		.then(arr => arr.forEach(
			correspondent => correspondents.add(correspondent)
		))
		.catch(e => console.log(e)),

		getItem('last-correspondent')
		.then(value => $('#emoji__recipient').value = value),
	]).then(() => readyPromiseResolve());
}

function checkForErrors(r) {
	if (!r.ok) {
		return r.json().then(j => {

			// if error in the server
			if (
				window && window.location &&
				j.error === 'No username param'
			) {
				document.body.classList.remove('user-logged-in');
				throw false;
			} else {
				throw Error(j.error);
			}
		}, e => {

			// Error fetching or parsing JSON.
			console.error(e);
			throw Error(e.message);
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
	])
	.then(() => readyPromise)
	.then(() => {
		save();
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
	.then(checkForErrors)
	.then(() => fetchNewMessages());
}

function sendPhoto(username, photo) {
	setItem('last-correspondent', username);
	return fetch('/api/send-message', {
		method: 'POST',
		credentials: 'same-origin',
		headers: jsonHeader,
		body: JSON.stringify({username, message: photo, type: 'photo'})
	})
	.then(checkForErrors)
	.then(() => fetchNewMessages());
}

function setReceiveAnon(value) {
	return fetch(`/api/toggle-receive-anon?anon=${value===true}`, {
		credentials: 'same-origin',
		headers: jsonHeader
	})
	.then(checkForErrors);
}

function queryUser(key) {
	return fetch('/auth/profile', {
		credentials: 'same-origin',
		headers: jsonHeader
	})
	.then(r => r.json())
	.then(r => r.user)
	.then(user => user[key]);
}

export {
	sendSubscriptionToServer,
	setReceiveAnon,
	getAllMessages,
	getMessages,
	sendMesage,
	queryUser,
	sendPhoto,
	save,
	init
};
