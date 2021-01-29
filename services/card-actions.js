/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/card-actions.js
Desc     : all actions and helper functions
           related to card interaction
Author(s): RAk3rman, vmdo3, SengdowJones
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_actions = require('./player-actions.js');

// Name : card_actions.attack(game_details)
// Desc : forces the next player in turn order to take 2 consecutive turns
// Author(s) : RAk3rman
exports.attack = async function (game_details) {
    // Check if we are going forward or backward
    // TODO Handle if players are dead
    if (game_details.turn_direction === "forward") {
        if (!(game_details.players.length <= game_details.seat_playing + 1)) { // Player seat advances by one
            game_details.seat_playing++;
        } else {
            game_details.seat_playing = 0;
        }
    } else if (game_details.turn_direction === "backward") {
        if (!(game_details.seat_playing - 1 < 0)) { // Player seat decreases by one
            game_details.seat_playing--;
        } else {
            game_details.seat_playing = game_details.players.length - 1;
        }
    }
    // Check how many turns we have left
    if (game_details.turns_remaining <= 1) { // Only one turn left, equal to two turns
        // Make sure the number of turns remaining is not 0
        game_details.turns_remaining = 2;
    } else { // Multiple turns left, turns_remaining
        game_details.turns_remaining += 2;
    }
    // Create new promise for game save
    return await new Promise((resolve, reject) => {
        // Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Name : card_actions.kill_player(game_details)
// Desc : player exploded, removes player from game and frees cards
// Author(s) : RAk3rman
exports.kill_player = async function (game_details, player_id) {
    // Find player and update status
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        if (game_details.players[i]._id === player_id) {
            game_details.players[i].status = "exploded";
            i = game_details.players.length;
        }
    }
    // Update all cards in player's hand to be "out of play"
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i].assignment === player_id) {
            game_details.cards[i].assignment = "out_of_play";
        }
    }
}

// Name : card_actions.shuffle_draw_deck(game_details)
// Desc : shuffles the positions of all cards in the draw deck
// Author(s) : RAk3rman
exports.shuffle_draw_deck = async function (game_details) {
    // Loop through each card to create array
    let bucket = [];
    let cards_in_deck = 0;
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        //Check to see if card in draw deck
        if (game_details.cards[i].assignment === "draw_deck") {
            bucket.push(cards_in_deck);
            cards_in_deck++;
        }
    }
    // Loop though each card and reassign position
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        //Check to see if card in draw deck and not chicken
        if (game_details.cards[i].assignment === "draw_deck") {
            game_details.cards[i].position = rand_bucket(bucket);
        }
    }
    // Create new promise for game save
    return await new Promise((resolve, reject) => {
        //Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Name : card_actions.reverse(game_details)
// Desc : reverse the current player order
// Author(s) : RAk3rman
exports.reverse = async function (game_details) {
    // Switch to forwards or backwards
    if (game_details.turn_direction === "forward") {
        game_details.turn_direction = "backward";
    } else if (game_details.turn_direction === "backward") {
        game_details.turn_direction = "forward";
    }
    // Create new promise for game save
    await new Promise((resolve, reject) => {
        //Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Name : card_actions.see_the_future(game_slug)
// Desc : allows active player to view the top three cards of the draw deck
// Author(s) : SengdowJones
exports.see_the_future = async function (game_slug) {
    //Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    //Loop through each card to create array
    let bucket = [];
    let bucket_length = 0;
    while (bucket_length < 3) {
        for (let i=0;i<=game_details.cards.length-1;i++) {
            //Check to see if card in draw deck
            if (game_details.cards[i].assignment === "draw_deck") {
                bucket.push(game_details.cards[i]);
                bucket_length++;
            } else {

            }
        }
    }
    //Create new promise
    return await new Promise((resolve, reject) => {
        game.findOne({ slug: game_slug }, function (err, found_game) {
                if (err) {
                    reject(err);
                } else {
                    //Resolve bucket of top 3 cards
                    resolve(bucket);
                }
            }
        )
    })
}

// Name : card_actions.defuse(game_slug)
// Desc : allows active player to play a defuse card in the event of drawing an Exploding Chicken
// Author(s) : Vincent Do
exports.defuse = async function (game_slug, card_id, player_id) {
    //Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each card
        for (let i = 0; i <= game_details.cards.length - 1; i++) {
            if (game_details.cards[i].action === "defuse" && game_details.cards[i].assignment === player_id) {
                game_actions.discard_card(game_slug, game_details.cards[i]._id);
                game_actions.chicken(game_slug, game_details.cards[i]._id);
            } else {
                //Removes the player's hand to the draw_deck
                for (let i = 0; i <= game_details.cards.length - 1; i++) {
                    if (game_details.cards[i]._id === player_id) {
                        game_actions.discard_card(game_slug, game_details.cards[i]._id);
                    }
                }
                //Changes player status of "dead"
                game_actions.discard_card(game_slug, card_id);
                game.findOneAndUpdate({ slug: game_slug, "player._id": player_id},
                    {"$set": { "player.$.status": "dead"}}, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(game_details.players.status);
                        }
                    });
                let count = 1;
                for (let i = 0; i <= game_details.players.length - 1; i++) {
                    if (game_details.players[i].status === "dead") {
                        count++;
                        if (count === game_details.players.length) {
                            //Announce winner
                        }
                    }
                }
            }
        }
        resolve();
    });
}

// Name : card_actions.favor(game_slug)
// Desc : Ask for a favor
// Author(s) : Vincent Do
exports.favor = async function (game_slug, card_id, player_id) {
    //Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    let bucket = [];
    //To be inputted by UI
    let target_id = "";
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i].assignment === target_id) {
            bucket.push(game_details.cards[i])
        }
    }
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game_actions.discard_card(game_slug, card_id);
        //take rand card from target hand
        game.findOneAndUpdate({slug: game_slug, "card": rand_bucket(bucket)},
            {"$set": {"card.$.assignment": player_id}}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(game_details.cards.assignment);
                }
            });
        resolve();
    });
}

// Name : card_actions.double(game_slug)
// Desc : Ask for a favor with two cards
// Author(s) : Vincent Do
exports.double = async function (game_slug, card_id, card_id1, player_id) {
    //Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    let bucket = [];
    //To be inputted by UI
    let target_id = "";
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i].assignment === target_id) {
            bucket.push(game_details.cards[i])
        }
    }
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game_actions.discard_card(game_slug, card_id);
        game_actions.discard_card(game_slug, card_id1);
        //take rand card from target hand
        game.findOneAndUpdate({slug: game_slug, "card": rand_bucket(bucket)},
            {"$set": {"card.$.assignment": player_id}}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(game_details.cards.assignment);
                }
            });
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
