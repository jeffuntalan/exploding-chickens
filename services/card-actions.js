/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/card-actions.js
Desc     : all actions and helper functions
           related to card interaction
Author(s): RAk3rman, vmdo3, SengdowJones
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_actions = require('./player-actions.js');

// Name : card_actions.attack(game_details)
// Desc : forces the next player in turn order to take 2 consecutive turns
// Author(s) : RAk3rman
exports.attack = async function (game_details) {
    // Advance to the next seat
    game_details.seat_playing = await player_actions.next_seat(game_details)
    // Check how many turns we have left
    if (game_details.turns_remaining <= 1) { // Only one turn left, equal to two turns
        // Make sure the number of turns remaining is not 0
        game_details.turns_remaining = 2;
    } else { // Multiple turns left, turns_remaining
        game_details.turns_remaining += 2;
    }
    // Save event
    game_details = await game_actions.log_event(game_details, "attack", "");
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

// Name : card_actions.kill_player(game_details, player_id)
// Desc : player exploded, removes player from game and frees cards
// Author(s) : RAk3rman
exports.kill_player = async function (game_details, player_id) {
    // Find player and update status
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        if (game_details.players[i]._id === player_id) {
            game_details.players[i].status = "dead";
            i = game_details.players.length;
        }
    }
    // Update all cards in player's hand to be "out of play"
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i].assignment === player_id) {
            game_details.cards[i].assignment = "out_of_play";
        }
    }
    // Save event
    game_details = await game_actions.log_event(game_details, "kill_player", "");
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

// Name : card_actions.defuse(game_details, player_id, target, card_id)
// Desc : removes exploding chicken from hand and inserts randomly in deck
// Author(s) : RAk3rman
exports.defuse = async function (game_details, player_id, target, card_id) {
    // Verify player is exploding
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        if (game_details.players[i]._id === player_id) {
            if (game_details.players[i].status !== "exploding") {
                return {trigger: "error", data: "You cannot play this card now"};
            }
            i = game_details.players.length;
        }
    }
    // Verify target
    let ctn = 0;
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        // Increment draw deck count
        if (game_details.cards[i].assignment === "draw_deck") {
            ctn++;
        }
    }
    if (target < 0 || ctn < target || target === "") {
        return {trigger: "chicken_target", data: {
            max_pos: ctn, card_id: card_id
        }};
    }
    // Loop through each card to create array
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        // Find chicken that is assigned to target player
        if (game_details.cards[i].assignment === player_id && game_details.cards[i].action === "chicken") {
            game_details.cards[i].assignment = "draw_deck";
            game_details.cards[i].position = ctn - target;
        }
        // Add to new array
        if (game_details.cards[i].assignment === "draw_deck" && game_details.cards[i].position >= ctn - target) {
            game_details.cards[i].position++;
        }
    }
    // Update player status
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        if (game_details.players[i]._id === player_id) {
            game_details.players[i].status = "playing";
            i = game_details.players.length;
        }
    }
    // Save event
    game_details = await game_actions.log_event(game_details, "defuse", "");
    // Create new promise for game save
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
    return true;
}

// Name : card_actions.verify_favor(game_details, player_id, target)
// Desc : verifies that the target player is able to give up a card
// Author(s) : RAk3rman
exports.verify_favor = async function (game_details, player_id, target) {
    // Make sure the player isn't asking itself
    if (player_id !== target) {
        // See if one card is assigned to target player
        for (let i = 0; i <= game_details.cards.length - 1; i++) {
            if (game_details.cards[i].assignment === target) {
                return true;
            }
        }
        return {trigger: "favor_target", data: ""}; // Request for valid target from client
    } else {
        return {trigger: "error", data: "You cannot ask yourself"};
    }
}

// Name : card_actions.verify_double(game_details, card_details, player_id)
// Desc : verifies that the current player has two of a kind, discards second card
// Author(s) : RAk3rman
exports.verify_double = async function (game_details, card_details, player_id, card_id) {
    // See if we have another card of the same action
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i].assignment === player_id && game_details.cards[i].action === card_details.action
        && game_details.cards[i]._id !== card_id) {
            return game_details.cards[i]._id;
        }
    }
    return false;
}

// Name : card_actions.ask_favor(game_details, player_id, target)
// Desc : takes a random card from target player's hand and places in current player's hand
// Author(s) : RAk3rman
exports.ask_favor = async function (game_details, player_id, target) {
    // Get cards in target and current player's hand
    let target_hand = await card_actions.filter_cards(target, game_details.cards);
    let current_hand = await card_actions.filter_cards(player_id, game_details.cards);
    // Determine random card
    let rand_pos = Math.floor(Math.random() * (target_hand.length - 1));
    // Update card details
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i]._id === target_hand[rand_pos]._id) {
            game_details.cards[i].assignment = player_id;
            game_details.cards[i].position = current_hand.length;
            break;
        }
    }
    await player_actions.sort_hand(game_details, target);
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
    return target_hand[rand_pos];
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
    // Save event
    game_details = await game_actions.log_event(game_details, "shuffle_draw_deck", "");
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
    // Save event
    game_details = await game_actions.log_event(game_details, "reverse", "");
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

// Name : card_actions.filter_cards(assignment, card_array)
// Desc : filters and sorts cards based on assignment and position
// Author(s) : RAk3rman
exports.filter_cards = async function (assignment, card_array) {
    // Get cards based on assignment
    let temp_deck = [];
    for (let i = 0; i < card_array.length; i++) {
        //If the card is assigned to this player, add to hand
        if (card_array[i].assignment === assignment) {
            temp_deck.push(card_array[i]);
        }
    }
    // Sort card hand by position
    temp_deck.sort(function(a, b) {
        return a.position - b.position;
    });
    return temp_deck;
}

// Name : card_actions.find_card(card_id, card_array)
// Desc : filters and returns the data for a card id
// Author(s) : RAk3rman
exports.find_card = async function (card_id, card_array) {
    let temp_card = undefined;
    // Loop through card array until we find the card
    for (let i = 0; i < card_array.length; i++) {
        //If the card is assigned to this player, add to hand
        if (card_array[i]._id === card_id) {
            temp_card = card_array[i];
            i = card_array.length;
        }
    }
    return temp_card;
}

//PRIVATE FUNCTIONS

// Name : rand_bucket(bucket)
// Desc : returns a random array position from a given bucket
// Author(s) : RAk3rman
function rand_bucket(bucket) {
    let randomIndex = Math.floor(Math.random()*bucket.length);
    return bucket.splice(randomIndex, 1)[0];
}
