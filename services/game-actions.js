/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/game-actions.js
Desc     : all actions and helper functions
           related to game play
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const ora = require('ora');
const chalk = require('chalk');
const moment = require('moment');
const spinner = ora('');
const { v4: uuidv4 } = require('uuid');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
let verbose_debug_mode = config_storage.get('verbose_debug_mode');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_actions = require('./player-actions.js');

// Name : game_actions.create_game()
// Desc : creates a new game in mongodb, returns game details
// Author(s) : RAk3rman
exports.create_game = async function () {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.create({
            _id: uuidv4(),
            slug: uniqueNamesGenerator({dictionaries: [adjectives, animals, colors], separator: '-', length: 2})
        }, function (err, created_game) {
            if (err) {
                reject(err);
            } else {
                resolve(created_game);
            }
        });
    });
}

// Name : game_actions.game_details_slug(slug)
// Desc : returns the details for a game slug
// Author(s) : RAk3rman
exports.game_details_slug = async function (slug) {
    //Create new promise and return created_game after saved
    return await new Promise((resolve, reject) => {
        game.findOne({ slug: slug }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                resolve(found_game);
            }
        });
    });
}

// Name : game_actions.import_cards(game_slug)
// Desc : bulk import cards via json file
// Author(s) : RAk3rman
exports.import_cards = async function (game_slug, pack_loc) {
    //Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    //Get json array of cards
    let pack_array = require(pack_loc);
    //Loop through each json value and add card
    for (let i = 1; i <= pack_array.length - 1; i++) {
        game_details.cards.push({
            _id: pack_array[i]._id,
            image_loc: "public/cards/" + pack_array[0].pack_name + "/" + pack_array[i].file_name,
            action: pack_array[i].action, position: i
        });
    }
    //Create new promise
    return await new Promise((resolve, reject) => {
        //Save existing game
        game_details.save(function (err) {
            if (err) {
                reject(err);
            } else {
                //Resolve promise when the last card has been pushed
                resolve(pack_array.length - 1);
            }
        });
    });
}

// Name : game_actions.draw_card(game_details, player_id)
// Desc : draw a card from the draw deck and place at the end of a players hand
// Author(s) : Vincent Do, RAk3rman
exports.draw_card = async function (game_details, player_id) {
    // Filter draw deck
    let draw_deck = await filter_cards("draw_deck", game_details.cards);
    // Filter player hand
    let player_hand = await filter_cards(player_id, game_details.cards);
    // Create new promise for game save
    return await new Promise((resolve, reject) => {
        // Update player with card that was drawn
        game.findOneAndUpdate({
            slug: game_details.slug,
            "cards._id": draw_deck[draw_deck.length-1]._id
        }, {
            "$set": { "cards.$.assignment": player_id, "cards.$.position": player_hand.length }
        }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(draw_deck[draw_deck.length-1]);
            }
        });
    });
}

// Name : game_actions.base_router(game_details, game_slug, player_id, card_id)
// Desc : base deck - calls the appropriate card function based on card action
// Author(s) : RAk3rman
exports.base_router = async function (game_details, game_slug, player_id, card_id) {
    // Find card details from id
    let card_details = await find_card(card_id, game_details.cards);
    console.log(card_details);
    // Determine which function to run
    if (card_details.action === "attack") {
        await card_actions.attack(game_details);
        await game_actions.discard_card(game_details, card_id);
        return true;
    } else if (card_details.action === "chicken") { // Signals that the player is dead
        await card_actions.kill_player(game_details, player_id);
        await game_actions.discard_card(game_details, card_id);
        game_details.turns_remaining = 0;
        await game_actions.advance_turn(game_details);
        return true;
    } else if (card_details.action === "defuse") {
        // TODO Implement defuse
    } else if (card_details.action === "favor") {
        // TODO Implement favor
    } else if (card_details.action === "randchick-1") {
        // TODO Implement randchick
    } else if (card_details.action === "randchick-2") {
        // TODO Implement randchick
    } else if (card_details.action === "randchick-3") {
        // TODO Implement randchick
    } else if (card_details.action === "randchick-4") {
        // TODO Implement randchick
    } else if (card_details.action === "reverse") {
        await card_actions.reverse(game_details);
        await game_actions.discard_card(game_details, card_id);
        return true;
    } else if (card_details.action === "seethefuture") {
        // TODO Implement see the future
    } else if (card_details.action === "shuffle") {
        await card_actions.shuffle_draw_deck(game_details);
        await game_actions.discard_card(game_details, card_id);
        return true;
    } else if (card_details.action === "skip") {
        await game_actions.discard_card(game_details, card_id);
        await game_actions.advance_turn(game_details);
        return true;
    } else {

    }
}

