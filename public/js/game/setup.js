/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/game/setup.js
Desc     : handles setup for player settings in browser
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Global variables
let allow_user_prompt = true;
let selected_avatar = "default.png";
let user_prompt_open = false;

// Name : frontend-game.setup_session_check(game_details)
// Desc : check local user configuration on browser
function setup_session_check(game_details) {
    // Get browser session details
    if (!localStorage.getItem('ec_session')) {
        // Reset local storage and session player since game data doesn't exist
        localStorage.setItem('ec_session', JSON.stringify({
            slug: window.location.pathname.substr(6),
            player_id: undefined
        }));
        session_user = {
            _id: undefined,
            is_host: false
        };
    } else if (JSON.parse(localStorage.getItem('ec_session')).slug !== window.location.pathname.substr(6)) {
        // Reset local storage and session player since slugs don't match
        localStorage.setItem('ec_session', JSON.stringify({
            slug: window.location.pathname.substr(6),
            player_id: undefined
        }));
        session_user = {
            _id: undefined,
            is_host: false
        };
    } else {
        // Check to make sure that the player is valid
        for (let i = 0; i < game_details.players.length; i++) {
            // Check if individual player exists
            if (game_details.players[i]._id === JSON.parse(localStorage.getItem('ec_session')).player_id) {
                if (session_user._id === undefined) {
                    // Tell server that a valid player connected
                    socket.emit('player-connected', {
                        slug: window.location.pathname.substr(6),
                        player_id: game_details.players[i]._id
                    })
                }
                // Update session_user _id and is_host
                session_user = {
                    _id: game_details.players[i]._id,
                    is_host: game_details.players[i].type === "host"
                };
                break;
            }
        }
    }
    // Open setup prompt if needed
    if (allow_user_prompt && session_user._id === undefined) {
        setup_user_prompt(game_details, "", "");
        allow_user_prompt = false;
    }
}

// Name : frontend-game.setup_user_prompt(game_details, err, nickname)
// Desc : fire a swal prompt to add user to game
function setup_user_prompt(game_details, err, nickname) {
    // Check if in game already
    if (game_details.status === "in_game") {
        prompt_open = false;
        Swal.fire({
            html: "<h1 class=\"text-4xl text-gray-700 mt-3\" style=\"font-family: Bebas Neue\"><a class=\"text-yellow-400\"><i class=\"fas fa-exclamation-triangle\"></i> EXPLODING</a> CHICKENS</h1>\n" +
                "<h1 class=\"text-sm text-gray-700\">Game Code: " + game_details.slug + " | Created: " + game_details.created + "</a><br><br><a class=\"text-red-500\">" + err + "</a></h1>\n" +
                "<h1 class=\"text-md text-gray-700\">The game has already started. Please refresh this page when the lobby is open to join.</h1>\n",
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonColor: '#374151',
            cancelButtonText: 'Spectate'
        })
    } else if (game_details.players.length > 5) {
        prompt_open = false;
        Swal.fire({
            html: "<h1 class=\"text-4xl text-gray-700 mt-3\" style=\"font-family: Bebas Neue\"><a class=\"text-yellow-400\"><i class=\"fas fa-exclamation-triangle\"></i> EXPLODING</a> CHICKENS</h1>\n" +
                "<h1 class=\"text-sm text-gray-700\">Game Code: " + game_details.slug + " | Created: " + game_details.created + "</a><br><br><a class=\"text-red-500\">" + err + "</a></h1>\n" +
                "<h1 class=\"text-md text-gray-700\">The player limit has been reached for this game. Please refresh this page when there is room for new players.</h1>\n",
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonColor: '#374151',
            cancelButtonText: 'Spectate'
        })
    } else {
        Swal.fire({
            html: "<h1 class=\"text-4xl text-gray-700 mt-3\" style=\"font-family: Bebas Neue\">Welcome to <a class=\"text-yellow-400\">EXPLODING</a> CHICKENS</h1>\n" +
                "<h1 class=\"text-sm text-gray-700\">Game Code: " + game_details.slug + " | Created: " + game_details.created + "</a><br><br><a class=\"text-red-500\">" + err + "</a></h1>\n" +
                "<div class=\"my-3 flex w-full max-w-sm mx-auto space-x-3 shadow-md\">\n" +
                "    <input\n" +
                "        class=\"text-center flex-1 appearance-none border border-transparent w-full py-2 px-10 bg-white text-gray-700 placeholder-gray-400 rounded-sm text-base border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500\"\n" +
                "        type=\"text\" id=\"nickname_swal\" maxlength=\"12\" value=\"" + nickname + "\" placeholder=\"What's your name?\">\n" +
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
                user_prompt_open = true;
                setup_update_options(game_details);
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Validate input
                let selected_nickname = document.getElementById("nickname_swal").value;
                if (selected_nickname === "" || !/^[a-zA-Z]/.test(selected_nickname)) {
                    setup_user_prompt("<i class=\"fas fa-exclamation-triangle\"></i> Please enter a valid nickname (letters only)", "");
                } else if (selected_avatar === "default.png") {
                    setup_user_prompt("<i class=\"fas fa-exclamation-triangle\"></i> Please select an avatar", selected_nickname);
                } else {
                    // Create new player
                    socket.emit('create-player', {
                        slug: window.location.pathname.substr(6),
                        nickname: selected_nickname,
                        avatar: selected_avatar
                    })
                }
            }
            user_prompt_open = false;
        })
    }
}

