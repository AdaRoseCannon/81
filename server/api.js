'use strict';

const express = require('express');
const app = express.Router();
const messagesApi = require('./messages.js');
const pushApi = require('./push.js');
const bp = require('body-parser');

function errorResponse(res, e) {
   res.status(500);
   res.json({
	   error: e.message
   });
}

app.use(bp.json());

app.get('/poke', function (req,res) {

	if (!req.query.username) {
		res.status(500);
		return res.json({
			error: 'No username param'
		});
	}
	pushApi(req.query.username)
	.then(() => {
		res.json({success: true})
	})
	.catch(e => errorResponse(res, e));
});

app.post('/send-message', function (req,res) {

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

	let user = 'Anonymous';
	if (req.user && req.user.username) {
		user = req.user.username;
	}
	messagesApi.pushMessage(req.body.username, JSON.stringify(
		{
			type: 'message',
			message: req.body.message,
			from: user,
			timestamp: Date.now()
		}
	))
	.then(m => {
		pushApi(req.body.username)
		res.json({
			success: true,
			noOfMessages: m
		});
	})
	.catch(e => errorResponse(res, e));
});

app.all('/get-messages', function (req,res) {

	if (!req.user) {
		res.status(500);
		return res.json({
			error: 'Not logged in'
		});
	}
	messagesApi
	.readMessages(req.user.username, req.query.start, req.query.amount)
	.then(m => {
		res.json(m.map(str => {
			try {
				return JSON.parse(str);
			} catch (e) {
				return false;
			}
		}));
	})
	.then(m => m.filter(l => typeof l === 'object'))
	.catch(e => errorResponse(res, e));
});

module.exports = app;
