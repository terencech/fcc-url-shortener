require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI).catch(error => function(error) {
  console.log(error);
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model("Url", urlSchema);

function createNewUrl(originalUrl, callback) {
  Url.create({ original_url: originalUrl }, function(err, url) {
    if (err) return console.error(err);
    callback(url);
  })
}

function findUrlByOriginal(originalUrl, callback) {
  Url.findOne({ original_url: originalUrl }, function(err, url) {
    if (err) return console.error(err);
    callback(url);
  });
}

function findUrlByShort(shortUrl, callback) {
  Url.findOne({ short_url: shortUrl }, function(err, url) {
    if (err) return console.error(err);
    callback(url);
  })
}

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  dns.lookup(req.body.url, function(err) {
    if (err) res.json({ error: 'invalid url' })
    else {
      findUrlByOriginal(req.body.url, function(url) {
        if (url) {
          res.json({
            original_url: url.original_url,
            short_url: null
          })
        } else {
          createNewUrl(req.body.url, function(url) {
            res.json({
              original_url: url.original_url,
              short_url: null
            })
          })
        };
      })
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
