'use strict';

/*** ENVIRONMENT ***/
const path = require('path');
require('dotenv').load();
const DEV = process.env.NODE_ENV === 'development';
const PROD = process.env.NODE_ENV === 'production';

/*** MODEL ***/
const Url = require('../models/Url.js');

/*** TOOLS ***/
const sha256 = require('crypto-js/sha256');
const validate = require('url-validator');
const blocklist = require('./blocklist');

/*** MU - NODE MUSTACHE TEMPLATING ***/
const mu = require('mu2');

// Dynamic HTML generation
mu.root = path.join(__dirname, '../views');

// A function to update mustache variables and render
const mupdate = (obj, response) => {
  if (DEV) {
    mu.clearCache(); // This is helpful for development to ensure changes are always reflected, but it hurts speed
  }
  const stream = mu.compileAndRender('index.html', obj);
  stream.pipe(response);
};

/*** CONTROLLERS ***/
// Controllers constructor
function Controllers() {
  // Common variables
  let long_url, short_url; // Values will be both shown and stored to database
  let visible; // Object used as mupdate parameter

  // Root
  // Display root page using mustache
  this.root = (req, res) => {
    visible = {
      home: true,
      links: false,
      error: false,
      long_url,
      short_url,
    };
    mupdate(visible, res);
  };

  // Create new
  this.newUrl = (req, res) => {
    // Validate the url
    // req.params.url -> https?: and req.params[0] -> //www.example.com, and we need both to make url-validator happy
    const fixed_lnk = validate(req.params.url + req.params[0]);

    // If the link is valid, check it against the blocklist
    let blocked;
    if (fixed_lnk) {
      blocked = blocklist['0'].map(i => fixed_lnk.includes(i)).filter(j => j === true)[0] || false;
      console.log('Blocked:', blocked);
    }

    // If fixed_lnk is NOT valid
    // Or the link is blocked
    if (!fixed_lnk || blocked) {
      console.error('Invalid entry!');
      //Show an error page
      visible = {
        home: false,
        links: false,
        error: true,
        long_url,
        short_url,
      };
      mupdate(visible, res);
    } else {
      // Otherwise, search the db to see if we've already got a copy of this link
      Url.findOne(
        {
          long_url: fixed_lnk,
        },
        (err, matches) => {
          if (err) {
            console.error(err);
          }
          // If there is a match to something already in the db
          if (matches) {
            // Show the links page without creating a new entry
            console.log("We've got a duplicate! It's", matches);
            long_url = matches.long_url;
            short_url = matches.short_url;
            visible = {
              home: false,
              links: true,
              error: false,
              long_url,
              short_url,
            };
            mupdate(visible, res);
            // res.json(matches);
            // If we wanted to just show a JSON object, we'd use this instead of mupdate
          } else {
            // If no matches, create a new entry for the database, insert it, and display a links page
            long_url = fixed_lnk;
            // short_url is the first 5 digits of the long_url's sha256 hash
            short_url = sha256(fixed_lnk)
              .toString()
              .split('')
              .slice(0, 5)
              .join('');

            visible = {
              home: false,
              links: true,
              error: false,
              long_url,
              short_url,
            };

            const dbEntry = new Url({
              long_url: long_url,
              short_url: short_url,
            });

            dbEntry.save((err, doc) => {
              if (err) {
                console.error(err);
              }
              console.log('Inserted', JSON.stringify(dbEntry));
            });

            mupdate(visible, res);
            // res.json(dbEntry);
            // If we wanted to just show a JSON object, we'd use this instead of mupdate
          }
        }
      );
    }
  };

  // Visit
  // Visit a new URL
  this.visit = (req, res) => {
    // See if the :url is a short_url
    Url.findOne(
      {
        short_url: req.params.url,
      },
      (err, matches) => {
        if (err) {
          console.error(err);
        }

        // If :url matches a short_url, redirect to the long_url
        if (matches) {
          console.log('Redirecting to', matches.long_url);
          res.redirect(matches.long_url);
          // Otherwise, show an error page
        } else {
          console.error('No matches');
          mu.clearCache();
          visible = {
            home: false,
            links: false,
            error: true,
            long_url,
            short_url,
          };
          mupdate(visible, res);
        }
      }
    );
  };
}

module.exports = Controllers;
