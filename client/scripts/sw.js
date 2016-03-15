importScripts('/sw-toolbox.js');

// Try network but fallback to cache
toolbox.router.default = toolbox.networkFirst;

// Data should query the network first
toolbox.router.any('/api/*', toolbox.networkOnly);

// Data should query the network first
toolbox.router.any('/auth/*', toolbox.networkOnly);
