/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/home.js
Desc     : handles socket.io connection
           related to site wide statistics and modals
Author(s): RAk3rman, SengdowJones
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Swal toast settings
const toast_alert = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 5000,
    padding: '0.4rem'
});

// Declare socket.io
let socket = io();

// Attempt to join game
function join_game() {
    // Get game slug from input
    let passed_slug = document.getElementById("game_slug").value;
    // Input validation
    if (passed_slug !== "" && /^[a-z-]+$/.test(passed_slug)) {
        socket.emit('check-slug', {
            slug: passed_slug
        });
    } else {
        invalid_game_slug();
    }
}

// Invalid game slug
function invalid_game_slug() {
    // Clear input
    document.getElementById("game_slug").value = "";
    // Fire error toast
    toast_alert.fire({
        icon: 'error',
        html: '<h1 class="text-lg font-bold pl-2 pr-1">Invalid game code</h1>'
    });
}

// Handle incoming slug response
socket.on("slug-response", function (data) {
    if (data === false) {
        invalid_game_slug();
    } else {
        window.location.href = "/game/" + data;
    }
});
