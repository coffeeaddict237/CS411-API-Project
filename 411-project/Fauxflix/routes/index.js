var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var path = require("path");
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
//var assert = require('assert');
var url = 'mongodb://localhost/UsersDB';

var $ = require('jquery');

var Wunderground = require('node-weatherunderground');
var client = new Wunderground();
var weatherKey = require('../config').weatherKey;
var tmdbKey = require('../config').tmdbKey;
var tmbdHelper = require('tmdbv3').init(tmdbKey);

var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* GET home page. */
router.get('/', function(req, res) {
    //console.log("It's coming in here idk");
    res.render('layout');
});

// router.get('/home', function(req,res) {
//     console.log("Someone has come home");
//     res.render('layout');
// });

/* REGISTER a new User */
router.post('/register', urlencodedParser, function(req, res) {

    var user = req.body.username;
    var pass = req.body.password;
    var pass2 = req.body.password2;

    if( !(/\d/.test(pass)) ) {
        console.log("Password requires at least one number");
        res.render('layout', {errormsg: "Password requires a number"});
    }

    console.log("New user trying to register: " + user);
    console.log("Comparing passwords: " + pass + " and " + pass2);

    if( pass === pass2 ) {
        MongoClient.connect(url, function(err, db) {
            db.collection('User').insertOne({
                username : user,
                password : pass
            });
            console.log('Added new user ' + user);
            res.render('layout', { signinSuccess : "Welcome " + user});
        });

        //console.log('Register request from new user ' + newSave.username + ' with password ' + newSave.password);

    }
    else {
        res.render('layout', { errormsg : "Passwords do not match"});
    }
});


/* LOG IN User */
router.post('/login', urlencodedParser, function(req, res) {

    var user = req.body.username;
    var pass = req.body.password;
    console.log("Login request detected for user " + user);

    MongoClient.connect(url, function(err, db) {
        db.collection('User').find({"username" : user}).toArray( function(err, lookup) {
            if(err) {
                console.log("Attempted login failed");
                res.render('layout', { errormsg : "Invalid username or password"});
            }
            else {
                if(lookup.length > 0 && lookup[0].password === pass) {
                    console.log(lookup);
                    console.log("Successful login!");
                    res.render('layout', {loginSuccess: "Welcome back " + user});
                }
                else if(lookup.length > 0 && lookup[0].password !== pass) {
                    res.render('layout', { errormsg : "Invalid username or password"});
                }
                else {
                    res.render('layout', { errormsg : "User does not exist"});
                }
            }
        });

    });
});

/* GET weather from user input */
router.post('/search', urlencodedParser, function(req, res) {
    console.log(req.body);
    var c = String(req.body.city);
    var s = String(req.body.state);

    /* format: http://api.wunderground.com/api/0def10027afaebb7/conditions/q/MA/boston.json */
    var opts = {
        key: weatherKey,
        city: c,
        state: s
    };
    console.log(opts.city + " " + opts.state + " " + opts.key);
    var json;
    client.conditions(opts, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            //console.log(data);
            var response = "The weather in " + data.display_location.full + " is " + data.weather + " with a temp of " + data.temp_f + "°F";
            var c = String(data.weather);
            if( c.includes("Partly")) {
                res.render('layout', {weather: response, conditions: data.weather.substring(7)});
            }
            else if( c.includes("Mostly")) {
                res.render('layout', {weather: response, conditions: data.weather.substring(7)});
            }
            else if( c.includes("Light")) {
                res.render('layout', {weather: response, conditions: data.weather.substring(6)});
            }
            else if( c.includes("Heavy")) {
                res.render('layout', {weather: response, conditions: data.weather.substring(6)});
            }
            else {
                res.render('layout', {weather: response, conditions: data.weather});
            }
        }
    });
});

/* GET a movie title */
router.post('/generate', urlencodedParser, function(req, res) {
    var c = String(req.body.conditions);
    //var user = req.body.username;
    var total = 0;
    var titles = "";
    var popular = 0;
    var poster = '';
    console.log("Fetching movie with search value " + c);
    tmbdHelper.search.movie(c, function(err, data) {
        if(err) {console.log(err);}
        //console.log(data);
        total = data.total_results;
        for( i = 0; i < total; i++ ) {
            //console.log(data.results[i]);
            if(data.results[i]) {
                titles += data.results[i].title + " \n ";
                //console.log("I'm still going!");
                if (data.results[i].vote_count > popular) {

                    popular = data.results[i].vote_count;
                    poster = "http://image.tmdb.org/t/p/w185/" + data.results[i].poster_path;
                    console.log("New most popular found with " + popular + " votes");
                }
            }
        }
        console.log(titles);
        console.log(poster);
        res.render('layout', {
            movies : titles,
            poster : poster,
            keyword : "Your keyword: " + c + " came up with " + total + " movies!",
            total : total
        });
    });
});

router.get('/genre/:name', urlencodedParser, function(req, res) {
    var genre = req.params.name;
    var titles = '';
    console.log("Someone is requested movies in " + genre);
    var ids = [["action", 28], ["adventure", 12], ["animation", 16], ["comedy", 35], ["crime", 80], ["documentary", 99], ["drama", 18], ["family", 1075],
        ["fantasy", 14], ["history", 36], ["horror", 27], ["music", 10402], ["mystery", 9648], ["romance", 10749], ["science_fiction", 878], ["thriller", 53],
        ["war", 10752], ["western", 37]];

    //need to get the list of genre ids and match the input genre to the correct id
    for (i = 0; i < 18; i++) {

        if (ids[i][0] === genre) {
            console.log("Id found: " + ids[i][1]);
            tmbdHelper.genre.movies(ids[i][1], function(err, data) {
                if(err) {console.log(err);}
                else {
                    console.log("Returning entries...");
                    //console.log(data);
                    var poster = "http://image.tmdb.org/t/p/w185/" + data.results[0].poster_path;
                    for (i = 0; i < 20; i++) {
                        //console.log(data.results[i].title);
                        titles += data.results[i].title + " \n ";
                    }
                    console.log(titles);
                    res.render('layout',
                        { movies: titles,
                          poster: poster,
                          keyword: "Your genre search for " + genre + " returned 20 results! ",
                          total : 20
                        });
                }
            });
        }
    }
});

/* POST to User's myList */


/* Get the copyrights page for all packages/APIs used */
router.get('/copyrights', function(req, res) {
    res.render('copyrights');
});

/**/
module.exports = router;
