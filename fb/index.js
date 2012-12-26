var querystring = require('querystring');
var restler = require('restler');

var appToken;

exports.init = function(cb) {
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
};

// Exchange a short-lived access token for a long-lived one,
// which we call a secret.
exports.exchangeAccessToken = function(accessToken, cb) {
  var url = 
       'https://graph.facebook.com/oauth/access_token' + 
       '?client_id=' + process.env.FACEBOOK_APP_ID +
       '&client_secret=' + process.env.FACEBOOK_SECRET +
       '&grant_type=fb_exchange_token' +
       '&fb_exchange_token=' + accessToken;
  restler.get(url).on('complete', function(result) {
    if (result instanceof Error) return cb(err);    
    cb({
      secret: querystring.parse(result)['access_token'], 
      expires: new Date(Date.now() + querystring.parse(result)['expires'] * 1000)
    });
  });  
};
