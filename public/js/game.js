/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/game.js
Desc     : handles socket.io connection
           related to game play
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Declare socket.io
let socket = io();
//Set SA Toast Settings
const toast_alert = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 5000,
    padding: '0.4rem'
});
const toast_turn = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    padding: '0.3rem'
});
//JSON array of game data
let game_data;
//Setup game variables
let allow_prompt = true;
let prompt_open = false;
let allow_connect_msg = false;
let selected_avatar = "default.png";
let session_player = {
    _id: undefined,
    is_host: false
};

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 SOCKET.IO EVENTS
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.socket.on.{slug}-update
// Desc : whenever an event occurs containing a game update
socket.on(window.location.pathname.substr(6) + "-update", function (data) {
    console.log(data);
    //Update game data
    game_data = data;
    //Check session data and player status
    session_check();
    //Update user interface
    update_interface();
    //Check to see if prompt window is open to update avatars
    if (prompt_open) {
        update_avatar_options();
    }
});

// Name : frontend-game.socket.on.player-created
// Desc : whenever an event occurs stating that a player was created
socket.on("player-created", function (data) {
    //Update player_id
    session_player._id = data;
    localStorage.setItem('ec_session', JSON.stringify({
        slug: window.location.pathname.substr(6),
        player_id: data
    }));
});

// Name : frontend-game.socket.on.{slug}-start
// Desc : whenever an event occurs stating that the game started
socket.on(window.location.pathname.substr(6) + "-start", function (data) {
    toast_alert.fire({
        icon: 'info',
        html: '<h1 class="text-lg font-bold pl-2 pr-1">Game has started</h1>'
    });
});

// Name : frontend-game.socket.on.{slug}-reset
// Desc : whenever an event occurs stating that the game has been reset
socket.on(window.location.pathname.substr(6) + "-reset", function (data) {
    toast_alert.fire({
        icon: 'info',
        html: '<h1 class="text-lg font-bold pl-2 pr-1">Game has been reset</h1>'
    });
});

// Name : frontend-game.socket.on.{slug}-error
// Desc : whenever an event occurs related to an error
socket.on(window.location.pathname.substr(6) + "-error", function (data) {
    toast_alert.fire({
        icon: 'error',
        html: '<h1 class="text-lg font-bold pl-2 pr-1">' + data + '</h1>'
    });
});

// Name : frontend-game.socket.on.connect
// Desc : whenever we connect to the backend
socket.on("connect", function (data) {
    //Request game update
    socket.emit('retrieve-game', {
        slug: window.location.pathname.substr(6)
    })
    //Update status dot
    document.getElementById("status_ping").innerHTML = "<span class=\"animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75\"></span>\n" +
        "<span class=\"relative inline-flex rounded-full h-2 w-2 bg-green-500\"></span>"
    //Send alert
    if (allow_connect_msg) {
        toast_alert.fire({
            icon: 'success',
            html: '<h1 class="text-lg font-bold pl-2 pr-1">Connected</h1>'
        });
    } else {
        allow_connect_msg = true;
    }
});

// Name : frontend-game.socket.on.connect
// Desc : whenever we disconnect from the backend
socket.on("disconnect", function (data) {
    //Update status dot
    document.getElementById("status_ping").innerHTML = "<span class=\"animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75\"></span>\n" +
        "<span class=\"relative inline-flex rounded-full h-2 w-2 bg-red-500\"></span>"
    //Send alert
    toast_alert.fire({
        icon: 'error',
        html: '<h1 class="text-lg font-bold pl-2 pr-1">Disconnected</h1>'
    });
});

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 GAME UI CONFIGURATION
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Local storage pre check
function session_check() {
    //Get browser session details
    if (!localStorage.getItem('ec_session')) {
        //Reset local storage and session player since game data doesn't exist
        localStorage.setItem('ec_session', JSON.stringify({
            slug: window.location.pathname.substr(6),
            player_id: undefined
        }));
        session_player = {
            _id: undefined,
            is_host: false
        };
    } else if (JSON.parse(localStorage.getItem('ec_session')).slug !== window.location.pathname.substr(6)) {
        //Reset local storage and session player since slugs don't match
        localStorage.setItem('ec_session', JSON.stringify({
            slug: window.location.pathname.substr(6),
            player_id: undefined
        }));
        session_player = {
            _id: undefined,
            is_host: false
        };
    } else {
        //Check to make sure that the player is valid
        for (let i = 0; i < game_data.players.length; i++) {
            //Check if individual player exists
            if (game_data.players[i]._id === JSON.parse(localStorage.getItem('ec_session')).player_id) {
                if (session_player._id === undefined) {
                    //Tell server that a valid player connected
                    socket.emit('player-connected', {
                        slug: window.location.pathname.substr(6),
                        player_id: game_data.players[i]._id
                    })
                }
                //Update session_player _id and is_host
                session_player = {
                    _id: game_data.players[i]._id,
                    is_host: game_data.players[i].type === "host"
                };
                break;
            }
        }
    }
    //Open setup prompt if needed
    if (allow_prompt && session_player._id === undefined) {
        setup_prompt();
        allow_prompt = false;
    }
}

