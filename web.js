var async = require('async');
var http = require('http');
var express = require('express');
var fs = require('fs');
var ejs = require('ejs');
var assert = require('assert');
var fb = require('./fb');
var game = require('./game');

var app = express();

var loginPage;
var gamePage;

function initLoginPage(cb) {
  fs.readFile('views/login.ejs', 'utf8', function(err, file) {
    if (err) { 
      loginPage = err; 
      cb(err);
    } else {
      var ejsArgs = { 
        locals: { appId: process.env.FACEBOOK_APP_ID } 
      };
      loginPage = ejs.render(file, ejsArgs);
      cb();
    }
  });
}

function initGamePage(cb) {
  fs.readFile('views/game.ejs', 'utf8', function(err, file) {
    if (err) { 
      gamePage = err; 
      cb(err);
    } else {
      gamePage = file;
      cb();
    }
  });
}

app.configure(function() {
  app.set('port', process.env.PORT);
  app.use('/save', express.bodyParser());
  app.use('/', express.cookieParser());
  app.use(express.static(require('path').join(__dirname, 'public')));
//  app.use(function(err, req, res, next) {
//    console.error(err.stack);
//    res.send(500, err.stack);
//  });
});

function returnGamePageFromCookie(cookie, res) {
  var getArgs = {
    uid: cookie.uid,
    secret: cookie.secret
  };
  game.getUser(getArgs, function(user) {
    if (user instanceof Error) {
      console.log(user);
      res.clearCookie('app594');
      res.send(user);
      return;
    }
    if (user === null) {
      res.clearCookie('app594');
      res.send(loginPage);
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

app.get('/', function(req, res) {
  var cookie = req.cookies['app594'];
  if (typeof cookie !== 'undefined') {
    returnGamePageFromCookie(cookie, res);  
  } else if(typeof req.query.token === 'undefined') {
      res.send(loginPage);
  } else {
    assert(typeof req.query.uid !== 'undefined');
    fb.exchangeAccessToken(req.query.token, function(result) {
      if (result instanceof Error) {
        console.log(err);
        res.send(err);
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
          res.send(result);
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
/* temporarily disable until above code is written
        res.cookie(
          'app594', 
          { uid: req.query.uid, token: result.secret }, 
          { expires: result.expires }
        );
*/
        res.send(ejs.render(gamePage, ejsArgs));      
      });
    });
  }
});

app.get('/channel.html', fb.channel);

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
  } else {
    cb();
  }
}

async.parallel([checkEnv, initLoginPage, initGamePage, fb.init, game.init], function(err) {
  if (err) {
    console.log(err);
  } else {
    http.createServer(app).listen(app.get('port'), function(err) {
      if (err) console.log(err);
      else console.log("listening on " + app.get('port'));
    });
  }
});
