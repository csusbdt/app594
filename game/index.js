var mongo = require('mongodb');
var fb = require('../fb');
//var querystring = require('querystring');
//var async = require('async');

var mongoUri = 
	process.env.MONGOLAB_URI || 
	'mongodb://localhost:27017/app594d';

var tokens = {};
var users = {};

mongo.Db.connect(mongoUri, function (err, db) {
	if (err) {
		console.log("Connect err: " + err);
	} else {
		var users = db.collection('users');
		users.findOne({ }, function(err, user) {
			if (err) {
				console.log("findOne err: " + err);
			} else {
				console.log('user.token = ' + user.token);
			}
		});
	}
});

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
