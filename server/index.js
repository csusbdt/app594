var http        = require('http');
var url         = require('url');

var root    = require('../req_root');
var save    = require('../req_save');
var channel = require('../req_channel');
var mem     = require('../req_mem');
var memfile = require('../req_memfile');

function route(req, res) {
  var pathname = url.parse(req.url).pathname;
  if      (pathname === '/')             root.redirectHome (req, res);
  else if (pathname === '/home')         root.handle       (req, res);
  else if (pathname === '/save')         save.handle       (req, res);
  else if (pathname === '/channel.html') channel.handle    (req, res);
  else if (pathname === '/mem')          mem.handle        (req, res);
  else                                   memfile.handle    (req, res);
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
