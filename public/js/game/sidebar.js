/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/game/sidebar.js
Desc     : handles ui updates and actions on the sidebar
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.sbr_update_widgets(game_details)
// Desc : update status, ec chance, & cards left widgets
function sbr_update_widgets(game_details) {
    // Status widget variables
    let stat_header = "<div class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 dark:bg-gray-900 dark:border-gray-800\">\n";
    let stat_icon;
    let stat_text = "...";
    let stat_color_a = "";
    let stat_color_b = "";
    // Construct status widget
    if (session_user.is_host) {
        if (game_details.status === "starting") {
            stat_header = "<button type=\"button\" class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 bg-gradient-to-r from-green-500 to-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500\" onclick=\"start_game()\">\n";
            stat_icon = "<svg class=\"stroke-current text-white\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9\" />\n" +
                "</svg>";
            stat_text = "Starting...";
        } else if (game_details.status === "in_lobby") {
            stat_header = "<button type=\"button\" class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 bg-gradient-to-r from-green-500 to-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500\" onclick=\"start_game()\">\n";
            stat_icon = "<svg class=\"stroke-current text-white\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9\" />\n" +
                "</svg>";
            stat_text = "Start <span class=\"hidden sm:inline-block\">game</span>";
        } else if (game_details.status === "in_game") {
            stat_header = "<button type=\"button\" class=\"widget w-full p-2.5 rounded-lg bg-white border border-gray-100 bg-gradient-to-r from-yellow-500 to-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500\"  onclick=\"reset_game()\">\n";
            stat_icon = "<svg class=\"stroke-current text-white\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n" +
                "</svg>";
            stat_text = "Reset <span class=\"hidden sm:inline-block\">game</span>";
        }
        stat_color_a = "text-white";
        stat_color_b = "text-white";
    } else {
        if (game_details.status === "in_lobby") {
            stat_icon = "<svg class=\"stroke-current text-blue-500\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />\n" +
                "</svg>\n";
            stat_text = "In lobby";
        } else if (game_details.status === "in_game") {
            stat_icon = "<svg class=\"stroke-current text-blue-500\" height=\"24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />\n" +
                "</svg>\n";
            stat_text = "In game";
        }
        stat_color_a = "text-gray-500";
        stat_color_b = "text-black";
    }
    // Update status widget
    document.getElementById("sbr_ele_status").innerHTML = stat_header +
        "    <div class=\"flex flex-row items-center justify-between\">\n" +
        "        <div class=\"flex flex-col text-left\">\n" +
        "            <div class=\"text-xs uppercase truncate " + stat_color_a + "\">\n" +
        "                Status\n" +
        "            </div>\n" +
        "            <div class=\"text-lg font-bold truncate " + stat_color_b + "\">\n" +
        "                " + stat_text + "\n" +
        "            </div>\n" +
        "        </div>\n" + stat_icon +
        "    </div>\n" +
        "</div>";
    if (game_details.status === "starting") { return }
    // Update ec count widget
    let p_chance = 100;
    if (game_details.cards_remaining !== 0) {
        p_chance = Math.floor((game_details.ec_remaining/game_details.cards_remaining)*100);
    }
    document.getElementById("sbr_ele_ec_count").innerHTML = game_details.ec_remaining + "<a class=\"font-light\"> / " +  p_chance + "% chance</a>";
    document.getElementById("itr_ele_ec_count").innerHTML = "<i class=\"fas fa-bomb\"></i> " + game_details.ec_remaining + "<a class=\"font-light\"> / " +  p_chance + "%</a>";
    // Update cards remaining widget
    document.getElementById("sbr_ele_cards_remain").innerHTML = game_details.cards_remaining;
}

