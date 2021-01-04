/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/home.js
Desc     : handles socket.io connection
           related to game play
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Declare socket.io
let socket = io();
//Set SA Toast Settings
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 5000
});
//JSON array of game data
let game_data;
//Setup game variables
let in_setup = true;
let current_player_host = false;
//Session player_id
let session_player_id = undefined;

//Update game_data
function update_game() {
    socket.emit('retrieve-game', {
        slug: window.location.pathname.substr(6)
    })
}

//Socket.io on game-data
socket.on('game-data', function (data) {
    console.log(data);
    game_data = data;
    //Check to see if we have to set up the game
    if (in_setup === true) {
        in_setup = false;
        setup_game();
    }
});

//Setup game
function setup_game() {
    //Get browser session details
    if (localStorage.getItem('ec_session')) {
        //Check if game_id matches
        if (localStorage.getItem('ec_session').game_id === game_data._id) {
            for (let i = 0; i > game_data.players.length; i++) {
                //Make sure player exists
                if (game_data.players[i]._id ===  localStorage.getItem('ec_session').player_id) {
                    session_player_id = game_data.players[i]._id;
                    if (game_data.players[i].status === "host") {
                        current_player_host = true;
                    } else {
                        current_player_host = false;
                    }
                    break;
                }
            }
        } else {
            //Reset local storage since game expired
            localStorage.setItem('ec_session', JSON.stringify({
                game_id: game_data._id,
                player_id: undefined
            }));
        }
    } else {
        //Reset local storage since game data doesn't exist
        localStorage.setItem('ec_session', JSON.stringify({
            game_id: game_data._id,
            player_id: undefined
        }));
    }
    //Update players on UI
    update_players();
}

//Update players
function update_players() {
    //Sort by player_seat
    game_data.players.sort(function(a, b) {
        return a.seat > b.seat;
    });
    //For each player, append to respective positions
    for (let i = 0; i < game_data.players.length; i++) {
        console.log(game_data.players[i]);
        //Append to sidebar, information
        let actions = "";
        if (game_data.players[i]._id === session_player_id) {

            //Add reset game button to player actions
            if (current_player_host) {
                actions = "<div class=\"flex mt-0 ml-4\">\n" +
                    "    <span class=\"\">\n" +
                    "          <button type=\"button\" class=\"inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400\">\n" +
                    "                <svg class=\"-ml-1 mr-1 h-5 w-5\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                    "                    <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n" +
                    "                </svg>\n" +
                    "                Reset Game\n" +
                    "          </button>\n" +
                    "    </span>\n" +
                    "</div>";
            }
        } else if (current_player_host) {
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
        let sidebar_players_payload = "";
        sidebar_players_payload += "<div class=\"flex items-center justify-between mb-2\">\n" +
            "    <div class=\"flex-1 min-w-0\">\n" +
            "        <h3 class=\"text-md font-bold text-gray-900 truncate\">\n" +
            "            " + status_dot(game_data.players[i].status, game_data.players[i].connection) + " " + game_data.players[i].nickname + "\n" +
            "        </h3>\n" +
            "        <div class=\"mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6\">\n" +
            "            <div class=\"flex items-center text-sm text-gray-500\">\n" +
            "                " + game_data.players[i].status.charAt(0).toUpperCase() + game_data.players[i].status.slice(1) + ", " + game_data.players[i].connection + "\n" +
            "            </div>\n" +
            "        </div>\n" +
            "    </div>\n" +
            actions +
            "</div>";
        //Append to center
        let center_players_payload = "";
        center_players_payload += "<div class=\"block text-center\">\n" +
            "    <h1 class=\"text-gray-600 font-medium text-sm\">\n" +
            "        " + game_data.players[i].nickname + " " + status_dot(game_data.players[i].status, game_data.players[i].connection) + "\n" +
            "    </h1>\n" +
            "    <div class=\"flex flex-col items-center -space-y-3\">\n" +
            "        <img class=\"h-12 w-12 rounded-full\" src=\"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80\" alt=\"\">\n" +
            "        <div class=\"-space-x-4 rotate-12\">\n" +
            "            <div class=\"transform inline-block rounded-md bg-gray-700 shadow-md h-5 w-4 -rotate-12\"><h1 class=\"text-gray-700 text-sm\">1</h1></div>\n" +
            "            <div class=\"transform inline-block rounded-md bg-gray-600 shadow-md h-5 w-4\"><h1 class=\"text-gray-600 text-sm\">1</h1></div>\n" +
            "            <div class=\"transform inline-block rounded-md bg-gray-500 shadow-md h-5 w-4 rotate-12\">\n" +
            "                <h1 class=\"text-white text-sm\">3</h1>\n" +
            "            </div>\n" +
            "        </div>\n" +
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
        document.getElementById("center_players").innerHTML = center_players_payload;
    }
}

//Return status dot
function status_dot(status, connection) {
    if (status === "exploded") {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 align-middle bg-red-500\"></span>"
    } else if (connection === "connected") {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 align-middle bg-green-500\"></span>"
    } else if (connection === "disconnected") {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 align-middle bg-yellow-400\"></span>"
    } else {
        return "<span class=\"animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 align-middle bg-gray-500\"></span>"
    }
}