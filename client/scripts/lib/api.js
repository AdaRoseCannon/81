function checkForErrors(r) {
	if (!r.ok) {
		return r.json().then(j => {
			throw (j.error);
		});
	} else {
		return r;
	}
}


// Update the server with our subscription details
function sendSubscriptionToServer(subscription) {

	// make fetch request with cookies to get user id.
	return fetch(`/api/subscribe?sub=${
		encodeURIComponent(
			JSON.stringify(
				subscription.toJSON()
			)
		)}`, {
		credentials: 'same-origin'
	})
	.then(checkForErrors);
}

// get messages from the server
function getMessages({start, amount, cache} = {}) {
	return fetch(`/api/get-messages?start=${start || 0}&amount=${amount || 10}${cache ? '&cache' : ''}`)
	.then(checkForErrors)
	.then(r => r.json())
	.then(json => {

		// store in idb then return
		return json.filter(m => typeof m === 'object');
	});
}

function sendMesage(username, message) {
	return fetch('/api/send-message', {
		method: 'POST',
		credentials: 'same-origin',
		body: JSON.stringify({username, message})
	})
	.then(checkForErrors);
}

export {
	sendSubscriptionToServer,
	getMessages,
	sendMesage
};
