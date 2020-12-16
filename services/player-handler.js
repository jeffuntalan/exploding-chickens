/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/player-handler.js
Desc     : handles all player actions
           and modifies players in game db
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

// Name : player_handler.modify_player()
// Desc : modifies an existing player, if it doesn't exist, make new player
// Author(s) : RAk3rman
exports.modify_player = async function (game_id, player_id, player_nickname, player_seat, player_status) {
    //Create new promise and return created_player after saved
    // return await new Promise((resolve, reject) => {
    //     game.findById({ _id: game_id }, function (err, created_game) {
    //         if (err) {
    //             reject(err);
    //         } else {
    //             resolve(created_game);
    //         }
    //     });
    // });
}