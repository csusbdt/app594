var assert      = require('assert');
var querystring = require('querystring');
var https       = require('https');

var HEROKU_TIMEOUT = 30000,
    RETRY_WAIT = 4000,
    appToken;

function resend(options, cb) {
  if (options.accumulatedTimeout) options.accumulatedTimeout += RETRY_WAIT;
  else options.accumulatedTimeout = RETRY_WAIT;
  if (options.accumulatedTimeout > HEROKU_TIMEOUT) {
    return cb(new Error('fb.resend: too many failed retries'));
  }
  console.log('fb.resend: retrying');
  setTimeout(function() { send(options, cb); }, RETRY_WAIT);
}

// see https://developers.facebook.com/docs/reference/api/errors/
function checkError(options, data, cb) {
  if (data.error) {
    if (data.error.code == 1 || 
        data.error.code == 2 ||
        data.error.code == 4 ||
        data.error.code == 17) { 
      resend(options, cb);
    } else {
      cb(new Error('fb.checkError failed, data: ' + JSON.stringify(data)));
    }
  } else {
    cb(data);
  }
}

function parseTextPlain(options, dataString, cb) {
  var data = querystring.parse(dataString);
  checkError(options, data, function(data) {
    if (data instanceof Error) {
      data.message += '\nfb.parseTextPlain: dataString: ' + dataString;
    }
    cb(data);
  });
}

function parseApplicationJson(options, dataString, cb) {
  var data;
  try {
    data = JSON.parse(dataString);
  } catch (err) {
    err.message += '\nfb.parseApplicationJson: failed to parse Facebook application/json response';
    err.message += '\nfb.parseApplicationJson: Facebook message body: ' + dataString;
    return cb(err);
  }
  checkError(options, data, function(data) {
    if (data instanceof Error) {
      data.message += '\nfb.parseApplicationJson: dataString: ' + dataString;
    }
    cb(data);
  });
}

function parseTextJavascript(options, dataString, cb) {
  parseApplicationJson(options, dataString, function(data) {
    if (data instanceof Error) {
      data.message += '\nfb.parseTextJavascript: dataString: ' + dataString;
    }
    cb(data);
  });
}

// Send request and receive data (a Javascript object).
// options are the same as for http.request
// cb = function(data) where data is Error or Object
function send(options, cb) {
  var req;
  
  // create request
  req = https.request(options, function(res) {
    var dataString;  // to be converted to Javascript object
    
    // tell node how to convert received bytes to a Javascript string
    res.setEncoding('utf8');
    
    // accumulate data
    res.on('data', function (chunk) {
      if (dataString === undefined) dataString = chunk; else dataString += chunk;
    });
    
    // parse received data
    res.on('end', function() {
      if (res.headers['content-type'].indexOf('text/plain') !== -1) {
        parseTextPlain(options, dataString, cb);
      } else if (res.headers['content-type'].indexOf('application/json') !== -1) {
        parseApplicationJson(options, dataString, cb);
      } else if (res.headers['content-type'].indexOf('text/javascript') !== -1) {
        parseTextJavascript(options, dataString, cb);
      } else {
        cb(new Error('fb.send: unsupported content-type: ' + res.headers['content-type']));
      }
    });
  });
  
  // register error listener
  req.on('error', function(err) { 
    err.message += '\nfb.send: request error';
    cb(err); 
  });
  
  // send request
  req.end();
};

exports.send = send;  // for test

// cb = function(appToken) 
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
      data.message += '\nfb.init: Failed to get app token. Could be bad app id or secret.';
      return cb(data);
    }
    if (data.access_token === undefined) {
      return cb(new Error(
        'fb.init: access_token not returned by facebook.' +
        '\nfb.init: Facebook returned: ' + JSON.stringify(data)
      ));
    }
    appToken = data.access_token;
    cb(appToken);
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
      return cb(new Error(
        'fb.exchangeAccessToken: access_token or expires not returned by facebook.' +
        '\nfb.exchangeAccessToken: Facebook returned: ' + JSON.stringify(data)
      ));
    }
    cb({
      secret: data.access_token, 
      expires: new Date(Date.now() + data.expires * 1000)
    });
  });
};
