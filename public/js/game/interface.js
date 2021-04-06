/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/game/interface.js
Desc     : handles ui updates and actions on the interface
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Swal toast settings
const toast_turn = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    padding: '0.3rem'
});
// Global variables
let is_turn = false;

// Name : frontend-game.itr_update_players(game_details)
// Desc : updates players
function itr_update_players(game_details) {
    let top_payload = "";
    let center_payload = "";
    // Loop through each player and append to payload
    for (let i = 0; i < game_details.players.length; i++) {
        // Construct top player payload
        top_payload += "<img class=\"inline-block h-6 w-6 rounded-full ring-2 ring-white\" src=\"/public/avatars/" + game_details.players[i].avatar + "\" alt=\"\">";
        // Construct center player payload
        let turns = game_details.seat_playing === game_details.players[i].seat ? game_details.turns_remaining : 0;
        // Check for dead filter
        let filter = game_details.players[i].status === "dead" ? "filter grayscale" : "";
        center_payload += "<div class=\"block text-center\">\n" +
            "    <h1 class=\"text-gray-600 font-medium text-sm\">\n" +
            "        " + game_details.players[i].nickname + " " + create_stat_dot(game_details.players[i].status, game_details.players[i].connection, "", "itr_stat_player_dot_" + game_details.players[i]._id) + "\n" +
            "    </h1>\n" +
            "    <div class=\"flex flex-col items-center -space-y-3\" id=\"itr_stat_player_halo_" + game_details.players[i]._id + "\">\n" +
            "        <img class=\"h-12 w-12 rounded-full " + filter + "\" src=\"/public/avatars/" + game_details.players[i].avatar + "\" alt=\"\">\n" +
            card_icon(game_details.players[i].status === "dead" ? -1: game_details.players[i].card_num, turns, game_details) +
            "    </div>\n" +
            "</div>";
        // If we are not at the end of the number of players, indicate direction
        if (i < game_details.players.length - 1) {
            if (game_details.turn_direction === "forward") {
                center_payload += "<button class=\"mx-2 bg-gray-400 p-1 rounded-full text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white\">\n" +
                    "    <svg class=\"h-3 w-3\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                    "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 5l7 7-7 7M5 5l7 7-7 7\" />\n" +
                    "    </svg>" +
                    "</button>";
            } else {
                center_payload += "<button class=\"mx-2 bg-gray-400 p-1 rounded-full text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white\">\n" +
                    "    <svg class=\"h-3 w-3\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n" +
                    "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 19l-7-7 7-7m8 14l-7-7 7-7\" />\n" +
                    "    </svg>\n" +
                    "</button>";
            }
        }
    }
    // Update with new player data
    if (top_payload !== "" || center_payload !== "") {
        document.getElementById("itr_ele_players_top").innerHTML = top_payload;
        document.getElementById("itr_ele_players_center").innerHTML = center_payload;
    }
}

// Name : frontend-game.itr_update_pstatus(game_details)
// Desc : updates only the status symbol of players
function itr_update_pstatus(game_details) {
    // Loop through each player and update status
    for (let i = 0; i < game_details.players.length; i++) {
        document.getElementById("itr_stat_player_dot_" + game_details.players[i]._id).className = stat_dot_class(game_details.players[i].connection, "mx-0.5");
    }
}

// Name : frontend-game.itr_update_pcards(game_details)
// Desc : updates only the cards icon of players
function itr_update_pcards(game_details) {
    // Loop through each player and update card icon
    for (let i = 0; i < game_details.players.length; i++) {
        let turns = 0;
        if (game_details.seat_playing === game_details.players[i].seat) {
            turns = game_details.turns_remaining;
        }
        document.getElementById("itr_stat_player_halo_" + game_details.players[i]._id).innerHTML = "<img class=\"h-12 w-12 rounded-full\" src=\"/public/avatars/" + game_details.players[i].avatar + "\" alt=\"\">\n" + card_icon(game_details.players[i].card_num, turns, game_details);
    }
}

// Name : frontend-game.itr_update_discard(game_details)
// Desc : updates discard deck
function itr_update_discard(game_details) {
    if (game_details.discard_deck.length !== 0) {
        document.getElementById("itr_ele_discard_deck").innerHTML = "<div class=\"rounded-xl shadow-sm center-card bg-center bg-contain\" style=\"background-image: url('/" + game_details.discard_deck[game_details.discard_deck.length-1].image_loc + "')\"></div>";
    } else {
        document.getElementById("itr_ele_discard_deck").innerHTML = "<div class=\"rounded-xl shadow-lg center-card bg-center bg-contain mx-1 border-dashed border-4 border-gray-400\">\n" +
            "    <h1 class=\"text-gray-400 font-bold flex items-center justify-center center-card-text\">Discard Pile</h1>\n" +
            "</div>";
    }
}

