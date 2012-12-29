var appCookieName = 'app594';

exports = module.exports = function(user) {
  return appCookieName + 
         '=' + JSON.stringify({ uid: user.uid, secret: user.secret }) + 
         '; Expires=' + new Date(user.expires).toUTCString() +
         '; Path=/; HttpOnly';
};
    
exports.cookieDelete = appCookieName + '=deleted; Expires=Thu, 01-Jan-1970 00:00:01 GMT; Path=/; HttpOnly';

exports.extract = function(req) {
  var userCredentials;
  if (req.headers.cookie === undefined) return undefined;
  var startIndex = req.headers.cookie.indexOf(appCookieName);
  if (startIndex === -1) return undefined;
  startIndex += appCookieName.length + 1;
  // Cookie value may end with ';' but not guaranteed.
  var onePastEndIndex = req.headers.cookie.indexOf(';', startIndex);
  if (onePastEndIndex === -1) onePastEndIndex = req.headers.cookie.length;
  try {
    userCredentials = JSON.parse(req.headers.cookie.substring(startIndex, onePastEndIndex));
  } catch (e) {
    console.log('Bad app cookie.');
    return undefined;
  }
  return userCredentials;
}
