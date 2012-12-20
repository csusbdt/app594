// TODO:
//   - Add session storage; see https://github.com/kcbanner/connect-mongo
//

var async = require('async');
var http = require('http');
var express = require('express');
var fb = require('./fb');
var game = require('./game');
var app = express();
var staticHandler = express.static(require('path').join(__dirname, 'public'));

function error(err, req, res, next) {
  console.error(err.stack);
  res.send(500, err.stack);
}

function configureExpress() {
  app.set('port', process.env.PORT);
  app.get('/', fb.html);
  app.get('/channel.html', fb.channel);
  app.get('/index.html', function(req, res) { res.redirect('/'); } );
  app.use('/op/', express.bodyParser());
  app.use('/op/', express.cookieParser());
  app.use('/op/', express.session({ secret: process.env.SESSION_SECRET || 'change-me-soon' }));
  app.get('/op/get-number', game.getNumber);
  app.get('/op/save-number', game.saveNumber);
  app.use(staticHandler);
  app.use(error);
}

// cb = function(err)
function init(cb) {
  if (process.env.FACEBOOK_APP_ID === undefined) {
    cb('FACEBOOK_APP_ID not defined');
  } else if (process.env.FACEBOOK_SECRET === undefined) {
    cb('FACEBOOK_SECRET not defined');
  } else {
    fb.init(cb);
  }
}

// cb = function(err)
function startServer(cb) {
  var server = http.createServer(app);
  server.listen(app.get('port'), cb);
}

app.configure(configureExpress);

async.series([init, startServer], function(err, result) {
  if (err) console.log(err);
  else console.log("listening on " + app.get('port'));
});
