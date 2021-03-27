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
const wipe = chalk.white;
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
    //Create new promise and return found_game after saved
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

// Name : game_actions.game_details_id(_id)
// Desc : returns the details for a game id
// Author(s) : RAk3rman
exports.game_details_id = async function (_id) {
    //Create new promise and return found_game after saved
    return await new Promise((resolve, reject) => {
        game.findOne({ _id: _id }, function (err, found_game) {
            if (err) {
                reject(err);
            } else {
                resolve(found_game);
            }
        });
    });
}

// Name : game_actions.import_cards(game_id, pack_loc))
// Desc : bulk import cards via json file
// Author(s) : RAk3rman
exports.import_cards = async function (game_id, pack_loc) {
    //Get game details
    let game_details = await game_actions.game_details_id(game_id);
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
    let draw_deck = await card_actions.filter_cards("draw_deck", game_details.cards);
    // Filter player hand
    let player_hand = await card_actions.filter_cards(player_id, game_details.cards);
    // Check if new card is a chicken
    if (draw_deck[draw_deck.length-1].action === "chicken") {
        for (let i = 0; i <= game_details.players.length - 1; i++) {
            if (game_details.players[i]._id === player_id) {
                game_details.players[i].status = "exploding";
                i = game_details.players.length;
            }
        }
    }
    // Update card
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        if (game_details.cards[i]._id === draw_deck[draw_deck.length-1]._id) {
            game_details.cards[i].assignment = player_id;
            game_details.cards[i].position = player_hand.length;
            i = game_details.cards.length;
        }
    }
    // Create new promise to save game
    return await new Promise((resolve, reject) => {
        // Save updated game
        game_details.save({}, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(draw_deck[draw_deck.length-1]);
            }
        });
    });
}

// Name : game_actions.base_router(game_details, player_id, card_id, target)
// Desc : base deck - calls the appropriate card function based on card action
// Author(s) : RAk3rman
exports.base_router = async function (game_details, player_id, card_id, target) {
    // Find card details from id
    let card_details = await card_actions.find_card(card_id, game_details.cards);
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
        return await game_actions.check_winner(game_details);
    } else if (card_details.action === "defuse") {
        if (await card_actions.defuse(game_details, player_id, target) === true) {
            await game_actions.discard_card(game_details, card_id);
            await game_actions.advance_turn(game_details);
            return true;
        } else {
            return "You must draw an Exploding Chicken";
        }
    } else if (card_details.action === "favor") { // Favor, expecting target player_id
        let v_favor = await card_actions.verify_favor(game_details, player_id, target);
        if (v_favor === true) {
            await card_actions.ask_favor(game_details, player_id, target);
            await game_actions.discard_card(game_details, card_id);
            return true;
        } else {
            return v_favor;
        }
    } else if (card_details.action === "randchick-1" || card_details.action === "randchick-2" ||
        card_details.action === "randchick-3" || card_details.action === "randchick-4") { // Favor, expecting target player_id
        let v_favor = await card_actions.verify_favor(game_details, player_id, target);
        if (v_favor === true) {
            let v_double = await card_actions.verify_double(game_details, card_details, player_id, card_id);
            if (v_double === true) {
                await card_actions.ask_favor(game_details, player_id, target);
                await game_actions.discard_card(game_details, card_id);
                return true;
            } else {
                return v_double;
            }
        } else {
            return v_favor;
        }
    } else if (card_details.action === "reverse") {
        await card_actions.reverse(game_details);
        await game_actions.discard_card(game_details, card_id);
        await game_actions.advance_turn(game_details);
        return true;
    } else if (card_details.action === "seethefuture") {
        await game_actions.discard_card(game_details, card_id);
        return "seethefuture";
    } else if (card_details.action === "shuffle") {
        await card_actions.shuffle_draw_deck(game_details);
        await game_actions.discard_card(game_details, card_id);
        return true;
    } else if (card_details.action === "skip") {
        await game_actions.discard_card(game_details, card_id);
        await game_actions.advance_turn(game_details);
        return true;
    } else {
        // Houston, we have a problem
        return "Invalid card";
    }
}

