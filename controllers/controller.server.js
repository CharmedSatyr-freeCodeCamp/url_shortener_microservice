'use strict';

/*** ENVIRONMENT ***/
var path = require('path');
require('dotenv').load();
var port = process.env.PORT || 8080;
var DEV = process.env.NODE_ENV === 'development';
var PROD = process.env.NODE_ENV === 'production';

/*** MODEL ***/
var Url = require('../models/Url.js');

/*** TOOLS ***/
var sha256 = require('crypto-js/sha256');
var validate = require('url-validator');

/*** MU - NODE MUSTACHE TEMPLATING ***/
var mu = require('mu2');

//Dynamic HTML generation
mu.root = path.join(__dirname, '../views');

//A function to update mustache variables and render
var mupdate = function(obj, response) {
  if (DEV) {
    mu.clearCache(); //This is helpful for development to ensure changes are always reflected, but it hurts speed
  }
  var stream = mu.compileAndRender('index.html', obj);
  stream.pipe(response);
};

function Controllers() {
  /*** VARIABLES ***/
  var long_url, short_url; //Values will be both shown and stored to database
  var visible; //Object used as mupdate parameter

  /*** ROOT ***/
  //Display root page using mustache
  this.root = function(req, res) {
    //Enforce HTTPS in production
    if (PROD) {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        res.redirect(process.env.APP_URL);
      } else {
        visible = {
          home: true,
          links: false,
          error: false,
          long_url: long_url,
          short_url: short_url
        };
        mupdate(visible, res);
      }
    } else {
      visible = {
        home: true,
        links: false,
        error: false,
        long_url: long_url,
        short_url: short_url
      };
      mupdate(visible, res);
    }
  };

  /*** CREATE NEW ***/
  this.newUrl = function(req, res) {
    //Validate the url
    //req.params.url -> https?: and req.params[0] -> //www.example.com, and we need both to make url-validator happy
    var fixed_lnk = validate(req.params.url + req.params[0]);
    //If fixed_lnk is NOT valid
    if (!fixed_lnk) {
      console.error('Invalid entry!');
      //Show an error page
      visible = {
        home: false,
        links: false,
        error: true,
        long_url: long_url,
        short_url: short_url
      };
      mupdate(visible, res);
    } else {
      //Otherwise, search the db to see if we've already got a copy of this link
      Url.findOne(
        {
          long_url: fixed_lnk
        },
        function(err, matches) {
          if (err) {
            console.error(err);
          }

          //If there is a match to something already in the db
          if (matches) {
            //Show the links page without creating a new entry
            console.log("We've got a duplicate! It's", matches);
            long_url = matches.long_url;
            short_url = matches.short_url;
            visible = {
              home: false,
              links: true,
              error: false,
              long_url: long_url,
              short_url: short_url
            };
            mupdate(visible, res);
            //res.json(matches); //If we wanted to just show a JSON object, we'd use this instead of mupdate
          } else {
            //If no matches, create a new entry for the database, insert it, and display a links page
            long_url = fixed_lnk;
            //short_url is the first 5 digits of the long_url's sha256 hash
            short_url = sha256(fixed_lnk)
              .toString()
              .split('')
              .slice(0, 5)
              .join('');
            visible = {
              home: false,
              links: true,
              error: false,
              long_url: long_url,
              short_url: short_url
            };

            var dbEntry = new Url({
              long_url: long_url,
              short_url: short_url
            });

            dbEntry.save(function(err, doc) {
              if (err) {
                console.error(err);
              }
              console.log('Inserted', JSON.stringify(dbEntry));
            });

            mupdate(visible, res);
            //res.json(dbEntry); //If we wanted to just show a JSON object, we'd use this instead of mupdate
          }
        }
      );
    }
  };

  /*** VISIT ***/
  //Visit a new URL
  this.visit = function(req, res) {
    //See if the :url is a short_url
    Url.findOne(
      {
        short_url: req.params.url
      },
      function(err, matches) {
        if (err) {
          console.error(err);
        }

        //If :url matches a short_url, redirect to the long_url
        if (matches) {
          console.log('Redirecting to', matches.long_url);
          res.redirect(matches.long_url);
          //Otherwise, show an error page
        } else {
          console.error('No matches');
          mu.clearCache();
          visible = {
            home: false,
            links: false,
            error: true,
            long_url: long_url,
            short_url: short_url
          };
          mupdate(visible, res);
        }
      }
    );
  };
}

module.exports = Controllers;
