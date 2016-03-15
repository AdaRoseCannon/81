/**
 * service-worker.js
 *
 * Set up the service worker.
 */

export default (function () {

	if ('serviceWorker' in navigator) {

		if (navigator.serviceWorker.controller) {
			return navigator.serviceWorker.ready;
		} else {

			// Return the instantiation promise
			return navigator.serviceWorker.register('/sw.min.js')
			.then(() => navigator.serviceWorker.ready);
		}
	}
}());
