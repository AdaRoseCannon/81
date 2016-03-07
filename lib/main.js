'use strict';
/* global $, MAKE, twemoji, $$ */

import customSelect from './lib/custom-select';
import selectablePopup from './lib/selectable-popup';
import addScript from './lib/add-script';


Promise.all([
	addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.1.3/build/dirty-dom-lib.min.js').promise,
	addScript('https://twemoji.maxcdn.com/2/twemoji.min.js').promise,
]).then(() => {

	let cursorPos = 0;
	const textInput = $('#emoji__text-input');
	const message = [];
	function setChar(str) {
		message[cursorPos] = str;
		textInput.empty();

		// only grab the first el because the second would be the unused modifier
		message
		.map(m => MAKE.html(twemoji.parse(m + skinToneSelector.dataset.value)).firstChild)
		.forEach(el => textInput.appendChild(el));
		cursorPos = (cursorPos + 1) % 3;
	}

	const skinTone = ['', '🏼', '🏿', '🏽', '🏾', '🏻'];
	const skinToneSelector = document.createElement('ul');
	for (const s of skinTone) {
		skinToneSelector.appendChild(MAKE.html(`<li data-value='${s}'>👋${s}</li>`));
	}
	$('#emoji__skin-tone-selector__wrapper').prependChild(skinToneSelector);
	customSelect(skinToneSelector);
	twemoji.parse(skinToneSelector);

	skinToneSelector.on('change', function (e) {
		const modifier = e.detail.value;
		$$('.emoji__grid-item').forEach(el => {
			el.textContent = el.dataset.emoji + modifier;
		});
		twemoji.parse(mainGrid);
		$$('.emoji__grid-item img + img').forEach(el => el.remove());
	});

	const subEmojis = [
		['😋', '😎', '😍', '😘', '😗', '😙', '😚', '☺', '😇'],
		['✍', '✋', '✌️', '👐', '👌', '👊', '👏', '👋', '🙋'],
		['👩', '👢', '👵', '👚', '👒', '👡', '👯', '🚺', '👭'],
		['👜', '🚹', '👘', '👖', '👞', '👠', '👢', '👕', '👚', '👒'],
		['😀', '😁', '😂', '😃', '😄', '😅', '😆', '😉', '😊', '😓', '😔', '😕', '😖', '🙃', '😷', '🤒', '🤕', '🤑', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '😬', '😰', '😱', '😳', '😵', '😡', '😠', '👿', '😈', '👦', '👧', '👨', '👩', '👴', '👵', '👶', '👱', '👮', '👲', '👳', '👷', '⛑', '👸', '💂', '🎅', '👼', '🕵', '👯', '💆', '💇', '👰', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🙇', '🙌'],
		['😐', '😑', '😶', '😣', '😥', '😮', '😪', '😫', '😴'],
		['😌', '🤓', '😛', '😜', '😝', '☹', '🙁', '😒', '😲'],
		['🖖', '😂', '💩', '😘', '🖕', '🤘', '👊', '🍖', '✌'],
		['👅', '🍑', '💋', '🏩', '💩', '👉', '👌', '🍆', '💦']
	];

	// main emojis is made out of middle emoji
	const mainEmojis = subEmojis.map(e => e[4]);

	const makeGrid = (emojis) => MAKE.html(`<div class='emoji__grid-wrapper'>
		<span class='emoji__grid-item top left' data-skintone='' data-emoji='${emojis[0]}'>${emojis[0]}</span>
		<span class='emoji__grid-item top centre' data-skintone='' data-emoji='${emojis[1]}'>${emojis[1]}</span>
		<span class='emoji__grid-item top right' data-skintone='' data-emoji='${emojis[2]}'>${emojis[2]}</span>
		<span class='emoji__grid-item middle left' data-skintone='' data-emoji='${emojis[3]}'>${emojis[3]}</span>
		<span class='emoji__grid-item middle centre' data-skintone='' data-emoji='${emojis[4]}'>${emojis[4]}</span>
		<span class='emoji__grid-item middle right' data-skintone='' data-emoji='${emojis[5]}'>${emojis[5]}</span>
		<span class='emoji__grid-item bottom left' data-skintone='' data-emoji='${emojis[6]}'>${emojis[6]}</span>
		<span class='emoji__grid-item bottom centre' data-skintone='' data-emoji='${emojis[7]}'>${emojis[7]}</span>
		<span class='emoji__grid-item bottom right' data-skintone='' data-emoji='${emojis[8]}'>${emojis[8]}</span>
	</div>`);

	const mainGrid = makeGrid(mainEmojis).firstChild;
	mainGrid.$$('.emoji__grid-item')
	.map(function (item, i) {

		const subGrid = makeGrid(subEmojis[i]).firstChild;
		subGrid.dataset.emoji = subEmojis[i][4];
		subGrid.on('emojiSelect', e => setChar(e.detail.emoji));
		item.appendChild(subGrid);
		return subGrid;
	})
	.forEach(selectablePopup);

	$('#emoji__grid').appendChild(mainGrid);
	twemoji.parse(mainGrid);

	document.body.on('touchmove', e => {
		e.preventDefault();
		return false;
	});


});
