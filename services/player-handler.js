/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/player-handler.js
Desc     : handles all player actions
           and modifies players in game db
Author(s): RAk3rman, SengdowJones
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_handler = require('../services/player-handler.js');

// Name : player_handler.modify_player()
// Desc : modifies an existing player, if it doesn't exist, make new player
// Author(s) : RAk3rman
exports.modify_player = async function (game_id, player_id, player_nickname, player_seat, player_status) {
    //Check if player exists
    if (await game.exists({ _id: game_id, "players._id": player_id })) { //Modify existing player
        //Create new promise and return player id after saved
        return await new Promise((resolve, reject) => {
            //Update existing player and return player_id
            game.findOneAndUpdate({ _id: game_id, "players._id": player_id }, {"$set": { "players.$.nickname": player_nickname, "players.$.seat": player_seat, "players.$.status": player_status }}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(player_id);
                }
            });
        })
    } else { //Create new player
        //Get game details
        let game_details = await game_actions.game_details(game_id);
        //Create new promise and return player id after saved
        return await new Promise((resolve, reject) => {
            //Create new player id
            if (!player_id) {
                player_id = uuidv4();
            }
            //Push new player into existing game
            game_details.players.push({ _id: player_id, nickname: player_nickname, seat: player_seat, status: player_status });
            //Save existing game and return player_id
            game_details.save(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(player_id);
                }
            });
        })
    }
};

// Name : player_handler.randomize_seats()
// Desc : given a game_id, gives each player a random seat position (without replacement)
// Author(s) : SengdowJones
exports.randomize_seats = async function (game_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Create array containing each available seat
        let bucket = [];
        for (let i = 0; i <= game_details.players.length - 1; i++) {
            bucket.push(i)
        }
        //Update seat number for each player
        for (let i = 0; i <= game_details.players.length - 1; i++) {
            game.findOneAndUpdate({ _id: game_id, "players._id": game_details.players[i]._id }, {"$set": { "players.$.seat": rand_bucket(bucket) }}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    //Resolve promise when the last game has been updated
                    if (i >= game_details.players.length - 1) {
                        resolve();
                    }
                }
            });
        }
    });
}

//PRIVATE FUNCTIONS

// Name : rand_bucket(bucket)
// Desc : returns a random array position from a given bucket
// Author(s) : RAk3rman
function rand_bucket(bucket) {
    let randomIndex = Math.floor(Math.random()*bucket.length);
    return bucket.splice(randomIndex, 1)[0];
}