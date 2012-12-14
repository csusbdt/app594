# Setup of the app594 project

This document is a record of how I set up the app594 project; students do not need to do this.

Here is a list of useful docs.

- [Managing Multiple Environments for an App](https://devcenter.heroku.com/articles/multiple-environments)
- [Creating Apps from the CLI](https://devcenter.heroku.com/articles/creating-apps)

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

I read [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support) to understand how to do the following.

Create file `package.json` with the following contents.

````
{
	"name": "app594",
	"version": "0.0.1",
	"dependencies": {
		"express": "2.5.x"
	},
	"engines": {
		"node": "0.8.x",
		"npm": "1.1.x"
	}
}
````

Install dependencies in local environment.  The npm command knows what to install by reading `package.json`

    npm install

The above command creates folder `node_modules` for the installed dependencies.  This folder does not need to be in the repository because it can be generated with the npm command by developers and the Heroku environment runs `npm intall --production` on deployment.  So, create file `.gitignore` with th following contents.

    node_modules

Create file `web.js` with the following contents.

````
var express = require('express');

var app = express.createServer(express.logger());

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

Test the app in the local development environment.

    foreman start

Go to the following URL in a browser to test the app.

    http://localhost:5000/

Commit to the master branch, push to github.

    git add .
    git commit -m "first runnable version"
    git push origin master

## Deploy into the staging environment

    git push staging master

Allocate a single web dyno. Anymore costs money.

    heroku ps:scale web=1



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





### Create 2 Facebook apps

Create app594 for production; create app594d for development.

Go to https://developers.facebook.com/apps and create a new app.  I  only entered the app name; I did not enter an optional namespace nor did I check the web hosting box.  I called the app `app594`.

I recorded the app id and secret.

App ID:	387071441377951
App Secret:	ee21f3627ae36e773d6f85758fda30c8



