var querystring = require('querystring');
var async = require('async');
var rest = require('restler');
var html = 'Not ready. Please try again.';
var appId;
var appSecret;
var appToken;
var channelDoc = '<script src="//connect.facebook.net/en_US/all.js"></script>';

exports.channel = function (req, res) {
  res.set({
    'Content-Type': 'text/html',
    'Content-Length': channelDoc.length,
    'Pragma': 'public',
    'Cache-Control': 'max-age=31536000',
    'Expires': new Date(Date.now() + 31536000).toUTCString()
  });
  res.end(channelDoc);
};

// see http://stackoverflow.com/questions/5406859/facebook-access-token-server-side-validation-for-iphone-app
function validateUser(uid, accessToken, cb) {
  cb();
}

function parseHtmlFile(cb) {
  function readFileCallback(err, file) {
    if (err) {
      html = err;
      cb(err);
    } else {
      html = require('ejs').render(file, { locals: { appId: appId } });
      cb();
    }
  }    
  require('fs').readFile('public/index.html', 'utf8', readFileCallback); 
}

function getAppToken(cb) {
  var url = 
    'https://graph.facebook.com/oauth/access_token?' + 
    'client_id=' + appId +
    '&client_secret=' + appSecret +
    '&grant_type=client_credentials';
  rest.get(url).on('complete', function(result) {
    if (result instanceof Error) {
      console.log('Error: ' + result.message + '\nRetrying in 5 seconds...');
      this.retry(5000);
    } else {
      appToken = querystring.parse(result)['access_token'];
      cb();
    }
  });  
}

exports.init = function(config, cb) {
  appId = config.appId;
  appSecret = config.appSecret;   
  async.parallel([
      parseHtmlFile,
      getAppToken
    ], 
    function(err, result) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    }
  );
};

exports.html = function(req, res) {
  res.send(html);
};

exports.start = function(req, res) {
};
