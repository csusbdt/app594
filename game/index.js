//var querystring = require('querystring');
//var async = require('async');

// cb = function(err, number)
function getNumber(cb) {
  cb(null, 3);
}

// cb = function(err)
function saveNumber(number, cb) {
  cb(null);
}

exports.getNumber = getNumber;
exports.saveNumber = saveNumber;
