/* global $ */

import swPromise from './sw.js';
import {sendSubscriptionToServer} from './api.js';
import {notify, warn, error} from './notify';

export default function pushNotifications() {
	const pushBanner = $('#emoji__push');
	if (pushBanner) {
		pushBanner.style.display = 'none';
		pushBanner.on('click', subscribe);
	}
	function subscribe() {
		notify('Subscribing');
		pushBanner.classList.add('working');

		swPromise.then(
			serviceWorkerRegistration => serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
		)
		.then(function(subscription) {
			pushBanner.style.display = 'none';
			return sendSubscriptionToServer(subscription);
		})
		.catch(function(e) {
			if (Notification.permission === 'denied') {
				pushBanner.style.display = '';
				warn('Permission for Notifications was denied');
			} else {

				// A problem occurred with the subscription; common reasons
				// include network errors, and lacking gcm_sender_id and/or
				// gcm_user_visible_only in the manifest.
				error('Unable to subscribe to push.');
				console.log(e);
			}
		})
		.then(() => {
			pushBanner.classList.remove('working');
		});
	}

	swPromise
	.then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
	.then(subscription => {
		if (!subscription) {

			if (pushBanner) {

				// Not subscribed: show subscribe button
				pushBanner.style.display = '';
			}
		} else {

			// Update server with correct info.
			return sendSubscriptionToServer(subscription);
		}
	})
	.catch(e => {

		// Service workers not supported.
		console.log('service workers/push notifications not supported.')
		console.log(e);
	});
}