//Update player interface
function update_interface() {
    //Update players on UI
    update_players();
    //Update sidebar stats
    update_stats();
    //Update discard deck
    update_discard();
}

//Prompt to set player settings
function setup_prompt(err, passed_nickname) {
    prompt_open = true;
    if (err === undefined) {err = "";}
    if (passed_nickname === undefined) {passed_nickname = "";}
    Swal.fire({
        html: "<h1 class=\"text-4xl text-gray-700 mt-3\" style=\"font-family: Bebas Neue\">Welcome to <a class=\"text-yellow-400\">EXPLODING</a> CHICKENS</h1>\n" +
            "<h1 class=\"text-sm text-gray-700\">Game ID: " + game_data.slug + " | Created: " + game_data.created + "</a><br><br><a class=\"text-red-500\">" + err + "</a></h1>\n" +
            "<div class=\"my-3 flex w-full max-w-sm mx-auto space-x-3 shadow-md\">\n" +
            "    <input\n" +
            "        class=\"text-center flex-1 appearance-none border border-transparent w-full py-2 px-10 bg-white text-gray-700 placeholder-gray-400 rounded-sm text-base border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500\"\n" +
            "        type=\"text\" id=\"nickname_swal\" maxlength=\"12\" value=\"" + passed_nickname + "\" placeholder=\"What's your name?\">\n" +
            "</div>" +
            "<div class=\"flex flex-wrap justify-center items-center py-2\" id=\"avatar_options_swal\">\n" +
            "</div>\n",
        showCancelButton: true,
        confirmButtonColor: '#fbbf24',
        cancelButtonColor: '#374151',
        cancelButtonText: 'Spectate',
        confirmButtonText: 'Join Game',
        allowOutsideClick: false,
        didOpen: function() {
            update_avatar_options();
        }
    }).then((result) => {
        if (result.isConfirmed) {
            //Validate input
            let selected_nickname = document.getElementById("nickname_swal").value;
            if (game_data.status === "in_game") {
                prompt_open = false;
                Swal.fire({
                    html: "<h1 class=\"text-4xl text-gray-700 mt-3\" style=\"font-family: Bebas Neue\"><a class=\"text-yellow-400\"><i class=\"fas fa-exclamation-triangle\"></i> EXPLODING</a> CHICKENS</h1>\n" +
                        "<h1 class=\"text-sm text-gray-700\">Game ID: " + game_data.slug + " | Created: " + game_data.created + "</a><br><br><a class=\"text-red-500\">" + err + "</a></h1>\n" +
                        "<h1 class=\"text-md text-gray-700\">The game has already started. Please refresh this page when the lobby is open.</h1>\n",
                    showConfirmButton: false,
                    showCancelButton: true,
                    cancelButtonColor: '#374151',
                    cancelButtonText: 'Spectate'
                })
            } else if (selected_nickname === "" || !/^[a-zA-Z]/.test(selected_nickname)) {
                setup_prompt("<i class=\"fas fa-exclamation-triangle\"></i> Please enter a valid nickname (letters only)", "");
            } else if (selected_avatar === "default.png") {
                setup_prompt("<i class=\"fas fa-exclamation-triangle\"></i> Please select an avatar", selected_nickname);
            } else {
                prompt_open = false;
                //Create new player
                socket.emit('create-player', {
                    slug: window.location.pathname.substr(6),
                    nickname: selected_nickname,
                    avatar: selected_avatar
                })
            }
        } else {
            prompt_open = false;
        }
    })
}

