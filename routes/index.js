'use strict';

/*** ENVIRONMENT ***/
const PROD = process.env.NODE_ENV === 'production';

/*** CONTROLLERS ***/
const Controllers = require('../controllers/');

/*** ROUTES ***/
module.exports = app => {
  // Call Controllers constructor
  const controllers = new Controllers();

  // Enforce HTTPS in production
  if (PROD) {
    app.get('*', (req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        console.log('Redirecting to', process.env.APP_URL + req.url);
        res.redirect(process.env.APP_URL + req.url);
      } else {
        next(); // Continue to other routes if we're not redirecting
      }
    });
  }

  app
    .get('/', controllers.root) // Website homepage
    .post('/new', controllers.postUrl) // Create a new short url
    .get('/:url*', controllers.visit); // Visit a short_url
};
