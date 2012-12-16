# Setup of the app594 project

This document is a record of how I set up the app594 project; students (developers) do not need to do this.  This is done by one person (the build manager or release engineer).

Here is a list of useful docs.

- [Managing Multiple Environments for an App](https://devcenter.heroku.com/articles/multiple-environments)
- [Creating Apps from the CLI](https://devcenter.heroku.com/articles/creating-apps)
- [foreman](http://blog.daviddollar.org/2011/05/06/introducing-foreman.html)
- [Heroku Facebook template](https://github.com/heroku/facebook-template-nodejs)
- [Getting started with Facebook login](https://developers.facebook.com/docs/howtos/login/getting-started/)

## Create a git repository for the project

Create a repository at Github; select to include a README file, which will contain links to readings and instructions on how to set up a local development environment.

Clone the repo with the following.

    git clone https://github.com/csusbdt/app594.git

## Create Heroku apps for staging and production

I ran the following commands in my local repository for app594.

Create a Heroku app to serve as the production environment.

    heroku apps:create app594 --remote production

As a result, the production url is the following.

    http://app594.heroku.com

This also creates a remote branch called `production` with the following location.

    git@heroku.com:app594.git

Create another Heroku app to serve as the staging environment.

    heroku apps:create app594s --remote staging

As a result, the staging url is the following.

    http://app594s.heroku.com

This also creates a remote branch called `staging` with the following location.

    git@heroku.com:app594s.git

There are now three remote locations, origin, production and staging; to see them, run the following.

    git branch

To see all your Heroku apps, run the following.

    heroku apps

## Create first app

I ran the following to determine the version of node that I have installed.

    node --version

The following gave me the version of npm installed.

    npm --version

I ran the following to determine the version of the most recent version of express, which I will specify as a dependency.

    npm view express version

I read [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support) to understand how to do the following.

Create file `package.json` with the following contents.

````
{
	"name": "app594",
	"version": "0.0.1",
	"dependencies": {
		"express": "3.0.4"
	},
	"engines": {
		"node": "0.8.14",
		"npm": "1.1.65"
	}
}
````

Install dependencies in local environment.  The npm command knows what to install by reading `package.json`

    npm install

The above command creates folder `node_modules` for the installed dependencies.  This folder does not need to be in the repository because it can be generated with the npm command by developers and the Heroku environment runs `npm intall --production` on deployment.  So, create file `.gitignore` with th following contents.

    node_modules

Run the following to see the installed modules.

    npm ls

Create file `web.js` with the following contents.

````
var express = require('express');

var app = express();

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
````

Create file `Procfile` with the following contents.  This file says to run the command `node web.js` on in a web process (a _web dyno_).

    web: node web.js

The Procfile specifies the processes to start up on deployment (or re-deployment).  Heroku uses the foreman program to start the processes specified in the Procfile, both locally and on Heroku. To test the app in the local development environment, run the following.

    foreman start

Go to the following URL in a browser to test the app.

    http://localhost:5000/

Commit to the master branch, push to github.

    git add .
    git commit -m "first runnable version"
    git push origin master

## Deploy into the staging environment

    git push staging master

Check that a single web dyno is allocated.

    heroku ps --app app594s

If you need to, allocate a single web dyno; more than one costs money.

    heroku ps:scale web=1

Test the staged app by going to the following url in a browser.

    http://app594s.herokuapp.com/


## Deploy into the production environment

    git push production master

Check that a single web dyno is allocated.

    heroku ps --app app594

If you need to, allocate a single web dyno; more than one costs money.

    heroku ps:scale web=1

Test the staged app by going to the following url in a browser.

    http://app594.herokuapp.com/

## Create a Facebook app for development

Go to https://developers.facebook.com/apps and create a new app named app594d. 

For the app display name, use "App 594d." 

For the app namespace, use `app-five-ninety-four-d`. 

For the app domain, use `localhost`.

Enable sandbox mode so that only developers will be able to use the app.

Under the integration options, select _Website with Facebook Login_ and use the following for the site url.

    http://localhost:5000/

Determine the latest version number for ejs.

    npm info ejs version

Edit `package.json` to include ejs.  Install ejs locally.

    npm install

Change the contents of `web.js` to the following. 

````
var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
var indexHtml = 'Starting server. Please try again.';

require('fs').readFile('index.ejs', 'utf8', function(err, file) {
  if (err) {
    console.log(err);
    indexHtml = err;
  } else {
    indexHtml = require('ejs').render(file, {
      locals: { 
        appId: process.env.FACEBOOK_APP_ID
      }
    });
  }
});

app.get('/', function(req, res) {
  res.send(indexHtml);
});

// Return channel.html with one-year cache duration.
app.get('/channel.html', function(req, res) {
  var body = '<script src="//connect.facebook.net/en_US/all.js"></script>';
  res.set({
  	'Content-Type': 'text/html',
  	'Content-Length': body.length,
  	'Pragma': 'public',
  	'Cache-Control': 'max-age=31536000',
    'Expires': new Date(Date.now() + 31536000).toUTCString()
  });
  res.end(body);
});

app.use(express.static(__dirname + '/public'));

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, err.stack);
});

app.listen(port, function() {
  console.log("Listening on " + port);
});
````

Create file `.env` with the following contents; foreman will use this to modify the environment.

    FACEBOOK_APP_ID=433935356668511

Because this setting is only for local development deployment, and because other developers will set a different value, omit `.env` from repository by adding to `.gitignore`.

Create folder `public/js` and place a copy of jquery into it.

Create a file named `index.ejs` with the following contents.

````
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>App 594</title>
  </head>
  <body>
    <div id="fb-root"></div>
    <p>
      This site implements the process for the scenario titled 
      <i>My site only uses Facebook for Registration</i> described in
      <a href="https://developers.facebook.com/docs/user_registration/flows/">User Registration Flows</a>.
    </p>

    <div id="msg"></div>

    <button id="login" onclick="login()" style="display: none">Login</button>

    <script src="js/jquery-1.8.3.min.js"></script>
    <script>
      function login() {
        FB.login(function(response) {
          if (response.authResponse) {
            FB.api('/me', function(response) {
              $('#login').hide();
              $('#msg').html('Hello, ' + response.name + '.');
            });
          } else {
              $('#msg').html('Authorization cancelled.');
          }
        });
      }

      window.fbAsyncInit = function() {
        FB.init({
          appId      : '<%= appId %>',
          channelUrl : '://' + window.location.host + '/channel.html',
          status     : true,  // Check the login status upon init.
          cookie     : true,  // Set session cookies to allow your server to access the session.
          xfbml      : false  // Parse XFBML tags on this page.
        });
        FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            $('#msg').html('Welcome back.');
          } else {
            $('#login').show();
          }
        });
      };
    
      // Load the SDK's source Asynchronously.
      (function(d){
         var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement('script'); js.id = id; js.async = true;
         js.src = "//connect.facebook.net/en_US/all.js";
         ref.parentNode.insertBefore(js, ref);
       }(document));
    </script>

  </body>