// Name : frontend-game.itr_update_hand(game_details)
// Desc : updates users hand and toggles banner if needed
function itr_update_hand(game_details) {
    let payload = "";
    // Find current player
    for (let i = 0; i < game_details.players.length; i++) {
        if (game_details.players[i]._id === session_user._id) {
            session_user.can_draw = true;
            // Add cards to hand
            for (let j = 0; j < game_details.players[i].cards.length; j++) {
                let play_card_funct = "";
                if (game_details.seat_playing === game_details.players[i].seat &&
                    game_details.players[i].cards[j].action === "defuse" || game_details.players[i].status !== "exploding") {
                    play_card_funct = "play_card('" + game_details.players[i].cards[j]._id + "', '')";
                }
                // Check if chicken is active
                if (game_details.players[i].cards[j].action === "chicken") {
                    itr_trigger_exp(10, game_details.players[i].cards[j]._id, true);
                    session_user.can_draw = false;
                }
                payload += "<div class=\"rounded-xl shadow-sm bottom-card bg-center bg-contain\" onclick=\"" + play_card_funct + "\" style=\"background-image: url('/" + game_details.players[i].cards[j].image_loc + "')\"></div>";
            }
            // Toggle turn banner
            if (game_details.seat_playing === game_details.players[i].seat && !is_turn && game_details.status === "in_game") {
                toast_turn.fire({
                    icon: 'info',
                    html: '<h1 class="text-lg font-bold pl-2 pr-1">Your turn</h1>'
                });
                is_turn = true;
            } else if (game_details.seat_playing !== game_details.players[i].seat && game_details.status === "in_game") {
                toast_turn.close();
                is_turn = false;
                session_user.can_draw = false;
            }
        } else {
            // Check if chicken is active
            if (game_details.players[i].status === "exploding") {
                itr_trigger_exp(10, false, true);
            }
        }
    }
    document.getElementById("itr_ele_player_hand").innerHTML = payload;
}

// Name : frontend-game.itr_trigger_exp(count, card_id, setup)
// Desc : triggers the exploding chicken ui to appear
function itr_trigger_exp(count, card_id, setup) {
    // Append html overlay if on first function call
    if (setup) {
        document.getElementById("itr_ele_discard_deck").innerHTML = "<div class=\"rounded-xl shadow-lg center-card bg-center bg-contain mx-1\" style=\"background-image: linear-gradient(rgba(0, 0, 0, .6), rgba(0, 0, 0, .6)), url('/public/cards/base/chicken.png');\">\n" +
            "    <div class=\"rounded-xl shadow-lg center-card bg-center bg-contain border-dashed border-4 border-green-500 h-full\" style=\"border-color: rgb(178, 234, 55); color: rgb(178, 234, 55);\">\n" +
            "        <div class=\"flex flex-wrap content-center justify-center h-full w-full\">\n" +
            "            <div class=\"block text-center space-y-2\">\n" +
            "                <h1 class=\"font-extrabold text-xl m-0\">DEFUSE</h1>\n" +
            "                <h1 class=\"font-bold text-8xl m-0\" id=\"itr_val_defuse_counter\">" + count + "</h1>\n" +
            "                <h1 class=\"font-extrabold text-xl m-0\">CHICKEN</h1>\n" +
            "            </div>\n" +
            "        </div>\n" +
            "    </div>\n" +
            "</div>";
        //toggle_halo(player_id, "ring-2 ring-red-500 animate-pulse");
    }
    // Call program again if not placed
    if (count > 0) {
        document.getElementById("itr_val_defuse_counter").innerHTML = count;
        setTimeout(function(){ itr_trigger_exp(count, card_id, false) }, 1000);
    } else if (count > -1) {
        document.getElementById("itr_val_defuse_counter").innerHTML = "<i class=\"fas fa-skull-crossbones\"></i>"
        setTimeout(function(){ itr_trigger_exp(count, card_id, false) }, 1000);
    } else if (card_id !== false) {
        // Force play chicken since time expired
        play_card(card_id);
    }
    count--;
}

