/* eslint-env worker */
/* global toolbox, clients, twemoji */

importScripts('/sw-toolbox.js');
importScripts('https://twemoji.maxcdn.com/2/twemoji.min.js');

import {decompress} from 'ftdatasquasher';
import {getMessages} from './lib/api';

// Try network but fallback to cache
toolbox.router.default = toolbox.fastest;

// Data should query the network first
toolbox.router.any('/api/*', function (request) {
	if ( (new URL(request.url)).search.split('&').indexOf('sw-cache') !== -1 ) {
		return toolbox.fastest(request);
	} else {
		return toolbox.networkOnly(request);
	}
});

// Data should query the network first
toolbox.router.any('/auth/*', toolbox.networkOnly);

// The index page should be got from the network first in case of login/logout
toolbox.router.any(/\/(index\.html)?/i , toolbox.networkFirst);

setInterval(function () {

}, 3000);

function getMessage(event) {
	let data = {
		title: 'Something Has Happened',
		message: 'Here\'s something you might want to check out.',
		icon: 'launcher-icon-4x.png'
	};
	if (event.data) {
		data = event.data.json();
	} else {
		data = getMessages({amount: 1})
		.then(messages => messages[0])
		.then(message => {
			if (message.type === 'message') {

				// Get the url for the twemoji image for the first emoji in the message.
				let iconUrl;
				try {
					iconUrl = twemoji.parse(message.message[0]).match(/http[^"]+\.png/);
					iconUrl = iconUrl[0];
				} catch (e) {
					// An error happened with twemoji, ignore it and carry on.
				}
				return {
					title: `${message.from} says: ${message.message.join('')}`,
					icon: iconUrl || 'launcher-icon-4x.png'
				}
			} else if (message.type === 'photo') {
				const icon = decompress(message.message);
				const title = `${message.from} sent a photo`;
				return {
					title,
					icon
				}
			}
		});
	}

	clients.matchAll({})
	.then(function (windows) {
		windows.forEach(function (w) {
			w.navigate('/#refresh');
		});
	});

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
