/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/card-actions.js
Desc     : all actions and helper functions
           related to card interaction
Author(s): RAk3rman, vmdo3
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_handler = require('../services/player-handler.js');

// Name : card_actions.skip(game_id, card_id)
// Desc : skips the current turn, returns next player_id
// Author(s) : RAk3rman
exports.skip = async function (game_id, card_id) {
    //Move card to discard pile
    //await game_actions.discard_card(game_id, card_id);
    //Advance turn to next_player, return next player_id
    return await game_actions.advance_turn(game_id);
}

// Name : card_actions.reverse(game_id, card_id)
// Desc : reverse the current player order, returns next player_id
// Author(s) : RAk3rman
exports.reverse = async function (game_id, card_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Switch to forwards or backwards
    if (game_details.turn_direction === "forward") {
        game_details.turn_direction = "backward";
    } else if (game_details.turn_direction === "backward") {
        game_details.turn_direction = "forward";
    }
    //Create new promise and wait for game_details to save
    await new Promise((resolve, reject) => {
        //Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            }
        });
    });
    //Move card to discard pile
    //await game_actions.discard_card(game_id, card_id);
    //Advance turn to next_player, return next player_id
    return await game_actions.advance_turn(game_id);
}

// Name : card_actions.shuffle_draw_deck(game_id, card_id)
// Desc : shuffles the positions of all cards in the draw deck, returns number of cards in draw deck
// Author(s) : RAk3rman
exports.shuffle_draw_deck = async function (game_id, card_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Loop through each card to create array
    let bucket = [];
    let cards_in_deck = 0;
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        //Check to see if card in draw deck
        if (game_details.cards[i].assignment === "draw_deck") {
            bucket.push(cards_in_deck);
            cards_in_deck++;
        }
    }
    //Loop though each card and reassign position
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        //Check to see if card in draw deck and not exploding
        if (game_details.cards[i].assignment === "draw_deck") {
            game_details.cards[i].position = rand_bucket(bucket);
        }
    }
    //Create new promise
    return await new Promise((resolve, reject) => {
        //Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            } else {
                //Check if we have to discard card
                if (card_id) {
                    //TODO call discard card function
                    resolve(cards_in_deck + 1);
                } else {
                    resolve(cards_in_deck + 1);
                }
            }
        });
    });
}

// Name : card_actions.attack_pre(game_id)
// Desc : forces the next player in turn order to take 2 consecutive turns by changing seat_playing
// Author(s) : SengdowJones
exports.attack_pre = async function (game_id) {
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                //Forces next player to take a turn
                let current = found_game.seat_playing;
                if (found_game.players.length < found_game.seat_playing + 1) {
                    let turn = found_game.seat_playing + 1 - found_game.players.length;
                    if (turn === 0) {
                        game.findOneAndUpdate({_id: game_id, "seat_playing": found_game.seat_playing},
                            {"$set": {"seat.$.playing": 0}}, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    //Resolve promise when the last player has been updated
                                    if (current !== found_game.seat_playing) {
                                        resolve(found_game.players.length);
                                    }
                                }

                            });
                    }
                } else {
                    game.findOneAndUpdate({_id: game_id, "seat_playing": found_game.seat_playing},
                        {"$set": {"seat.$.playing": found_game.seat_playing += 1}}, function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                //Resolve promise when the last player has been updated
                                if (current !== found_game.seat_playing) {
                                    resolve(found_game.players.length);
                                }
                            }
                        });
                }
            }
        });
    });
}

// Name : card_actions.attack_post(game_id)
// Desc : forces the next player in turn order to take 2 consecutive turns by keeping the same seat_playing
// Author(s) : SengdowJones
exports.attack_post = async function (game_id) {
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                //Updates seat_playing to same seat_playing
                    game.findOneAndUpdate({_id: game_id, "seat_playing": found_game.seat_playing},
                        {"$set": {"seat.$.playing": found_game.seat_playing}}, function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                //Resolve promise when the last player has been updated
                                    resolve(found_game.players.length);
                            }
                        });

            }
        });
    });
}

// Name : card_actions.drawfromthebottom(game_id)
// Desc : allows active player to draw one card from the bottom of the draw deck
// Author(s) : SengdowJones
exports.drawfromthebottom = async function (game_id, card_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each card
        //Create array containing each see the future id
        let bucket = [];
        for (let i = 0; i <= 2; i++) {
            //Check to see if card in draw deck
            if (game_details.cards[i].assignment === "draw_deck")
                bucket.push(game_details.cards[i]);
            else
                i = i - 1;
        }
        game_actions.discard_card(game_id, card_id);
        resolve();
    });
}

// Name : card_actions.seethefuture(game_id)
// Desc : allows active player to view the top three cards of the draw deck
// Author(s) : SengdowJones
exports.seethefuture = async function (game_id, card_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each card
        //Create array containing each see the future id
        let bucket = [];
        for (let i = 0; i <= 2; i++) {
            //Check to see if card in draw deck
            if (game_details.cards[i].assignment === "draw_deck")
                bucket.push(game_details.cards[i]);
            else
                i = i - 1;
            }
        game_actions.discard_card(game_id, card_id);
        resolve();
    });
}

// Name : card_actions.defuse(game_id)
// Desc : allows active player to play a defuse card in the event of drawing an Exploding Chicken
// Author(s) : Vincent Do
exports.defuse = async function (game_id, card_id, id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each card
        for (let i = 0; i <= game_details.cards.length - 1; i++) {
            if (game_details.cards[i].action === "defuse" && game_details.cards[i].assignment === id) {
                game_actions.discard_card(game_id, game_details.cards[i]._id);
                game_actions.chicken(game_id, game_details.cards[i]._id);
            } else {
                //Remove player
            }
        }
        //Still need to put chicken back into deck
        resolve();
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