// Name : game_actions.discard_card(game_details, card_id)
// Desc : put a card in discard deck
// Author(s) : RAk3rman
exports.discard_card = async function (game_details, card_id) {
    // Find greatest position in discard deck
    let discard_deck = await card_actions.filter_cards("discard_deck", game_details.cards);
    // Create new promise to save game
    return await new Promise((resolve, reject) => {
        // Update card that was discarded
        game.findOneAndUpdate(
            { slug: game_details.slug, "cards._id": card_id},
            {"$set": { "cards.$.assignment": "discard_deck", "cards.$.position": discard_deck.length }},
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    player_actions.sort_hand(game_details, card_id.assignment);
                    resolve();
                }
            });
    });
}

// Name : game_actions.advance_turn(game_details)
// Desc : advance to the next turn
// Author(s) : RAk3rman
exports.advance_turn = async function (game_details) {
    // Check how many turns we have left
    if (game_details.turns_remaining <= 1) { // Only one turn left, player seat advances
        // Advance to the next seat
        game_details.seat_playing = await player_actions.next_seat(game_details);
        // Make sure the number of turns remaining is not 0
        game_details.turns_remaining = 1;
    } else { // Multiple turns left, player seat remains the same and turns_remaining decreases by one
        game_details.turns_remaining--;
    }
    // Create new promise to save game
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

// Name : game_actions.check_winner(game_details)
// Desc : check to see if there is a winner
// Author(s) : RAk3rman
exports.check_winner = async function (game_details) {
    // Count the number of active players
    let ctn = 0;
    let player_id = undefined;
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        if (game_details.players[i].status === "playing") {
            ctn++;
            player_id = game_details.players[i]._id;
        }
    }
    // Determine if there is a winner, end game if so
    if (ctn === 1) {
        await game_actions.reset_game(game_details, "idle", "in_lobby");
        // Create new promise to save game
        await new Promise((resolve, reject) => {
            game.findOneAndUpdate(
                { slug: game_details.slug, "players._id": player_id },
                {"$set": { "players.$.status": "winner" }},
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        })
        return "winner";
    } else {
        return true;
    }
}

// Name : game_actions.reset_game(game_details, player_status, game_status)
// Desc : resets the game to default
// Author(s) : Vincent Do, RAk3rman
exports.reset_game = async function (game_details, player_status, game_status) {
    // Reset cards
    for (let i = 0; i <= game_details.cards.length - 1; i++) {
        game_details.cards[i].assignment = "draw_deck";
        game_details.cards[i].position = i;
    }
    // Reset players
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        game_details.players[i].status = player_status;
    }
    // Reset game variables
    game_details.turn_direction = "forward";
    game_details.seat_playing = 0;
    game_details.turns_remaining = 1;
    game_details.status = game_status;
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

// Name : game_actions.game_purge(debug)
// Desc : deletes all games that are over 4 hours old
// Author(s) : RAk3rman
exports.game_purge = async function (debug) {
    if (debug !== false) {
        spinner.info(wipe(`${chalk.bold.red('Game Purge')}: Purging all games older than 4 hours`));
    }
    await new Promise((resolve, reject) => {
        game.find({}, function (err, found_games) {
            if (err) {
                spinner.fail(wipe(`${chalk.bold.red('Game Purge')}: Could not retrieve games`));
                reject(err);
            } else {
                // Loop through each game
                for (let i = 0; i < found_games.length; i++) {
                    // Determine if the game is more than 4 hours old
                    if (!moment(found_games[i].created).add(4, "hours").isSameOrAfter(moment())) {
                        // Delete game
                        game_actions.delete_game(found_games[i]._id).then(() => {
                            if (debug !== false) {
                                spinner.succeed(wipe(`${chalk.bold.red('Game Purge')}: Deleted game with id:` + found_games[i]._id));
                            }
                        });
                    }
                }
                resolve();
            }
        });
    })
}

// Name : game_actions.delete_game(game_id)
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
