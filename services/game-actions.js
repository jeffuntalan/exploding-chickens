/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/game-actions.js
Desc     : all actions and helper functions
           related to game play
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

// Name : game_actions.create_game()
// Desc : creates a new game in mongodb
// Author(s) : RAk3rman
exports.create_game = async function () {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.create({}, function (err, created_game) {
            if (err) {
                reject(err);
            } else {
                resolve(created_game);
            }
        });
    });
}

// Name : game_actions.delete_game()
// Desc : deletes a existing game in mongodb
// Author(s) : RAk3rman
exports.delete_game = async function (_id) {
    //Create new promise and return delete_game _id after deleted
    return await new Promise((resolve, reject) => {
        game.deleteOne({ _id: _id }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(_id);
            }
        });
    });
}