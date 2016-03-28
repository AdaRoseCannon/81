/* global $, Draggable, TweenLite */

import {error, notify} from './notify';
import {getAllMessages} from './api';
import {combineEmojis} from './emoji-text-input';
import {decompress} from 'ftdatasquasher';


// decompress and blow up the image.
function rebuildImage(str, callback) {
	const dataUri = decompress(str);
	const canvas = document.createElement('canvas');
	canvas.classList.add('photo');
	canvas.width = canvas.height = 192;
	const context = canvas.getContext('2d');
	context.mozImageSmoothingEnabled = false;
	context.webkitImageSmoothingEnabled = false;
	context.msImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;
	const img = document.createElement('img');
	img.src = dataUri;
	img.once('load', function () {
		context.drawImage(img, 0, 0, 64, 64, 0, 0, 192, 192);
		img.src = canvas.toDataURL();
		callback(img);
	});
}

function populateToField(e) {
	let otherParty;
	if (e.currentTarget.classList.contains('sent')) {
		otherParty = e.currentTarget.dataset.recipient;
	}
	if (e.currentTarget.classList.contains('received')) {
		otherParty = e.currentTarget.dataset.sender;
	}
	if (otherParty) {
		$('#emoji__recipient').value = otherParty;
	}
}

function fetchNewMessages({
	silent,
	cached = false
}) {

	let noti;
	if (silent !== true) {
		noti = notify('Loading Messages', false);
	}
	const messageTarget = $('#emoji__messages');
	return getAllMessages(cached)
	.then(function (m) {
		messageTarget.empty();
		m.forEach(function (message) {
			const li = document.createElement('li');
			li.classList.add(message.sent ? 'sent' : 'received');
			li.dataset.timestamp = message.timestamp;
			li.dataset.sender = message.from;
			li.dataset.recipient = message.to;

			li.on('click', populateToField);

			if (message.type === 'message') {
				if (message.message.constructor !== Array) return;
				li.innerHTML = message.message.map(function (m) {
					return combineEmojis(m);
				}).join('');
				messageTarget.appendChild(li);
			}
			if (message.type === 'photo') {
				rebuildImage(message.message, function (img) {
					li.appendChild(img);
				});
				messageTarget.appendChild(li);
			}
		});
	}).catch(function (e) {
		if (e.message) {
			return error(e.message);
		}
	}).then(function () {
		if (noti) {
			return noti.remove();
		}
	});
}

function init() {

	const messagesEl = $('#emoji__messages');
	const draggableMessage = Draggable.create(messagesEl, {
		type:'y',
		bounds: messagesEl.parentNode,
		edgeResistance:0.65,
		onDragStart: function () {
			this.target.style.transition = 'initial';
		},
		onDragEnd: function () {
			dragEnd();
			this.target.style.transition = '';
		}
	})[0];

	function dragEnd() {
		// messagesEl.classList.remove('restart-prompt');
		draggableMessage.update();
		if (draggableMessage.y <= draggableMessage.minY - 20) {
			fetchNewMessages('Checking for Updates.');
		}
	}

	window.on('resize', () => {
		draggableMessage.update();
	});

	let draggableMessageTimeout;
	messagesEl.on('mousewheel', function (e) {
		draggableMessage.update();
		TweenLite.set(draggableMessage.target, {y: draggableMessage.y + e.wheelDelta});
		clearTimeout(draggableMessageTimeout);
		draggableMessageTimeout = setTimeout(() => {
			dragEnd();
			draggableMessage.applyBounds();
		}, 500);
	});

	fetchNewMessages({
		silent: true
	})
	.then(() => fetchNewMessages({
		silent: true,
		cached: true
	}));
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
