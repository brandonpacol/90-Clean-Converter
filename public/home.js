const APIController = (function() {
    
    // private methods
    const _getPlaylists = async () => {
        const result = await fetch('/getPlaylists');
        const data = await result.json();
        return data;
    }

    const _getUser = async () => {
        const result = await fetch('/getMe')
        const data = await result.json();
        return data;
    }

    const _createPlaylist = async (playlistName, percentageString) => {

        const result = await fetch('/createPlaylist', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name : playlistName + percentageString,
                description : 'Created with 90% Clean Converter',
                public : true
            })
        });

        const data = await result.json();
        console.log('SUCCESSFULLY CREATED PLAYLIST WITH ID: ' + data.id);
        return data;

    }

    const _getSongs = async (playlistId) => {

        const result = await fetch('/getSongs', {
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              playlistId : playlistId
            })});
        const data = await result.json();
        return data;

    }

    const _searchSong = async (artist, track) => {
        search_string = artist + ' ' + track;
        query = encodeURIComponent(search_string.slice(0,100));

        const result = await fetch('/searchTrack', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                artist : artist,
                track : track
            })
        });

        const data = await result.json();
        return data.tracks.items;

    }

    const _addSongsToPlaylist = async (playlistId, uris_to_add) => {

        const result = await fetch('/addToPlaylist', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playlistId : playlistId,
                uris : uris_to_add
            })
        });

        console.log('SUCCESSFULLY ADDED SONGS TO PLAYLIST');

    }

    return {
        getPlaylists() {
            return _getPlaylists();
        },
        createPlaylist(name, percentageString) {
            return _createPlaylist(name, percentageString);
        },
        getSongs(playlistId) {
            return _getSongs(playlistId)
        },
        searchSong(artist, track) {
            return _searchSong(artist, track);
        },
        addSongsToPlaylist(playlistId, uris_to_add) {
            return _addSongsToPlaylist(playlistId, uris_to_add);
        },
        getUser() {
            return _getUser();
        }
    }
})();


// UI Module
const UIController = (function() {

    //object to hold references to html selectors
    const DOMElements = {
        divPlaylistList: '#playlist-list',
        divPlaylistDetail: '.playlist',
        selectedPlaylistText: '#selected-playlist-text',
        playlistName: '.playlist-name',
        welcomeUser: '#welcome-user',
        convertButton: '#convert-button',
        loadingBar: '#loading-bar',
        loadingBarDiv: '#loading-bar-div',
        keepExplicit: '#keep-explicit',
        logoutButton: '#logout-button'
    }

    //public methods
    return {
        //method to get input fields
        inputField() {
            return {
                playlistList: document.querySelector(DOMElements.divPlaylistList),
                login: document.querySelector(DOMElements.loginButton),
                playlists: document.querySelector(DOMElements.divPlaylistList),
                selectedPlaylistText: document.querySelector(DOMElements.selectedPlaylistText),
                playlistName: document.querySelector(DOMElements.playlistName),
                welcomeUser: document.querySelector(DOMElements.welcomeUser),
                convertButton: document.querySelector(DOMElements.convertButton),
                loadingBar: document.querySelector(DOMElements.loadingBar),
                loadingBarDiv: document.querySelector(DOMElements.loadingBarDiv),
                keepExplicit: document.querySelector(DOMElements.keepExplicit),
                logoutButton: document.querySelector(DOMElements.logoutButton)
            }
        },

        // need method to create a playlist list group item 
        createPlaylist(img, title, id , position) {
            const html = `
            <div class="row mb-2 playlist"  id="p${id}">
                <div class="col-sm-4 d-flex justify-content-center">
                    <img src="${img}" class="playlist-thumbnail rounded" alt="...">
                </div>
                <div class="col-sm-8 text-center my-auto">
                    <h5 class="playlist-name">${title}</h5>
                </div>
            </div>
            `;
            document.querySelector(DOMElements.divPlaylistList).insertAdjacentHTML(position, html);
        },

        getPlaylistImage(playlist_id) {
            return document.querySelector('#'+playlist_id).getElementsByTagName('img')[0].src;
        },

        editSelectedPlaylistText(name) {
            document.querySelector(DOMElements.selectedPlaylistText).innerHTML = '"' + name + '" is selected.';
        },

        editIsConvertingText(name) {
            document.querySelector(DOMElements.selectedPlaylistText).innerHTML = '"' + name + '" is converting.';
        },

        editHasBeenConvertedText(name) {
            document.querySelector(DOMElements.selectedPlaylistText).innerHTML = '"' + name + '" has been converted.';
        },

        disableConvertButton() {
            document.querySelector(DOMElements.convertButton).disabled = true;
            document.querySelector(DOMElements.convertButton).innerHTML = 'Converting <div class="spinner-border spinner-border-sm" role="status"></div>';
        },

        enableConvertButton() {
            document.querySelector(DOMElements.convertButton).disabled = false;
            document.querySelector(DOMElements.convertButton).innerHTML = 'Convert';
        },

        editWelcomeUser(name) {
            document.querySelector(DOMElements.welcomeUser).innerHTML = 'Welcome, ' + name + '!';
        },

        getPlaylistName(playlist_id) {
            return document.querySelector('#'+playlist_id).querySelector(DOMElements.playlistName).textContent;
        },

        getExplicit() {
            return document.querySelector(DOMElements.keepExplicit).checked;
        },

        updateLoadingBar(percent) {
            document.querySelector(DOMElements.loadingBar).style = 'width: ' + percent + '%';
        },

        showLoadingBar() {
            document.querySelector(DOMElements.loadingBarDiv).style = '';
        },

        hideLoadingBar() {
            document.querySelector(DOMElements.loadingBarDiv).style = 'display : none;';
        }
    }

})();

