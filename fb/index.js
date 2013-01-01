var querystring = require('querystring');
var https = require('https');

var appToken;

// options will be passed to http.request
// cb = function(data) where data is Error or Object
function send(options, cb) {
  var req = https.request(options, function(res) {
    var dataString;
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      if (dataString === undefined) dataString = chunk; else dataString += chunk;
    });
    res.on('end', function() {
      if (res.headers['content-type'].indexOf('text/plain') !== -1) {
        return cb(querystring.parse(dataString));
      }
      if (res.headers['content-type'].indexOf('application/json') !== -1) {
        try {
          return cb(JSON.parse(dataString));
        } catch (err) {
          err.message += '\nfb.send: ' + err.message + ' for message body = ' + dataString;
          return cb(err);
        }
      }
      cb(new Error('fb.send: unsupported content-type: ' + res.headers['content-type']));
    });
  });
  req.on('error', function(err) { cb(err); });
  req.end();  // send request
};

exports.init = function(cb) {  
  var options = {
    hostname: 'graph.facebook.com',
    path: '/oauth/access_token?' + 
          'client_id=' + process.env.FACEBOOK_APP_ID +
          '&client_secret=' + process.env.FACEBOOK_SECRET +
          '&grant_type=client_credentials',
    method: 'GET'
  };
  send(options, function(data) {
    if (data instanceof Error) {
      data.message += 'fb.init: Failed to get app token. Could be bad app id or secret or other error.\n'
      return cb(data);
    }
    if (data.access_token === undefined) {
      return cb(new Error('fb.init: app token not returned by facebook. data = ' + JSON.stringify(data)));
    }
    appToken = data.access_token;
    cb();
  });
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
    method: 'GET'
  };
  send(options, function(data) {
    if (data instanceof Error) {
      data.message += '\nfb.exchangeAccessToken: Failed.'
      return cb(data);
    }
    if (data.access_token === undefined || data.expires === undefined) {
      return cb(new Error('fb.exchangeAccessToken: Failed. data = ' + JSON.stringify(data)));
    }
    cb({
      secret: data.access_token, 
      expires: new Date(Date.now() + data.expires * 1000)
    });
  });
  req.on('error', function(e) { cb(e); });
  req.end();
};
