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
app.use(express.static(path.join(__dirname, '/views/style')));

// Favicon
const favicon = require('express-favicon');
app.use(favicon(path.join(__dirname, '/views/style/favicon.ico')));

/*** MONGOOSE ***/
const mongoose = require('mongoose');
const db = mongoose.connection;
mongoose.Promise = global.Promise;

const mongoLink = process.env.MONGO_URI;

mongoose.connect(
  mongoLink,
  {
    useMongoClient: true,
  },
  (err, db) => {
    if (err) {
      console.error('Failed to connect to database!');
    } else {
      console.log('Connected to database.');
    }
  }
);

/*** ROUTES ***/
const routes = require('./routes/index.server.js');
routes(app);

/*** SERVE ***/
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Listening on port', port);
});
