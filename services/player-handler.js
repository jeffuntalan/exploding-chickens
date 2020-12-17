/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/player-handler.js
Desc     : handles all player actions
           and modifies players in game db
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

// Name : player_handler.modify_player()
// Desc : modifies an existing player, if it doesn't exist, make new player
// Author(s) : RAk3rman
exports.modify_player = async function (game_id, player_id, player_nickname, player_seat, player_status) {
    //Check if game exists
    //TODO see if there is a more efficient way to do this
    let player_exists = await game.exists({ _id: game_id, "players._id": player_id });
    //Create new promise and return player id after saved
    return await new Promise((resolve, reject) => {
        //Find game in db
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                //Check if game exists
                if (found_game !== null) {
                    //Check if player exists
                    if (player_exists) {
                        //Update existing player and return player_id
                        game.findOneAndUpdate({ _id: game_id, "players._id": player_id }, {"$set": { "players.$.nickname": player_nickname, "players.$.seat": player_seat, "players.$.status": player_status }}, function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(player_id);
                            }
                        });
                    } else {
                        //Create new player id
                        if (!player_id) {
                            player_id = uuidv4();
                        }
                        //Push new player into existing game
                        found_game.players.push({ _id: player_id, nickname: player_nickname, seat: player_seat, status: player_status });
                        //Save existing game and return player_id
                        found_game.save(function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(player_id);
                            }
                        });
                    }
                } else {
                    reject("Player cannot be created because game does not exist");
                }
            }
        });
    });
};

// Name : player_handler.randomize_seats()
// Desc : given a game_id, gives each player a random seat position (without replacement)
// Author(s) : SengdowJones
exports.randomize_seats = async function (game_id) {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {

                // Randomly sample seat number without replacement
                let bucket = [];

               for (let i=0;i<=found_game.players.length-1;i++) {
                   bucket.push(i)
               }

                function getRandomFromBucket() {
                    let randomIndex = Math.floor(Math.random()*bucket.length);
                    return bucket.splice(randomIndex, 1)[0];
                }

               // Update seat number for each player
                for (let i=0;i<=found_game.players.length-1;i++) {
                   game.findOneAndUpdate({ _id: game_id, "players._id": found_game.players[i]._id }, {"$set": { "players.$.seat": getRandomFromBucket() }}, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                        }
                    });
                }
                resolve(found_game);
            }
        });
    });
}