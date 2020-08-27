// App used in conjunction with authentication to create playlists based on user's favorite tracks and artists
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'client_id'; // Your client id
var client_secret = 'client_secret'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private user-top-read'; // edit scopes
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
        refresh_token = body.refresh_token;
        var user_id = ''; // user id
        var playlist_id = ''; // playlist id when created
        var query_string = ''; // track uris to add to end of url

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));

        function get_user_info() {
          return new Promise((resolve, reject) => {
              // use the access token to access the Spotify Web API
            request.get(options, function(error, response, body) {
              // console.log(body);
            user_id = body.id;
            console.log('my id: ' + user_id); // debugging 
            resolve();
            });
          });
        }
            
         function get_tracks(){
          return new Promise((resolve, reject) => {
            var track_ids = [];
            var top_tracks = {
              url: 'https://api.spotify.com/v1/me/top/tracks',
              headers: { 'Authorization': 'Bearer ' + access_token },
              json: true
            };
            request.get(top_tracks, function(error, response, body) {
                  //console.log(body);
                  body.items.forEach(function(item){
                    track_ids.push(item.uri);
                  });
                  query_string = track_ids.join(",");
                  console.log('got tracks');
                  resolve();   
            });
          });    
         }
              
          
          function create_playlist(){
            return new Promise((resolve, reject) => {
              var playlist = {
                url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
                headers: { 
                  'Authorization': 'Bearer ' + access_token, 
                  'Content-Type': 'application/json'
                },
                body: {
                  name: 'urfavtracks - created by anish',
                  public: false
                },
                json: true
              };
              // Create a private playlist
              request.post(playlist, function(error, response, body) {
                console.log(body);
                playlist_id = body.id;
                console.log("created playlist!")
                console.log(playlist_id);
                resolve();
              });
            }); 
          }
          
          function add_tracks(){
            return new Promise((resolve, reject) => {
              var tracks = {
                path: playlist_id,
                url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?uris=${query_string}`, // query string with all the track uris retrieved earlier
                headers: { 
                  'Authorization': 'Bearer ' + access_token,
                },
                json: true
                };
              request.post(tracks, function(error, response, body) {
                  console.log('Added tracks to playlist!');
                  console.log(response.statusMessage);
                  resolve();
              });
            });
          }

          // function to run all async functions synchronously
          function run(){
            get_user_info()
            .then(create_playlist)
            .then(get_tracks)
            .then(add_tracks);
          }

          run();

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
