var express = require("express"),
  bodyParser = require('body-parser'),
  flash = require('connect-flash'),
  session = require('express-session');

var compression = require('compression');
var helmet = require('helmet')
var routes = require('./routes/index');
var path = __dirname + '/views/';
var flash = require('connect-flash');
var http = require("http");
setInterval(function() {
  http.get("http://www.belowsurface.org");
}, 300000);

var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect, { useMongoClient: true });

var hbs = require('express-handlebars')({
  defaultLayout: 'layout',
  extname: '.hbs'
});
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// const msg = {
//   to: 'test@example.com',
//   from: 'test@example.com',
//   subject: 'Sending with SendGrid is Fun',
//   text: 'and easy to do anywhere, even with Node.js',
//   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
// };
// sgMail.send(msg);

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(compression());
app.use(helmet());
app.use(flash());
app.use(session({
  cookie: {
    maxAge: 60000
  },
  secret: 'woot',
  resave: 'true',
  saveUninitialized: true
}));
app.engine('hbs', hbs);
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.all('/express-flash', function(req, res) {
  req.flash('error', 'This is a flash message using the express-flash module.');
  res.redirect(301, '/');
});

app.use(function(req, res, next) {
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});

require('./routes/index.js')(app);

app.listen(process.env.PORT || 3000, function() {
  console.log('listening on *:3000');
});