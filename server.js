require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI).catch(error => function(error) {
  console.log(error);
});

const urlSchema = new mongoose.Schema({
  original_url: String,
});

const Url = mongoose.model("Url", urlSchema);

function createNewUrl(originalUrl) {
  const newUrl = new Url({ original_url: originalUrl });
  newUrl.save(function (err, data) {
    if (err) return console.error(err);
    return data;
  });
}

function findUrlByOriginal(originalUrl) {
  Url.findOne({ original_url: originalUrl }, function(err, url) {
    if (err) return console.error(err);
    return url;
  });
}

function findUrlById(urlId) {
  Url.findById(urlId, function(err, url) {
    if (err) return console.error(err);
    return url;
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
  dns.lookup(req.body.url, function (err) {
    if (err) res.json({ error: 'invalid url' })
    else {


      res.json({
        original_url: req.body.url,
        short_url: 1
      })
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
