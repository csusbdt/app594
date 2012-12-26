var mongo = require('mongodb');
var assert = require('assert');
var fb = require('../fb');

exports.init = function(cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').ensureIndex({ uid: 1 }, { unique: true, sparse: true });
    cb();
  });
};

exports.getUser = function(uid, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').findOne({ uid: uid }, function(err, user) {
      if (err) cb(err); 
      else cb(user);
    });
  });
};

exports.updateUser = function(props, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    var users = db.collection('users');
    var query = { uid: props.uid };
    var sort = [];
    var update = { secret: props.secret, expires: props.expires };
    var options = { new: true, upsert: true };
    users.findAndModify(query, sort, update, options, function(err, user) {
      if (err) return cb(err);
      if (user.number === undefined) user.number = 0;
      cb(user);
    });
  });
};

/*
exports.saveNumber = function(args, cb) {
  var user = tokens[args.accessToken];
  if (typeof user === 'undefined') {
    cb('unauthorized');
  } else {
    user.number = args.number;
    cb(null);
  }
};
*/

