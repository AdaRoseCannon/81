'use strict';

const express = require('express');
const app = express.Router();
const messagesApi = require('./messages.js');
const pushApi = require('./push.js');
const bp = require('body-parser');
const authApi = require('./twitter-auth');
const errorResponse = require('./errorResponse');

app.use(bp.json());

app.get('/poke', function (req,res) {

	if (!req.query.username) {
		return errorResponse(res, Error('No username param'), 403);
	}

	pushApi(req.query.username)
	.then(() => {
		res.json({success: true});
	})
	.catch(e => errorResponse(res, e));
});

app.get('/toggle-receive-anon', function (req, res) {

	if (!req.user || !req.user.username) {
		return errorResponse(res, Error('No username param'), 403);
	}

	authApi.getProfileFromHandle(req.user.username)
	.then(inProfile => {
		inProfile.receiveAnon = req.query.anon === 'true';
		authApi.updateProfileFromHandle(req.user.username, inProfile);
	})
	.then(function () {
		res.json({
			success: true
		});
	})
	.catch(e => {
		res.status(500);
		res.json({
			error: e.message
		});
	});
});

app.get('/subscribe', function (req, res) {

	if (!req.user || !req.user.username) {
		return errorResponse(res, Error('No username param'), 403);
	}

	authApi.getProfileFromHandle(req.user.username)
	.then(inProfile => {

		const newDetails = JSON.parse(decodeURIComponent(req.query.sub));

		inProfile.pushUrl = newDetails;
		authApi.updateProfileFromHandle(req.user.username, inProfile);
	})
	.then(function () {
		res.json({
			success: true
		});
	})
	.catch(e => {
		res.status(500);
		res.json({
			error: e.message
		});
	});
});

app.post('/send-message', function (req,res) {

	if (!req.body.username) {
		return errorResponse(res, Error('No username param'), 403);
	}

	if (!req.body.message) {
		return errorResponse(res, Error('No message param'), 403);
	}

	let user;
	if (req.user && req.user.username) {
		user = req.user.username;
	}

	messagesApi.pushMessage(req.body.username, user, {
		to: req.body.username,
		type: req.body.type || 'message',
		message: req.body.message,
		from: user,
		timestamp: Date.now()
	})
	.then(m => {

		// send a push notification
		pushApi(req.body.username);
		res.json({
			success: true,
			noOfMessages: m
		});
	})
	.catch(e => {
		errorResponse(res, e);
	});
});

app.all('/get-messages', function (req,res) {

	if (!req.user || !req.user.username) {
		return errorResponse(res, Error('No username param'), 403);
	}
	messagesApi
	.readIncomingMessages(req.user.username, req.query.start, req.query.amount)
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

app.all('/get-sent-messages', function (req,res) {

	if (!req.user || !req.user.username) {
		return errorResponse(res, Error('No username param'), 403);
	}

	messagesApi
	.readOutgoingMessages(req.user.username, req.query.start, req.query.amount)
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
