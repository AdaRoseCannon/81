'use strict';

const express = require('express');
const app = express.Router();
const messagesApi = require('./messages.js');
const pushApi = require('./push.js');
const bp = require('body-parser');
const authApi = require('./twitter-auth');
const dataUriToBuffer = require('data-uri-to-buffer');
const ftDataSquasher = require('ftdatasquasher');
const lwip = require('lwip');

function errorResponse(res, e, status) {
   res.status(status || 500);
   res.json({
	   error: e.message,
	   stack: e.stack
   });
}

app.use(bp.json());

app.get('/poke', function (req,res) {

	if (!req.query.username) {
		return errorResponse(res, Error('No username param'), 403);
	}
	pushApi(req.query.username)
	.then(() => {
		res.json({success: true})
	})
	.catch(e => errorResponse(res, e));
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
		pushApi(req.body.username);
		res.json({
			success: true,
			noOfMessages: m
		});
	})
	.catch(e => {
		errorResponse(res, e)
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

app.all('/get-image', function (req, res) {
	if (!req.query.postid) {
		return errorResponse(res, Error('No postid param'));
	}

	messagesApi
	.readSingleMessage(req.query.postid)
	.then(m => {
		if (m.type !== 'photo') {
			throw Error('Message is not a photo');
		}
		const buffer = dataUriToBuffer(ftDataSquasher.decompress(m.message));
		return new Promise((resolve, reject) => {
			lwip.open(buffer, 'png', function (err, image) {
				if (err) return reject(err);
				return resolve(image);
			});
		})
	})
	.then(image => {
		return new Promise((resolve, reject) => {
			image.resize(192, 192, 'nearest-neighbor', function (err, image) {
				if (err) return reject(err);
				image.toBuffer('png', {}, function (err, buffer) {
					if (err) return reject(err);
					resolve(buffer);
				})
			});
		});
	})
	.then(buffer => {
	    res.set('Content-Type', 'image/png');
		res.send(buffer);
	})
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