// Name : frontend-game.setup_update_options(game_details)
// Desc : show a swal prompt to add user to game
function setup_update_options(game_details) {
    let options = ["bear.png", "bull.png", "cat.png", "dog.png", "elephant.png", "flamingo.png", "fox.png", "lion.png", "mandrill.png", "meerkat.png", "monkey.png", "panda.png", "puma.png", "raccoon.png", "wolf.png"];
    let options_payload = "";
    // Loop through each avatar to see if in use or not
    for (let i = 0; i < options.length; i++) {
        // Loop through each player
        let found_match = false;
        for (let j = 0; j < game_details.players.length; j++) {
            if (game_details.players[j].avatar === options[i]) {
                found_match = true;
                break;
            }
        }
        // Append to payload
        if (found_match) { //Grayed out
            options_payload += "<div class=\"flex-none block text-center m-2\">\n" +
                "    <img class=\"h-16 w-16 rounded-full ring-2 ring-offset-2 ring-yellow-400 opacity-30\" src=\"/public/avatars/" + options[i] + "\" alt=\"\">\n" +
                "</div>\n";
            if (selected_avatar === options[i]) {
                selected_avatar = "default.png";
            }
        } else if (selected_avatar === options[i]) { //Current selection, green halo
            options_payload += "<div class=\"flex-none block text-center m-2\" onclick=\"setup_select_option('" + options[i] + "')\">\n" +
                "    <img class=\"h-16 w-16 rounded-full ring-2 ring-offset-2 ring-green-500\" src=\"/public/avatars/" + options[i] + "\" id=\"" + options[i] + "\" alt=\"\">\n" +
                "</div>\n";
        } else { //Available for selection
            options_payload += "<div class=\"flex-none block text-center m-2\" onclick=\"setup_select_option('" + options[i] + "')\">\n" +
                "    <img class=\"h-16 w-16 rounded-full\" src=\"/public/avatars/" + options[i] + "\" id=\"" + options[i] + "\" alt=\"\">\n" +
                "</div>\n";
        }
    }
    // Append to swal
    document.getElementById("avatar_options_swal").innerHTML = options_payload;
}

// Name : frontend-game.setup_select_option(avatar)
// Desc : select an avatar and update ui
function setup_select_option(avatar) {
    // Update old selection
    if (selected_avatar !== "default.png") {
        document.getElementById(selected_avatar).className = "h-16 w-16 rounded-full";
    }
    // Update new selection
    selected_avatar = avatar;
    document.getElementById(selected_avatar).className = "h-16 w-16 rounded-full ring-2 ring-offset-2 ring-green-500";

}