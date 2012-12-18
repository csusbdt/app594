var querystring = require('querystring');
var rest = require('restler');

var html = 'Not ready. Please try again.';

exports.html = function(req, res) {
  res.send(html);
};

exports.config = function(config, cb) {
  var appTokenUrl = 
    'https://graph.facebook.com/oauth/access_token?' + 
    'client_id=' + config.appId +
    '&client_secret=' + config.appSecret +
    '&grant_type=client_credentials';
  rest.get(appTokenUrl).on('complete', function(result) {
    if (result instanceof Error) {
      console.log('Error: ' + result.message + '\nRetrying in 5 seconds...');
      this.retry(5000);
    } else {
      exports.appToken = querystring.parse(result)['access_token'];
      cb();
    }
  });
  require('fs').readFile('html.ejs', 'utf8', function(err, file) {
    if (err) {
      console.log(err);
      html = err;
    } else {
      html = require('ejs').render(file, {
        locals: { 
          appId: config.appId
        }
      });
    }
  });  
};

(function() {
  var body = '<script src="//connect.facebook.net/en_US/all.js"></script>';
  var contentLength = '' + body.length;
  exports.channel = function(req, res) {
    res.set({
  	  'Content-Type': 'text/html',
    	'Content-Length': contentLength,
  	  'Pragma': 'public',
  	  'Cache-Control': 'max-age=31536000',
      'Expires': new Date(Date.now() + 31536000).toUTCString()
    });
    res.end(body);
  };
})();
