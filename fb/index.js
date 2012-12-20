// TODO validate user in exchangeAccessToken
// see http://stackoverflow.com/questions/5406859/facebook-access-token-server-side-validation-for-iphone-app

var querystring = require('querystring');
var async = require('async');
var rest = require('restler');
var html = 'Not ready. Please try again.';
var appToken;
var channelDoc = '<script src="//connect.facebook.net/en_US/all.js"></script>';

// Internal
// cb = function(err)
function parseHtmlFile(cb) {
  function readFileCallback(err, file) {
    if (err) {
      html = err;
      cb(err);
    } else {
      html = require('ejs').render(file, { locals: { appId: process.env.FACEBOOK_APP_ID } });
      cb();
    }
  }    
  require('fs').readFile('public/index.html', 'utf8', readFileCallback); 
}

// Internal
// cb = function(err)
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

// External
// cb = function(err)
function init(cb) {
  async.parallel([parseHtmlFile, getAppToken], function(err, result) {
    if (err) cb(err); else cb();
  });
}

// External
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
function handleHtmlRequest(req, res) {
  res.send(html);
}

// see http://stackoverflow.com/questions/5406859/facebook-access-token-server-side-validation-for-iphone-app
//
// External; cb = function(err, newAccessToken)
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
      cb(null, querystring.parse(result)['access_token']);
    }
  });  
}

exports.init = init;
exports.html = handleHtmlRequest;
exports.channel = handleChannelRequest;
exports.exchangeAccessToken = exchangeAccessToken;
