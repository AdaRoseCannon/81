/* eslint-env worker */
/* global toolbox, clients */

importScripts('/sw-toolbox.js');

// Try network but fallback to cache
toolbox.router.default = toolbox.fastest;

// Data should query the network first
toolbox.router.any('/api/*', function (request) {
	if ( (new URL(request.url)).search.split('&').indexOf('sw-cache') !== -1 ) {
		return toolbox.fastest(request);
	} else {
		return toolbox.networkFirst(request);
	}
});

// Data should query the network first
toolbox.router.any('/auth/*', toolbox.networkOnly);

function getMessage(event) {
	let data = {
		title: 'Something Has Happened',
		message: 'Here\'s something you might want to check out.',
		icon: 'launcher-icon-4x.png'
	};
	if (event.data) {
		data = event.data.json();
	} else {
		// fetch data frome server
	}
	return Promise.resolve(data);
}

self.addEventListener('notificationclick', function () {
	if (clients.openWindow) {
		clients.openWindow('https://81.ada.is/');
	}
});

self.addEventListener('push', function(event) {
	if (!(self.Notification && self.Notification.permission === 'granted')) {
		return;
	}

	if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
		console.warn('Notifications aren\'t supported.');
		return;
    }

	const noti = getMessage(event)
	.then(message => self.registration.showNotification(message.title, message));

	event.waitUntil(noti);
});
