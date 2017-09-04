'use strict'

const express = require('express'),
  app = express(),
  mongo = require('mongodb').MongoClient,
  path = require('path'),
  mu = require('mu2'),
  sha256 = require('crypto-js/sha256'),
  validate = require('url-validator'),
  mongoLink =
    process.env.MONGOLAB_URI ||
    'mongodb://localhost:27017/url-shortener-microservice',
  port = process.env.PORT || 8080
require('dotenv').config()

//Dynamic HTML generation and static CSS
mu.root = path.join(__dirname + '/views')
app.use(express.static(path.join(__dirname + '/views/style')))

let collection,
  long_url,
  short_url,
  dbEntry, //dbEntry
  visible, //mustache display
  stream, //mustache stream
  fixed_lnk,
  redirect_site

//A function to update mustache variables and render
const mupdate = (obj, response) => {
  mu.clearCache() //This is helpful for Development to ensure changes are always reflected, but it hurts speed
  stream = mu.compileAndRender('index.html', obj)
  stream.pipe(response)
}

mongo.connect(mongoLink, (err, db) => {
  err
    ? console.error('Database failed to connect!')
    : console.log('Connected to database on port', port)

  //Create a collection
  db.createCollection('urls', {
    capped: false,
    size: 5242880,
    max: 5000
  })
  collection = db.collection('urls')

  /* Force HTTPS */
  app.get('*', (req, res, next) => {
    if (req.headers['x-forwarded-proto'] != 'https')
      res.redirect('https://op.pe' + req.url)
    else next() /* Continue to other routes if we're not redirecting */
  })

  //Display a static home page using mustache
  app.get('/', (req, res) => {
    visible = {
      home: true,
      links: false,
      error: false,
      long_url: long_url,
      short_url: short_url
    }
    mupdate(visible, res)
  })

  //Create a new short_url
  app.get('/new/:url*', (req, res) => {
    //Validate the url
    //req.params.url -> https?: and req.params[0] -> //www.example.com, and we need both to make url-validator happy
    fixed_lnk = validate(req.params.url + req.params[0])
    //If fixed_lnk is NOT valid
    if (!fixed_lnk) {
      console.error('Invalid entry!')
      //Show an error page
      visible = {
        home: false,
        links: false,
        error: true,
        long_url: long_url,
        short_url: short_url
      }
      mupdate(visible, res)
    } else {
      //Otherwise, search the collection to see if we've already got a copy of this link
      collection.findOne(
        {
          long_url: fixed_lnk
        },
        (err, matches) => {
          if (err) throw err

          //If there is a match to something already in the db
          if (matches) {
            //Show the links page without creating a new entry
            console.log("We've got a duplicate! It's", matches)
            long_url = matches.long_url
            short_url = matches.short_url
            visible = {
              home: false,
              links: true,
              error: false,
              long_url: long_url,
              short_url: short_url
            }
            mupdate(visible, res)
            //res.json(matches); //If we wanted to just show a JSON object, we'd use this instead of mupdate
          } else {
            //If no matches, create a new entry for the database, insert it, and display a links page
            long_url = fixed_lnk
            //short_url is the first 5 digits of the long_url's sha256 hash
            short_url = sha256(fixed_lnk)
              .toString()
              .split('')
              .slice(0, 5)
              .join('')
            visible = {
              home: false,
              links: true,
              error: false,
              long_url: long_url,
              short_url: short_url
            }
            dbEntry = {
              long_url: long_url,
              short_url: short_url
            }
            collection.insertOne(dbEntry)
            console.log('Inserted', JSON.stringify(dbEntry))
            mupdate(visible, res)
            //res.json(dbEntry); //If we wanted to just show a JSON object, we'd use this instead of mupdate
          }
        }
      )
    }
  })

  //Visit a short_url
  app.get('/:url*', (req, res) => {
    //See if the :url is a short_url
    collection.findOne(
      {
        short_url: req.params.url
      },
      (err, matches) => {
        if (err) throw err

        //If :url matches a short_url, redirect to the long_url
        if (matches) {
          console.log('Redirecting to', matches.long_url)
          res.redirect(matches.long_url)
          //Otherwise, show an error page
        } else {
          console.error('No matches')
          mu.clearCache()
          visible = {
            home: false,
            links: false,
            error: true,
            long_url: long_url,
            short_url: short_url
          }
          mupdate(visible, res)
        }
      }
    )
  })

  app.listen(port, () => {
    console.log('Listening on port', port)
  })
})