//Update avatar options on join game swal
function update_avatar_options() {
    let options = ["bear.png", "bull.png", "cat.png", "dog.png", "elephant.png", "flamingo.png", "fox.png", "lion.png", "mandrill.png", "meerkat.png", "monkey.png", "panda.png", "puma.png", "raccoon.png", "wolf.png"];
    let options_payload = "";
    //Loop through each avatar to see if in use or not
    for (let i = 0; i < options.length; i++) {
        //Loop through each player
        let found_match = false;
        for (let j = 0; j < game_data.players.length; j++) {
            if (game_data.players[j].avatar === options[i]) {
                found_match = true;
                break;
            }
        }
        //Append to payload
        if (found_match) { //Grayed out
            options_payload += "<div class=\"flex-none block text-center m-2\">\n" +
                "    <img class=\"h-16 w-16 rounded-full ring-2 ring-offset-2 ring-yellow-400 opacity-30\" src=\"/public/avatars/" + options[i] + "\" alt=\"\">\n" +
                "</div>\n";
            if (selected_avatar === options[i]) {
                selected_avatar = "default.png";
            }
        } else if (selected_avatar === options[i]) { //Current selection, green halo
            options_payload += "<div class=\"flex-none block text-center m-2\">\n" +
                "    <img class=\"h-16 w-16 rounded-full ring-2 ring-offset-2 ring-green-500\" src=\"/public/avatars/" + options[i] + "\" alt=\"\">\n" +
                "</div>\n";
        } else { //Available for selection
            options_payload += "<div class=\"flex-none block text-center m-2\" onclick=\"pick_avatar('" + options[i] + "')\">\n" +
                "    <img class=\"h-16 w-16 rounded-full\" src=\"/public/avatars/" + options[i] + "\" alt=\"\">\n" +
                "</div>\n";
        }
    }
    //Append to swal
    document.getElementById("avatar_options_swal").innerHTML = options_payload;
}

