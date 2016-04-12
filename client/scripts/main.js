/* global $, twemoji */

import 'gsap/src/uncompressed/utils/Draggable';
import 'gsap/src/uncompressed/TweenLite';
import 'gsap/src/uncompressed/easing/EasePack';

import selectablePopup from './lib/emoji-selector';
import addScript from './lib/add-script';
import {getItem, init as settingsInit} from './lib/settings';
import pushNotifications from './lib/push-notifications';
import tinycam from './lib/tinycam';
import {updateMessageTextInput, combineEmojis, isCombinableEmojis, init as initTextInput} from './lib/emoji-text-input';
import {init as messages} from './lib/messages';
import {init as touchInit} from './lib/touch';
import {init as apiInit, save as apiSave, getCorrespondents} from './lib/api';
import {init as shareInit} from './lib/share';

Promise.all([
	addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.3.1/build/dirty-dom-lib.min.js').promise,
	addScript('https://twemoji.maxcdn.com/2/twemoji.min.js').promise,

	// some useful polyfills
	addScript('https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch,default').promise,

	// patched array.from polyfill
	addScript('https://cdn.rawgit.com/Financial-Times/polyfill-service/Array.from-Handle-Iterable/polyfills/Array/from/polyfill.js').promise,
	addScript('/scripts/color-thief.js').promise
]).then(() => {

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
		<span class='emoji__grid-item top left' data-emoji='${emojis[0]}'><span class="emoji__emoji">${combineEmojis(emojis[0], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item top centre' data-emoji='${emojis[1]}'><span class="emoji__emoji">${combineEmojis(emojis[1], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item top right' data-emoji='${emojis[2]}'><span class="emoji__emoji">${combineEmojis(emojis[2], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item middle left' data-emoji='${emojis[3]}'><span class="emoji__emoji">${combineEmojis(emojis[3], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item middle centre' data-emoji='${emojis[4]}'><span class="emoji__emoji">${combineEmojis(emojis[4], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item middle right' data-emoji='${emojis[5]}'><span class="emoji__emoji">${combineEmojis(emojis[5], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item bottom left' data-emoji='${emojis[6]}'><span class="emoji__emoji">${combineEmojis(emojis[6], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item bottom centre' data-emoji='${emojis[7]}'><span class="emoji__emoji">${combineEmojis(emojis[7], getItem('skintone'))}</span></span>
		<span class='emoji__grid-item bottom right' data-emoji='${emojis[8]}'><span class="emoji__emoji">${combineEmojis(emojis[8], getItem('skintone'))}</span></span>
	</div>`);

	const mainGrid = makeGrid(mainEmojis);
	mainGrid.$$('.emoji__grid-item')
	.map(function (item, i) {

		const subGrid = makeGrid(subEmojis[i]);
		subGrid.dataset.emoji = subEmojis[i][4];
		subGrid.on('emojiSelect', e => {

			if (isCombinableEmojis(e.detail.emoji, getItem('skintone'))) {
				updateMessageTextInput(e.detail.emoji + getItem('skintone'));
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

	function updateCorrespondentsList() {
		const c = getCorrespondents();
		const dom = $('#emoji_correspondents');
		dom.empty();
		for (const co of c) {
			if (co !== '@AnonymousUser') {
				dom.$(`<option selected>${co}</option>`);
			}
		}
	}

	window.addEventListener('correrspondentsUpdated', updateCorrespondentsList);

	// Set up local storage caching
	apiInit().then(updateCorrespondentsList);

	// Add button interactions
	touchInit();

	// Set up push notification service
	pushNotifications();

	// load new messages
	messages();

	// Push notification camera.
	tinycam();

	// Set up the text input
	initTextInput();

	shareInit();

	settingsInit();

	window.addEventListener('unload', apiSave);
})
.catch(e => {

	// Script loading errors
	throw e;
});
