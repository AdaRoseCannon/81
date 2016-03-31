'use strict';

const express = require('express');
const app = express.Router();
const denodeify = require('denodeify');
const messagesApi = require('./messages.js');
const pushApi = require('./push.js');
const bp = require('body-parser');
const authApi = require('./twitter-auth');
const dataUriToBuffer = require('data-uri-to-buffer');
const ftDataSquasher = require('ftdatasquasher');
const lwip = require('lwip');
const co = require('co');

// maintain a global color promise because lwip can't run in paralel
lwip.colorPromise = Promise.resolve();

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

function loadImageFromMessage(postid) {

	return messagesApi
	.readSingleMessage(postid)
	.then(m => {
		if (m.type !== 'photo') {
			throw Error('Message is not a photo: ' + postid);
		}
		const buffer = dataUriToBuffer(ftDataSquasher.decompress(m.message));
		return denodeify(lwip.open)(buffer, 'png')
		.then(image => denodeify(image.resize.bind(image))(192, 192, 'nearest-neighbor'));
	});
}

app.all('/get-image', function (req, res) {
	if (!req.query.postid) {
		return errorResponse(res, Error('No postid param'));
	}

	lwip.colorPromise = lwip.colorPromise
	.then(() => loadImageFromMessage(req.query.postid))
	.then(image => denodeify(image.toBuffer.bind(image))('png', {}))
	.then(buffer => {
	    res.set('Content-Type', 'image/png');
		res.send(buffer);
	})
	.catch(e => errorResponse(res, e));
});

app.all('/get-collage', function (req, res) {
	if (!req.query.postids) {
		return errorResponse(res, Error('No postids param'));
	}

	const postids = req.query.postids.split(',');

	if (postids.length === 1) {
		return errorResponse(res, Error('Needs more than one id, comma seperated.'));
	}

	lwip.colorPromise = lwip.colorPromise
	.then(() => Promise.all(postids.map(postid => loadImageFromMessage(postid))))
	.then(images => {
		const padding = 8;
		const columns = 2;
		const rows = Math.ceil(images.length/columns);
		return denodeify(lwip.create)(
			(192+padding) * columns + padding,
			(192+padding) * rows + padding,
			[255, 240, 245]
		)
		.then(canvas => {
			return co(function *() {
				for (let i=0; i<images.length; i++) {
					const image = images[i];
					const x = (i % 2);
					const y = Math.floor(i/columns);
					const posX = x * (192+padding) + padding;
					const posY = y * (192+padding) + padding;
					yield denodeify(canvas.paste.bind(canvas))(posX, posY, image);
				}
				return canvas
			});
		});
	})
	.then(image => denodeify(image.toBuffer.bind(image))('png', {}))
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
