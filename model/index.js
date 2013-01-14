var mongo = require('mongodb');
var fb = require('../fb');

/////////////////////////////////////////////////////////////////////////////////
//
// How this module is patterned:
//
// The functions in this module take incomplete user objects as input.
//
// The uid property of the user object is mapped to _id in the database.
//
// The get functions use the uid from the user object to get one
// or more properties from the database, and then adds these properties to 
// the user object.
//
// The save functions use the uid and one or more properties from the
// user object, and writes these into the database.
//
// The callback functions all have the same signature: function(err), where
// err will be undefined or an instance of Error.
//
/////////////////////////////////////////////////////////////////////////////////

// Make sure we can connect to database.
exports.init = function(cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(new Error('failed to connect to database'));
    db.close(); // in case another init method fails, program will exit
    cb();
  });
};

// Input: user.uid
// Reads: user.secret, user.expires
exports.getSecret = function(user, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').findOne(
      { _id: user.uid }, 
      { secret: 1, expires: 1, _id: 0 }, 
      function(err, dbUser) {
        if (err) return cb(err);
        if (dbUser) {
          user.secret = dbUser.secret;
          user.expires = dbUser.expires;
        } else {
          console.log('WARNING: user not found');
        }
        cb();
      }
    );
  });
};

// Input: user.uid, user.secret, user.expires
// Writes: user.secret, user.expires
// Note: This function creates user documents when needed.
exports.saveSecret = function(user, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').update(
      { _id: user.uid }, 
      { $set: { secret: user.secret, expires: user.expires } },
      { safe: true, upsert: true },
      function(err) {
        if (err) return cb(err);
        cb();
      }
    );
  });
};

// Input: user.uid
// Reads: user.gameState
exports.getGameState = function(user, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').findOne(
      { _id: user.uid }, 
      { gameState: 1, _id: 0 }, 
      function(err, dbUser) {
        if (err) return cb(err);
        if (dbUser.gameState) {
          user.gameState = dbUser.gameState;
        } else {
          user.gameState = { number: 0 }
        }
        cb();
      }
    );
  });
};

// Input: user.uid, user.gameState
// Writes: user.gameState
exports.saveGameState = function(user, cb) {
  mongo.Db.connect(process.env.MONGO_URI, function (err, db) {
    if (err) return cb(err);
    db.collection('users').update(
      { _id: user.uid }, 
      { $set: { gameState: user.gameState } },
      { safe: true },
      function(err) {
        if (err) return cb(err);
        cb();
      }
    );
  });
};
