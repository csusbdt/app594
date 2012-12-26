var async   = require('async');
var http    = require('http');
var connect = require('connect');
var fs      = require('fs');
var ejs     = require('ejs');
var assert  = require('assert');
var fb      = require('./fb');
var game    = require('./game');

if (process.env.FACEBOOK_APP_ID === undefined) throw new Error('FACEBOOK_APP_ID not defined');
if (process.env.FACEBOOK_SECRET === undefined) throw new Error('FACEBOOK_SECRET not defined');
if (process.env.MONGO_URI       === undefined) throw new Error('MONGO_URI not defined');
if (process.env.PORT            === undefined) throw new Error('PORT not defined');

var loginPage,
    gamePage,
    app = connect(),
    channelDoc = '<script src="//connect.facebook.net/en_US/all.js"></script>';

app.use('/channel.html', function(req, res, next) {
  res.set({
    'Content-Type': 'text/html',
    'Content-Length': channelDoc.length,
    'Pragma': 'public',
    'Cache-Control': 'max-age=31536000',
    'Expires': new Date(Date.now() + 31536000).toUTCString()
  });
  res.end(channelDoc);
});

app.use(connect.static(require('path').join(__dirname, 'public')));

app.use('/', connect.query());

app.use('/', function(req, res, next) {
  var startIndex,
      endIndex,
      userCredentials;
      
  // Look for the app594 cookie.
  startIndex = req.headers.cookie.indexOf('app594=');
  if (startIndex > -1) {
    // app594 cookie found.
    startIndex += 7; 
    // Cookie value may end with ';' but not guaranteed.
    var endIndex = req.headers.cookie.indexOf(';', startIndex);
    if (endIndex === -1) endIndex = req.headers.cookie.length;
    try {
      userCredentials = JSON.parse(req.headers.cookie.substr(startIndex, endIndex - startIndex));
    } catch (e) {
      console.log('Bad app594 cookie.');
      res.setHeader('Set-Cookie', 'app594=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT');
      res.redirect('/');
      return;
    }
    game.getUser(userCredentials, function(user) {
      if (user instanceof Error) throw err;
      if (user === null) {
        res.setHeader('Set-Cookie', 'app594=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT');
        res.end(loginPage);
      } else {
        res.end(ejs.render(gamePage, {locals: { appId: process.env.FACEBOOK_APP_ID, user: user }}));
      }
    });
    return;
  }

  // Look for uid and short-term access token in URL from the login page.
  if (req.query.token && req.query.uid) {
    fb.exchangeAccessToken(req.query.token, function(result) {
      if (result instanceof Error) return next(result);
      var updateArgs = { 
        uid: req.query.uid, 
        secret: result.secret, 
        expires: result.expires 
      };
      game.updateUser(updateArgs, function(user) {
        if (user instanceof Error) return next(user);
        var cookieData = { uid: user.uid, secret: user.secret };
        res.setHeader('Set-Cookie', 
          'app594=' + JSON.stringify(cookieData) + 
          '; Expires=' + new Date(user.expires).toUTCString() +
          '; Path=/; HttpOnly');
        res.end(ejs.render(gamePage, {locals: { appId: process.env.FACEBOOK_APP_ID, user: user }}));
      });
    });
    return;
  }
  
  // The login page will return uid and short-term access token in URL.
  res.end(loginPage);
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.end(500, err.stack);
});

async.parallel(
  [
    function(cb) {
      fs.readFile('views/login.ejs', 'utf8', function(err, file) {
        if (err) return cb(err);
        loginPage = ejs.render(file, { locals: { appId: process.env.FACEBOOK_APP_ID } });
        cb();
      });
    },
    function(cb) {
      fs.readFile('views/game.ejs', 'utf8', function(err, file) {
        if (err) return cb(err);
        gamePage = file;
        cb();
      });
    },
    function(cb) {
      fb.init(function(err) { if(err) return cb(err); });
      cb();
    },
    function(cb) {
      game.init(function(err) { if(err) return cb(err); });
      cb();
    }
  ],
  function(err) {
    if (err) throw err;
    http.createServer(app).listen(process.env.PORT, function(err) {
      if (err) throw err;
      else console.log("listening on " + process.env.PORT);
    });
  }
);
