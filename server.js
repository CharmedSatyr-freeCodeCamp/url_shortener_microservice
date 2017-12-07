'use strict';

/*** ENVIRONMENT ***/
var path = require('path');
require('dotenv').load();

/*** EXPRESS ***/
var express = require('express');
var app = express();

/*** MIDDLEWARE ***/
app.use(express.static(path.join(__dirname, '/views/style')));

/*** MONGOOSE ***/
var mongoose = require('mongoose');
var db = mongoose.connection;
mongoose.Promise = global.Promise;

var mongoLink = process.env.MONGO_URI;

mongoose.connect(
  mongoLink,
  {
    useMongoClient: true
  },
  function(err, db) {
    if (err) {
      console.error('Failed to connect to database!');
    } else {
      console.log('Connected to database.');
    }
  }
);

/*** ROUTES ***/
var routes = require('./routes/index.server.js');
routes(app);

/*** SERVE ***/
var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log('Listening on port', port);
});
