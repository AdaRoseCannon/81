/* global $, $$, Draggable, TweenLite */

import {error, notify} from './notify';
import {getAllMessages} from './api';
import {combineEmojis, isCombinableEmojis} from './emoji-text-input';
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

function fetchNewMessages({
	silent,
	cached = false
} = {}) {

	const shareWrapper = $('#emoji__share-wrapper');

	function handleClick(e) {

		if (document.body.classList.contains('post-select')) {
			e.currentTarget.classList.toggle('selected');
			const selectedEls = $$('.selected');
			const emojiEls = selectedEls.filter(el => !el.$('img.photo'));
			shareWrapper.fire('update', {
				text: emojiEls.map(el => el.dataset.message).join('\n'),
				postids: selectedEls.map(el => el.dataset.id)
			});
		} else {
			let otherParty;
			if (e.currentTarget.classList.contains('sent')) {
				otherParty = e.currentTarget.dataset.recipient;
			}
			if (e.currentTarget.classList.contains('received')) {
				otherParty = e.currentTarget.dataset.sender;
			}
			if (otherParty === '@AnonymousUser') return;
			if (otherParty) {
				$('#emoji__recipient').value = otherParty;
			}
		}
	}

	let noti;
	if (silent !== true) {
		noti = notify('Checking for new Messages', false);
	}
	const messageTarget = $('#emoji__messages');
	return getAllMessages(cached)
	.then(function (m) {
		messageTarget.empty();
		m.forEach(function (message) {

			if (message.hidden) return;

			const li = document.createElement('li');
			li.classList.add(message.sent ? 'sent' : 'received');
			li.dataset.timestamp = message.timestamp;
			li.dataset.id = message.messageId;

			if (message.from && message.from !== '@AnonymousUser') {
				li.dataset.sender = message.from;
			}
			li.on('click', handleClick);
			li.dataset.recipient = message.to;

			if (message.type === 'message') {
				if (message.message.constructor !== Array) return;
				let messageData = '';
				li.innerHTML = message.message.map(function (m) {
					if (isCombinableEmojis(m)) {
						messageData = messageData + m;
					} else {
						messageData = messageData + m[0];
					}
					return combineEmojis(m);
				}).join('');
				li.dataset.message = messageData;
				messageTarget.appendChild(li);
			}
			if (message.type === 'photo') {
				rebuildImage(message.message, function (img) {
					img.classList.add('photo');
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
	let lastY = 0;

	let pressTimeout = -1;
	const draggableMessage = Draggable.create(messagesEl, {
		type:'y',
		bounds: messagesEl.parentNode,
		edgeResistance:0.65,
		onDragStart: function () {
			this.target.style.transition = 'initial';
		},
		onDrag: function () {
			if (this.isDragging) {
				clearTimeout(pressTimeout);
				lastY = this.y;
			}
			this.target.classList.toggle('restart-prompt', lastY <= draggableMessage.minY - 100);
		},
		onDragEnd: function () {
			this.target.style.transition = '';
			dragEnd();
		},
		onPress: function () {
			pressTimeout = setTimeout(() => {
				if (!document.body.classList.contains('post-select')) {
					document.body.classList.add('post-select');
					if (navigator.vibrate) {
						navigator.vibrate(100);
					}
				}
			}, 600);
		},
		onRelease: () => {
			clearTimeout(pressTimeout);
		}
	})[0];

	function dragEnd() {
		if (lastY <= draggableMessage.minY - 100) {
			fetchNewMessages();
		}
		draggableMessage.target.classList.remove('restart-prompt');
	}

	let draggableMessageTimeout;
	messagesEl.parentNode.on('mousewheel', function (e) {
		draggableMessage.target.style.transition = 'initial';
		draggableMessage.update();
		TweenLite.set(draggableMessage.target, {y: draggableMessage.y + e.wheelDelta/2});
		lastY = draggableMessage.y + e.wheelDelta/2;
		clearTimeout(draggableMessageTimeout);
		draggableMessageTimeout = setTimeout(() => {
			draggableMessage.target.style.transition = '';
			draggableMessage.update();
			dragEnd();
			draggableMessage.applyBounds();
			draggableMessage.target.classList.remove('restart-prompt');
		}, 500);
	});

	window.on('resize', () => {
		draggableMessage.update();
	});

	fetchNewMessages({
		silent: true
	})
	.catch(() => fetchNewMessages({
		silent: true,
		cached: true
	}));
	window.addEventListener('hashchange', function () {
		if (window.location.hash === '#refresh') {
			location.hash = '';
			fetchNewMessages({
				silent: true
			});
		}
	});
}

export {
	init,
	fetchNewMessages
};
