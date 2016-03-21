const GCM_KEY = process.env['GCM_API_KEY'];
const getProfileFromHandle = require('./twitter-auth').getProfileFromHandle;
const fetch = require('node-fetch');
const headers = new fetch.Headers({
	'Content-Type': 'application/json',
	Authorization: `key=${GCM_KEY}`
});

module.exports = handle =>
	getProfileFromHandle(handle)
	.then(profile => {
		if (!profile.pushUrl) {
			throw ('No push url');
		}
		return profile.pushUrl.endpoint.split('/').pop();
	})
	.then(id => fetch('https://android.googleapis.com/gcm/send', {
		method: 'POST',
		headers,
		body: JSON.stringify({
			registration_ids: [id]
		})
	}))
	.then(r => r.json());
