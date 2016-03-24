/* global $, MAKE, twemoji, $$ */

import 'gsap/src/uncompressed/utils/Draggable';
import 'gsap/src/uncompressed/TweenLite';
import 'gsap/src/uncompressed/easing/EasePack';

import customSelect from './lib/custom-select';
import selectablePopup from './lib/selectable-popup';
import addScript from './lib/add-script';
import * as settings from './lib/settings';
import touchInit from './lib/touch';
import pushNotifications from './lib/push-notifications';
import tinycam from './lib/tinycam';

import {
	sendMesage,
	getMessages
} from './lib/api';

Promise.all([
	addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.3.1/build/dirty-dom-lib.min.js').promise,
	addScript('https://twemoji.maxcdn.com/2/twemoji.min.js').promise,
	addScript('https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch,default').promise,
	addScript('/scripts/color-thief.js').promise
]).then(() => {

	function notify(str, timeout = 3000) {
		const li = $('#emoji__notifications').$('<li>' + str + '</li>');
		if (timeout) setTimeout(function () {
			return li.remove();
		}, timeout);
		return li;
	}

	function warn(message, timeout) {
		notify(message, timeout).classList.add('warn');
	}

	function error(message, timeout) {
		notify(message, timeout).classList.add('error');
	}

	function tapOnChar(e) {
		if (e.target !== e.currentTarget) cursorPos = e.target.prevAll().length;
		updateMessageTextInput();
	}

	let cursorPos = 0;
	const textInput = $('#emoji__text-input');
	const message = [];
	function updateMessageTextInput(str) {
		if (cursorPos < 0) cursorPos = 0;
		if (cursorPos > message.length) cursorPos = message.length;
		if (str) {
			message.splice(cursorPos, 0, str + skinToneSelector.dataset.value);
			cursorPos = cursorPos + 1;
		}
		textInput.innerHTML = message.map(m => combineEmojis(m)).join('') + '<span class="spacer"></span>';
		textInput.childNodes[cursorPos].classList.add('cursor');
	}
	$('#emoji__text-input')
	.on('backspace', () => {
		cursorPos--;
		message.splice(cursorPos, 1);
		updateMessageTextInput();
	})
	.on('back-cursor', () => {
		cursorPos--;
		updateMessageTextInput();
	})
	.on('forward-cursor', () => {
		cursorPos++;
		updateMessageTextInput();
	})
	.on('click', tapOnChar);

	$('#emoji__submit')
	.on('click', function () {
		const username = $('#emoji__recipient').value;
		if (username === '') {
			return warn('No User');
		}
		sendMesage(username, message)
		.catch(e => warn(e));

		message.splice(0);
		updateMessageTextInput();
	});

	const skinTone = ['', '🏼', '🏿', '🏽', '🏾', '🏻'];
	const skinToneSelector = $('<ul id="skin-tone-selector">');
	for (const s of skinTone) {
		const selected = s === settings.getItem('skinTone');
		skinToneSelector.appendChild($(`<li data-value='${s}'${selected ? ' data-selected="true"' : ''}>👋${s}</li>`));
	}
	$('#emoji__skin-tone-selector__wrapper').prependChild(skinToneSelector);
	customSelect(skinToneSelector, $('#emoji__options'));
	twemoji.parse(skinToneSelector);

	skinToneSelector.on('change', function (e) {
		const modifier = e.detail.value;
		settings.setItem('skinTone', modifier);
		$$('.emoji__grid-item').forEach(el => {
			el.$('.emoji__emoji').innerHTML = combineEmojis(el.dataset.emoji, modifier);
		});
	});

	function combineEmojis(emoji, skinTone='') {
		const div = MAKE.div();
		div.appendChild(MAKE.html(twemoji.parse(emoji + skinTone)).firstChild);
		return div.innerHTML;
	}

	const subEmojis = [
		['😋', '😎', '😍', '😘', '😗', '😙', '😚', '☺', '😇'],
		['✍', '✋', '✌️', '👐', '👌', '👊', '👏', '👋', '🙋'],
		['👩', '👢', '👵', '👚', '👒', '👡', '👯', '🚺', '👭'],
		['👜', '🚹', '👘', '👖', '👞', '👠', '👢', '👕', '👚', '👒'],
		['😀', '😁', '😂', '😃', '😄', '😅', '😆', '😉', '😊'],
		['😐', '😑', '😶', '😣', '😥', '😮', '😪', '😫', '😴'],
		['😌', '🤓', '😛', '😜', '😝', '☹', '🙁', '😒', '😲'],
		['🖖', '😂', '💩', '😘', '🖕', '🤘', '👊', '🍖', '✌'],
		['👅', '🍑', '💋', '🏩', '💩', '👉', '👌', '🍆', '💦']
	];

	// main emojis is made out of middle emoji
	const mainEmojis = subEmojis.map(e => e[4]);

	const makeGrid = (emojis) => $(`<div class='emoji__grid-wrapper'>
		<span class='emoji__grid-item top left' data-emoji='${emojis[0]}'><span class="emoji__emoji">${combineEmojis(emojis[0], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item top centre' data-emoji='${emojis[1]}'><span class="emoji__emoji">${combineEmojis(emojis[1], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item top right' data-emoji='${emojis[2]}'><span class="emoji__emoji">${combineEmojis(emojis[2], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item middle left' data-emoji='${emojis[3]}'><span class="emoji__emoji">${combineEmojis(emojis[3], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item middle centre' data-emoji='${emojis[4]}'><span class="emoji__emoji">${combineEmojis(emojis[4], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item middle right' data-emoji='${emojis[5]}'><span class="emoji__emoji">${combineEmojis(emojis[5], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item bottom left' data-emoji='${emojis[6]}'><span class="emoji__emoji">${combineEmojis(emojis[6], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item bottom centre' data-emoji='${emojis[7]}'><span class="emoji__emoji">${combineEmojis(emojis[7], skinToneSelector.dataset.value)}</span></span>
		<span class='emoji__grid-item bottom right' data-emoji='${emojis[8]}'><span class="emoji__emoji">${combineEmojis(emojis[8], skinToneSelector.dataset.value)}</span></span>
	</div>`);

	const mainGrid = makeGrid(mainEmojis);
	mainGrid.$$('.emoji__grid-item')
	.map(function (item, i) {

		const subGrid = makeGrid(subEmojis[i]);
		subGrid.dataset.emoji = subEmojis[i][4];
		subGrid.on('emojiSelect', e => updateMessageTextInput(e.detail.emoji));
		item.appendChild(subGrid);
		return subGrid;
	})
	.forEach(selectablePopup);

	$('#emoji__grid').appendChild(mainGrid);
	twemoji.parse(mainGrid);
	twemoji.parse($('#emoji__options-button'));

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

	// Add button interactions
	touchInit();

	// Set up push notification service
	pushNotifications();

	// load new messages
	fetchNewMessages();

	// Push notification camera.
	tinycam();
})
.catch(e => {

	// Script loading errors
	console.error(e);
});
