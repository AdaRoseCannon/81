importScripts('/sw-toolbox.js');

// Try network but fallback to cache
toolbox.router.default = toolbox.networkFirst;

// Data should query the network first
toolbox.router.any('/api/*', toolbox.networkOnly);

// Data should query the network first
toolbox.router.any('/auth/*', toolbox.networkOnly);

self.addEventListener('push', function(event) {
	console.log('Received a push message', event);

	var title = 'Yay a message.';
	var body = 'We have received a push message.';
	var icon = '/icon-192x192.png';
	var tag = 'simple-push-demo-notification-tag';

	event.waitUntil(
		self.registration.showNotification(title, {
			body: body,
			icon: icon,
			tag: tag
		})
	);
});
