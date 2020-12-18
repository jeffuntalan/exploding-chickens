/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/card-actions.js
Desc     : all actions and helper functions
           related to card interaction
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
let template_base = require('../templates/base.json');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

// Name : game_actions.import_cards(game_id)
// Desc : bulk import cards via json file
// Author(s) : RAk3rman
exports.import_cards = async function (game_id) {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                //Loop through each json value and add card
                for (let i = 0; i <= template_base.length - 1; i++) {
                    found_game.cards.push({ _id: template_base[i]._id, name: template_base[i].name, action: template_base[i].action, position: i });
                }
                //Save existing game
                found_game.save(function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        //Resolve promise when the last card has been pushed
                        resolve();
                    }
                });
            }
        });
    });
}

// Name : game_actions.assign_defuse(game_id)
// Desc : assigns defuses to all players
// Author(s) :
exports.assign_defuse = async function (game_id) {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                //TODO assign defuses to each player here
                let bucket = [];
                for (let i = 0; i <= found_game.cards.length - 1; i++) {
                    if (found_game.cards[i].action === "defuse") {
                        bucket.push(found_game.cards[i]._id);
                        console.log(found_game.cards[i]._id);
                    }
                }
                for (let i = 0; i <= found_game.players.length - 1; i++) {
                    console.log(found_game.players[i]._id);
                    game.findOneAndUpdate({ _id: game_id, "card._id": found_game.cards[i]._id },
                        {"$set": { "cards.$.assignment": found_game.players[i]._id, "cards.$.position": found_game.players[i].seat  }}, function (err) {
                        console.log(found_game.cards[i].assignment);
                        if (err) {
                            reject(err);
                        } else {
                            //Resolve promise when the last game has been updated
                            if (i >= found_game.players.length - 1) {
                                resolve();
                            }
                        }
                    });
                }
            }
        });
    });
}