/* global $, $$, twemoji */

import {combineEmojis} from './emoji-text-input';
import customSelect from './custom-select';
import {setReceiveAnon, queryUser} from './api';
import {error} from './notify';

const data = JSON.parse(localStorage.getItem('settings') || JSON.stringify({
	skintone: '',
	contactHistory: [],
	receiveAnon: false
}));

const getItem = key => data[key];
const setItem = (key, stuff) => {
	data[key] = stuff;
	localStorage.setItem('settings', JSON.stringify(data));
};

function init() {

	/*
	* Generate the skintone emoji selector in the options page
	*/

	const skinTone = ['', '🏼', '🏿', '🏽', '🏾', '🏻'];
	const skinToneSelector = $('<ul id="skin-tone-selector">');
	for (const s of skinTone) {
		const selected = s === getItem('skinTone');
		skinToneSelector.appendChild($(`<li data-value='${s}'${selected ? ' data-selected="true"' : ''}>👋${s}</li>`));
	}
	$('#emoji__skin-tone-selector__wrapper').prependChild(skinToneSelector);
	customSelect(skinToneSelector, $('#emoji__options'));
	twemoji.parse(skinToneSelector);

	skinToneSelector.on('change', function (e) {
		const modifier = e.detail.value;
		setItem('skinTone', modifier);
		$$('.emoji__grid-item').forEach(el => {
			el.$('.emoji__emoji').innerHTML = combineEmojis(el.dataset.emoji, modifier);
		});
	});

	/*
	* Update AnonMessages on tap.
	*/

	const checkbox = $('#emoji__receive-anon-emoji');

	queryUser('receiveAnon').then(receiveAnon => checkbox.checked = receiveAnon);

	checkbox.on('change', function () {
		setReceiveAnon(this.checked)
		.catch(e => error(e.message));
	});
}

export {
	getItem,
	setItem,
	init
};
