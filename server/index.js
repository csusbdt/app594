var http        = require('http');
var url         = require('url');

var req_home    = require('../req_home');
var req_save    = require('../req_save');
var req_channel = require('../req_channel');
var req_mem     = require('../req_mem');
var req_memfile = require('../req_memfile');

function route(req, res) {
  var pathname = url.parse(req.url).pathname;
  if      (pathname === '/')             req_home.redirectHome (req, res);
  else if (pathname === '/home')         req_home.handle       (req, res);
  else if (pathname === '/save')         req_save.handle       (req, res);
  else if (pathname === '/channel.html') req_channel.handle    (req, res);
  else if (pathname === '/mem')          req_mem.handle        (req, res);
  else                                   req_memfile.handle    (req, res);
}

function requestHandler(req, res) {
  // Make sure messages are sent over https when deployed through Heroku.
  // See https://devcenter.heroku.com/articles/http-routing
  if (req.headers['x-forwarded-proto'] === 'https' ||    // common case
      req.headers['x-forwarded-proto'] === undefined) {
    route(req, res);
  } else {
    res.writeHead(302, { 'Location': "https://" + req.headers.host + req.url });
    res.end();
  }
}

exports.start = function() {
  http.createServer(requestHandler).listen(process.env.PORT, function(err) {
    if (err) console.log(err);
    else console.log("listening on " + process.env.PORT);
  });
};
