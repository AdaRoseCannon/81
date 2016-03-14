const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const app = require('express')();
const appSecret = process.env.APP_SECRET || 'oh dear oh dear';

// use memory caching
// const nodeCouchDB = require('node-couchdb');
// const couch = new nodeCouchDB('localhost', 5984);

// Configure the Twitter strategy for use by Passport.
//
// OAuth 1.0-based strategies require a `verify` function which receives the
// credentials (`token` and `tokenSecret`) for accessing the Twitter API on the
// user's behalf, along with the user's profile.	The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy(
	{
		consumerKey: process.env.CONSUMER_KEY,
		consumerSecret: process.env.CONSUMER_SECRET,
		callbackURL: global.serverUrl + '/auth/twitter/return'
	},
	function(token, tokenSecret, profile, cb) {
		// In this example, the user's Twitter profile is supplied as the user
		// record.	In a production-quality application, the Twitter profile should
		// be associated with a user record in the application's database, which
		// allows for account linking and authentication with other identity
		// providers.
		return cb(null, profile);
	}
));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.	In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.	However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
	cb(null, JSON.stringify(user));
});

passport.deserializeUser(function(obj, cb) {
	cb(null, JSON.parse(obj));
});

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: appSecret, resave: true, saveUninitialized: true }));

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
		res.json('profile', { user: req.user });
	}
);

app.get('/auth/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

module.exports = app;