// Name : frontend-game.itr_trigger_stf(top_3)
// Desc : triggers the exploding chicken ui to appear
function itr_trigger_stf(top_3) {
    let card_payload;
    // Check number of cards left in deck, prepare payload
    if (top_3.length > 2) {
        card_payload = "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain -rotate-12\" style=\"background-image: url('/" + top_3[top_3.length - 1].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n" +
            "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain mb-2\" style=\"background-image: url('/" + top_3[top_3.length - 2].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n" +
            "<div class=\"transform inline-block rounded-xl shadow-sm bottom-card bg-center bg-contain rotate-12\" style=\"background-image: url('/" + top_3[top_3.length - 3].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n";
    } else if (top_3.length > 1) {
        card_payload = "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain -rotate-6\" style=\"background-image: url('/" + top_3[top_3.length - 1].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n" +
            "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain rotate-6\" style=\"background-image: url('/" + top_3[top_3.length - 2].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n";
    } else if (top_3.length > 0) {
        card_payload = "<div class=\"transform inline-block rounded-xl shadow-sm center-card bg-center bg-contain\" style=\"background-image: url('/" + top_3[top_3.length - 1].image_loc + "');width: 10.2rem;height: 14.4rem;border-radius: 1.6rem\"></div>\n";
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

// Name : frontend-game.itr_trigger_pselect(game_details, card_id)
// Desc : triggers the player selection ui to appear
function itr_trigger_pselect(game_details, card_id) {
    let payload = "";
    // Check number of cards left in deck, prepare payload
    for (let i = 0; i < game_details.players.length; i++) {
        if (game_details.players[i].status === "playing" && session_user._id !== game_details.players[i]._id) {
            payload += "<div class=\"block text-center p-3\" onclick=\"play_card('" + card_id + "', '" + game_details.players[i]._id + "');swal.close();\">\n" +
                "    <h1 class=\"text-white font-medium text-sm\">\n" +
                "        " + game_details.players[i].nickname + " " + create_stat_dot(game_details.players[i].status, game_details.players[i].connection, "", "") +
                "    </h1>\n" +
                "    <div class=\"flex flex-col items-center -space-y-3\">\n" +
                "        <img class=\"h-12 w-12 rounded-full\" src=\"/public/avatars/" + game_details.players[i].avatar + "\" alt=\"\">\n" +
                card_icon(game_details.players[i].card_num, 0, game_details) +
                "    </div>\n" +
                "</div>";
        }
    }
    // Fire swal
    Swal.fire({
        html:
            "<div class=\"inline-block\">" +
            "    <h1 class=\"text-3xl font-semibold pb-1 text-white\">Ask a Favor</h1>" +
            "    <h1 class=\"text-xl font-semibold pb-3 text-white\">Select a player below</h1>" +
            "    <div class=\"inline-flex items-center p-2\">" +
            payload +
            "    </div>" +
            "</div>\n",
        background: "transparent",
        showConfirmButton: false
    })
}

// Name : frontend-game.itr_display_winner(name, count)
// Desc : displays the winner graphic
function itr_display_winner(name, count) {
    // Fire swal once and repeat
    if (count === 0) {
        Swal.fire({
            html: "<h1 class=\"text-4xl text-gray-700 mt-3\" style=\"font-family: Bebas Neue\">WINNER WINNER <a class=\"text-yellow-400\">CHICKEN</a> DINNER</h1>\n" +
                "<h1 class=\"text-xl text-gray-700 mt-1 font-bold\">" + name + "</h1>\n" +
                "<h1 class=\"text-md text-gray-700 mt-2\">After the smoke has cleared, it appears that " + name + " was the last one standing. Test your odds again by staying in the lobby.</h1>\n",
            showConfirmButton: false,
            showCancelButton: true,
            backdrop: "transparent",
            background: "#F8F8F8",
            cancelButtonColor: '#374151',
            cancelButtonText: 'Return to Lobby'
        })
    }
    if (count < 7) {
        setTimeout(() => {  itr_display_winner(name, count + 1); }, 500);
    }
    // Call confetti function
    confetti({
        angle: Math.random() * (125 - 55) + 55,
        spread: Math.random() * (70 - 50) + 50,
        particleCount: Math.random() * (100 - 50) + 50,
        origin: { y: 0.6 }
    });
}

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 GAME UI HELPER FUNCTIONS
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.create_stat_dot(status, connection, margin, id)
// Desc : returns the html for a pulsating status dot
function create_stat_dot(status, connection, margin, id) {
    return "<span class=\"" + stat_dot_class(connection, margin) + "\" id=\"" + id + "\"></span>"
}

// Name : frontend-game.stat_dot_class(connection, margin)
// Desc : returns the class for a status dot
function stat_dot_class(connection, margin) {
    if (connection === "connected") {
        return "animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-green-500"
    } else if (connection === "offline") {
        return "animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-yellow-500"
    } else {
        return "animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-gray-500"
    }
}

// Name : frontend-game.cards_icon(card_num, turns)
// Desc : returns the html for cards in a players hand (as well as blue card for turns)
function card_icon(card_num, turns, game_details) {
    // Check to see if target player has any turns remaining
    let turns_payload = "";
    if (turns !== 0 && game_details.status === "in_game") {
        turns_payload = "<div class=\"transform inline-block rounded-md bg-blue-500 shadow-md h-5 w-4 ml-1\">\n" +
            "    <h1 class=\"text-white text-sm\">" + turns + "</h1>\n" +
            "</div>\n"
    }
    // Determine number of cards in hand
    if (card_num === -1) {
        return "<div class=\"inline-block\"><div class=\"-space-x-4 rotate-12 inline-block\"><div class=\"transform inline-block rounded-md bg-red-500 shadow-md h-5 w-4\">\n" +
            "    <h1 class=\"text-white text-sm\"><i class=\"fas fa-skull-crossbones\"></i></h1>\n" +
            "</div></div></div>\n"
    } else if (card_num === 2) {
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
        return "<div class=\"inline-block\"><div class=\"-space-x-4 rotate-12 inline-block\"><div class=\"transform inline-block rounded-md bg-yellow-500 shadow-md h-5 w-4\">\n" +
            "    <h1 class=\"text-white text-sm\">" + card_num + "</h1>\n" +
            "</div></div>" +  turns_payload + "</div>\n"
    }
}