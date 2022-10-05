if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const app = express();
const port = 5500;
const fetch = require('node-fetch');
var SpotifyWebApi = require('spotify-web-api-node');
var bodyParser = require('body-parser');

// create application/json parser
var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static('public'))

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUri = 'http://127.0.0.1:5500/callback';
const homepage = 'http://127.0.0.1:5500/home.html'
const scopes = [
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
];
const state = generateRandomString(16);
const showDialog = false;
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirectUri,
});

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

app.get('/login', (req, res) => {
    let url = spotifyApi.createAuthorizeURL(scopes, state, showDialog);
    console.log(url)
    res.redirect(url);
})

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;
  
    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }
  
    spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            console.log('access_token:', access_token);
            console.log('refresh_token:', refresh_token);

            console.log(
                `Sucessfully retreived access token. Expires in ${expires_in} s.`
            );
            res.redirect(homepage);

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];

                console.log('The access token has been refreshed!');
                console.log('access_token:', access_token);
                spotifyApi.setAccessToken(access_token);
            }, expires_in / 2 * 1000);
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
        });
});

app.get('/getPlaylists', async (req, res) => {
    // get current user's id
    const userdata = await spotifyApi.getMe();
    const userId = userdata.body['id'];
    
    /// get user playlists
    let offset = 0;
    let morePlaylists = true;
    let playlists = [];
    while (morePlaylists) {
        const result = await spotifyApi.getUserPlaylists(userId, { limit: 20, offset: offset });
        const data = result.body;
        playlists = playlists.concat(data['items']);
        if (data['next'] == null) {
            morePlaylists = false;
        } else {
            offset += 20;
        }
    }
    res.json(playlists)
})

app.get('/getMe', async (req, res) => {
    const result = await spotifyApi.getMe();
    const data = result.body;
    res.json(data);
})

app.post('/createPlaylist', jsonParser, async (req, res) => {
    const body = req.body;
    const result = await spotifyApi.createPlaylist(body.name , { 'description': req.description, 'public': req.public });
    const data = result.body;
    res.json(data);
})

app.post('/getSongs', jsonParser, async (req, res) => {
    const body = req.body;
    const playlistId = body.playlistId;
    let offset = 0;
    let moreSongs = true;
    let songs = [];

    while (moreSongs) {
        const result = await spotifyApi.getPlaylistTracks(playlistId, { offset: offset });
        const data = result.body;
        songs = songs.concat(data.items);
        if (data.next == null) {
            moreSongs = false;
        } else {
            offset += 100;
        }
    }
    res.json(songs);
})

app.post('/searchTrack', jsonParser, async (req, res) => {
    const body = req.body;
    const track = body.track;
    const artist = body.artist;
    const query = ('artist:' + artist + ' track:' + track).slice(0,100);
    const results = await spotifyApi.searchTracks(query, { limit: 5 });
    const data = results.body;
    res.json(data);
})

app.post('/addToPlaylist', jsonParser, async (req, res) => {
    const body = req.body;
    const playlistId = body.playlistId;
    const uris = body.uris;
    await spotifyApi.addTracksToPlaylist(playlistId, uris);
    res.end()
})