</html>
````
Run server and test with a browser.

    foreman start

Go to http://localhost:5000/ in a browser.


## Create a Facebook app for staging

Go to https://developers.facebook.com/apps and create a new app named app594s. 

For the app display name, use "App 594s." 

For the app namespace, use `app-five-ninety-four-s`. 

For the app domain, use `app594s.herokuapp.com`.

Enable sandbox mode so that only developers will be able to use the app.

Under the integration options, select _Website with Facebook Login_ and use the following for the site url.

    http://app594s.herokuapp.com/

TO BE CONTINUED

heroku config:add FACEBOOK_APP_ID=12345



## Create 3 Facebook apps

Create app594 for production, app594s for staging, and app594d for development.

Go to https://developers.facebook.com/apps and create 3 new apps named app594d, app594s, app594.  I  only entered the app name in each case; I did not enter an optional namespace nor did I check the web hosting box.  I made a note of the app id and app secret for each of the 3 apps.






I first tried to get the development app to work.

I referred to the following github project as a reference to contruct this app.

    https://github.com/heroku/facebook-template-nodejs

Determine the version number of the most recent release of the faceplate module.

    npm view faceplate version

Add the following line to the dependencies array in `package.json`.

    'faceplate': '0.4.0'

Install faceplate and dependencies.

    npm install

Change the contents of `web.js` to the following. 

````

````


I recorded the app id and secret.

app594:

App ID:	387071441377951
App Secret:	ee21f3627ae36e773d6f85758fda30c8

app594s:
App ID:	141880709295917
App Secret:	da1e548a335405262a93e72cdc8c28e3

app594d:
App ID:	433935356668511
App Secret:	f84820a6e277584e519f560430349fd4




look at http://ckrack.github.com/fbootstrapp/



## Add MongoDB support





---



[This gist](https://gist.github.com/1709617) shows how to create a simple static website with Nodejs.

````
var express = require('express');
var port = process.env.PORT || 3000;
var app = express.createServer();
 
app.get('/', function(request, response) {
    response.sendfile(__dirname + '/index.html');
}).configure(function() {
    app.use('/images', express.static(__dirname + '/images'));
}).listen(port);
````
