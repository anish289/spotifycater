# SpotifyCater

UPDATE 09/08/2020: Spending time fixing up code/adding new features... learning more about async ops with JS so far

Welcome! This is a backend script that allows a user to retrieve a playlist with recommended tracks based on recent listening activity with the click of a button (WIP).


## Installation

You must install Node.js for this app to run. [click here](http:/www.nodejs.org/download/) to find instructions to install it. 

After Node.js is installed, clone the repo and install dependencies with:

    $ npm install

### Using your own credentials
In order to run this application, you must follow these instructions taken from the Spotify developers themselves to access your own client id and client secret to enter into app.js. The instructions will follow: 

You will need to register your app and get your own credentials from the Spotify for Developers Dashboard.

To do so, go to [your Spotify for Developers Dashboard](https://beta.developer.spotify.com/dashboard) and create your application. For the examples, we registered these Redirect URIs:

* http://localhost:8888 
* http://localhost:8888/callback

Once you have created your app, replace the `client_id`, `redirect_uri` and `client_secret` in the examples with the ones you get from My Applications.

## Running the app
In order to run SpotifyCater, cd into the project directory and cater_app and enter into the command line:

    $ cd src
    $ node app.js

Then, open `http://localhost:8888` in a browser, enter your credentials, and enjoy your playlist!
