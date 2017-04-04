const express = require('express'),
    app = express(),
    mongo = require('mongodb').MongoClient,
    mu = require('mu2'),
    sha256 = require('crypto-js/sha256'),
    url = 'mongodb://localhost:27017/url-shortener-microservice',
    port = process.env.PORT || 5000;

mu.root = __dirname + '/public';

app.get('/:url', function(req, res) {
    mu.clearCache(); //This is helpful for Development to ensure changes are always reflected

    //Long URL parameter
    //Need to parse so that :// characters don't ruin everything
    //Need to see if it matches an existing short_url
    //If it matches an existing short_url, redirect to the associated long_url
    let long_url = req.params.url;
    //Shorten to 5 digits of the long parameter's hash
    let short_url = (sha256(long_url)).toString().split('').slice(0, 5).join('');

    let newUrl = {
        long_url: long_url,
        short_url: short_url
    }

    //Save long_url in the DB
    //Save short_url in the DB associated with its long_url
    //Navigating to short_url redirects user to long_url

    let stream = mu.compileAndRender('index.html', newUrl);

    mongo.connect(url, function(err, db) {
        if (err)
            throw err;

        const collection = db.collection('urls');
        collection.insert(newUrl, function(err, data) {
            if (err)
                throw err;

            console.log(JSON.stringify(newUrl));
            db.close();
        })
    })

    stream.pipe(res);

});

app.listen(port, function() {
    console.log('Listening on port', port);
});
