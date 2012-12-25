# APP 594 Communication Flows

## Overview

This document describes the communication flows between the subsystems comprising this application.  The application is a trivial Facebook game.  Each player is assigned a number variable initialized to zero when they first authenticate to the system. The user can increment the number stored in the variable by clicking a button.  The user interface also displays the largest number across all players in the system.

### Subsystems

This description of the system includes communications between the following 4 subsystems.

- __browser__ the end user browser
- __server__ the app server 
- __db__ the app database 
- __fb__ Facebook

### Authentication credentials

The app uses the Facebook user ID for it's user ID.  This is referred to as _uid_ in this document.

Facebook allows an app to convert short-lived access tokens into long-lived tokens. The application uses these tokens as passwords to authenticate the user.  This document refers to a user's long-lived token as the __secret__.

The main reason for using the long-lived token for app authentication is because it minimizes the number of messages needed by the app.

Currently, autheticaion is required to access dynamically generated content; all requests for static content are allowed without authentication.

### Cookies

The app makes use of long-lived cookies but does not require them.

The app does not use session cookies; the browser provides the secret on an as-needed basis.

### Database

Objects from the database are referred to as _documents_ because we are using a document-oriented database (MongoDB).

### Web Pages

The system returns 2 web pages: the login page and the game page.  

The login page is the same for all users, and so it can be considered static content.  However, the login page needs the Facebook application ID, which varies across deployments (development, staging, production).  For this reason, the page is constructed when the server starts.  

The game page contains the Facebook application ID, uid, secret and a snapshot of the game state when the browser loads the page, so it is constructed when requested by the browser.  It is the only dynamically constructed Web page in the system.

Both login and game pages have the same URL, which is the root path.

### Web service content (Ajax)

There is a single url used to store application state: __/save__. This is requested by the browser when the user clicks the save button.

## Case 1: Server start up

__server -> fb__ The server sends its Facebook app ID and app secret to obtain its Facebook app token.

__server <- fb__ Facebook returns the app token.

Note: the app token only changes when the app secret is changed.  The app token should not be sent to the browser; it is used as a shared secret between the app server and Facebook.

## Case 2: User starts application

### Case 2.1: the browser sends uid/secret in a cookie

__browser -> server__ Browser sends GET request to '/' with __uid__ and _secret_ in cookie.

__server -> db__ The server requests the document matching the uid and secret.

#### Case 2.1.1: The database returns zero documents

__server <- db__ The database returns an empty set.

This situation happens when the user is accessing the app from a different device, which will have stored a different long-lived token (secret).

__browser <- server__ The server returns the login page.

#### Case 2.1.2: The database returns the user document

__server <- db__ The database returns the user document.

__browser <- server__ The server returns the game page.

### Case 2.2: the browser does not send uid/secret in a cookie

__browser -> server__ Browser sends GET request to '/' without __uid__ and _secret_ in cookie.

This occurs when a) the user is accessing the app from a device for the first time, b) long-lived cookies are disabled in the browser, c) the cookie expired, or d) a previously set cookie was deleted.

__browser <- server__ The server returns the login page.

## Case 3: The browser loads the login page

__browser <-> fb__ On page load, the Facebook script obtains the uid and short-lived access token.  This may or may not involve the user as explained in the following.  

a) If the user was already logged into Facebook and the user previously authorized the app, then the user is not involved.

b) If the user was already logged into Facebook but has not yet authorized the app, then the script asks the user for authorization.

c) If the user is not logged into Facebook, then the user is presented with the Facebook login screen.  If the user logs in, then the script asks the user to authorize the app.

### Case 3.1: the cancels login or does not authorize the app

In this case, the login page shows a login button.  The user can restart the login/authorization process again by clicking this login button.

### Case 3.2: the user is logged in and the app is authorized

__browser -> server__ Browser sends GET request to _/login_ with uid and short-lived access token.

__server -> fb__ Server requests Facebook to exchange the short-lived token for a long-lived token.

#### Case 3.2.1: the exchange operation fails. 

This means an attacker sent a bogus short-lived token. 

__browser <- server__ The server returns a _not authorized_ response.

#### Case 3.2.2: the exchange operation succeeds.

This means the user is authenticated with Facebook and has authorized the app with at least basic permissions.

__server -> db__ The server requests from the database the document matching the uid.

#### Case 3.2.2.1: The database returns zero documents

__server <- db__ The database returns zero documents.

The database returns zero documents when the user accesses the app for the first time.

__server <-> db__ The server stores an initial user document with uid, secret and initial game state.

__browser <- server__ The server returns the game page.

#### Case 3.2.2.2: The database returns the user document

__server <- db__ The database returns the user document.

If the database returns the user document it means the user has authorized the app in a previous session.

__browser <- server__ The server returns the game page.

## Case 4: The game page requests to save the game state

__browser -> server__ The browser sends a request to save the game state.  The request includes the uid, secret and game state.

__server -> db__ The server requests that that game state attribute of the user document be set for the given uid and secret.

### Case 4.1: The secret is invalid

The secret will be invalid if the user accessed the app from a different device after starting the app in the current device.  It could also be a bogus secret supplied by an attacker.  In either case, the database will report that zero writes occurred.

__server <- db__ The database indicates that zero writes occurred.

__browser <- server__ Server returns an unauthorized response.

The browser will now go through an authorization sequence to obtain a short-lived token from Facebook.

__browser <-> fb__ The login function of the Facebook API is called in order to obtain a new access token, which will be short-lived.  This may or may not involve the user as explained in the following.  

a) If the user is already logged into Facebook and the user has left the app authorized, then Facebook returns a new short-lived token without user involvement.

b) If the user is already logged into Facebook but has de-authorized the app, then the script asks the user for authorization.

c) If the user is not logged into Facebook, then the user is presented with the Facebook login screen.  After logging in, if the user has left the app authorized, then Facebook returns a new short-lived token.  On the other hand, if the user has de-authorized the app, then the Facebook asks the user to authorize the app.

#### Case 4.1.1: the user cancels login or does not authorize the app

In this case, the browser shows only a login button.  The user can restart the login/authorization process by clicking this login button.

#### Case 4.1.2: the user is logged in and the app is authorized

__browser -> server__ Browser resends the request to save the game state but this time it specifies a short-lived access token instread of the secret.

__server -> fb__ Server requests Facebook to exchange the short-lived token for a long-lived token.

__server <- fb__ Facebook returns a new long-lived token. (If this fails, then the server returns unathorized response.)

__server -> db__ The server requests the database to update the user document with the new secret and game state.

__server <- browser__ The server returns the new secret to the browser.

### Case 4.2: The secret is valid

__server <- db__ The database indicates that one write occurred.

__browser <- server__ Server returns a success message.

