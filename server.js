'use strict';

/*** ENVIRONMENT ***/
const path = require('path');
require('dotenv').load();

/*** EXPRESS ***/
const express = require('express');
const app = express();

/*** DEVELOPMENT TOOLS ***/
const DEV = process.env.NODE_ENV === 'development';
const morgan = require('morgan');
DEV ? app.use(morgan('dev')) : app.use(morgan('tiny'));
if (DEV) {
  console.log('Development mode');
}

/*** MIDDLEWARE ***/
app.set('view engine', 'mu2');
app.use(express.static(path.join(__dirname, '/views/style')));

// Body Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Favicon
const favicon = require('express-favicon');
app.use(favicon(path.join(__dirname, '/views/style/favicon.ico')));

/*** AUTH ***/
const session = require('express-session');

// config express-session
const sess = {
  secret: 'CHANGE THIS TO A RANDOM SECRET',
  cookie: {},
  resave: false,
  saveUninitialized: true,
};

if (app.get('env') === 'production') {
  sess.cookie.secure = true; // serve secure cookies, requires https
}

app.use(session(sess));

// Load Passport
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');

// Configure Passport to use Auth0
const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

// You can use this section to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

const userInViews = require('./lib/middleware/userInViews');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

app.use(userInViews());
app.use('/', authRouter);
app.use('/', usersRouter);

/*** MONGOOSE ***/
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const mongoLink = process.env.MONGO_URI;

mongoose.connect(mongoLink, { useMongoClient: true }, err => {
  if (err) {
    console.error('Failed to connect to database!');
  } else {
    console.log('Connected to database.');
  }
});

/*** ROUTES ***/
const routes = require('./routes/');
routes(app);

/*** SERVE ***/
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Listening on port', port);
});
