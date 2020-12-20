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
let template_base = require('../templates/base.json');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_handler = require('../services/player-handler.js');

// Name : game_actions.create_game()
// Desc : creates a new game in mongodb, returns game details
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

// Name : game_actions.game_details()
// Desc : returns the details for a game
// Author(s) : RAk3rman
exports.game_details = async function (game_id) {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                resolve(found_game);
            }
        });
    });
}

// Name : game_actions.delete_game()
// Desc : deletes a existing game in mongodb, returns game_id
// Author(s) : RAk3rman
exports.delete_game = async function (game_id) {
    //Create new promise and return delete_game _id after deleted
    return await new Promise((resolve, reject) => {
        game.deleteOne({ _id: game_id }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(game_id);
            }
        });
    });
}

// Name : game_actions.import_cards(game_id)
// Desc : bulk import cards via json file
// Author(s) : RAk3rman
exports.import_cards = async function (game_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each json value and add card
        for (let i = 0; i <= template_base.length - 1; i++) {
            game_details.cards.push({ _id: template_base[i]._id, name: template_base[i].name, action: template_base[i].action, position: i });
        }
        //Save existing game
        game_details.save(function (err) {
            if (err) {
                reject(err);
            } else {
                //Resolve promise when the last card has been pushed
                resolve(template_base.length);
            }
        });
    });
}

// Name : game_actions.advance_turn(game_id)
// Desc : Advance to the next turn, returns player_id of next turn
// Author(s) : RAk3rman, Vincent Do
exports.advance_turn = async function (game_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return delete_game _id after deleted
    return await new Promise((resolve, reject) => {
        //Check how many turns we have left
        if (game_details.turns_remaining <= 1) { //Only one turn left, player seat advances
            //Check if we are going forward or backward
            if (game_details.turn_direction === "forward") {
                if (!(game_details.players.length <= game_details.seat_playing + 1)) { //Player seat advances by one
                    game_details.seat_playing++;
                } else {
                    game_details.seat_playing = 0;
                }
            } else if (game_details.turn_direction === "backward") {
                if (!(game_details.seat_playing - 1 < 0)) { //Player seat decreases by one
                    game_details.seat_playing--;
                } else {
                    game_details.seat_playing = game_details.players.length - 1;
                }
            }
            //Make sure the number of turns remaining is not 0
            game_details.turns_remaining = 1;
        } else { //Multiple turns left, player seat remains the same and turns_remaining decreases by one
            game_details.turns_remaining--;
        }
        //Find next player's id
        let next_player_id = "";
        for (let i = 0; i <= game_details.players.length - 1; i++) {
            if (game_details.players[i].seat === game_details.seat_playing) {
                next_player_id = game_details.players[i]._id;
                break;
            }
        }
        //Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(next_player_id);
            }
        });
    });
}
// Name : game_actions.discard_card(game_id)
// Desc : Put card in discard pile
// Author(s) : Vincent Do
exports.discard_card = async function (game_id, card_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return delete_game _id after deleted
    return await new Promise((resolve, reject) => {
        let value = -1;
        for (let i = 0; i <= game_details.cards.length - 1; i++) {
            if (game_details.cards[i].assignment === "discard_deck") {
                console.log(game_details.cards[i].position);
            }
            if (game_details.cards[i].position > value && game_details.cards[i].assignment === "discard_deck") {
                value = game_details.cards[i].position;
            }
        }
        game.findOneAndUpdate({ _id: game_id, "cards._id": card_id},
            {"$set": { "cards.$.assignment": "discard_deck", "cards.$.position": value + 1  }}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    //Resolve promise when the last card has been updated
                    resolve();
                }
            });
    });
}