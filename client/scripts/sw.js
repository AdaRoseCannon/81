/* eslint-env worker */
/* global toolbox, clients */

importScripts('/sw-toolbox.js');
import * as localforage from 'localforage';

console.log(localforage);

// Try network but fallback to cache
toolbox.router.default = toolbox.networkFirst;

// Data should query the network first
toolbox.router.any('/api/*', toolbox.networkOnly);

// Data should query the network first
toolbox.router.any('/auth/*', toolbox.networkOnly);

self.addEventListener('push', function(event) {
	if (!(self.Notification && self.notification.permission === 'granted')) {
		return;
	}

	let data = {};
	if (event.data) {
		data = event.data.json();
	}
	const title = data.title || 'Something Has Happened';
	const message = data.message || 'Here\'s something you might want to check out.';
	const icon = data.icon || 'launcher-icon-4x.png';

	const notification = new Notification(title, {
		body: message,
		tag: 'simple-push-demo-notification',
		icon: icon
	});

	notification.addEventListener('click', function() {
		if (clients.openWindow) {
			clients.openWindow('https://81.ada.is/');
		}
	});
});
