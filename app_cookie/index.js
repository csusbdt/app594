var appCookieName = 'app594';

exports = module.exports = function(user) {
  return appCookieName + 
         '=' + JSON.stringify({ uid: user.uid, secret: user.secret }) + 
         '; Expires=' + new Date(user.expires).toUTCString() +
         '; Path=/; HttpOnly';
};
    
exports.cookieDelete = appCookieName + '=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT; Path=/; HttpOnly';
