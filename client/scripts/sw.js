import swToolbox from 'sw-toolbox';

// Try network but fallback to cache
swToolbox.router.default = swToolbox.networkFirst;

// Data should query the network first
swToolbox.router.any('/api/*', swToolbox.networkOnly);

// Data should query the network first
swToolbox.router.any('/auth/*', swToolbox.networkOnly);
