	# app594

## Overview 

This is a sample Facebook app for use with CSE 594.  The project files are stored in the Github repository located at the following location:

    http://github.com/csusbdt/app594

The project is setup to resemble a professional development environment, with deploys for development, staging and production.

## Background reading

- To learn about git, read [Pro Git](http://git-scm.com/book).
- To learn about the development environment, read [The Twelve-Factor App](http://www.12factor.net/).
- To learn about facebook integration, read [the Facebook developer docs](https://developers.facebook.com/docs/).
- Forserver-side authentication that includes a large number of identity providers, see [everyauth](http://everyauth.com/).

## Development environment

- Install git. (I think git comes with Heroku toolbelt, so a separate install of git may not be necessary; please test and let me know if you haven't yet installed git).
- Install Node.js.
- Install MongoDB.
- Have a Github account.
- Have a Facebook account.
- Have a Heroku account and install the Heroku toolbelt.
- Have a MongoLab account.

## Fork app594

Maybe the easiest way to work is for each developer to fork the app594 project and then clone the forked repository.  Then I can merge from their forked repositories.

## Local setup

Run the following to clone the remote repository.

    git clone https://github.com/csusbdt/app594.git (or FORKED REPO)

Install dependencies.

    cd app594
    npm install

Create file __.env__ with the following contents.

FACEBOOK_APP_ID=<your facebook app id>
FACEBOOK_SECRET=<your facebook app id>
MONGO_URI=mongodb://localhost:27017/app594d

Start local instance of the app.

    foreman start

Check that the app is running by going to the following URL in a browser.

    http://localhost:5000/


## Module documentation

- [asynch](https://github.com/caolan/async) 
- [MongoDB Documentation](http://docs.mongodb.org/manual/)
- [MongoDB Javascript driver](https://github.com/mongodb/node-mongodb-native)

## Notes

- The iPhone screen dimensions are 320 by 480.

