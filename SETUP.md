# Setup of the app594 project


## Overview

This document is a record of how I set up the app594 project.  These are the steps a release manager would follow to setup a project; other project developers do not do this.


## Create a git repository for the project

Create a repository at Github; select to include a README file, which will contain links to readings and instructions on how to set up a local development environment.

Clone the repository with the following.

    git clone https://github.com/csusbdt/app594.git

At this point, there is 1 remote repository location called `origin`.  To see this, run the following.

    git remote

To see the location of this remote repository, run the following.

    git remote -v

## Create Heroku apps for staging and production

Inside the app594 folder, run the following 2 commands to create remote Heroku apps for staging and release deployments of the project.

    heroku apps:create app594s --remote staging
    heroku apps:create app594 --remote production

As a result, the staging and production urls are the following.

    http://app594s.heroku.com
    http://app594.heroku.com

To see these Heroku apps, run the following.

    heroku apps

Also, the _heroku apps:create_ command given above configures the local repository with 2 additional remote locations named _staging_ and _production_.  To see these, along with _origin_, run the following.

    git remote -v

Note that when other project developers clone the repository from Github, their repositories will only contain a reference to the remote at Github called _origin_.

## Create Facebook apps for development, staging and production

### development

Go to https://developers.facebook.com/apps and create a new app named app594d with the following settings.

- For the app display name, use "App 594d". 
- For the app namespace, use `appfnfd`. 
- For the app domain, use `localhost`.
- Enable sandbox mode so that only developers will be able to use the app.
- Under the integration options, select _Website with Facebook Login_ and for the site url use `http://localhost:5000/`.

To deploy a local development instance, the system needs access to the app's Facebook id and secret.  We pass this to the server as the following 2 environmental variables.

    FACEBOOK_APP_ID = <development app id>
    FACEBOOK_APP_SECRET = <development app secret>

Place the above 2 lines in a file named `.env`.  This file will be read by the foreman program that we will use to launch the app llocally.

Other developers will set different values for their development deployment, so omit `.env` from repository by adding it to `.gitignore`.


### staging

Create another app named app594s with the following settings.

- For the app display name, use "App 594s".
- For the app namespace, use `appfnfs`. 
- For the app domain, use `app594s.herokuapp.com`.
- Enable sandbox mode so that only developers will be able to use the app.
- Under the integration options, select _Website with Facebook Login_ and for the site url use `http://app594s.herokuapp.com/`.

Use the `heroku config:add` command to write the app id and secret into the Heroku's execution environment for the staging app.

    heroku config:add --app app594s FACEBOOK_APP_ID=<staging id>
    heroku config:add --app app594s FACEBOOK_APP_SECRET=<staging secret>

You can check these settings by using the following command.

    heroku config --app app594s


### production

Create another app named app594 with the following settings.

- For the app display name, use "App 594".
- For the app namespace, use `appfnf`. 
- For the app domain, use `app594.herokuapp.com`.
- Leave sandbox mode disabled.
- Under the integration options, select _Website with Facebook Login_ and for the site url use `http://app594.herokuapp.com/`.

Use the `heroku config:add` command to write the app id and secret into the Heroku's execution environment for the production app.

    heroku config:add --app app594 FACEBOOK_APP_ID=<production id>
    heroku config:add --app app594 FACEBOOK_APP_SECRET=<production secret>

You can check these settings by using the following command.

    heroku config --app app594

## Create Mongo databases

Install Mongo locally for testing in the development deployment.  Use the binary distribution provided through the MongoDB website (referred to as the 10gen builds).  Note that there are easier approaches to installing mongo, but this approach will work on all possible development platforms that your developrs might use: Windows, OS X and Linux.

The following runs Mongo locally.

    mongod

Create 2 Mongo databases through the MongoLab website, a database for staging named _app594s_ and another for production named _app594_. Make a database user for each database.  Make a note of the driver-based connection strings for these 2 databases provided through the MongoLab Web site.

Use the `heroku config:add` command to write the driver-based connection strings into the staging and production Heroku execution environments.

    heroku config:add --app app594s MONGOLAB_URI=<staging string>
    heroku config:add --app app594  MONGOLAB_URI=<production string>

You can check the settings by using the following command.

    heroku config --app app594s
    heroku config --app app594

## Configure dependencies

Determine the versions of node and npm installed.  (Make sure they are current.)

    node --version
    npm --version

Determine the most recent version of express, ejs, mongodb, everyauth.

    npm view express version
    npm view ejs version
    npm view mongodb version
    npm view everyauth version

Create a file named `package.json` with the following contents.  (Make sure the version numbers match with what you have installed.)

````
{
    "name": "app594",
    "version": "0.0.1",
    "description": "App illustrating integration of MongoDB, Nodejs, Heroku, and Facebook",
    "dependencies": {
        "express": "3.0.4",
        "ejs": "0.8.3",
        "everyauth": "0.3.1",
        "mongodb": "1.2.5"
    },
    "engines": {
        "node": "0.8.14",
        "npm": "1.1.65"
    }
}
````

Install dependencies in local environment.  The npm command knows what to install by reading `package.json`.

    npm install

Run the following to see the installed modules.

    npm ls

The above command creates folder `node_modules` for the installed dependencies.  This folder should not be in the repository.  Each developer who clones the repository needs to run `npm install` to install the dependent modules.  Also, when the project is deployed for staging or production, the Heroku environment runs `npm intall --production` automatically. So, create file `.gitignore` with the following contents.

    node_modules


---

#CONTINUE FROM HERE

---


## Tests

The following tests verify conceptual understanding and correctness of the configuration.

### test-server-init

When the server starts, it uses its facebook app id and secret to retrieve a secret app token, which it will use to make calls into the graph API.

Isolate retrieval of the app token in a module named `fb-app-token`.  The test is contained in `test-fb-app-token`.

````
require('./fb-app-token');

````


## Test the development deployment

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




## Create first app



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



look at http://ckrack.github.com/fbootstrapp/

