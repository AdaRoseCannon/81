import * as toolbox from 'sw-toolbox';

// Try network but fallback to cache
router.default = toolbox.networkFirst;

// Data should query the network first
router.any('/api/*', toolbox.networkOnly);

// Data should query the network first
router.any('/auth/*', toolbox.networkOnly);