//Select avatar on join
function pick_avatar(selection) {
    selected_avatar = selection;
    update_avatar_options();
}

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 GAME UI ELEMENT UPDATERS
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Update players
function update_players() {
    //For each player, append to respective positions
    let sidebar_players_payload = "";
    let topbar_players_payload = "";
    let center_players_payload = "";
    let current_player_cards = "";
    for (let i = 0; i < game_data.players.length; i++) {
        //Append to sidebar, information
        let actions = "";
        if (game_data.players[i]._id === session_player._id) {
            //Add nickname to the top of sidebar
            document.getElementById("sidebar_top_nickname").innerHTML = game_data.players[i].nickname + status_dot(game_data.players[i].status, game_data.players[i].connection, "mx-1.5");
            //Add cards to hand
            for (let j = 0; j < game_data.players[i].cards.length; j++) {
                let call_play_card = "";
                if (game_data.seat_playing === game_data.players[i].seat) {
                    call_play_card = "play_card('" + game_data.players[i].cards[j]._id + "')";
                }
                current_player_cards += "<div class=\"rounded-xl shadow-sm bottom-card bg-center bg-contain\" onclick=\"" + call_play_card + "\" style=\"background-image: url('/" + game_data.players[i].cards[j].image_loc + "')\"></div>";
            }
            //Add reset game button to player actions
            if (session_player.is_host) {
                // actions = "<div class=\"flex mt-0 ml-4\">\n" +
                //     "    <span class=\"\">\n" +
                //     "          <button type=\"button\" class=\"inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400\">\n" +
                //     "                <svg class=\"-ml-1 mr-1 h-5 w-5\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                //     "                    <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n" +
                //     "                </svg>\n" +
                //     "                Reset Game\n" +
                //     "          </button>\n" +
                //     "    </span>\n" +
                //     "</div>";
            }
        } else if (session_player.is_host) {
            //Add make host and kick buttons to player actions
            actions = "<div class=\"flex mt-0 ml-4\">\n" +
                "    <span class=\"\">\n" +
                "          <button type=\"button\" class=\"inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500\">\n" +
                "                <svg class=\"-ml-1 mr-1 h-5 w-5 text-gray-500\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "                    <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" />\n" +
                "                </svg>\n" +
                "                Make Host\n" +
                "          </button>\n" +
                "    </span>\n" +
                "    <span class=\"ml-3\">\n" +
                "          <button type=\"button\" class=\"inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500\">\n" +
                "                <svg class=\"-ml-1 mr-1 h-5 w-5\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\" aria-hidden=\"true\">\n" +
                "                    <path fill-rule=\"evenodd\" d=\"M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z\" clip-rule=\"evenodd\" />\n" +
                "                </svg>\n" +
                "                Kick\n" +
                "          </button>\n" +
                "    </span>\n" +
                "</div>";
        }
        //Append to sidebar, players
        let player_nickname_msg = game_data.players[i].nickname;
        if (session_player.is_host && game_data.players[i]._id === session_player._id) {
            player_nickname_msg += ", Host"
        } else if (game_data.players[i]._id === session_player._id) {
            player_nickname_msg += ", You"
        }
        sidebar_players_payload += "<div class=\"flex items-center justify-between mb-2\">\n" +
            "    <div class=\"flex-1 min-w-0\">\n" +
            "        <h3 class=\"text-md font-bold text-gray-900 truncate\">\n" +
            "            " + player_nickname_msg + " " + status_dot(game_data.players[i].status, game_data.players[i].connection, "mx-0.5") + "\n" +
            "        </h3>\n" +
            "        <div class=\"mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6\">\n" +
            "            <div class=\"flex items-center text-sm text-gray-500\">\n" +
            "                " + game_data.players[i].status.charAt(0).toUpperCase() + game_data.players[i].status.slice(1) + ", " + game_data.players[i].connection + "\n" +
            "            </div>\n" +
            "        </div>\n" +
            "    </div>\n" +
            actions +
            "</div>";
        //Append to topbar, players
        topbar_players_payload += "<img class=\"inline-block h-6 w-6 rounded-full ring-2 ring-white\" src=\"/public/avatars/" + game_data.players[i].avatar + "\" alt=\"\">";
        //Append to center
        let turns_remaining_player = 0;
        if (game_data.seat_playing === game_data.players[i].seat) {
            turns_remaining_player = game_data.turns_remaining;
        }
        center_players_payload += "<div class=\"block text-center\">\n" +
            "    <h1 class=\"text-gray-600 font-medium text-sm\">\n" +
            "        " + game_data.players[i].nickname + " " + status_dot(game_data.players[i].status, game_data.players[i].connection, "") + "\n" +
            "    </h1>\n" +
            "    <div class=\"flex flex-col items-center -space-y-3\">\n" +
            "        <img class=\"h-12 w-12 rounded-full\" src=\"/public/avatars/" + game_data.players[i].avatar + "\" alt=\"\">\n" +
            cards_icon(game_data.players[i].card_num, turns_remaining_player) +
            "    </div>\n" +
            "</div>";
        //If we are not at the end of the # of players, put an arrow
        if (i < game_data.players.length - 1) {
            //Check direction
            if (game_data.turn_direction === "forward") {
                center_players_payload += "<button class=\"mx-2 bg-gray-400 p-1 rounded-full text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white\">\n" +
                    "    <svg class=\"h-3 w-3\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                    "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 5l7 7-7 7M5 5l7 7-7 7\" />\n" +
                    "    </svg>" +
                    "</button>";
            } else {
                center_players_payload += "<button class=\"mx-2 bg-gray-400 p-1 rounded-full text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white\">\n" +
                    "    <svg class=\"h-3 w-3\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                    "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 19l-7-7 7-7m8 14l-7-7 7-7\" />\n" +
                    "    </svg>\n" +
                    "</button>";
            }
        }
        //Replace old elements with payloads
        document.getElementById("sidebar_players").innerHTML = sidebar_players_payload;
        document.getElementById("topbar_players").innerHTML = topbar_players_payload;
        document.getElementById("center_players").innerHTML = center_players_payload;
        document.getElementById("player_cards").innerHTML = current_player_cards;
    }
}

