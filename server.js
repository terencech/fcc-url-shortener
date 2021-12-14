require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const psl = require('psl');

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
  const hostName = psl.get(req.body.url);
  dns.lookup(hostName, function(err, address) {
    if (err || !hostName) { 
      res.json({ error: 'invalid url' })
    }
    else {
      findUrlByOriginal(req.body.url, function(url) {
        if (url) {
          res.json({
            original_url: url.original_url,
            short_url: url.short_url
          })
        } else {
          createNewUrl(req.body.url, function(url) {
            res.json({
              original_url: url.original_url,
              short_url: url.short_url
            })
          })
        };
      })
    }
  })
})

app.get('/api/shorturl/:shortUrl', function(req, res) {
  findUrlByShort(Number(req.params.shortUrl), function(url) {
    if (req.params.shortUrl.match(/^(https\:\/\/)||^(http\:\/\/)/)) {
      res.redirect(url.original_url);
    } else {
      res.redirect("https://" + url.original_url);
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
