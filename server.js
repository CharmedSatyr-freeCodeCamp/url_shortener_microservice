'use strict';

const express = require('express'),
    app = express(),
    router = express.Router(),
    mongo = require('mongodb').MongoClient,
    path = require('path'),
    mu = require('mu2'),
    sha256 = require('crypto-js/sha256'),
    validate = require('url-validator'),
    mongoLink = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/url-shortener-microservice',
    port = process.env.PORT || 8080;
require('dotenv').config({silent: false});

mu.root = path.join(__dirname + '/views');

let collection,
    long_url,
    short_url,
    visible,
    stream,
    fixed_lnk,
    redirect_site;

mongo.connect(mongoLink, function(err, db) {
    (err)
        ? console.error('Database failed to connect!')
        : console.log('Connected to database on port', port)

    console.log('connected on... ', mongoLink);
    //Create a collection
    db.createCollection('urls', {
        capped: true,
        size: 5242880,
        max: 5000
    });

    //Display a static home page using mustache
    app.get('/', function(req, res) {
        mu.clearCache(); //This is helpful for Development to ensure changes are always reflected
        visible = {
            home: true,
            links: false,
            error: false,
            long_url: long_url,
            short_url: short_url
        }
        stream = mu.compileAndRender('index.html', visible);
        stream.pipe(res);
    });

    //Create a new short_url
    app.get('/new/:url*', function(req, res) {
        mu.clearCache(); //This is helpful for Development to ensure changes are always reflected
        fixed_lnk = validate(req.params.url + req.params[0]);

        if (fixed_lnk) {
            long_url = fixed_lnk;
            short_url = (sha256(fixed_lnk)).toString().split('').slice(0, 5).join('');
            visible = {
                home: false,
                links: true,
                error: false,
                long_url: long_url,
                short_url: short_url
            }
        } else {
            visible = {
                home: false,
                links: false,
                error: true,
                long_url: long_url,
                short_url: short_url
            }
        }
        stream = mu.compileAndRender('index.html', visible);
        stream.pipe(res);
        collection = db.collection('urls');
        collection.insertOne(visible);
        console.log('Inserted', JSON.stringify(visible));
    });

    //Visit a short_url
    app.route('/:url*').get(function(req, res) {
        //See if the :url is a short_url
        collection = db.collection('urls');
        collection.findOne({
            short_url: req.params.url
        }, function(err, matches) {
            if (err)
                throw err;

            //Log whether there are any matches
            if (matches) {
                console.log('Match:', matches);
                console.log('Redirecting to', matches.long_url);
                res.redirect(matches.long_url);
            } else {
                console.error('No matches');
                mu.clearCache(); //This is helpful for Development to ensure changes are always reflected
                visible = {
                    home: false,
                    links: false,
                    error: true,
                    long_url: long_url,
                    short_url: short_url
                }
                stream = mu.compileAndRender('index.html', visible);
                stream.pipe(res);
            }
        });
    });

    app.listen(port, function() {
        console.log('Listening on port', port);
    });
});
