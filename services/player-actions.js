/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/player-actions.js
Desc     : handles all player actions
           and modifies players in game db
Author(s): RAk3rman, SengdowJones
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const { v4: uuidv4 } = require('uuid');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_actions = require('./player-actions.js');

// Name : player_actions.modify_player()
// Desc : modifies an existing player, if it doesn't exist, make new player
// Author(s) : RAk3rman
exports.modify_player = async function (game_slug, player_id, p_nickname, p_seat, p_avatar, p_type, p_status, p_connection) {
    // Check if player exists
    if (await game.exists({ slug: game_slug, "players._id": player_id })) { //Modify existing player
        // Create new promise and return player id after saved
        return await new Promise((resolve, reject) => {
            // Update existing player and return player_id
            game.findOneAndUpdate({ slug: game_slug, "players._id": player_id }, {"$set": { "players.$.nickname": p_nickname, "players.$.seat": p_seat, "players.$.avatar": p_avatar, "players.$.status": p_status, "players.$.type": p_type, "players.$.connection": p_connection }}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(player_id);
                }
            });
        })
    } else { // Create new player
        // Get game details
        let game_details = await game_actions.game_details_slug(game_slug);
        // Create new promise and return player id after saved
        return await new Promise((resolve, reject) => {
            // Create new player id
            if (!player_id) {
                player_id = uuidv4();
            }
            // Push new player into existing game
            game_details.players.push({ _id: player_id, nickname: p_nickname, seat: p_seat, avatar: p_avatar, type: p_type, status: p_status, connection: p_connection });
            // Save existing game and return player_id
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

// Name : player_actions.update_connection(game_slug, player_id, p_connection))
// Desc : updates the connection for a target player
// Author(s) : RAk3rman
exports.update_connection = async function (game_slug, player_id, p_connection) {
    // Create new promise and return player id after saved
    return await new Promise((resolve, reject) => {
        // Update existing player and return player_id
        game.findOneAndUpdate({ slug: game_slug, "players._id": player_id }, {"$set": { "players.$.connection": p_connection }}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(player_id);
            }
        });
    })
};

// Name : player_actions.get_player(game_details, player_id)
// Desc : return the details for a target player
// Author(s) : RAk3rman
exports.get_player = async function (game_details, player_id) {
    // Find player and return details
    for (let i = 0; i < game_details.players.length; i++) {
        // If the card is assigned to this player, add to hand
        if (game_details.players[i]._id === player_id) {
            return game_details.players[i];
        }
    }
}

// Name : player_actions.create_hand(game_slug)
// Desc : gives each player a defuse card and 4 random cards from the draw_deck, rations ec
// Author(s) : RAk3rman
exports.create_hand = async function (game_slug) {
    // Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    // Create array containing the position of each defuse card and regular card
    let defuse_bucket = [];
    let exploding_bucket = [];
    let card_bucket = [];
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i].action === "defuse") {
            defuse_bucket.push(i);
        } else if (game_details.cards[i].action === "chicken") {
            exploding_bucket.push(i);
            game_details.cards[i].assignment = "out_of_play";
        } else {
            card_bucket.push(i);
        }
    }
    // Assign defuse card to player id in first position
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        let rand_defuse_pos = rand_bucket(defuse_bucket);
        game_details.cards[rand_defuse_pos].assignment = game_details.players[i]._id;
        game_details.cards[rand_defuse_pos].position = 0;
    }
    // Add remaining defuse cards to card bucket
    for (let i = 0; i <= defuse_bucket.length - 1; i++) {
        card_bucket.push(defuse_bucket[i]);
    }
    // Assign remaining 4 cards to each player
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        //Over 4 cards on the same player
        for (let j = 1; j <= 4; j++) {
            let rand_card_pos = rand_bucket(card_bucket);
            game_details.cards[rand_card_pos].assignment = game_details.players[i]._id;
            game_details.cards[rand_card_pos].position = j;
        }
    }
    // Assign exploding chickens to deck
    for (let i = 0; i < game_details.players.length - 1; i++) {
        // Randomly pick ec
        let rand_card_pos = rand_bucket(exploding_bucket);
        game_details.cards[rand_card_pos].assignment = "draw_deck";
    }
    // Save event
    game_details = await game_actions.log_event(game_details, "create_hand", "");
    // Create new promise
    await new Promise((resolve, reject) => {
        // Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
    // Shuffle draw deck once we are done
    await card_actions.shuffle_draw_deck(game_details);
}


// Name : player_actions.randomize_seats(game_details)
// Desc : given a game_slug, gives each player a random seat position (without replacement)
// Author(s) : SengdowJones, RAk3rman
exports.randomize_seats = async function (game_details) {
    // Create array containing each available seat
    let bucket = [];
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        bucket.push(i)
    }
    // Update seat number for each player
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        game_details.players[i].seat = rand_bucket(bucket);
    }
    // Save event
    game_details = await game_actions.log_event(game_details, "randomize_seats", "");
    // Create new promise
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

