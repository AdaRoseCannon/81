/**
 * Do some push notifications and twitter auth
 */
require('dotenv').config();
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

app.use('/api', require('./api'));

app.use('*', (req,res) => {
	res.status(404);
	res.json({
		error: 404,
		message: 'Page not found',
		haiku: 'You step in the stream, but the water has moved on. This page is not here.'
	});
});

app.listen(port);
console.log('listening on: ' + port);
