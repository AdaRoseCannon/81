/* global $ */

import {error, notify} from './notify';
import {getAllMessages} from './api';
import {combineEmojis} from './emoji-text-input';
import {scrollMessagesToBottom} from './touch';
import {decompress} from 'ftdatasquasher';

function fetchNewMessages() {

	const noti = notify('Loading Messages', false);
	const messageTarget = $('#emoji__messages');
	getAllMessages().then(function (m) {
		messageTarget.empty();
		m.forEach(function (message) {
			const li = document.createElement('li');
			li.classList.add(message.sent ? 'sent' : 'received');
			li.dataset.timestamp = message.timestamp;
			li.dataset.sender = message.from;

			if (message.type === 'message') {
				if (message.message.constructor !== Array) return;
				li.innerHTML = message.message.map(function (m) {
					return combineEmojis(m);
				}).join('');
				messageTarget.appendChild(li);
			}
			if (message.type === 'photo') {
				const img = document.createElement('img');
				img.src = decompress(message.message);
				img.classList.add('photo');
				li.appendChild(img);
				messageTarget.appendChild(li);
			}
		});
	}).catch(function (e) {
		return error(e.message);
	}).then(function () {
		return noti.remove();
	});
}

function init() {
	fetchNewMessages();
	window.addEventListener('hashchange', function () {
		if (window.location.hash === '#refresh') {
			location.hash = '';
			fetchNewMessages();
		}
	});
}

export {
	init,
	fetchNewMessages
};
