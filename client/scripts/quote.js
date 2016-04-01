/* global twemoji*/
import addScript from './lib/add-script';

Promise.all([
	addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.3.1/build/dirty-dom-lib.min.js').promise,
	addScript('https://twemoji.maxcdn.com/2/twemoji.min.js').promise,
	addScript('https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch,default').promise
]).then(() => {
	twemoji.parse(document.body);
});
