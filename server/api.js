const express = require('express');
const app = express.Router();

app.use(require('body-parser').json());

function errorResponse(res, e) {
   res.status(500);
   res.json({
	   error: e.message
   });
}

app.get('/poke', function (req,res) {

	if (!req.query.username) {
		res.status(500);
		return res.json({
			error: 'No username param'
		});
	}
	require('./push.js')(req.query.username)
	.then(() => {
		res.json({success: true})
	})
	.catch(e => errorResponse(res, e));
});

app.post('/send-message', function (req,res) {

	console.log(req.body);

	if (!req.body.username) {
		res.status(500);
		return res.json({
			error: 'No username param'
		});
	}
	if (!req.body.message) {
		res.status(500);
		return res.json({
			error: 'No message param'
		});
	}
	require('./messages.js').pushMessage(req.body.username, req.body.message)
	.then(m => {
		res.json(m)
	})
	.catch(e => errorResponse(res, e));
});

app.all('/get-messages', require('connect-ensure-login').ensureLoggedIn('/auth/twitter'), function (req,res) {

	if (!req.user) {
		res.status(500);
		return res.json({
			error: 'Not logged in'
		});
	}
	require('./messages.js')
	.readMessages(req.user.username)
	.then(m => {
		res.json(m)
	})
	.catch(e => errorResponse(res, e));
});

module.exports = app;
