'use strict';

const co = require('co');
const errorResponse = require('./errorResponse');
const messageApi = require('./messages');

module.exports = function quote(req, res) {
	co(function *() {

		if (!req.query.postids) {
			return errorResponse(res, Error('No postids param'));
		}

		req.query.by = req.query.by || 'an anonymous user.';

		const postids = req.query.postids.split(',');

		const messages = yield Promise.all(
			postids.map(
				postid => messageApi.readSingleMessage(postid)
			)
		);

		const details = {
			fromUser: req.query.by,
			messages
		};

		const photoMessages = [];
		const emojiMessages = [];
		for (const o of messages) {
			o.sent = o.from.toLowerCase() === req.query.by.toLowerCase();
			if (o.type === 'photo' && photoMessages.length < 4) {
				o.message = `<img src="/images/get-image?postid=${o.messageId}" />`;
				photoMessages.push(o);
			}
			if (o.type === 'message') {
				o.message = o.message.join('');
				emojiMessages.push(o.message);
			}
		}

		if (photoMessages.length === 0) {
			details['twitter-card-type'] = 'summary';
			details['twitter-image'] = 'https://81.ada.is/static/screenshot.png';
		}

		if (photoMessages.length === 1) {
			details['twitter-card-type'] = 'summary';
			details['twitter-image'] = 'https://81.ada.is/images/get-image?postid=' + photoMessages[0].messageId;
		}

		if (photoMessages.length >= 2) {
			details['twitter-card-type'] = 'summary_large_image';
			details['twitter-image'] = 'https://81.ada.is/images/get-collage?postids=' + photoMessages.map(m => m.messageId).join(',');
		}

		details['twitter-description'] = emojiMessages.join('\n');

		res.render('quote', details);
	})
	.catch(e => errorResponse(res, e));
}
