const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const express = require('express');
const app = express();
const appSecret = process.env.APP_SECRET || 'oh dear oh dear';
const extend = require('util')._extend;
const redis = require('./redis');
const redisGet = redis.redisGet;
const redisSet = redis.redisSet;
const redisStore = redis.redisStore;

function genIdToProfile(profile) {
	return 'v1.0.1_profile_by_number_' + profile.id;
}

function genUserNameToId(profile) {
	return 'v1.0.0_id_by_username_' + profile.username.toLowerCase();
}

function getSummary(profile) {
	return {
		id: profile.id,
		username: profile.username,
		displayName: profile.displayName,
		photos: profile.photos[0],
		pushUrl: profile.pushUrl || 'NONE_SET'
	};
}

if (
	process.env.CONSUMER_KEY &&
	process.env.CONSUMER_SECRET &&
	global.serverUrl
) {
	passport.use(new Strategy(
		{
			consumerKey: process.env.CONSUMER_KEY,
			consumerSecret: process.env.CONSUMER_SECRET,
			callbackURL: global.serverUrl + '/auth/twitter/return'
		},
		function(token, tokenSecret, profile, cb) {

			redisGet(genIdToProfile(profile))
			.then(data => JSON.parse(data))
			.then(inProfile => {
				if (inProfile) {

					// Old User update profile with new Data
					extend(inProfile, profile);
					return inProfile;
				} else {

					//New user
					return profile;
				}
			})
			.then(profile => {

				return Promise.all([
					redisSet(genIdToProfile(profile), JSON.stringify(profile)),

					// Update map of user names to profile ids
					redisSet(genUserNameToId(profile), profile.id)
				]).then(() => profile);
			})
			.then(profile => cb(null, profile));
		}
	));
}

passport.serializeUser(function(user, cb) {
	if (!user.id) {
		return cb(Error('error getting id'));
	}
	cb(null, String(user.id));
});

passport.deserializeUser(function(id, cb) {
	redisGet(genIdToProfile({id}))
	.then(data => JSON.parse(data))
	.catch(e => {
		console.log(e.message);
		cb(e);
	})
	.then(user => {
		cb(null, getSummary(user));
	});
});

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({
	secret: appSecret,
	resave: true,
	saveUninitialized: true,
	store: redisStore,
	cookie: {
		maxAge : 3600000 * 24 * 30,
		secure: 'auto',
		secret: appSecret
	}
}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/twitter', function (req, res, next) {
	if (req.user) {
		res.redirect('/');
	} else {
		next();
	}
}, passport.authenticate('twitter'));

app.get('/auth/twitter/return',
	passport.authenticate('twitter', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
	}
);

app.get('/auth/profile',
	require('connect-ensure-login').ensureLoggedIn('/auth/twitter'),
	function(req, res){
		res.json({ user: req.user });
	}
);

app.get('/auth/detail',
	function(req, res){

		if (!req.query.username) {
			res.status(403);
			return res.json({
				error: 'No username param'
			});
		}

		getProfileFromHandle(req.query.username)
		.then(profile => {
			res.json(getSummary(profile));
		})
		.catch(e => res.json({
			error: e.message
		}));
	}
);

app.get('/auth/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

function getProfileFromHandle(username) {

	if (username === '@AnonymousUser') {
		return Promise.resolve({
			username,
			id: -1,
			displayName: 'Anonymous User'
		});
	}

	return redisGet(genUserNameToId({username}))
	.then(id => {

		if (!id) {
			throw Error('No user by that username: ' + username);
		}

		return redisGet(genIdToProfile({id}));
	})
	.then(str => JSON.parse(str));
}

function updateProfileFromHandle(username, data) {

	return redisGet(genUserNameToId({username}))
	.then(id => {

		if (!id) {
			throw Error('No user by that username: ' + username);
		}

		return redisSet(genIdToProfile({id}), JSON.stringify(data));
	});
}

module.exports = app;
module.exports.getProfileFromHandle = getProfileFromHandle;
module.exports.updateProfileFromHandle = updateProfileFromHandle;
