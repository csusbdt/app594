var async = require('async');
var http = require('http');
var connect = require('connect');
var fs = require('fs');
var ejs = require('ejs');
var assert = require('assert');
var fb = require('./fb');
var game = require('./game');

var app = connect();

var loginPage;
var gamePage;

function initLoginPage(cb) {
  fs.readFile('views/login.ejs', 'utf8', function(err, file) {
    if (err) { 
      cb(err); 
      return; 
    }
    var ejsArgs = { 
      locals: { appId: process.env.FACEBOOK_APP_ID } 
    };
    loginPage = ejs.render(file, ejsArgs);
    cb();
  });
}

function initGamePage(cb) {
  fs.readFile('views/game.ejs', 'utf8', function(err, file) {
    if (err) { 
      cb(err);
      return;
    }
    gamePage = file;
    cb();
  });
}

var cookieParser = connect.cookieParser();

//  app.use('/save', connect.bodyParser());
//  app.use('/', connect.cookieParser());
  app.use(connect.query());
  app.use(connect.static(require('path').join(__dirname, 'public')));
//  app.use(function(err, req, res, next) {
//    console.error(err.stack);
//    res.send(500, err.stack);
//  });

function returnGamePageFromCookie(cookieString, res) {
console.log('cookie string = ' + cookieString);
  var cookie = JSON.parse(cookieString);
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

app.use('/', function(req, res, next) {

  console.log('req.headers = ' + req.headers);
  
  var cookie = req.headers.cookie; 
  
    
    if (typeof cookie !== 'undefined') {
      var cookieValue = cookie.substr(cookie.indexOf('=') + 1);  
      console.log('cookieValue = ' + cookieValue);
      returnGamePageFromCookie(cookieValue, res);  
    } else if(typeof req.query.token === 'undefined') {
        res.end(loginPage);
    } else {
      returnGamePageFromQuery(req, res);
    }    

/*
  cookieParser(req, res, function() {
    var cookies = req.cookies['app594'];
console.log(cookies);
    if (typeof cookies !== 'undefined') {
      returnGamePageFromCookie(cookies[0], res);  
    } else if(typeof req.query.token === 'undefined') {
        res.end(loginPage);
    } else {
      returnGamePageFromQuery(req, res);
    }    
  });
  */
});

app.use('/channel.html', fb.channel);

/*
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
*/

function checkEnv(cb) {
  if (process.env.FACEBOOK_APP_ID === undefined) {
    cb(new Error('FACEBOOK_APP_ID not defined'));
  } else if (process.env.FACEBOOK_SECRET === undefined) {
    cb(new Error('FACEBOOK_SECRET not defined'));
  } else if (process.env.MONGO_URI === undefined) {
    cb(new Error('MONGO_URI not defined'));
  } else if (process.env.PORT === undefined) {
    cb(new Error('PORT not defined'));
  } else {
    cb();
  }
}

async.parallel([checkEnv, initLoginPage, initGamePage, fb.init, game.init], function(err) {
  if (err) {
    console.log(err);
  } else {
    http.createServer(app).listen(process.env.PORT, function(err) {
      if (err) console.log(err);
      else console.log("listening on " + process.env.PORT);
    });
  }
});
