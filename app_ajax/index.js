var querystring = require('querystring');

var MAX_BODY = 256;

// cb = function(data) where data is Error or Object
exports.parse = function(req, cb) {
  var dataString;
  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    if (chunk.length > MAX_BODY) {
      return cb(new Error('app_ajax.parse: chunk exceeds ' + MAX_BODY));
    }
    if (dataString === undefined) dataString = chunk; else dataString += chunk;
  });
  req.on('end', function() {
    if (dataString.length > MAX_BODY) {
      return cb(new Error('app_ajax.parse: dataString exceeds ' + MAX_BODY));
    }
    if (dataString === undefined || dataString.length === 0) return cb({});
    try {
      return cb(JSON.parse(dataString));
    } catch (err) {
      err.message += '\napp_ajax.parse: ' + err.message + ' for message body = ' + dataString;
      return cb(err);
    }
  });
};

exports.reply = function(res, data) {
  if (typeof data !== 'object') return cb(new Error('app_ajax: reply must be passed an object'));
  var buf = new Buffer(JSON.stringify(data), 'utf8');
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': buf.length,
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, no-store'
  });
  res.end(buf);
};

exports.error = function(res) {
  var buf = new Buffer(JSON.stringify({'error': 'unspecified error'}), 'utf8');
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': buf.length,
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, no-store'
  });
  res.end(buf);
};

exports.ok = function(res) {
  var buf = new Buffer(JSON.stringify({}), 'utf8');
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': buf.length,
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, no-store'
  });
  res.end(buf);
};
