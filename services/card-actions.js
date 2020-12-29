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
    await game_actions.discard_card(game_id, card_id);
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
        //Move card to discard pile
        game_actions.discard_card(game_id, card_id);
        //Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            }
        });
    });
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
        //Check to see if card in draw deck and not chicken
        if (game_details.cards[i].assignment === "draw_deck") {
            game_details.cards[i].position = rand_bucket(bucket);
        }
    }
    if (card_id === null) {
        //Move card to discard pile
        await game_actions.discard_card(game_id, card_id);
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

// Name : card_actions.attack(game_id, card_id)
// Desc : forces the next player in turn order to take 2 consecutive turns
// Author(s) : RAk3rman
exports.attack = async function (game_id, card_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
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
    //Check how many turns we have left
    if (game_details.turns_remaining <= 1) { //Only one turn left, equal to two turns
        //Make sure the number of turns remaining is not 0
        game_details.turns_remaining = 2;
    } else { //Multiple turns left, turns_remaining
        game_details.turns_remaining += 2;
    }
    //Find next player's id
    let next_player_id = "";
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        if (game_details.players[i].seat === game_details.seat_playing) {
            next_player_id = game_details.players[i]._id;
            break;
        }
    }
    //Create new promise
    return await new Promise((resolve, reject) => {
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

// Name : card_actions.drawfromthebottom(game_id,card_id)
// Desc : allows active player to draw one card from the bottom of the draw deck
// Author(s) : SengdowJones
exports.drawfromthebottom = async function (game_id, card_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Change bottom card of draw deck's position to player's hand
        draw_card(game_id, card_id)
        //Update draw deck
        //No need to reassign position since drawing from bottom remains 0
        //Move card to discard pile
        game_actions.discard_card(game_id, card_id);
        resolve();
    });
}

// Name : card_actions.see_the_future(game_id)
// Desc : allows active player to view the top three cards of the draw deck
// Author(s) : SengdowJones
exports.see_the_future = async function (game_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
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
        game.findById({_id: game_id}, function (err, found_game) {
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

// Name : card_actions.defuse(game_id)
// Desc : allows active player to play a defuse card in the event of drawing an Exploding Chicken
// Author(s) : Vincent Do
exports.defuse = async function (game_id, card_id, player_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each card
        for (let i = 0; i <= game_details.cards.length - 1; i++) {
            if (game_details.cards[i].action === "defuse" && game_details.cards[i].assignment === player_id) {
                game_actions.discard_card(game_id, game_details.cards[i]._id);
                game_actions.chicken(game_id, game_details.cards[i]._id);
            } else {
                //Removes the player's hand to the draw_deck
                for (let i = 0; i <= game_details.cards.length - 1; i++) {
                    if (game_details.cards[i]._id === player_id) {
                        game_actions.discard_card(game_id, game_details.cards[i]._id);
                    }
                }
                //Changes player status of "dead"
                game_actions.discard_card(game_id, card_id);
                game.findOneAndUpdate({ _id: game_id, "player._id": player_id},
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
// Name : card_actions.favor(game_id)
// Desc : Ask for a favor
// Author(s) : Vincent Do
exports.favor = async function (game_id, card_id, player_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
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
        game_actions.discard_card(game_id, card_id);
        //take rand card from target hand
        game.findOneAndUpdate({_id: game_id, "card": rand_bucket(bucket)},
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
// Name : card_actions.double(game_id)
// Desc : Ask for a favor with two cards
// Author(s) : Vincent Do
exports.double = async function (game_id, card_id, card_id1, player_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
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
        game_actions.discard_card(game_id, card_id);
        game_actions.discard_card(game_id, card_id1);
        //take rand card from target hand
        game.findOneAndUpdate({_id: game_id, "card": rand_bucket(bucket)},
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
