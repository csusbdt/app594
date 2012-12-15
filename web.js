var express = require('express');

var app = express();

//app.use(express.bodyParser());
//app.use(express.cookieParser());

//app.use(require('faceplate').middleware({
//  app_id: process.env.FACEBOOK_APP_ID,
//  secret: process.env.FACEBOOK_SECRET,
//  scope:  'user_likes,user_photos,user_photo_video_tags'
//}));

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
  res.send(500, 'Something broke!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

