/* global $, twemoji, MAKE */

import {sendMesage} from './api';
import {warn} from './notify';

let cursorPos = 0;
const message = [];

function combineEmojis(emoji, skinTone='') {
	const div = MAKE.div();
	div.appendChild(MAKE.html(twemoji.parse(emoji + skinTone)).firstChild);
	return div.innerHTML;
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
}

export {
	combineEmojis,
	updateMessageTextInput,
	init
}
