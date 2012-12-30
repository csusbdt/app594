var async       = require('async');

var server      = require('./server');
var req_root    = require('./req_root');
var req_memfile = require('./req_memfile');
var game        = require('./game');
var fb          = require('./fb');

// http://www.smashingboxes.com/heroku-vs-amazon-web-services/
// See http://policy.heroku.com/aup for limits on RAM and storage
// For caching files, use http://nodejs.org/api/process.html#process_process_memoryusage
// to check for 512 MB memory limit.

// See the following for performance tips.
// http://engineering.linkedin.com/nodejs/blazing-fast-nodejs-10-performance-tips-linkedin-mobile
// See the section "2. Turn off socket pooling" in particular.

// Refer to following for caching
// https://devcenter.heroku.com/articles/increasing-application-performance-with-http-cache-headers

// For slug size, see https://devcenter.heroku.com/articles/slug-compiler
// See https://devcenter.heroku.com/articles/s3 for asset storage

if (process.env.FACEBOOK_APP_ID === undefined) throw new Error('FACEBOOK_APP_ID not defined');
if (process.env.FACEBOOK_SECRET === undefined) throw new Error('FACEBOOK_SECRET not defined');
if (process.env.MONGO_URI       === undefined) throw new Error('MONGO_URI not defined');
if (process.env.PORT            === undefined) throw new Error('PORT not defined');

// Remove spaces that foreman does not take out.
process.env.FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID.replace(' ', '');
process.env.FACEBOOK_SECRET = process.env.FACEBOOK_SECRET.replace(' ', '');
process.env.MONGO_URI = process.env.MONGO_URI.replace(' ', '');
process.env.PORT = process.env.PORT.replace(' ', '');

async.parallel(
  [
    function(cb) {
      req_root.init(function(err) {
        if (err) cb(err); else cb();
      });
    },
    function(cb) {
      req_memfile.init(function(err) { 
        if (err) cb(err); else cb();
      });
    },
    function(cb) {
      fb.init(function(err) { 
        if (err) cb(err); else cb();
      });
    },
    function(cb) {
      game.init(function(err) { 
        if (err) cb(err); else cb();
      });
    }
  ],
  function(err, result) {
    if (err) return console.log(err);
    server.start();
  }
);
