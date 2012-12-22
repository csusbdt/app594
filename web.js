// TODO:
//   - This app uses the facebook accessToken as a shared secret.
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
  app.use(express.cookieParser());
//  app.use(express.methodOverride());  // maybe take this out
  app.use(express.bodyParser());
  //app.use('/op/', express.csrf());  // definitely add this later
  app.use(staticHandler);
  app.use(error);
}

app.get('/', fb.html);
app.get('/channel.html', fb.channel);
app.get('/index.html', function(req, res) { res.redirect('/'); } );

app.post('/op/login', function(req, res) {
  var args = {
    uid: req.params.uid,
    accessToken: req.params.accessToken
  };
  game.login(args, function(err, newToken) {
    if (err) {
      res.json({ err: err });
    } else {
      res.json({ accessToken: newToken });
    }
  });
});

app.post('/op/logout', function(req, res) {
  req.session = null;
  res.end();
});

app.post('/op/get-number', function(req, res) {
  game.getNumber(req.params.accessToken, function(err, number) {
    if (err) res.json({err: err});
    else res.json({ number: number });
  });
});

app.post('/op/save-number', function(req, res) {
  var args = {
    accessToken: req.params.accessToken,
    number: req.params.number
  };
  game.saveNumber(args, function(err, number) {
    if (err) res.json({err: err});
    else res.json({});
  });
});

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