// Name : player_actions.next_seat(game_details)
// Desc : determine next seat position
// Author(s) : RAk3rman
exports.next_seat = async function (game_details) {
    // Traverse until we find next open seat
    let found_seat = false;
    let pos = game_details.seat_playing;
    while (!found_seat) {
        // Increment or decrement pos based on direction
        if (game_details.turn_direction === "forward") {
            pos++
            if (pos > game_details.players.length - 1) {
                pos = 0;
            }
        } else if (game_details.turn_direction === "backward") {
            pos--;
            if (pos < 0) {
                pos = game_details.players.length - 1;
            }
        }
        // Find current seat and check to see if current seat is playing
        for (let i = 0; i < game_details.players.length; i++) {
            if (game_details.players[i].seat === pos) {
                if (game_details.players[i].status === "playing") {
                    found_seat = true;
                    return pos;
                } else {
                    break;
                }
            }
        }
    }
}

// Name : player_actions.kick_player(game_details, host_player_id, kick_player_id)
// Desc : remove a player from the game
// Author(s) : RAk3rman
exports.kick_player = async function (game_details, host_player_id, kick_player_id) {
    // Make sure they aren't kicking themselves
    if (host_player_id === kick_player_id) {
        return;
    }
    // Remove player from game and release cards
    await card_actions.kill_player(game_details, kick_player_id);
    // Find player to delete
    for (let i = 0; i < game_details.players.length; i++) {
        if (game_details.players[i]._id === kick_player_id) {
            // Check if player is playing
            if (game_details.players[i].seat === game_details.seat_playing) {
                await game_actions.advance_turn(game_details);
            }
            game_details.players.splice(i, 1);
            break;
        }
    }
    // Reset game if we have 1 player left
    if (game_details.players.length <= 1) {
        await game_actions.reset_game(game_details, "idle", "in_lobby");
    } else {
        // Remove an ec from the deck
        for (let i = 0; i < game_details.cards.length; i++) {
            if (game_details.cards[i].action === "chicken" && game_details.cards[i].assignment === "draw_deck") {
                game_details.cards[i].assignment = "out_of_play";
                break;
            }
        }
        // Reset player seat positions
        await player_actions.randomize_seats(game_details);
    }
}

// Name : player_actions.make_host(game_details, curr_player_id, suc_player_id)
// Desc : make a new player the host
// Author(s) : RAk3rman
exports.make_host = async function (game_details, curr_player_id, suc_player_id) {
    // Make sure they aren't making themselves a host
    if (curr_player_id === suc_player_id) {
        return;
    }
    // Both players and modify type
    for (let i = 0; i < game_details.players.length; i++) {
        // Check if the player id's match, update changes
        if (game_details.players[i]._id === curr_player_id) {
            game_details.players[i].type = "player";
        } else if (game_details.players[i]._id === suc_player_id) {
            game_details.players[i].type = "host";
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

// Name : player_actions.sort_hand(game_details, player_id)
// Desc : sort players hand, typically after a card is removed
// Author(s) : RAk3rman
exports.sort_hand = async function (game_details, player_id) {
    // Get cards in player's hand
    let player_hand = [];
    for (let i = 0; i < game_details.cards.length; i++) {
        // If the card is assigned to this player, add to hand
        if (game_details.cards[i].assignment === player_id) {
            player_hand.push({
                loc_pos: game_details.cards[i].position,
                gbl_pos: i
            });
        }
    }
    // Sort card hand by local position
    player_hand.sort(function(a, b) {
        return a.loc_pos - b.loc_pos;
    });
    // Overlay positions properly
    for (let i = 0; i <= player_hand.length - 1; i++) {
        game_details.cards[player_hand[i].gbl_pos].position = i;
    }
}

//PRIVATE FUNCTIONS

// Name : rand_bucket(bucket)
// Desc : returns a random array position from a given bucket
// Author(s) : RAk3rman
function rand_bucket(bucket) {
    let randomIndex = Math.floor(Math.random()*bucket.length);
    return bucket.splice(randomIndex, 1)[0];
}
