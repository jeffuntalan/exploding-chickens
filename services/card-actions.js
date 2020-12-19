/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/card-actions.js
Desc     : all actions and helper functions
           related to card interaction
Author(s): RAk3rman, vmdo3
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
let template_base = require('../templates/base.json');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_handler = require('../services/player-handler.js');

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

// Name : game_actions.assign_defuse(game_id)
// Desc : assigns defuses to all players
// Author(s) : Vincent Do, RAk3rman
exports.assign_defuse = async function (game_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Create array containing each defuse card id
        let bucket = [];
        for (let i = 0; i <= game_details.cards.length - 1; i++) {
            if (game_details.cards[i].action === "defuse") {
                bucket.push(game_details.cards[i]._id);
            }
        }
        //Assign defuse card to player id in first position
        for (let i = 0; i <= game_details.players.length - 1; i++) {
            game.findOneAndUpdate({ _id: game_id, "cards._id": rand_bucket(bucket) },
                {"$set": { "cards.$.assignment": game_details.players[i]._id, "cards.$.position": 0  }}, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        //Resolve promise when the last player has been updated
                        if (i >= game_details.players.length - 1) {
                            resolve(game_details.players.length);
                        }
                    }
                });
        }
    });
}

// Name : game_actions.player_hand(game_id)
// Desc : assigns 4 more cards to each player
// Author(s) : Vincent Do
exports.player_hand = async function (game_id) {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                //Finding player
                let bucket = [];
                for (let i = 0; i <= found_game.cards.length - 1; i++) {
                    if (found_game.cards.assignment !== 'draw_deck' && found_game.cards[i].action !== "explode") {
                        bucket.push(found_game.cards[i]._id);
                    }
                }
                //assign card assignment to player id
                function get_rand_bucket() {
                    let randomIndex = Math.floor(Math.random()*bucket.length);
                    return bucket.splice(randomIndex, 1)[0];
                }
                //Assign cards to player id in first position
                for (let i = 1; i <= 4; i++) {
                    for (let k = 0; k <= found_game.players.length - 1; k++) {
                    game.findOneAndUpdate({ _id: game_id, "cards._id": get_rand_bucket() },
                        {"$set": { "cards.$.assignment": found_game.players[k]._id, "cards.$.position": i  }}, function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                //Resolve promise when the last player has been updated
                                if (i >= found_game.players.length - 1) {
                                    resolve(found_game.players.length);
                                }
                            }
                        });
                    }
                }
            }
        });
    });
}

// Name : game_actions.advance_turn(game_id)
// Desc : Skip next player's turn
// Author(s) : Vincent Do
exports.advance_turn = async function (game_id) {
    return await new Promise((resolve, reject) => {
        game.findById({ _id: game_id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                //Skipping turn of next player
                let current = found_game.seat_playing;
                if (found_game.players.length <= current + 2) {
                    let turn = found_game.players.length - current;
                    if (turn === 1) {
                        game.findOneAndUpdate({_id: game_id },
                            {"$set": {"seat_playing": 0}}, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    //Resolve promise when the last player has been updated
                                    if (current === found_game.seat_playing) {
                                        resolve(found_game.players.length);
                                    }
                                }

                            });

                    } else if (turn === 2) {
                        game.findOneAndUpdate({_id: game_id},
                            {"$set": {"seat_playing": 1}}, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    //Resolve promise when the last player has been updated
                                    if (current === found_game.seat_playing) {
                                        resolve(found_game.players.length);
                                    }
                                }
                            });
                    }
                } else {
                    game.findOneAndUpdate({_id: game_id},
                        {"$set": {"seat_playing": found_game.seat_playing + 2}}, function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                //Resolve promise when the last player has been updated
                                if (current === found_game.seat_playing) {
                                    resolve(found_game.players.length);
                                }
                            }
                        });
                }
            }
        });
    });
}

// Name : game_actions.shuffle_draw_deck(game_id)
// Desc : shuffles the positions of all cards in the draw deck
// Author(s) : RAk3rman
exports.shuffle_draw_deck = async function (game_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each card
        //Create array containing each defuse card id
        let bucket = [];
        for (let i = 0; i <= game_details.cards.length - 1; i++) {
            //Check to see if card in draw deck
            if (game_details.cards[i].assignment === "draw_deck" && game_details.cards[i].action !== "explodes") {
                bucket.push(game_details.cards[i]._id);
            }
        }
        resolve();
    });
}

// Name : rand_bucket(bucket)
// Desc : returns a random array position from a given bucket
// Author(s) : RAk3rman
function rand_bucket(bucket) {
    let randomIndex = Math.floor(Math.random()*bucket.length);
    return bucket.splice(randomIndex, 1)[0];
}

// Name : game_actions.attack_pre(game_id)
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

// Name : game_actions.attack_post(game_id)
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

// Name : game_actions.seethefuture(game_id)
// Desc : allows active player to view the top three cards of the draw deck
// Author(s) : SengdowJones
exports.seethefuture = async function (game_id) {
    //Get game details
    let game_details = await game_actions.game_details(game_id);
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        //Loop through each card
        //Create array containing each see the future id
        let bucket = [];
        for (let i = 0; i <= 2; i++) {
            //Check to see if card in draw deck
            if (game_details.cards[i].assignment === "draw_deck") {
                bucket.push(game_details.cards[i]._id);
            }
        }
        resolve();
    });
}