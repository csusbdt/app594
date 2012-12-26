var mongo = require('mongodb');
var assert = require('assert');
var fb = require('../fb');

//var ObjectID = mongo.ObjectID;

// Notes:
// (1) A "user" document in code may not include all the data from the database.
// (2) user.gameState is undefined until first call to saveGameState.
// (3) user.uid is mapped to the mongo key field _id

exports.init = function(cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
//    db.collection('users').ensureIndex({ uid: 1 }, { unique: true, sparse: true });
    cb();
  });
};

exports.getUser = function(uid, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').findOne({ _id: uid }, function(err, user) {
      if (err) return cb(err);
      if (user.gameState === undefined) user.gameState = { number: 0 };
      user.uid = uid;
      delete user._id;
      cb(user);
    });
  });
};

exports.saveSecret = function(user, cb) {
  console.log('saving secret: ' + user.uid + " " + user.secret);
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').findAndModify(
      { _id: user.uid },  // query
      [],  // sort
      { _id: user.uid, secret: user.secret, expires: user.expires },  // update
      { 'new': false, upsert: true },  // options
      function(err, dbUser) {
        if (err) return cb(err);
        if (dbUser && dbUser.gameState) {
          console.log('gameState existing');
          user.gameState = dbUser.gameState;
        } else {
          console.log('gameState not existing');
          user.gameState = { number: 0 };
        }
        cb();
      }
    );
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

