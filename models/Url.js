'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Url = new Schema({
  long_url: String,
  short_url: String
});

module.exports = mongoose.model('Url', Url);

