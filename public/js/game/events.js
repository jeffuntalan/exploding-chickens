/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/game/events.js
Desc     : handles setup for player settings in browser
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Declare socket.io
let socket = io();
// Swal toast settings
const toast_alert = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 5000,
    padding: '0.4rem'
});
// Global variables
let allow_connect_msg = false;
let session_user = {
    _id: undefined,
    is_host: false,
    can_draw: false
};

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 SOCKET.IO EVENTS
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.socket.on.{slug}-update
// Desc : whenever an event occurs containing a game update
socket.on(window.location.pathname.substr(6) + "-update", function (data) {
    console.log(data);
    console.log(data.trigger);
    // Check browser session
    setup_session_check(data);
    // Update elements based on update trigger
    if (data.trigger === "player-connected") { // Existing player connected
        sbr_update_pstatus(data);
        itr_update_pstatus(data);
    } else if (data.trigger === "create-player") { // New player was created
        if (user_prompt_open) {
            setup_update_options(data);
        }
        sbr_update_widgets(data);
        sbr_update_players(data);
        itr_update_players(data);
    } else if (data.trigger === "start-game") { // Game started
        sbr_update_widgets(data);
        sbr_update_pstatus(data);
        itr_update_pstatus(data);
        itr_update_pcards(data);
        itr_update_discard(data);
        itr_update_hand(data);
        toast_alert.fire({
            icon: 'info',
            html: '<h1 class="text-lg font-bold pl-2 pr-1">Game has started</h1>'
        });
    } else if (data.trigger === "reset-game") { // Game was reset
        sbr_update_widgets(data);
        sbr_update_pstatus(data);
        itr_update_pstatus(data);
        itr_update_pcards(data);
        itr_update_discard(data);
        itr_update_hand(data);
        toast_alert.fire({
            icon: 'info',
            html: '<h1 class="text-lg font-bold pl-2 pr-1">Game has been reset</h1>'
        });
    } else if (data.trigger === "play-card") { // A card was played by a player
        itr_update_pcards(data);
        itr_update_discard(data);
        itr_update_hand(data);
    } else if (data.trigger === "draw-card") { // A card was drawn by a player
        itr_update_pcards(data);
        itr_update_hand(data);
    } else if (data.trigger === "disconnect") { // Existing player disconnected
        sbr_update_pstatus(data);
    } else { // Update entire ui
        sbr_update_widgets(data);
        sbr_update_players(data);
        itr_update_players(data);
        itr_update_discard(data);
        itr_update_hand(data);
    }
});

// Name : frontend-game.socket.on.{slug}-callback
// Desc : whenever an event occurs related to an error
socket.on(window.location.pathname.substr(6) + "-callback", function (data) {
    console.log(data);
});

// Name : frontend-game.socket.on.player-created
// Desc : whenever an event occurs stating that a player was created
socket.on("player-created", function (data) {
    // Update player_id
    session_user._id = data;
    localStorage.setItem('ec_session', JSON.stringify({
        slug: window.location.pathname.substr(6),
        player_id: data
    }));
});

// Name : frontend-game.socket.on.{slug}-error
// Desc : whenever an event occurs related to an error
socket.on(window.location.pathname.substr(6) + "-error", function (data) {
    if (data === "Game does not exist") {
        window.location.href = "/";
    } else {
        toast_alert.fire({
            icon: 'error',
            html: '<h1 class="text-lg font-bold pl-2 pr-1">' + data + '</h1>'
        });
    }
});

// Name : frontend-game.socket.on.connect
// Desc : whenever we connect to the backend
socket.on("connect", function (data) {
    // Request game update
    socket.emit('retrieve-game', {
        slug: window.location.pathname.substr(6)
    })
    // Update status dot
    document.getElementById("status_ping").innerHTML = "<span class=\"animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75\"></span>\n" +
        "<span class=\"relative inline-flex rounded-full h-2 w-2 bg-green-500\"></span>"
    // Send alert
    if (allow_connect_msg) {
        toast_alert.fire({
            icon: 'success',
            html: '<h1 class="text-lg font-bold pl-2 pr-1">Connected</h1>'
        });
    } else {
        allow_connect_msg = true;
    }
});

// Name : frontend-game.socket.on.disconnect
// Desc : whenever we disconnect from the backend
socket.on("disconnect", function (data) {
    // Update status dot
    document.getElementById("status_ping").innerHTML = "<span class=\"animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75\"></span>\n" +
        "<span class=\"relative inline-flex rounded-full h-2 w-2 bg-red-500\"></span>"
    // Send alert
    toast_alert.fire({
        icon: 'error',
        html: '<h1 class="text-lg font-bold pl-2 pr-1">Disconnected</h1>'
    });
});

/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 PLAYER ACTION FUNCTIONS
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.start_game()
// Desc : emits the start-game event when the host clicks the start game button
function start_game() {
    socket.emit('start-game', {
        slug: window.location.pathname.substr(6),
        player_id: session_user._id
    })
}

// Name : frontend-game.reset_game()
// Desc : emits the reset-game event when the host clicks the reset game button
function reset_game() {
    socket.emit('reset-game', {
        slug: window.location.pathname.substr(6),
        player_id: session_user._id
    })
}

// Name : frontend-game.play_card(card_id)
// Desc : emits the play-card event when a card in the players hand is clicked
function play_card(card_id) {
    socket.emit('play-card', {
        slug: window.location.pathname.substr(6),
        player_id: session_user._id,
        card_id: card_id
    })
}

// Name : frontend-game.draw_card()
// Desc : emits the draw-card event when the draw deck is clicked
function draw_card() {
    if (session_user.can_draw) {
        socket.emit('draw-card', {
            slug: window.location.pathname.substr(6),
            player_id: session_user._id
        })
    } else {
        toast_alert.fire({
            icon: 'error',
            html: '<h1 class="text-lg font-bold pl-2 pr-1">You cannot draw a card</h1>'
        });
    }
}