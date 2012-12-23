// TODO validate user in exchangeAccessToken
// see http://stackoverflow.com/questions/5406859/facebook-access-token-server-side-validation-for-iphone-app

// Unless otherwise stated, callbacks have the form function(err).

var querystring = require('querystring');
var async = require('async');
var rest = require('restler');
var fs = require('fs');
var ejs = require('ejs');
var loginHtmlString;
var appToken;
var channelDoc = '<script src="//connect.facebook.net/en_US/all.js"></script>';

////////////////////////////////////////////////////////////////////////
// Internal functions
////////////////////////////////////////////////////////////////////////

function createViews(cb) {    
  fs.readFile('views/login.ejs', 'utf8', function(err, file) {
    if (err) { 
      loginHtmlString = err; 
      cb(err);
    } else {
      var ejsArgs = { 
        locals: { appId: process.env.FACEBOOK_APP_ID } 
      };
      loginHtmlString = ejs.render(file, ejsArgs);
      cb();
    }
  });
}

function getAppToken(cb) {
  var url = 
       'https://graph.facebook.com/oauth/access_token?' + 
       'client_id=' + process.env.FACEBOOK_APP_ID +
       '&client_secret=' + process.env.FACEBOOK_SECRET +
       '&grant_type=client_credentials';
  rest.get(url).on('complete', function(result) {
    if (result instanceof Error) {
      cb(result.message);
    } else {
      appToken = querystring.parse(result)['access_token'];
      console.log('appToken acquired');
      cb();
    }
  });  
}

////////////////////////////////////////////////////////////////////////
// External functions
////////////////////////////////////////////////////////////////////////

function init(cb) {
  async.parallel([createViews, getAppToken], function(err) {
    if (err) cb(err); else cb();
  });
}

function handleChannelRequest(req, res) {
  res.set({
    'Content-Type': 'text/html',
    'Content-Length': channelDoc.length,
    'Pragma': 'public',
    'Cache-Control': 'max-age=31536000',
    'Expires': new Date(Date.now() + 31536000).toUTCString()
  });
  res.end(channelDoc);
}

// External
function handleLoginPageRequest(req, res) {
  res.send(loginHtmlString);
}

// External; cb = function(err, newAccessToken, expires)
function exchangeAccessToken(accessToken, cb) {
  var url = 
       'https://graph.facebook.com/oauth/access_token' + 
       '?client_id=' + process.env.FACEBOOK_APP_ID +
       '&client_secret=' + process.env.FACEBOOK_SECRET +
       '&grant_type=fb_exchange_token' +
       '&fb_exchange_token=' + accessToken;
  rest.get(url).on('complete', function(result) {
    if (result instanceof Error) {
      cb(result.message);
    } else {
      cb(null, 
        querystring.parse(result)['access_token'], 
        querystring.parse(result)['expires']
      );
    }
  });  
}

exports.init = init;
exports.loginHtml = handleLoginPageRequest;
exports.channel = handleChannelRequest;
exports.exchangeAccessToken = exchangeAccessToken;
