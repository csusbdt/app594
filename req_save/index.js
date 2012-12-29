var querystring = require('querystring');
var cookie = require('../app_cookie');
var game = require('../game');

exports = module.exports = function() {
  return req_save;
};

function error(req, res, err) {
  console.error(err.message);
  res.end(500, { error: err.message });
}

function req_save(req, res) {
  if (req.method !== 'POST') return error(req, res, new Error('not supported'));
  var MAX_BODY = 256,  // what about max header?
      body;
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    if (chunk.length > MAX_BODY) {
      return res.end();
    }
    if (body === undefined) body = chunk;
    else body += chunk;
    if (body.length > MAX_BODY) {
      return res.end();
    }
  });
  req.on('end', function () {
    var user = {},
        data;
    try {
      data = querystring.parse(body);
    } catch (err) {
      return error(err);
    }
    user.uid = data.uid;
    user.secret = data.secret;
    game.getSecret(user, function(err) {
      if (err) return error(err);
      if (data.secret !== user.secret) {
        res.setHeader('Set-Cookie', cookie.cookieDelete);
        return res.end('{ login: true }');
      }
      try {
        user.gameState = JSON.parse(data.gameState);
      } catch (err) {
        return error(err);
      }
      game.saveGameState(user, function(err) {
        if (err) return error(err);
        res.end('{}');  // all good
      });
    });
  });
};
