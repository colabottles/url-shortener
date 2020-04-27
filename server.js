// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
//set the env
const dotenv = require('dotenv');
dotenv.config();
//require/import the mongodb native drivers
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
// using Node.js `require()`
const mongoose = require('mongoose');
// connection URL
const url = process.env.DB_URI;
// connection
const promise_connection = mongoose.connect(url, {
  useMongoClient: true
});
let db = mongoose.connection;
// url variables
let full_URL;
let short_URL;
// reg exp's
const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
const url_valid = new RegExp(expression);

// if connection is success
promise_connection.then(function (db) {
  console.log('Connected to mongodb');
});

// describe the schema
let Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

let urlBranch = new Schema({
  full_url: String,
  short_url: String
});

// get the model
let model = mongoose.model('url', urlBranch);

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// set the main html view-file
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


// get url to make this short
app.get("/short/:mainUrl(*)", function (request, response) {
  full_URL = request.params.mainUrl;
  if (full_URL.match(url_valid)) {
    createRandomNumber();
    setTimeout(() => {
      response.json({ full_URL, short_URL });
    }, 1000);
  } else {
    response.send("Incorrect URL. Please, try again");
  }
});

// get url to make this short
app.get("/:ret", function (request, response) {
  model.findOne({ short_url: request.params.ret.toString() }, function (err, docs) {
    if (docs === null) {
      response.send("wrong request, try again/check if the URL is correct");
    }
    else {
      let url = docs.full_url
      if (!((/^https:\/\//.test(url)) || (/^http:\/\//.test(url)))) {
        url = "http://" + url;
      }
      response.redirect(url);
    }
  });
});


// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

// method to create random number and check if there's existed one
let createRandomNumber = () => {
  let rndm = getRandomInt(0, 1000);
  model.findOne({ short_url: rndm.toString() }, function (err, docs) {
    if (docs === null) {
      short_URL = rndm.toString();
      // create a post
      let obj = { full_url: full_URL, short_url: short_URL };
      var post = new model(obj);
      post.save(function (err) {
        if (!err) console.log('Success!');
      });
    }
    else {
      createRandomNumber();
    }
  });
}

// get random num from min to max
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