// Name : game_actions.discard_card(game_details, game_slug, card_id)
// Desc : put a card in discard deck
// Author(s) : RAk3rman
exports.discard_card = async function (game_details, card_id) {
    // Find greatest position in discard deck
    let discard_deck = await filter_cards("discard_deck", game_details.cards);
    // Create new promise to save game
    return await new Promise((resolve, reject) => {
        // Update card that was discarded
        game.findOneAndUpdate({ slug: game_details.slug, "cards._id": card_id},
            {"$set": { "cards.$.assignment": "discard_deck", "cards.$.position": discard_deck.length }},
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
}

// Name : game_actions.advance_turn(game_details)
// Desc : Advance to the next turn
// Author(s) : RAk3rman, Vincent Do
exports.advance_turn = async function (game_details) {
    // Check how many turns we have left
    // TODO Handle if players are dead
    if (game_details.turns_remaining <= 1) { // Only one turn left, player seat advances
        // Check if we are going forward or backward
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
        // Make sure the number of turns remaining is not 0
        game_details.turns_remaining = 1;
    } else { // Multiple turns left, player seat remains the same and turns_remaining decreases by one
        game_details.turns_remaining--;
    }
    // Create new promise
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

// Name : game_actions.reset_game(game_slug, player_status, game_status)
// Desc : resets the game to default
// Author(s) : Vincent Do
exports.reset_game = async function (game_slug, player_status, game_status) {
    //Get game details
    let game_details = await game_actions.game_details_slug(game_slug);
    //Reset cards
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        game_details.cards[i].assignment = "draw_deck";
        game_details.cards[i].position = i;
    }
    //Reset players
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        game_details.players[i].status = player_status;
    }
    //Reset game variables
    game_details.turn_direction = "forward";
    game_details.seat_playing = 0;
    game_details.turns_remaining = 1;
    game_details.status = game_status;
    //Create new promise
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

// Name : game_actions.game_purge()
// Desc : deletes all games that are over 4 hours old
// Author(s) : RAk3rman
exports.game_purge = async function () {
    spinner.info(`${chalk.bold.red('Game Purge')}: Purging all games older than 4 hours`);
    game.find({}, function (err, found_games) {
        if (err) {
            spinner.fail(`${chalk.bold.red('Game Purge')}: Could not retrieve games`);
        } else {
            //Loop through each game
            for (let i = 0; i < found_games.length; i++) {
                //Determine if the game is more than 4 hours old
                if (!moment(found_games[i].created).add(4, "hours").isSameOrAfter(moment())) {
                    //Delete game
                    game_actions.delete_game(found_games[i].slug).then(() => {
                        spinner.succeed(`${chalk.bold.red('Game Purge')}: Deleted game with id:` + found_games[i]._id);
                    });
                }
            }
        }
    });
}

// Name : game_actions.delete_game()
// Desc : deletes a existing game in mongodb, returns game_slug
// Author(s) : RAk3rman
exports.delete_game = async function (game_slug) {
    //Create new promise and return delete_game _id after deleted
    return await new Promise((resolve, reject) => {
        game.deleteOne({ slug: game_slug }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(game_slug);
            }
        });
    });
}

// PRIVATE FUNCTIONS

// Name : filter_cards(assignment, card_array)
// Desc : filters and sorts cards based on assignment and position
// Author(s) : RAk3rman
function filter_cards(assignment, card_array) {
    //Get cards in discard deck
    let temp_deck = [];
    for (let i = 0; i < card_array.length; i++) {
        //If the card is assigned to this player, add to hand
        if (card_array[i].assignment === assignment) {
            temp_deck.push(card_array[i]);
        }
    }
    //Sort card hand by position
    temp_deck.sort(function(a, b) {
        return a.position - b.position;
    });
    return temp_deck;
}

// Name : find_card(card_id, card_array)
// Desc : filters and returns the data for a card id
// Author(s) : RAk3rman
function find_card(card_id, card_array) {
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