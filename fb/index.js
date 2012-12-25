// Unless otherwise stated, callbacks have the form function(err).

var querystring = require('querystring');
//var async = require('async');
var restler = require('restler');
var appToken;
var channelDoc = '<script src="//connect.facebook.net/en_US/all.js"></script>';

////////////////////////////////////////////////////////////////////////
// Internal functions
////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////
// External functions
////////////////////////////////////////////////////////////////////////

function init(cb) {
  var url = 
       'https://graph.facebook.com/oauth/access_token?' + 
       'client_id=' + process.env.FACEBOOK_APP_ID +
       '&client_secret=' + process.env.FACEBOOK_SECRET +
       '&grant_type=client_credentials';
  restler.get(url).on('complete', function(result) {
    if (result instanceof Error) {
      cb(result.message);
    } else {
      appToken = querystring.parse(result)['access_token'];
      console.log('appToken acquired');
      cb();
    }
  });  
}

function handleChannelRequest(req, res, next) {
  res.set({
    'Content-Type': 'text/html',
    'Content-Length': channelDoc.length,
    'Pragma': 'public',
    'Cache-Control': 'max-age=31536000',
    'Expires': new Date(Date.now() + 31536000).toUTCString()
  });
  res.end(channelDoc);
}

// cb = function(result) 
function exchangeAccessToken(accessToken, cb) {
  var url = 
       'https://graph.facebook.com/oauth/access_token' + 
       '?client_id=' + process.env.FACEBOOK_APP_ID +
       '&client_secret=' + process.env.FACEBOOK_SECRET +
       '&grant_type=fb_exchange_token' +
       '&fb_exchange_token=' + accessToken;
  restler.get(url).on('complete', function(result) {
    if (result instanceof Error) {
      cb(result);
    } else {    
      cb({
        secret: querystring.parse(result)['access_token'], 
        expires: new Date(Date.now() + querystring.parse(result)['expires'] * 1000)
      });
    }
  });  
}

exports.init = init;
exports.channel = handleChannelRequest;
exports.exchangeAccessToken = exchangeAccessToken;