//Update sidebar statistics
function update_stats() {
    //Game code
    document.getElementById("sidebar_game_code").innerHTML = window.location.pathname.substr(6);
    //Game status
    if (session_player.is_host) {
        if (game_data.status === "in_lobby") {
            document.getElementById("sidebar_status").innerHTML = "<div class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 bg-gradient-to-r from-green-500 to-green-400\" onclick=\"start_game()\">\n" +
                "    <div class=\"flex flex-row items-center justify-between\">\n" +
                "        <div class=\"flex flex-col\">\n" +
                "            <div class=\"text-xs uppercase text-white truncate\">\n" +
                "                Status\n" +
                "            </div>\n" +
                "            <div class=\"text-lg font-bold text-white truncate\">\n" +
                "                Start game\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        <svg class=\"stroke-current text-white\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "           <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9\" />\n" +
                "        </svg>" +
                "    </div>\n" +
                "</div>";
        } else if (game_data.status === "in_game") {
            document.getElementById("sidebar_status").innerHTML = "<div class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 bg-gradient-to-r from-yellow-500 to-yellow-400\"  onclick=\"reset_game()\">\n" +
                "    <div class=\"flex flex-row items-center justify-between\">\n" +
                "        <div class=\"flex flex-col\">\n" +
                "            <div class=\"text-xs uppercase text-white truncate\">\n" +
                "                Status\n" +
                "            </div>\n" +
                "            <div class=\"text-lg font-bold text-white truncate\">\n" +
                "                Reset game\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        <svg class=\"stroke-current text-white\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "           <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n" +
                "        </svg>" +
                "    </div>\n" +
                "</div>";
        }
    } else {
        if (game_data.status === "in_lobby") {
            document.getElementById("sidebar_status").innerHTML = "<div class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 dark:bg-gray-900 dark:border-gray-800\">\n" +
                "    <div class=\"flex flex-row items-center justify-between\">\n" +
                "        <div class=\"flex flex-col\">\n" +
                "            <div class=\"text-xs uppercase text-gray-500 truncate\">\n" +
                "                Status\n" +
                "            </div>\n" +
                "            <div class=\"text-lg font-bold truncate\">\n" +
                "                In lobby\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        <svg class=\"stroke-current text-blue-500\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />\n" +
                "        </svg>\n" +
                "    </div>\n" +
                "</div>";
        } else if (game_data.status === "in_game") {
            document.getElementById("sidebar_status").innerHTML = "<div class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 dark:bg-gray-900 dark:border-gray-800\">\n" +
                "    <div class=\"flex flex-row items-center justify-between\">\n" +
                "        <div class=\"flex flex-col\">\n" +
                "            <div class=\"text-xs uppercase text-gray-500 truncate\">\n" +
                "                Status\n" +
                "            </div>\n" +
                "            <div class=\"text-lg font-bold truncate\">\n" +
                "                In game\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        <svg class=\"stroke-current text-blue-500\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />\n" +
                "        </svg>\n" +
                "    </div>\n" +
                "</div>";
        }
    }
    //Cards remaining
    document.getElementById("sidebar_cards_left").innerHTML = game_data.cards_remaining;
    //EC remaining
    document.getElementById("sidebar_ec_remaining").innerHTML = game_data.ec_remaining + "<a class=\"font-light\"> / " +  Math.floor((game_data.ec_remaining/game_data.cards_remaining)*100) + "% chance</a>";
}

// Name : frontend-game.fire_player_select()
// Desc : shows the UI for a player to select another player to target
function fire_player_select() {

}

// Name : frontend-game.fire_stf()
// Desc : shows the UI for see the future
function fire_stf() {
    if (game_data.draw_deck !== undefined || game_data.draw_deck !== []) {
        let card_payload;
        // Check number of cards left in deck, prepare payload
        if (game_data.draw_deck.length > 2) {
            card_payload = "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain -rotate-12\" style=\"background-image: url('/" + game_data.draw_deck[game_data.draw_deck.length - 1].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n" +
                "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain mb-2\" style=\"background-image: url('/" + game_data.draw_deck[game_data.draw_deck.length - 2].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n" +
                "<div class=\"transform inline-block rounded-xl shadow-sm bottom-card bg-center bg-contain rotate-12\" style=\"background-image: url('/" + game_data.draw_deck[game_data.draw_deck.length - 3].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n";
        } else if (game_data.draw_deck.length > 1) {
            card_payload = "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain -rotate-6\" style=\"background-image: url('/" + game_data.draw_deck[game_data.draw_deck.length - 1].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n" +
                "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain rotate-6\" style=\"background-image: url('/" + game_data.draw_deck[game_data.draw_deck.length - 2].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n";
        } else if (game_data.draw_deck.length > 0) {
            card_payload = "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain\" style=\"background-image: url('/" + game_data.draw_deck[game_data.draw_deck.length - 1].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n";
        }
        // Fire swal
        Swal.fire({
            html:
                "<div class=\"inline-block\">" +
                "    <h1 class=\"text-3xl font-semibold pb-1 text-white\"><i class=\"fas fa-eye\"></i> See the Future <i class=\"fas fa-eye\"></i></h1>" +
                "    <h1 class=\"text-xl font-semibold pb-5 text-white\">Top <i class=\"fas fa-long-arrow-alt-right\"></i> Bottom</h1>" +
                "    <div class=\"-space-x-24 rotate-12 inline-block\">" +
                card_payload +
                "    </div>" +
                "</div>\n",
            timer: 5000,
            background: "transparent"
        })
    }
}

