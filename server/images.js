'use strict';

const express = require('express');
const app = express.Router();
const messagesApi = require('./messages.js');
const dataUriToBuffer = require('data-uri-to-buffer');
const ftDataSquasher = require('ftdatasquasher');
const lwip = require('lwip');
const denodeify = require('denodeify');
const co = require('co');
const errorResponse = require('./errorResponse');

// maintain a global color promise because lwip can't run in paralel
lwip.colorPromise = Promise.resolve();

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

// One years caching on images.
app.use(function (req, res, next) {
	res.set('Cache-Control', 'public, max-age=31557600');
	next();
});

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

	if (postids.length > 4) {
		return errorResponse(res, Error('Sorry four is the limit.'));
	}

	lwip.colorPromise = lwip.colorPromise
	.then(() => Promise.all(postids.map(postid => loadImageFromMessage(postid))))
	.then(images => {
		const padding = 8;
		const columns = postids.length === 3 ? 3 : 2;
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
					const x = (i % columns);
					const y = Math.floor(i/columns);
					const posX = x * (192+padding) + padding;
					const posY = y * (192+padding) + padding;
					yield denodeify(canvas.paste.bind(canvas))(posX, posY, image);
				}
				return canvas;
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

module.exports = app;
