'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var joinTweet = "SELECT content, name, pictureUrl, tweets.id AS tweetID, users.id AS userID FROM tweets INNER JOIN users ON tweets.userid = users.id";
var insertTweet = "INSERT INTO tweets (userID, content) VALUES ($1, $2)";

module.exports = function makeRouterWithSockets(io, client) {

    // a reusable function
    function respondWithAllTweets(req, res, next) {
        // var allTheTweets = tweetBank.list();
        client.query(joinTweet, function(err, result) {
            var tweets = result.rows;
            res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
        });
        // res.render('index', {
        //   title: 'Twitter.js',
        //   tweets: allTheTweets,
        //   showForm: true
        // });
    }


    // here we basically treet the root view and tweets view as identical
    router.get('/', respondWithAllTweets);
    router.get('/tweets', respondWithAllTweets);

    // single-user page
    router.get('/users/:username', function(req, res, next) {
        var tweetName = req.params.username;
        client.query(joinTweet + " WHERE name=$1", [tweetName], function(err, result) {

            var tweets = result.rows;
            res.render('index', {
                title: 'Twitter.js',
                tweets: tweets,
                showForm: true,
                username: tweetName
            });
        });
    });

    // single-tweet page
    router.get('/tweets/:id', function(req, res, next) {
        //var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
        var tweetID = req.params.id;
        client.query(joinTweet + " WHERE tweets.id=" + tweetID, function(err, result) {
            var tweets = result.rows;
            res.render('index', {
                title: 'Twitter.js',
                tweets: tweets
            });
        });
    });

    // create a new tweet
    router.post('/tweets', function(req, res, next) {
        //var newTweet = tweetBank.add(req.body.name, req.body.text);
        client.query('SELECT id from users where name = $1', [req.body.name], function(err, result) {

            if (!result.rows[0]) {
                client.query("INSERT INTO users (name) VALUES ($1)", [req.body.name], function(err, data) {


                    client.query('SELECT id from users where name = $1', [req.body.name], function(err, result) {
                        var userID = result.rows[0].id;
                        var newTweet = [userID, req.body.text];

                        client.query(insertTweet, newTweet, function(err, data) {

                            if (err) throw err;
                            var tweet = { 'name': req.body.name, 'text': req.body.text, 'id': userID };
                            io.sockets.emit('new_tweet', tweet);
                            res.redirect('/');
                        });
                    });


                });
            } else {
                var userID = result.rows[0].id;
                var newTweet = [userID, req.body.text];
                client.query(insertTweet, newTweet, function(err, data) {
                    if (err) throw err;
                    var tweet = { 'name': req.body.name, 'text': req.body.text, 'id': userID };
                    io.sockets.emit('new_tweet', tweet);
                    res.redirect('/');
                });
            }
        });
    });


    return router;
}
