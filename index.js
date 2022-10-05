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
var jsonParser = bodyParser.json();
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUri = 'http://127.0.0.1:5500/callback';
const scopes = [
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
];
const state = generateRandomString(16);
const showDialog = true;
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

// page calls
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

app.get('/home', (req, res) => {
    if (spotifyApi.getAccessToken() != null) {
        res.set('Cache-Control', 'no-store')
        res.sendFile(__dirname + '/public/home.html');
    } else {
        res.redirect('/');
    }
})

// api calls
app.get('/login', (req, res) => {
    let url = spotifyApi.createAuthorizeURL(scopes, state, showDialog);
    res.redirect(url);
})

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const result = await spotifyApi.authorizationCodeGrant(code);
    const data = result.body;
    const access_token = data.access_token;
    const refresh_token = data.refresh_token;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    res.redirect('/home');
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
    const result = await spotifyApi.createPlaylist(body.name, { 'description' : body.description, 'public' : body.public });
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

app.get('/logout', (req, res) => {
    spotifyApi.setAccessToken(null);
    spotifyApi.setRefreshToken(null);
    res.end();
})