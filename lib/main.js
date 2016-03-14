/* global $, MAKE, twemoji, $$ */

import customSelect from './lib/custom-select';
import selectablePopup from './lib/selectable-popup';
import addScript from './lib/add-script';
import * as settings from './lib/settings';
import touchInit from './lib/touch';

Promise.all([
	addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.2.2/build/dirty-dom-lib.min.js').promise,
	addScript('https://twemoji.maxcdn.com/2/twemoji.min.js').promise,
]).then(() => {

	let cursorPos = 0;
	const textInput = $('#emoji__text-input');
	const message = [];
	function setChar(str) {
		if (!str) return;
		message[cursorPos] = str + skinToneSelector.dataset.value;
		textInput.innerHTML = message.map(m => combineEmojis(m)).join('');
		cursorPos = Math.min((cursorPos + 1), 2);
	}

	const skinTone = ['', '🏼', '🏿', '🏽', '🏾', '🏻'];
	const skinToneSelector = $('<ul id="skin-tone-selector">');
	for (const s of skinTone) {
		const selected = s === settings.getItem('skinTone');
		skinToneSelector.appendChild($(`<li data-value='${s}'${selected ? ' data-selected="true"' : ''}>👋${s}</li>`));
	}
	$('#emoji__skin-tone-selector__wrapper').prependChild(skinToneSelector);
	customSelect(skinToneSelector);
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
		subGrid.on('emojiSelect', e => setChar(e.detail.emoji));
		item.appendChild(subGrid);
		return subGrid;
	})
	.forEach(selectablePopup);

	$('#emoji__grid').appendChild(mainGrid);
	twemoji.parse(mainGrid);

	// Add button interactions
	touchInit();
});