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

function getMessage(event) {
	let data = {
		title: data.title || 'Something Has Happened',
		message: data.message || 'Here\'s something you might want to check out.',
		icon: data.icon || 'launcher-icon-4x.png'
	};
	if (event.data) {
		data = event.data.json();
	} else {
		// fetch data frome server
	}
	return Promise.resolve(data);
}

self.addEventListener('push', function(event) {
	if (!(self.Notification && self.Notification.permission === 'granted')) {
		return;
	}

	if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
		console.warn('Notifications aren\'t supported.');
		return;
    }

	const noti = getMessage(event)
	.then(message => self.registration.showNotification(message.title, message))
	.then(function (notificationEvent) {

		const notification = notificationEvent.notification;
		notification.addEventListener('click', function() {
			if (clients.openWindow) {
				clients.openWindow('https://81.ada.is/');
			}
		});
	});

	event.waitUntil(noti);
});
