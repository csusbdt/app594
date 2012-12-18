var fb = require('./fb');

fb.config({
    appId: process.env.FACEBOOK_APP_ID,
    appSecret:  process.env.FACEBOOK_APP_SECRET
  },
  function() {
    console.log('App Token: ' + fb.appToken);
  }
);
