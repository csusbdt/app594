var async   = require('async');
var http    = require('http');
var connect = require('connect');
var fs      = require('fs');
var ejs     = require('ejs');
var querystring = require('querystring');
var assert  = require('assert');
var fb      = require('./fb');
var game    = require('./game');

// http://www.smashingboxes.com/heroku-vs-amazon-web-services/
// See http://policy.heroku.com/aup for limits on RAM and storage
// For caching files, use http://nodejs.org/api/process.html#process_process_memoryusage
// to check for 512 MB memory limit.

if (process.env.FACEBOOK_APP_ID === undefined) throw new Error('FACEBOOK_APP_ID not defined');
if (process.env.FACEBOOK_SECRET === undefined) throw new Error('FACEBOOK_SECRET not defined');
if (process.env.MONGO_URI       === undefined) throw new Error('MONGO_URI not defined');
if (process.env.PORT            === undefined) throw new Error('PORT not defined');

var loginPage,
    gamePage,
    app = connect(),
    cookieDelete = 'app594=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT; Path=/; HttpOnly',
    channelDoc = '<script src="//connect.facebook.net/en_US/all.js"></script>';

// Make sure messages are sent over https when deployed through Heroku.
// See https://devcenter.heroku.com/articles/http-routing
app.use('/', function(req, res, next) {
  if (req.headers['X-Forwarded-Proto'] === 'https') return next();
  res.writeHead(302, { 'Location': "https://" + req.headers.host + req.url });
  res.end();
});

app.use(connect.favicon('public/favicon.ico'));

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

//app.use(connect.staticCache());
app.use(connect.static(require('path').join(__dirname, 'public')));

app.use('/', connect.query());

app.use('/', function(req, res, next) {
  console.log('req.url = ' + req.url);
  if (req.url !== '/' && req.url.substr(0, 2) !== '/?') return next();
  
  var startIndex = -1,
      endIndex,
      userCredentials,
      user = {};
      
  // Look for the app594 cookie.
  if (req.headers.cookie) startIndex = req.headers.cookie.indexOf('app594=');
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
      res.setHeader('Set-Cookie', cookieDelete);
      res.redirect('/');
      return;
    }
    user.uid = userCredentials.uid;
    game.getSecret(user, function(err) {
      if (err) return next(err);
      if (user.secret === undefined || userCredentials.secret !== user.secret) {
        res.setHeader('Set-Cookie', cookieDelete);
        return res.end(loginPage);
      }
      game.getGameState(user, function(err) {
        if (err) return next(err);
        res.end(ejs.render(gamePage, {locals: { appId: process.env.FACEBOOK_APP_ID, app: JSON.stringify(user) }}));
      });
    });
  }

  // Look for uid and short-term access token in URL from the login page.
  else if (req.query.uid && req.query.token) {
    fb.exchangeAccessToken(req.query.token, function(result) {
      if (result instanceof Error) return next(result);
      user.uid = req.query.uid; 
      user.secret = result.secret; 
      user.expires = result.expires;
      game.saveSecret(user, function(err) {
        if (err) return next(err);
        var cookieData = { uid: user.uid, secret: user.secret };
        res.setHeader('Set-Cookie', 
          'app594=' + JSON.stringify(cookieData) + 
          '; Expires=' + new Date(user.expires).toUTCString() +
          '; Path=/; HttpOnly');
        game.getGameState(user, function(err) {
          if (err) return next(err);
          console.log('3. returning game page');
          res.end(ejs.render(gamePage, {locals: { appId: process.env.FACEBOOK_APP_ID, app: JSON.stringify(user) }}));
        });
      });
    });
  }

  else {  
    // The login page will return uid and short-term access token in URL.
    res.end(loginPage);
  }
});

// Allow only POST requests beyond this point.
app.use(function(req, res, next) {
  if (req.method !== 'POST') {
    res.statusCode = 404;  // not found
    res.end('not found');
  } else {
    next();
  }
});

//app.use(connect.bodyParser());

app.use('/save', function(req, res, next) {
  var MAX_BODY = 256,  // what about max header?
      body;
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    console.log('chunk = ' + chunk)
    if (chunk.length > MAX_BODY) {
      return res.end();
    }
    if (body === undefined) body = chunk;
    else body += chunk;
    if (body.length > MAX_BODY) {
      return res.end();
    }
  });
  req.on('end', function () {
    var user = {},
        data;
    try {
      data = querystring.parse(body);
    } catch (err) {
      return next(err);
    }
    user.uid = data.uid;
    user.secret = data.secret;
    game.getSecret(user, function(err) {
      if (err) return next(err);
      if (data.secret !== user.secret) {
        res.setHeader('Set-Cookie', cookieDelete);
        return res.end('{ login: true }');
      }
      try {
        user.gameState = JSON.parse(data.gameState);
      } catch (err) {
        return next(err);
      }
      game.saveGameState(user, function(err) {
        if (err) return next(err);
        res.end('{}');  // all good
      });
    });
  });
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
      fb.init(function(err) { 
        if(err) return cb(err); 
        cb();
      });
    },
    function(cb) {
      game.init(function(err) { 
        if(err) return cb(err); 
        cb();
      });
    }
  ],
  function(err, result) {
    if (err) return console.log(err);
    http.createServer(app).listen(process.env.PORT, function(err) {
      if (err) return console.log(err);
      console.log("listening on " + process.env.PORT);
    });
  }
);
