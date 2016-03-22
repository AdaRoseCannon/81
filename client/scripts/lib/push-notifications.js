/* global $ */

import swPromise from './sw.js';
import {sendSubscriptionToServer} from './api.js';

export default function pushNotifications() {
	const pushButton = $('#emoji__push');
	if (pushButton) {
		pushButton.style.display = 'none';
		pushButton.on('click', subscribe);
	}
	function subscribe() {
		swPromise.then(serviceWorkerRegistration => {
			serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
			.then(function(subscription) {
				pushButton.style.display = 'none';
				return sendSubscriptionToServer(subscription);
			})
			.catch(function(e) {
				if (Notification.permission === 'denied') {
					pushButton.style.display = '';
					console.warn('Permission for Notifications was denied');
				} else {

					// A problem occurred with the subscription; common reasons
					// include network errors, and lacking gcm_sender_id and/or
					// gcm_user_visible_only in the manifest.
					console.error('Unable to subscribe to push.', e);
				}
			});
		});
	}

	swPromise
	.then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
	.then(subscription => {
		if (!subscription) {

			if (pushButton) {

				// Not subscribed: show subscribe button
				pushButton.style.display = '';
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
