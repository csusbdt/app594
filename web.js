var express = require('express');
var app = express();
var fb = require('./fb');

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.bodyParser());
  app.get('/channel.html', fb.channel);
  app.use(express.static(require('path').join(__dirname, 'public')));
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, err.stack);
  });
  app.get('/', fb.html);
  app.get('/index.html', function(req, res) { res.redirect('/'); } );
});

fb.config({
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET
  },
  function() {
    require('http').createServer(app).listen(app.get('port'), function() {
      console.log("Server listening on port " + app.get('port') + '.');
    });
  }
);
