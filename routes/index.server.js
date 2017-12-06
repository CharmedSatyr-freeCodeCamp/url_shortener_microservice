'use strict';

var Controllers = require('../controllers/controller.server.js');

module.exports = function(app, db) {
  var controllers = new Controllers();
  //Website homepage
  app.get('/', controllers.root);

  //Create a new short_url
  app.get('/new/:url*', controllers.newUrl);

  //Visit a short_url
  app.get('/:url*', controllers.visit);
};
