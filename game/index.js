var mongo = require('mongodb');
var fb = require('../fb');
var assert = require('assert');
//var querystring = require('querystring');
//var async = require('async');

//var mongoUri = 
//	process.env.MONGO_URI || 
//	'mongodb://localhost:27017/app594';

var gameHtmlString = 'to be continued ...';

var tokens = {};
var users = {};

////////////////////////////////////////////////////////////////////////
// Internal functions
////////////////////////////////////////////////////////////////////////
/*
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
*/

// cb = function(err, html)
function createGameHtmlString(cb) {
  fs.readFile('views/game.ejs', 'utf8', function(err, file) {
    if (err) { 
      gameHtmlString = err; 
      cb(err);
    } else {
      var ejsArgs = { 
        locals: { appId: process.env.FACEBOOK_APP_ID } 
      };
      gameHtmlString = ejs.render(file, ejsArgs);
      cb();
    }
  });
}

////////////////////////////////////////////////////////////////////////
// External functions
////////////////////////////////////////////////////////////////////////

// cb = function(err)
/*
function handleGamePageRequest(req, res) {
  if (typeof req.params.token !== undefined) {
    fb.exchangeAccessToken(req.params.token, function(err, secret, expires) {
    
    }
  }
  res.send(gameHtmlString);
}
*/

function init(cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').ensureIndex({ uid: 1 }, { unique: true, sparse: true });
    cb();
  });
}

function getUser(args, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) {
      assert(err instanceof Error);
      console.log("Connect err: " + err);
      cb(err);
      return;
    }
    var users = db.collection('users');
    var query = { uid: args.uid };
    users.findOne(query, function(err, user) {
      if (err) {
        assert(err instanceof Error);
        console.log("findAndModify err: " + err);
        cb(err);
        return;
      }
      cb(user);
    });
  });
}

function updateUser(args, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) {
      assert(err instanceof Error);
      console.log("Connect err: " + err);
      cb(err);
      return;
    }
    var users = db.collection('users');
    var query = { uid: args.uid };
    var sort = [];
    var update = { secret: args.secret, expires: args.expires };
    var options = { new: true, upsert: true };
    users.findAndModify(query, sort, update, options, function(err, user) {
      if (err) {
        assert(err instanceof Error);
        console.log("findAndModify err: " + err);
        cb(err);
        return;
      }
      /*
      if (user === null) {
        var user = { 
          uid: args.uid, 
          secret: args.secret, 
          expires: args.expires,
          number: 0
        };
        users.insert(user, function(err) {
          if (err) {
            assert(err instanceof Error);
            console.log("insert err: " + err);
            cb(err);
            return;
          }
          cb(user);
        });
        */
      //} else {
      if (typeof user.number === 'undefined') user.number = 0;
      cb(user);
    });
  });
}

function login(err, newToken) {
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

//exports.login = login;
//exports.getNumber = getNumber;
//exports.saveNumber = saveNumber;
exports.init = init;
exports.getUser = getUser;
exports.updateUser = updateUser;

