var querystring = require('querystring');
var https = require('https');

var appToken;

exports.init = function(cb) {
  var result;
  var options = {
    hostname: 'graph.facebook.com',
    path: '/oauth/access_token?' + 
          'client_id=' + process.env.FACEBOOK_APP_ID +
          '&client_secret=' + process.env.FACEBOOK_SECRET +
          '&grant_type=client_credentials',
    method: 'GET',
    agent: false  // doesn't matter here, but need for other interactions
  };
  var req = https.request(options, function(res) {
    res.on('data', function (chunk) {
      if (result === undefined) result = chunk;
      else result += chunk;
    });
    res.setEncoding('utf8');
    res.on('end', function() {
      appToken = querystring.parse(result)['access_token'];
      cb();
    });
  });
  req.on('error', function(e) { cb(e); });
  req.end();
};

// Exchange a short-lived access token for a long-lived one,
// which we call a secret.
exports.exchangeAccessToken = function(accessToken, cb) {
  var result;
  var options = {
    hostname: 'graph.facebook.com',
    path: '/oauth/access_token' + 
          '?client_id=' + process.env.FACEBOOK_APP_ID +
          '&client_secret=' + process.env.FACEBOOK_SECRET +
          '&grant_type=fb_exchange_token' +
          '&fb_exchange_token=' + accessToken,
    method: 'GET',
    agent: false  // See http://engineering.linkedin.com/nodejs/blazing-fast-nodejs-10-performance-tips-linkedin-mobile
  };
  var req = https.request(options, function(res) {
    res.on('data', function (chunk) {
      if (result === undefined) result = chunk;
      else result += chunk;
    });
    res.setEncoding('utf8');
    res.on('end', function() {
      cb({
        secret: querystring.parse(result)['access_token'], 
        expires: new Date(Date.now() + querystring.parse(result)['expires'] * 1000)
      });
    });
  });
  req.on('error', function(e) { cb(e); });
  req.end();
};
