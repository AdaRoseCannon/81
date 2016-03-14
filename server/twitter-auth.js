const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const express = require('express');
const app = express();
const appSecret = process.env.APP_SECRET || 'oh dear oh dear';
const REDIS = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const denodeify = require('denodeify');
const extend = require('util')._extend;
const redis = (function () {
	if (process.env.REDISTOGO_URL) {
		const rtg = require('url').parse(process.env.REDISTOGO_URL);
		const redis = REDIS.createClient(rtg.port, rtg.hostname);

		redis.auth(rtg.auth.split(':')[1]);
		return redis;
	} else {
	 	return REDIS.createClient();
	}
}());

const redisGet = denodeify(redis.get).bind(redis);
const redisSet = denodeify(redis.set).bind(redis);

function genIdToProfile(profile) {
	return 'v1.0.1_profile_by_number_' + profile.id;
}

function genUserNameToId(profile) {
	return 'v1.0.0_id_by_username_' + profile.username;
}

function getSummary(profile) {
	return {
		id: profile.id,
		username: profile.username,
		displayName: profile.displayName,
		photos: profile.photos[0]
	};
}

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
				redisSet(genIdToProfile(profile), JSON.stringify(inProfile));
				return JSON.parse(inProfile);
			} else {

				//New user
				return profile;
			}
		})
		.then(profile => {

			// Update map of user names to profile ids
			redisSet(genUserNameToId(profile), profile.id);

			// Update profile with new data from auth
			return cb(null, profile);
		});
	}
));

passport.serializeUser(function(user, cb) {
	cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
	redisGet(genIdToProfile({id}))
	.then(data => JSON.parse(data))
	.catch(e => console.log(e))
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
	store: new RedisStore({
		client : redis
	})
}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/twitter', passport.authenticate('twitter'));

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

app.get('/auth/badend',
	require('connect-ensure-login').ensureLoggedIn('/auth/twitter'),
	function(req, res){
		redisGet(genIdToProfile(req.user.id))
		.then(str => JSON.parse(str))
		.then(profile => {
			res.json(profile);
		});
	}
);

app.get('/auth/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

module.exports = app;