const APPController = (function(UICtrl, APICtrl) {

    // get input field object ref
    const DOMInputs = UICtrl.inputField();

    // get playlists on page load
    const loadInitialPage = async () => {

        // gets user
        const user = await APICtrl.getUser();
        UICtrl.editWelcomeUser(user.display_name);

        //get the playlists
        const playlists = await APICtrl.getPlaylists();

        //populate our playlist list
        playlists.forEach(element => {
            if (element.images.length > 0) {
                UICtrl.createPlaylist(element.images[0].url, element.name, element.id, 'beforeend');
            } else {
                UICtrl.createPlaylist('https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A31BDF2?v=v2', element.name, element.id, 'beforeend');
            }
        });
    }

    // select playlist
    DOMInputs.playlists.addEventListener('click', async (e) => {
        e.preventDefault();
        let playlistEndpoint = null;
        let playlistName = 'No playlist';
        if (e.target.parentElement.parentElement.parentElement.id == 'playlist-list') {
            playlistEndpoint = e.target.parentElement.parentElement.id;
        } else if (e.target.parentElement.parentElement.id == 'playlist-list') {
            playlistEndpoint = e.target.parentElement.id;
        } else if (e.target.parentElement.id == 'playlist-list'){
            playlistEndpoint = e.target.id;
        } else {
            playlistEndpoint = null;
        }

        if (playlistEndpoint != null) {
            playlistName = UICtrl.getPlaylistName(playlistEndpoint);
            playlistEndpoint = playlistEndpoint.slice(1);
        }

        console.log("clicked on " + playlistName);
        console.log('playlist id is ' + playlistEndpoint);
        localStorage.setItem('selected_playlist_id', playlistEndpoint);
        UICtrl.editSelectedPlaylistText(playlistName);
    })

    // logout button
    DOMInputs.logoutButton.addEventListener('click', async () => {
        window.location.replace("index.html");
    })

    // convert button
    DOMInputs.convertButton.addEventListener('click', async () => {
        UICtrl.disableConvertButton();
        UICtrl.showLoadingBar();

        let playlistName = UICtrl.getPlaylistName('p' + localStorage.getItem('selected_playlist_id'));
        UICtrl.editIsConvertingText(playlistName);        


        let keepExplicit = !(UICtrl.getExplicit());
        let percentageString = '';
        if (keepExplicit) {
            percentageString = ' (90% Clean) EXPRESS'
        } else {
            percentageString = ' (100% Clean)'
        }
        // create new playlist bassed on selected playlist name
        let playlistId = localStorage.getItem('selected_playlist_id');
        const newPlaylist = await APICtrl.createPlaylist(playlistName, percentageString);

        // get songs from selected playlist
        let search_keywords = [];
        const songs = await APICtrl.getSongs(playlistId);
        songs.forEach(element => search_keywords.push({
            artist : element.track.artists[0].name, 
            track : element.track.name, 
            explicit : element.track.explicit,
            uri : element.track.uri,
            id : element.track.id}));

        // if songs are explicit, search for clean song
        let uris_to_add = [];
        for (let i = 0; i < search_keywords.length; i++) {
            console.log('Searching for song '+ (i+1));
            if (search_keywords[i].explicit) {
                let found = false;
                const search_results = await APICtrl.searchSong(search_keywords[i].artist, search_keywords[i].track, search_keywords[i].uri);
                for (let j = 0; j < search_results.length; j++) {
                    console.log('Searching for a clean version of ' + search_keywords[i].track + '...');
                    if (!search_results[j].explicit && search_keywords[i].artist == search_results[j].artists[0].name) {
                        console.log('Clean version of ' + search_keywords[i].track + ' added!');
                        uris_to_add.push(search_results[j].uri);
                        found = true;
                        break;
                    }
                }
                if (!found && keepExplicit) {
                    console.log('No clean version found, added explicit version of ' + search_keywords[i].track + '.');
                    uris_to_add.push(search_keywords[i].uri);
                }
            } else {
                uris_to_add.push(search_keywords[i].uri);
            }
            UICtrl.updateLoadingBar((i/search_keywords.length)*100);
        }

        // add songs to created playlist
        let total_songs = uris_to_add.length;
        for (let i = 0; i < uris_to_add.length; i+=100) {
            if (total_songs > 100) {
                await APICtrl.addSongsToPlaylist(newPlaylist.id, uris_to_add.slice(i, i+99));
                total_songs = total_songs-100;
            } else {
                await APICtrl.addSongsToPlaylist(newPlaylist.id, uris_to_add.slice(i, i+total_songs));
            }
        }

        let playlistImage = UICtrl.getPlaylistImage('p' + localStorage.getItem('selected_playlist_id'));
        UICtrl.createPlaylist(playlistImage, newPlaylist.name, newPlaylist.id, 'afterbegin')
        UICtrl.editHasBeenConvertedText(playlistName);
        UICtrl.hideLoadingBar();
        UICtrl.updateLoadingBar(0);
        UICtrl.enableConvertButton();
    })

    return {
        init() {
            loadInitialPage();
            console.log('App is starting');
        }
    }

})(UIController, APIController);

APPController.init();