var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
var indexHtml = 'Starting server. Please try again.';

require('fs').readFile('index.ejs', 'utf8', function(err, file) {
  if (err) {
    console.log(err);
    indexHtml = err;
  } else {
    indexHtml = require('ejs').render(file, {
      locals: { 
        appId: process.env.FACEBOOK_APP_ID
      }
    });
  }
});

app.get('/', function(req, res) {
  res.send(indexHtml);
});

// Return channel.html with one-year cache duration.
app.get('/channel.html', function(req, res) {
  var body = '<script src="//connect.facebook.net/en_US/all.js"></script>';
  res.set({
  	'Content-Type': 'text/html',
  	'Content-Length': body.length,
  	'Pragma': 'public',
  	'Cache-Control': 'max-age=31536000',
    'Expires': new Date(Date.now() + 31536000).toUTCString()
  });
  res.end(body);
});

app.use(express.static(__dirname + '/public'));

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, err.stack);
});

app.listen(port, function() {
  console.log("Listening on " + port);
});
