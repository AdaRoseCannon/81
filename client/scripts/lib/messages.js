/* global $ */

import {error, notify} from './notify';
import {getMessages} from './api';
import {combineEmojis} from './emoji-text-input';

function fetchNewMessages() {

	let lastMessage;

	const noti = notify('Loading Messages', false);
	getMessages().then(function (m) {
		m.forEach(function (message) {
			if (message.message.constructor !== Array) return;
			const li = $('<li class="received" timestamp=' + message.timestamp + ' data-sender="' + message.from + '">' + message.message.map(function (m) {
				return combineEmojis(m);
			}).join('') + '</li>');
			$('#emoji__messages').appendChild(li);
			lastMessage = li;
		});
	}).catch(function (e) {
		return error(e.message);
	}).then(function () {
		return noti.remove();
	});

	if (lastMessage) lastMessage.scrollIntoView();
}

function init() {
	fetchNewMessages();
}

export {
	init,
	fetchNewMessages
};
