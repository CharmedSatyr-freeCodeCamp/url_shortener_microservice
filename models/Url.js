'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Url = new Schema({
  long_url: String,
  short_url: String,
});

module.exports = mongoose.model('Url', Url);
