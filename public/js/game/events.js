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
    // Check browser session
    setup_session_check(data);
    // Update elements based on update trigger
    if (data.trigger === "player-connected") { // Existing player connected
        sbr_update_pstatus(data);
        itr_update_pstatus(data);
        itr_update_hand(data);
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
        itr_update_players(data);
        itr_update_pcards(data);
        itr_update_discard(data);
        itr_update_hand(data);
        toast_alert.fire({
            icon: 'info',
            html: '<h1 class="text-lg font-bold pl-2 pr-1">Game has started</h1>'
        });
    } else if (data.trigger === "reset-game") { // Game was reset or there is a winner
        sbr_update_widgets(data);
        sbr_update_pstatus(data);
        itr_update_pstatus(data);
        itr_update_pcards(data);
        itr_update_discard(data);
        itr_update_hand(data);
        // Check if we have a winner
        let winner = false;
        for (let i = 0; i < data.players.length; i++) {
            if (data.players[i].status === "winner") {
                itr_display_winner(data.players[i].nickname, 0);
                winner = true;
                break;
            }
        }
        if (winner === false) {
            toast_alert.fire({
                icon: 'info',
                html: '<h1 class="text-lg font-bold pl-2 pr-1">Game has been reset</h1>'
            });
        }
    } else if (data.trigger === "play-card") { // A card was played by a player
        sbr_update_widgets(data);
        itr_update_players(data);
        itr_update_pcards(data);
        if (data.req_player_id !== session_user._id) {
            itr_update_discard(data);
            itr_update_hand(data);
        }
    } else if (data.trigger === "draw-card") { // A card was drawn by a player
        sbr_update_widgets(data);
        itr_update_pcards(data);
        itr_update_hand(data);
    } else if (data.trigger === "disconnect") { // Existing player disconnected
        sbr_update_pstatus(data);
        itr_update_pstatus(data);
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
    // See the future callback
    if (data.trigger === "seethefuture") {
        itr_trigger_stf(data.payload);
    } else if (data.trigger === "favor_target") {
        itr_trigger_pselect(data.payload.game_details, data.payload.card_id);
    } else if (data.trigger === "chicken_target") {
        itr_trigger_chicken_target(parseInt(data.payload.max_pos), data.payload.card_id);
    } else if (data.trigger === "favor_taken") {
        sbr_update_widgets(data.payload.game_details);
        itr_update_players(data.payload.game_details);
        itr_update_pcards(data.payload.game_details);
        itr_update_discard(data.payload.game_details);
        itr_update_hand(data.payload.game_details);
        if (session_user._id === data.payload.target_player_id) {
            itr_trigger_taken(data.payload.favor_player_name, data.payload.card_image_loc);
        }
    }
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

// Name : frontend-game.socket.on.{slug}-draw-card
// Desc : whenever the player draws a card, triggers animation
socket.on(window.location.pathname.substr(6) + "-draw-card", function (data) {
    const temp = document.getElementById("anim_draw");
    const target = document.getElementById(data._id);
    new AnimationFrames({
        duration: 400,
        easing: 'sineInOut',
        onstart () {
            temp.style.display = '';
            temp.style.backgroundImage = 'url(/' + data.image_loc + ')';
            target.style.visibility = 'hidden';
        },
        onprogress: (e) => {
            temp.style.transform = translate(e * (get_position(target).x - get_position(temp).x), e * (get_position(target).y - get_position(temp).y));
        },
        onend () {
            temp.style.transform = '';
            target.style.visibility = 'visible';
        }
    });
});

// Name : frontend-game.socket.on.{slug}-play-card
// Desc : whenever the player plays a card, triggers animation
socket.on(window.location.pathname.substr(6) + "-play-card", function (data) {
    const temp = document.getElementById("anim_draw");
    const target = document.getElementById(data.card._id);
    const discard = document.getElementById("anim_discard");
    new AnimationFrames({
        duration: 400,
        easing: 'sineInOut',
        onstart () {
            temp.style.display = '';
            temp.style.backgroundImage = 'url(/' + data.card.image_loc + ')';
            target.style.visibility = 'hidden';
        },
        onprogress: (e) => {
            temp.style.transform = translate((e * ((get_position(discard).x - get_position(target).x)) +  + (get_position(target).x - get_position(temp).x)), (e * (get_position(discard).y - get_position(target).y)) + (get_position(target).y - get_position(temp).y));
        },
        onend () {
            itr_update_discard(data.game_details);
            itr_update_hand(data.game_details);
            temp.style.transform = '';
        }
    });
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
    sbr_update_widgets({status: "starting"});
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

// Name : frontend-game.play_card(card_id, target)
// Desc : emits the play-card event when a card in the players hand is clicked
function play_card(card_id, target) {
    socket.emit('play-card', {
        slug: window.location.pathname.substr(6),
        player_id: session_user._id,
        card_id: card_id,
        target: target
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