// Name : frontend-game.sbr_update_players(game_details)
// Desc : updates players, add host actions if able
function sbr_update_players(game_details) {
    let payload = "";
    // Loop through each player and append to payload
    for (let i = 0; i < game_details.players.length; i++) {
        // Check if we found current user, append to top
        if (game_details.players[i]._id === session_user._id) {
            document.getElementById("sbr_ele_usertop").innerHTML = game_details.players[i].nickname + create_stat_dot(game_details.players[i].status, game_details.players[i].connection, "mx-1.5", "sbr_stat_usertop_" + game_details.players[i]._id);
        }
        // If host, add make host and kick options to each player
        let actions = "";
        // TODO Implement make host / kick actions
        // if (session_user.is_host && game_details.players[i]._id !== session_user._id) {
        //     actions = "<div class=\"flex mt-0 ml-4\">\n" +
        //         "    <span class=\"\">\n" +
        //         "          <button type=\"button\" class=\"inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500\">\n" +
        //         "                <svg class=\"-ml-1 mr-1 h-5 w-5 text-gray-500\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
        //         "                    <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" />\n" +
        //         "                </svg>\n" +
        //         "                Make Host\n" +
        //         "          </button>\n" +
        //         "    </span>\n" +
        //         "    <span class=\"ml-3\">\n" +
        //         "          <button type=\"button\" class=\"inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500\">\n" +
        //         "                <svg class=\"-ml-1 mr-1 h-5 w-5\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\" aria-hidden=\"true\">\n" +
        //         "                    <path fill-rule=\"evenodd\" d=\"M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z\" clip-rule=\"evenodd\" />\n" +
        //         "                </svg>\n" +
        //         "                Kick\n" +
        //         "          </button>\n" +
        //         "    </span>\n" +
        //         "</div>";
        // }
        // Construct name for each player
        let name = game_details.players[i].nickname;
        if (game_details.players[i].type === "host") {
            name += ", Host"
        } else if (game_details.players[i]._id === session_user._id) {
            name += ", You"
        }
        // Add sidebar html to payload
        payload += "<div class=\"flex items-center justify-between mb-2\">\n" +
            "    <div class=\"flex-1 min-w-0\">\n" +
            "        <h3 class=\"text-md font-bold text-gray-900 truncate\">\n" +
            "            " + name + " " + create_stat_dot(game_details.players[i].status, game_details.players[i].connection, "mx-0.5", "sbr_stat_player_dot_" + game_details.players[i]._id) + "\n" +
            "        </h3>\n" +
            "        <div class=\"mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6\">\n" +
            "            <div class=\"flex items-center text-sm text-gray-500\" id=\"sbr_stat_player_details_" + game_details.players[i]._id + "\">\n" +
            "                " + game_details.players[i].status.charAt(0).toUpperCase() + game_details.players[i].status.slice(1) + ", " + game_details.players[i].connection + "\n" +
            "            </div>\n" +
            "        </div>\n" +
            "    </div>\n" +
            actions +
            "</div>";
    }
    // Update with new player data
    if (payload !== "") {
        document.getElementById("sbr_ele_players").innerHTML = payload;
    }
}

// Name : frontend-game.sbr_update_pstatus(game_details)
// Desc : updates only the status symbol of players
function sbr_update_pstatus(game_details) {
    // Loop through each player and update status
    for (let i = 0; i < game_details.players.length; i++) {
        // Check if we found current user, append to top
        if (game_details.players[i]._id === session_user._id) {
            document.getElementById("sbr_stat_usertop_" + game_details.players[i]._id).className = stat_dot_class(game_details.players[i].connection, "mx-1.5");
        }
        // Update status for players element
        document.getElementById("sbr_stat_player_dot_" + game_details.players[i]._id).className = stat_dot_class(game_details.players[i].connection, "mx-0.5");
        document.getElementById("sbr_stat_player_details_" + game_details.players[i]._id).innerHTML = game_details.players[i].status.charAt(0).toUpperCase() + game_details.players[i].status.slice(1) + ", " + game_details.players[i].connection;
    }
}

// Name : frontend-game.sbr_copy_url()
// Desc : copies the game url to the clients clipboard
function sbr_copy_url() {
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