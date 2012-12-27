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
    cookieDelete = 'app594=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT; Path=/; HttpOnly',
    channelDoc = '<script src="//connect.facebook.net/en_US/all.js"></script>';

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
  var startIndex = -1,
      endIndex,
      userCredentials,
      user = {};
      
  // Look for the app594 cookie.
  if (req.headers.cookie) startIndex = req.headers.cookie.indexOf('app594=');
  if (startIndex > -1) {
    // app594 cookie found.
    console.log('4. app594 cookie found');
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
        console.log('5. returning game page');
        res.end(ejs.render(gamePage, {locals: { appId: process.env.FACEBOOK_APP_ID, user: user }}));
      });
    });
  }

  // Look for uid and short-term access token in URL from the login page.
  else if (req.query.uid && req.query.token) {
    console.log('2. access token passed through url');
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
          res.end(ejs.render(gamePage, {locals: { appId: process.env.FACEBOOK_APP_ID, user: user }}));
        });
      });
    });
  }

  else {  
    // The login page will return uid and short-term access token in URL.
    console.log('1. returning login page');
    res.end(loginPage);
  }
});

// Allow only POST requests beyond this point.
app.use(function(req, res, next) {
  if (req.method !== 'POST') {
    response.statusCode = 404;  // not found
    res.end();
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
        data = JSON.parse();
    user.uid = data.uid;
    game.getSecret(user, function(err) {
      if (err) return next(err);
      if (data.secret !== user.secret) {
        res.setHeader('Set-Cookie', cookieDelete);
        return res.end('{ login: true }');
      }
      user.gameState = data.gameState;
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
      fb.init(function(err) { if(err) return cb(err); });
      cb();
    },
    function(cb) {
      game.init(function(err) { if(err) return cb(err); });
      cb();
    }
  ],
  function(err) {
    if (err) { console.log(err.stack); }
    else {
      http.createServer(app).listen(process.env.PORT, function(err) {
        if (err) throw err;
        else console.log("listening on " + process.env.PORT);
      });
    }
  }
);
