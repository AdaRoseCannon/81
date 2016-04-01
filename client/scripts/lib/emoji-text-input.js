/* global $, twemoji, MAKE */

import {sendMesage} from './api';
import {warn} from './notify';
import {showGrid} from './touch';

let cursorPos = 0;
const message = [];

function combineEmojis(emoji, skinTone='') {
	const imgString = twemoji.parse(emoji + skinTone);
	const foundImg = imgString.match(/<img[^>]+>/gi);
	if (!foundImg) return emoji;
	return foundImg[0];
}

function isCombinableEmojis(emoji, skinTone='') {
	return twemoji.parse(emoji + skinTone).match(/<img/gi).length === 1;
}

function tapOnChar(e) {
	if (e.target !== e.currentTarget) cursorPos = e.target.prevAll().length;
	updateMessageTextInput();
}

function updateMessageTextInput(str) {
	const textInput = $('#emoji__text-input');
	if (cursorPos < 0) cursorPos = 0;
	if (cursorPos > message.length) cursorPos = message.length;
	if (str) {
		message.splice(cursorPos, 0, str);
		cursorPos = cursorPos + 1;
	}
	textInput.innerHTML = message.map(m => combineEmojis(m)).join('') + '<span class="spacer"></span>';
	textInput.childNodes[cursorPos].classList.add('cursor');
}

function init() {
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

	$('#emoji__text-input').on('click', e => {
		e.stopPropagation();
		$('#emoji__text-input-focsable').focus();
		showGrid(true);
	});

	$('#emoji__text-input-focsable').on('keydown', e => {
		const key = e.keyCode || e.charCode;
		let preventDefault = false;
		if ( key === 8 || key === 46 ){
			preventDefault = true;
			$('#emoji__text-input').fire('backspace');
		}
		if (key === 37) {
			preventDefault = true;
			$('#emoji__text-input').fire('back-cursor');
		}
		if (key === 39) {
			preventDefault = true;
			$('#emoji__text-input').fire('forward-cursor');
		}
		if (preventDefault) {
			e.preventDefault();
			return false;
		}
	});

	$('#emoji__text-input-backspace').on('click', e => {
		$('#emoji__text-input').fire('backspace');
		e.preventDefault();
		e.stopPropagation();
		$('#emoji__text-input-focsable').focus();
	});
}

export {
	combineEmojis,
	isCombinableEmojis,
	updateMessageTextInput,
	init
}
