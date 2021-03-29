/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/player-actions.js
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
let player_actions = require('./player-actions.js');

// Name : player_actions.modify_player()
// Desc : modifies an existing player, if it doesn't exist, make new player
// Author(s) : RAk3rman
exports.modify_player = async function (game_slug, player_id, p_nickname, p_seat, p_avatar, p_type, p_status, p_connection) {
    //Check if player exists
    if (await game.exists({ slug: game_slug, "players._id": player_id })) { //Modify existing player
        //Create new promise and return player id after saved
        return await new Promise((resolve, reject) => {
            //Update existing player and return player_id
            game.findOneAndUpdate({ slug: game_slug, "players._id": player_id }, {"$set": { "players.$.nickname": p_nickname, "players.$.seat": p_seat, "players.$.avatar": p_avatar, "players.$.status": p_status, "players.$.type": p_type, "players.$.connection": p_connection }}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(player_id);
                }
            });
        })
    } else { //Create new player
        //Get game details
        let game_details = await game_actions.game_details_slug(game_slug);
        //Create new promise and return player id after saved
        return await new Promise((resolve, reject) => {
            //Create new player id
            if (!player_id) {
                player_id = uuidv4();
            }
            //Push new player into existing game
            game_details.players.push({ _id: player_id, nickname: p_nickname, seat: p_seat, avatar: p_avatar, type: p_type, status: p_status, connection: p_connection });
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

// Name : player_actions.update_connection(game_slug, player_id, p_connection))
// Desc : updates the connection for a target player
// Author(s) : RAk3rman
exports.update_connection = async function (game_slug, player_id, p_connection) {
    //Create new promise and return player id after saved
    return await new Promise((resolve, reject) => {
        //Update existing player and return player_id
        game.findOneAndUpdate({ slug: game_slug, "players._id": player_id }, {"$set": { "players.$.connection": p_connection }}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(player_id);
            }
        });
    })
};

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
    // Create new promise
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
    // Shuffle draw deck once we are done
    await card_actions.shuffle_draw_deck(game_details);
}


// Name : player_actions.randomize_seats(game_slug)
// Desc : given a game_slug, gives each player a random seat position (without replacement)
// Author(s) : SengdowJones, RAk3rman
exports.randomize_seats = async function (game_slug) {
    //Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    //Create array containing each available seat
    let bucket = [];
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        bucket.push(i)
    }
    //Update seat number for each player
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        game_details.players[i].seat = rand_bucket(bucket);
    }
    //Create new promise
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
        // Check to see if current seat is playing
        console.log(game_details.players[pos].nickname + " " + game_details.players[pos].status);
        if (game_details.players[pos].status === "playing") {
            found_seat = true;
            console.log("POS" + pos);
            return pos;
        }
    }
}

// Name : player_actions.sort_hand(game_details, player_id)
// Desc : sort players hand, typically after a card is removed
// Author(s) : RAk3rman
exports.sort_hand = async function (game_details, player_id) {
    // Get cards in player's hand
    let player_hand = [];
    for (let i = 0; i < game_details.cards.length; i++) {
        //If the card is assigned to this player, add to hand
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
