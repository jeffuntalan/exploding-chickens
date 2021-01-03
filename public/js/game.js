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

//Setup game
function setup_game() {
    //Update game data and configure setup
    update_game();
}

//Update game_data
function update_game() {
    socket.emit('retrieve-game', {
        slug: window.location.pathname.substr(6)
    })
}

//Socket.io on game-data
socket.on('game-data', function (data) {
    console.log(data);
});