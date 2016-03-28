/* global $, twemoji, $$ */

import 'gsap/src/uncompressed/utils/Draggable';
import 'gsap/src/uncompressed/TweenLite';
import 'gsap/src/uncompressed/easing/EasePack';

import customSelect from './lib/custom-select';
import selectablePopup from './lib/emoji-selector';
import addScript from './lib/add-script';
import * as settings from './lib/settings';
import pushNotifications from './lib/push-notifications';
import tinycam from './lib/tinycam';
import {updateMessageTextInput, combineEmojis, isCombinableEmojis, init as initTextInput} from './lib/emoji-text-input';
import {init as messages} from './lib/messages';
import {init as touchInit} from './lib/touch';
import {warn} from './lib/notify';
import {sendPhoto, init as apiInit} from './lib/api';

Promise.all([
	addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.3.1/build/dirty-dom-lib.min.js').promise,
	addScript('https://twemoji.maxcdn.com/2/twemoji.min.js').promise,
	addScript('https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch,default').promise,
	addScript('/scripts/color-thief.js').promise
]).then(() => {

	/*
	* Generate the skintone emoji selector in the options page
	*/
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

	/*
	* Set up the emoji Grid
	*/
	const subEmojis = [
		['😍', '😘', '🌈', '💕', '❤️', '💔', '🌹', '👬', '👭'],       // Romance
		['😋', '😎', '😤', '😉', '😀', '😂', '😴', '😉', '😇'],        // Smiles
		['✍', '✋', '✌️', '👐', '👌', '🖖', '👏', '👋', '🙋'],        // Hands
		['👜', '👒', '👘', '👖', '👞', '👠', '👢', '👕', '👚'], // Clothes
		['🍕', '☕', '🍸', '🍺', '🍷', '🍗', '🍒', '🍩', '🎂'],    // Foods
		['😐', '😑', '😶', '😣', '😥', '😮', '😪', '😫', '⬇'],   // Misc
		['😌', '🤓', '😛', '😜', '😝', '☹', '🙁', '😒', '😲'],     // Silly
		['😟', '😑', '💩', '😒', '🖕', '🤘', '👊', '🍖', '✌'],      // Angries
		['👅', '🍑', '💋', '🏩', '💩', '👉', '👌', '🍆', '💦']    // Adult
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
		subGrid.on('emojiSelect', e => {

			if (isCombinableEmojis(e.detail.emoji, skinToneSelector.dataset.value)) {
				updateMessageTextInput(e.detail.emoji + skinToneSelector.dataset.value);
			} else {
				updateMessageTextInput(e.detail.emoji);
			}

		});
		item.appendChild(subGrid);
		return subGrid;
	})
	.forEach(selectablePopup);

	$('#emoji__grid').appendChild(mainGrid);
	twemoji.parse(mainGrid);
	twemoji.parse($('#emoji__options-button'));

	// Set up local storage caching
	apiInit();

	// Add button interactions
	touchInit();

	// Set up push notification service
	pushNotifications();

	// load new messages
	messages();

	// Push notification camera.
	const {photoModal} = tinycam();
	photoModal.on('photo', e => {
		const username = $('#emoji__recipient').value;
		if (username === '') {
			return warn('No User');
		}
		sendPhoto(username, e.detail);
	});

	// Set up the text input
	initTextInput();
})
.catch(e => {

	// Script loading errors
	console.error(e);
});
