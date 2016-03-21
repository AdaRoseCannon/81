/**
 * Do some push notifications and twitter auth
 */

global.serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const port = process.env.PORT || 3000;

const express = require('express');
const exphbs = require('express-handlebars');

const app = express();
app.engine('html', exphbs({
	extname: '.html'
}));
app.set('view engine', 'html');

app.get('*', express.static('build'));
app.use(require('./twitter-auth'));

app.get('/', (req, res) => res.render('index', {
	user: !!req.user
}));

app.get('/api/poke', function (req,res) {

	if (!req.query.username) {
		return res.json({
			error: 'No username param'
		});
	}
	require('./push.js')(req.query.username)
	.then(() => {
		res.json({success: true})
	})
	.catch(e => {
		res.status(500);
		res.json({
			error: e.message
		});
	});
});

app.use('*', (req,res) => {
	res.status(404);
	res.json({
		error: 404,
		message: 'Page not found',
		haiku: 'You step in the stream, but the water has moved on. This page is not here.'
	});
});

app.listen(port);
console.log('listenting on: ' + port);
