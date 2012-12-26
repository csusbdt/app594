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

  var cookie,
      cookies = req.headers.cookie;
      
  if (req.headers.cookies !== undefined && cookies['app594'] !== undefined) {
    try {
      cookie = JSON.parse(cookies['app594'].substr(cookies['app594'].indexOf('=') + 1));
    } catch (e) {
      cookie = undefined;
      res.setHeader('Set-Cookie', 'app594=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT');
    }
  }  
  
  if (typeof cookie !== 'undefined') {
    console.log('cookieValue = ' + cookieValue);
    returnGamePageFromCookie(cookieValue, res);  
  } else if(typeof req.query.token === 'undefined') {
      res.end(loginPage);
  } else {
    returnGamePageFromQuery(req, res);
  }
});



function returnGamePageFromCookie(cookie, res) {
  
  var getArgs = {
    uid: cookie.uid,
    secret: cookie.secret
  };
  console.log(cookie.uid);
  console.log(cookie.secret);
  game.getUser(getArgs, function(user) {
    if (user instanceof Error) {
      console.log(user);
      res.clearCookie('app594');
      res.send(user);
      return;
    }
    if (user === null) {
      res.setHeader('Set-Cookie', 'app594=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT');
      res.end(loginPage);
      return;
    }
    var ejsArgs = { 
      locals: { 
        appId: process.env.FACEBOOK_APP_ID,
        uid: user.uid,
        secret: user.secret,
        expires: user.expires,
        number: user.number
      }
    };
    res.send(ejs.render(gamePage, ejsArgs));
  });
}

function returnGamePageFromQuery(req, res) {
  assert(typeof req.query.uid !== 'undefined');
  fb.exchangeAccessToken(req.query.token, function(result) {
    if (result instanceof Error) {
      console.log(err);
      res.end(err);
      return;
    }
    var updateArgs = { 
      uid: req.query.uid, 
      secret: result.secret, 
      expires: result.expires 
    };
    game.updateUser(updateArgs, function(result) {
      if (result instanceof Error) {
        console.log(result);
        res.end(result);
        return;
      }
      var ejsArgs = { 
        locals: { 
          appId: process.env.FACEBOOK_APP_ID,
          uid: req.query.uid,
          secret: result.secret,
          expires: result.expires,
          number: result.number
        }
      };
      var cookie = { uid: req.query.uid, secret: result.secret };
      res.setHeader('Set-Cookie', 
        'app594=' + JSON.stringify(cookie) + 
        '; Expires=' + new Date(result.expires).toUTCString() +
        '; Path=/; HttpOnly');
      res.end(ejs.render(gamePage, ejsArgs));      
    });
  });
}


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
