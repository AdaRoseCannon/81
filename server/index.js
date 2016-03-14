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

app.use('/', (req, res) => res.render('index', {
	user: !!req.user
}));

app.listen(port);
console.log('listenting on: ' + port);
