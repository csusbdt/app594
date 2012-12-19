var async = require('async');
var fb = require('./fb');
var rest = require('restler');
var querystring = require('querystring');

function getAppToken(cb) {
  var settings = {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET
  };
  fb.config(settings, function() {
    if (typeof fb.appToken !== 'string') {
      cb('returned app token not a string');
    } else {
      cb();
    }
  });
}

function getCsusbdtId(cb) {
  rest.get('https://graph.facebook.com/csusbdt?fields=id').on('complete', function(result) {
    if (result instanceof Error) {
      cb(result.message);
    } else {
      var csusbdtId = JSON.parse(result)['id'];
      if (csusbdtId != 1076781871) {
        cb('Incorrect id for csusbdt');
      } else {
        cb();
      }
    }
  });
}

// https://www.facebook.com/dialog/oauth/?client_id=433935356668511&redirect_uri=http://localhost:5000/&state=YOUR_STATE_VAL&response_type=token

function getCsusbdtAccessToken(cb) {
  var accessTokenUrl = 
    'https://www.facebook.com/dialog/oauth/?' + 
    'client_id=' + process.env.FACEBOOK_APP_ID +
    '&redirect_uri=http://localhost:5000/' +
    '&response_type=token' +
    'state=1234';
  rest.get(accessTokenUrl, { followRedirects: false }).on('complete', function(result, response) {
    if (result instanceof Error) {
      console.log('Error: ' + result.message + '\nRetrying in 5 seconds...');
      this.retry(5000);
    } else {
    console.log(result);
//console.log(querystring(response).param['access_token']);
      exports.accessToken = querystring.parse(result)['access_token'];
      cb();
    }
  });
}

// validate the access_token
// http://stackoverflow.com/questions/5406859/facebook-access-token-server-side-validation-for-iphone-app


async.series([
//    getAppToken,
//    getCsusbdtId,
    getCsusbdtAccessToken
  ],
  function(err, results) {
    if (err) {
      console.log(err);
    } else {
      console.log('All tests passed.');
    }
  }
);