// Name : frontend-game.fire_exp_chicken()
// Desc : shows the UI when an exploding chicken is drawn
function fire_exp_chicken(count, first_call) {
    // Append html overlay if on first function call
    if (first_call) {
        document.getElementById("discard_deck").innerHTML = "<div class=\"rounded-xl shadow-lg center-card bg-center bg-contain mx-1\" style=\"background-image: linear-gradient(rgba(0, 0, 0, .6), rgba(0, 0, 0, .6)), url('/public/cards/base/chicken-1.png');\">\n" +
            "    <div class=\"rounded-xl shadow-lg center-card bg-center bg-contain border-dashed border-4 border-green-500 h-full\" style=\"border-color: rgb(178, 234, 55); color: rgb(178, 234, 55);\">\n" +
            "        <div class=\"flex flex-wrap content-center justify-center h-full w-full\">\n" +
            "            <div class=\"block text-center space-y-2\">\n" +
            "                <h1 class=\"font-extrabold text-xl m-0\">DEFUSE</h1>\n" +
            "                <h1 class=\"font-bold text-8xl m-0\"> id=\"defuse_counter\"" + count + "</h1>\n" +
            "                <h1 class=\"font-extrabold text-xl m-0\">CHICKEN</h1>\n" +
            "            </div>\n" +
            "        </div>\n" +
            "    </div>\n" +
            "</div>"
    }
    document.getElementById("defuse_counter").innerHTML = count;
    count--;
    // Call program again if not placed
    if (count > 0) {
        setTimeout(fire_exp_chicken(count, false), 1000);
    } else {
        // Automatically play chicken since time expired
    }
}


// Name : frontend-game.update_discard()
// Desc : refreshes the data for the discard deck
function update_discard() {
    if (game_data.discard_deck.length !== 0) {
        document.getElementById("discard_deck").innerHTML = "<div class=\"rounded-xl shadow-sm center-card bg-center bg-contain\" style=\"background-image: url('/" + game_data.discard_deck[game_data.discard_deck.length-1].image_loc + "')\"></div>";
    }
}

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 PLAYER ACTION FUNCTIONS
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.start_game()
// Desc : emits the start-game event when the host clicks the start game button
function start_game() {
    socket.emit('start-game', {
        slug: window.location.pathname.substr(6),
        player_id: session_player._id
    })
}

// Name : frontend-game.reset_game()
// Desc : emits the reset-game event when the host clicks the reset game button
function reset_game() {
    socket.emit('reset-game', {
        slug: window.location.pathname.substr(6),
        player_id: session_player._id
    })
}

// Name : frontend-game.play_card(card_id)
// Desc : emits the play-card event when a card in the players hand is clicked
function play_card(card_id) {
    socket.emit('play-card', {
        slug: window.location.pathname.substr(6),
        player_id: session_player._id,
        card_id: card_id
    })
}

