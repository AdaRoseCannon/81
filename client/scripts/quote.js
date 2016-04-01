/* global twemoji, $$*/
import addScript from './lib/add-script';
import { setItem } from 'localforage';

Promise.all([
	addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.3.1/build/dirty-dom-lib.min.js').promise,
	addScript('https://twemoji.maxcdn.com/2/twemoji.min.js').promise,
	addScript('https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch,default').promise
]).then(() => {
	twemoji.parse(document.body);
	$$('li').forEach(li => li.on('click', function () {
		setItem('last-correspondent', this.dataset.sender)
		.then(function () {
			window.location.assign('/');
		})
		.catch(e => console.log(e));
	}));
})
.catch(e => console.log(e));
