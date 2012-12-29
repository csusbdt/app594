var url = require('url');
var fs = require('fs');
var ejs = require('ejs');

var game = require('../game');
var cookie = require('../app_cookie');
var fb = require('../fb');

var loginPage,
    gamePageTemplate;

exports = module.exports = function() {
  return handleRootRequest;
}

exports.init = function(cb) {
  fs.readFile('views/login.ejs', 'utf8', function(err, file) {
    if (err) return cb(err);
    loginPage = ejs.render(file, { locals: { appId: process.env.FACEBOOK_APP_ID } });
    fs.readFile('views/game.ejs', 'utf8', function(err, file) {
      if (err) return cb(err);
      gamePageTemplate = file;
      cb();
    });
  });
};

function error(req, res, err) {
  console.log(err.message);
  res.statusCode = 500;
  res.end(err.message);
}

function handleRootRequest(req, res) {
  var userCredentials = cookie.extract(req);
  
  console.log('HEREHRHERHEREHR');
  if (userCredentials === undefined) console.log('userCredentials is undefined');
  else console.log('userCredentials = ' + JSON.stringify(userCredentials));
  
  if (userCredentials) {
    processUserCredentials(req, res, userCredentials);
  } else if (req.url.substr(0, 2) === '/?') {
    processShortLivedToken(req, res);
  } else {
    returnLoginPage(req, res);
  }
}

function returnLoginPage(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': loginPage.length,
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, no-store',
    'Set-Cookie': cookie.cookieDelete  // in case of bad cookie
  });
  res.end(loginPage);
}

function returnGamePage(req, res, user) {
  game.getGameState(user, function(err) {
    if (err) return error(req, res, err);
    var page = ejs.render(
      gamePageTemplate, 
      { locals: { appId: process.env.FACEBOOK_APP_ID, app: JSON.stringify(user) } }
    );
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': page.length,
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache, no-store',
      'Set-Cookie': cookie(user)
    });
    res.end(page);
  });
}

function processUserCredentials(req, res, userCredentials) {
console.log('processing user credentials');
  var user = {};
  user.uid = userCredentials.uid;
  game.getSecret(user, function(err) {
    if (err) return error(req, res, err);
    if (user.secret === undefined || userCredentials.secret !== user.secret) {
      returnLoginPage(req, res);
    } else {
      returnGamePage(req, res, user);
    }
  });
}

function processShortLivedToken(req, res) {
  // Look for uid and short-term access token in URL from the login page.
  var query, token, user = {};
  try {
    query = url.parse(req.url, true).query;
  } catch (err) {
    console.log(err.message);
    query = {};
  }
  if (query.token === undefined || query.uid === undefined) {
    res.redirect('/');  // clear out bad query
    return;
  }
  user.uid = query.uid;
  fb.exchangeAccessToken(query.token, function(result) {
    if (result instanceof Error) return error(req, res, result);
    user.secret = result.secret; 
    user.expires = result.expires;
    game.saveSecret(user, function(err) {
      if (err) return error(req, res, result);
      returnGamePage(req, res, user);    
    });
  });
};
