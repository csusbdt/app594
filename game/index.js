var fb = require('../fb');
//var querystring = require('querystring');
//var async = require('async');

var tokens = {};
var users = {};

// cb = function(err, newToken)
function login(args, cb) {
  fb.exchangeAccessToken(args.accessToken, function(err, newToken, expires) {
    var user;
    if (err) {
      cb(err); 
    } else {
      user = { 
        uid: args.uid, 
        token: newToken, 
        number: 0, 
        expires: expires 
      };
      tokens[user.token] = user;
      users[user.uid] = user;    
      cb(null, newToken);
    }
  });
}

// cb = function(err, number)
function getNumber(accessToken, cb) {
  var user = tokens[accessToken];
  if (typeof user === 'undefined') {
    cb('unauthorized');
  } else {
    cb(null, user.number);
  }
}

// cb = function(err)
function saveNumber(args, cb) {
  var user = tokens[args.accessToken];
  if (typeof user === 'undefined') {
    cb('unauthorized');
  } else {
    user.number = args.number;
    cb(null);
  }
}

exports.login = login;
exports.getNumber = getNumber;
exports.saveNumber = saveNumber;
