// Unless otherwise stated, callbacks have the form function(err).

var querystring = require('querystring');
//var async = require('async');
var restler = require('restler');
var appToken;

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
    if (result instanceof Error) return cb(result);
    appToken = querystring.parse(result)['access_token'];
    cb();
  });  
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
//exports.channel = handleChannelRequest;
exports.exchangeAccessToken = exchangeAccessToken;
