
// Update the server with our subscription details
function sendSubscriptionToServer(subscription) {

	// make fetch request with cookies to get user id.
	fetch(`/api/subscribe?sub=${
		encodeURIComponent(
			JSON.stringify(
				subscription.toJSON()
			)
		)}`, {
		credentials: 'same-origin'
	}).catch(e => console.log(e));
}

// get messages from the server
function getMessages({start, amount, cache}) {
	return fetch(`/api/get-messages?start=${start || 0}&amount=${amount || 10}${cache ? '&cache' : ''}`)
	.then(r => r.json())
	.then(json => {

		// store in idb then return
		return json;
	});
}

function sendMesage(username, message) {
	return fetch('/api/send-message', {
		method: 'POST',
		credentials: 'same-origin',
		body: JSON.stringify({username, message})
	})
}

export {
	sendSubscriptionToServer,
	getMessages,
	sendMesage
};
