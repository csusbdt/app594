var querystring = require('querystring');
var cookie = require('../app_cookie');
var model = require('../model');
var ajax = require('../app_ajax');

function error(res, err) {
  console.error('req_save: ' + err.message);
  res.end(500, { error: err.message });
}

exports.handle = function(req, res) {
  ajax.parse(req, function(data) {
    if (data instanceof Error) {
      console.log('req_save: failed to parse incoming data: ' + data.message);
      return ajax.error(res);
    }
    var user = {};
    if (data.uid === undefined) {
      console.log('req_save: uid missing from req: ' + JSON.stringify(data));
      return ajax.error(res);
    }
    if (data.secret === undefined) {
      console.log('req_save: secret missing from req: ' + JSON.stringify(data));
      return ajax.error(res);
    }
    if (data.gameState === undefined) {
      console.log('req_save: gameState missing from req: ' + JSON.stringify(data));
      return ajax.error(res);
    }
    user.uid = data.uid;
    model.getSecret(user, function(err) {
      if (err) {
        console.log('req_save: failed to get secret from db: ' + err.message);
        return ajax.error(res);
      }
      if (data.secret !== user.secret) {
        res.setHeader('Set-Cookie', cookie.cookieDelete);
        return ajax.reply(res, { login: true });
      }
      user.gameState = data.gameState;
      model.saveGameState(user, function(err) {
        if (err) {
          console.log('req_save: failed to save game state into db: ' + err.message);
          return ajax.error(res);
        }
        ajax.ok(res);
      });
    });
  });
};