// Name : frontend-game.draw_card()
// Desc : emits the draw-card event when the draw deck is clicked
function draw_card() {
    socket.emit('draw-card', {
        slug: window.location.pathname.substr(6),
        player_id: session_player._id
    })
}

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 GAME UI HELPER FUNCTIONS
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.cards_icon(card_num, turns)
// Desc : returns the html for cards in a players hand (as well as blue card for turns)
function cards_icon(card_num, turns) {
    //Check to see if target player has any turns remaining
    let turns_payload = "";
    if (turns !== 0 && game_data.status === "in_game") {
        turns_payload = "<div class=\"transform inline-block rounded-md bg-blue-500 shadow-md h-5 w-4 ml-1\">\n" +
            "    <h1 class=\"text-white text-sm\">" + turns + "</h1>\n" +
            "</div>\n"
        // toast_turn.fire({
        //     icon: 'info',
        //     html: '<h1 class="text-lg font-bold pl-2 pr-1">Your turn</h1>'
        // });
    }
    //Determine number of cards in hand
    if (card_num === 2) {
        return "<div class=\"inline-block\"><div class=\"-space-x-4 rotate-12 inline-block\"><div class=\"transform inline-block rounded-md bg-gray-600 shadow-md h-5 w-4 -rotate-6\"><h1 class=\"text-gray-600 text-sm\">1</h1></div>\n" +
            "<div class=\"transform inline-block rounded-md bg-gray-500 shadow-md h-5 w-4 rotate-6\">\n" +
            "    <h1 class=\"text-white text-sm\">" + card_num + "</h1>\n" +
            "</div></div>" +  turns_payload + "</div>\n"
    } else if (card_num === 3) {
        return "<div class=\"inline-block\"><div class=\"-space-x-4 rotate-12 inline-block\"><div class=\"transform inline-block rounded-md bg-gray-700 shadow-md h-5 w-4 -rotate-12\"><h1 class=\"text-gray-700 text-sm\">1</h1></div>\n" +
            "<div class=\"transform inline-block rounded-md bg-gray-600 shadow-md h-5 w-4\"><h1 class=\"text-gray-600 text-sm\">1</h1></div>\n" +
            "<div class=\"transform inline-block rounded-md bg-gray-500 shadow-md h-5 w-4 rotate-12\">\n" +
            "    <h1 class=\"text-white text-sm\">" + card_num + "</h1>\n" +
            "</div></div>" +  turns_payload + "</div>\n"
    } else if (card_num >= 4) {
        return "<div class=\"inline-block\"><div class=\"-space-x-4 rotate-12 inline-block\"><div class=\"transform inline-block rounded-md bg-gray-800 shadow-md h-5 w-4\" style=\"--tw-rotate: -18deg\"><h1 class=\"text-gray-700 text-sm\">1</h1></div>\n" +
            "<div class=\"transform inline-block rounded-md bg-gray-700 shadow-md h-5 w-4 -rotate-6\"><h1 class=\"text-gray-700 text-sm\">1</h1></div>\n" +
            "<div class=\"transform inline-block rounded-md bg-gray-600 shadow-md h-5 w-4 rotate-6\"><h1 class=\"text-gray-600 text-sm\">1</h1></div>\n" +
            "<div class=\"transform inline-block rounded-md bg-gray-500 shadow-md h-5 w-4\" style=\"--tw-rotate: 18deg\">\n" +
            "    <h1 class=\"text-white text-sm\">" + card_num + "</h1>\n" +
            "</div></div>" +  turns_payload + "</div>\n"
    } else {
        return "<div class=\"inline-block\"><div class=\"-space-x-4 rotate-12 inline-block\"><div class=\"transform inline-block rounded-md bg-gray-500 shadow-md h-5 w-4\">\n" +
            "    <h1 class=\"text-white text-sm\">" + card_num + "</h1>\n" +
            "</div></div>" +  turns_payload + "</div>\n"
    }
}

// Name : frontend-game.status_dot(status, connection, margin)
// Desc : returns the html for a pulsating status dot
function status_dot(status, connection, margin) {
    if (status === "exploded") {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-red-500\"></span>"
    } else if (connection === "connected") {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-green-500\"></span>"
    } else if (connection === "offline") {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-yellow-400\"></span>"
    } else {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-gray-500\"></span>"
    }
}

// Name : frontend-game.copy_game_url()
// Desc : copies the game url to the clients clipboard
function copy_game_url() {
    let tempInput = document.createElement("input");
    tempInput.value = window.location.href;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    toast_alert.fire({
        icon: 'success',
        html: '<h1 class="text-lg font-bold pl-2 pr-1">Copied game link</h1>'
    });
}