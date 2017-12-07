'use strict';

/*** ENVIRONMENT ***/
require('dotenv').load();
var PROD = process.env.NODE_ENV === 'production';

/*** CONTROLLERS ***/
var Controllers = require('../controllers/controller.server.js');

/*** ROUTES ***/
module.exports = function(app, db) {
  //Call Controllers constructor
  var controllers = new Controllers();

  //Enforce HTTPS in production
  if (PROD) {
    app.get('*', function(req, res, next) {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        res.redirect(process.env.APP_URL + req.url);
      } else {
        next(); /* Continue to other routes if we're not redirecting */
      }
    });
  }
  //Website homepage
  app.get('/', controllers.root);

  //Create a new short_url
  app.get('/new/:url*', controllers.newUrl);

  //Visit a short_url
  app.get('/:url*', controllers.visit);
};
