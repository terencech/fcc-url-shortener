require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI).catch(err => console.error(err));

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, default: 1 }
});

urlSchema.plugin(AutoIncrement, { inc_field: 'short_url' });

const UrlModel = mongoose.model("Url", urlSchema);

function isValidUrl(url) {
  return new Promise(resolve => {
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch(err) {
      console.error(err);
      resolve(false);
    }
    console.log(urlObj.protocol);
    if (urlObj.protocol != 'http:' && urlObj.protocol != 'https:') { resolve(false); }

    dns.lookup(urlObj.hostname, function(err, address) {
      if (err || !address) {
        console.error(err);
        resolve(false);
      }
      resolve(true);
    })
  })
}

function createNewUrl(originalUrl, callback) {
  UrlModel.create({ original_url: originalUrl }, function(err, url) {
    if (err) return console.error(err);
    callback(url);
  })
}

function findUrlByOriginal(originalUrl, callback) {
  UrlModel.findOne({ original_url: originalUrl }, function(err, url) {
    if (err) return console.error(err);
    callback(url);
  });
}

function findUrlByShort(shortUrl, callback) {
  UrlModel.findOne({ short_url: shortUrl }, function(err, url) {
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
  isValidUrl(req.body.url).then(result => {
    if (result) {
      findUrlByOriginal(req.body.url, url => {
        if (url) {
          res.json({
            original_url: url.original_url,
            short_url: url.short_url
          })
        } else {
          createNewUrl(req.body.url, url => {
            res.json({
              original_url: url.original_url,
              short_url: url.short_url
            })
          })
        }
      })
    } else {
      res.json({
        error: 'invalid url'
      })
    }
  });
});

app.get('/api/shorturl/:shortUrl', function(req, res) {
  findUrlByShort(req.params.shortUrl, url => {
    res.redirect(url.original_url);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});