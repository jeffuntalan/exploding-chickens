/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/config/evaluation.js
Desc     : evaluation suite for testing game,
           player, and card interactions
Author(s): RAk3rman, SengdowJones, Vincent Do
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora('');
var assert = require('assert');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_actions = require('../services/player-actions.js');

//Variables
let sample_game_slug = "";

// Name : evaluation.game_creation()
// Desc : creates a test game and initializes to sample values
// Author(s) : RAk3rman
exports.game_creation = async function () {
    //Console header
    let console_head = `${chalk.bold.red('Evaluation')}: ${chalk.dim.green('G-ADD')} `;
    spinner.info(console_head + `${chalk.bold('Evaluating game creation')}`);
    //Create sample game
    spinner.info(console_head + `Creating sample game`);
    let game_details = await game_actions.create_game().catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Created sample game with parameters: ` + JSON.stringify(game_details));
    sample_game_slug = game_details["slug"];
    //Import cards
    spinner.info(console_head + `Importing base cards from base.json`);
    let card_count = await game_actions.import_cards(sample_game_slug, '../packs/base.json').catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Imported ` + chalk.bold(card_count) + ` cards from base.json`);
}

// Name : evaluation.player_test()
// Desc : adds players to a sample game and tests interaction
// Author(s) : RAk3rman, SengdowJones
exports.player_test = async function () {
    //Console header
    let console_head = `${chalk.bold.red('Evaluation')}: ${chalk.dim.yellow('P-ACT')} `;
    spinner.info(console_head + `${chalk.bold('Evaluating player actions')}`);
    //Create 4 sample players
    spinner.info(console_head + `Creating sample players (4 total)`);
    let player_a = await player_actions.modify_player(sample_game_slug, undefined, "Player X", 0, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", "host", "idle", "offline").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Created Player X (aka A) (1 of 4) with id: ` + player_a);
    let player_b = await player_actions.modify_player(sample_game_slug, undefined, "Player B", 2, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", "player", "idle", "online").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Created Player B (2 of 4) with id: ` + player_b);
    let player_c = await player_actions.modify_player(sample_game_slug, undefined, "Player C", 3, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", "player", "idle", "online").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Created Player C (3 of 4) with id: ` + player_c);
    let player_d = await player_actions.modify_player(sample_game_slug, undefined, "Player D", 4, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", "player", "idle", "online").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Created Player D (4 of 4) with id: ` + player_d);
    //Test player modification
    spinner.info(console_head + `Modifying Player X (aka A) and verifying changes with id: ` + player_a);
    await player_actions.modify_player(sample_game_slug, player_a, "Player A", 1, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", "host", "idle", "online").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Modified Player X (aka A) with id: ` + player_a);
    //Assign cards to all players and print assignment
    spinner.info(console_head + `Assigning initial cards to all players`);
    await player_actions.create_hand(sample_game_slug).catch(e => {failed_test(e)});
    game_details = await game_actions.game_details_slug(sample_game_slug);
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        let cards_assigned = "";
        for (let j = 0; j <= game_details.cards.length - 1; j++) {
            if (game_details.players[i]._id === game_details.cards[j].assignment) {
                cards_assigned += " " + game_details.cards[j]._id;
            }
        }
        spinner.succeed(console_head + `Assigned cards to ` + game_details.players[i].nickname + `:` + cards_assigned);
    }
    //spinner.succeed(console_head + `Assigned ` + chalk.bold(defuse_count) + ` defuse cards to ` + chalk.bold(defuse_count) + ` players`);
    //Test seat randomization
    spinner.info(console_head + `Randomizing seat positions for all players`);
    await player_actions.randomize_seats(sample_game_slug).catch(e => {failed_test(e)});
    game_details = await game_actions.game_details_slug(sample_game_slug);
    // For every player, express updated seat position to console
    for (let i = 0; i <= game_details.players.length - 1; i++) {
        spinner.succeed(console_head +
            `Changed ` + game_details.players[i].nickname +
            `'s (` + (i+1) + ` of ` + game_details.players.length + `)` +
            ` seat position to ` + game_details.players[i].seat +
            ` with id: ` + game_details.players[i]._id);
    }
}

// Name : evaluation.card_test()
// Desc : adds cards to a sample game and tests interaction
// Author(s) : RAk3rman, Vincent Do
exports.card_test = async function () {
    //TODO Needs to be reworked with new functions
    //Console header
    let console_head = `${chalk.bold.red('Evaluation')}: ${chalk.dim.cyan('C-ACT')} `;
    spinner.info(console_head + `${chalk.bold('Evaluating card actions')}`);
    //Skip a players turn
    // spinner.info(console_head + `${chalk.italic('Skip:')} Skipping current turn`);
    // let next_player = await card_actions.skip(sample_game_slug, "").catch(e => {failed_test(e)});
    // spinner.succeed(console_head + `${chalk.italic('Skip:')} Skipped the current turn`);
    //Shuffle all cards in draw_deck
    spinner.info(console_head + `${chalk.italic('Shuffle:')} Shuffling all cards in draw deck`);
    let cards_in_deck = await card_actions.shuffle_draw_deck(sample_game_slug, "shuffle-base-a").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `${chalk.italic('Shuffle:')} Shuffled ` + chalk.bold(cards_in_deck) + ` cards in draw deck`);
    spinner.info(console_head + `${chalk.italic('Exploding Chicken:')} Use a defuse or die`);
    await card_actions.defuse(sample_game_slug, "chicken-base-a", "aea35f36-cf9c-44f1-b4a5-3718658d3964").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `${chalk.italic('Exploding Chicken:')} successfully dealt with`);
    let the_future = await card_actions.see_the_future(sample_game_slug).catch(e => {failed_test(e)});
    spinner.succeed(console_head + `${chalk.italic('See the Future:')}` + the_future);
    spinner.info(console_head + `${chalk.italic('Exploding Chicken:')} Doing a favor`);
    await card_actions.favor(sample_game_slug, "chicken-base-a", "aea35f36-cf9c-44f1-b4a5-3718658d3964").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `${chalk.italic('Favor:')} successfully dealt with`);
    spinner.info(console_head + `${chalk.italic('Exploding Chicken:')} Combining chicken to a favor`);
    await card_actions.double(sample_game_slug, "chicken-base-a", "aea35f36-cf9c-44f1-b4a5-3718658d3964").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `${chalk.italic('Favor:')} successfully dealt with`);
}

// Name : evaluation.game_test()
// Desc : tests game functions and interaction
// Author(s) : Vincent Do
exports.game_test = async function () {
    //TODO Needs to be reworked with new functions
    //Console header
    let console_head = `${chalk.bold.red('Evaluation')}: ${chalk.dim.magenta('G-ACT')} `;
    spinner.info(console_head + `${chalk.bold('Evaluating game actions')}`);
    //Advance forward 4 turns
    spinner.info(console_head + `Advancing forward 4 turns`);
    await game_actions.advance_turn(sample_game_slug).catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Advanced turn to next player`);
    spinner.info(console_head + `Discarding card`);
    let discard = await game_actions.discard_card(sample_game_slug, "skip-base-a").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `New card position is: ` + discard);
    spinner.info(console_head + `Drawing card`);
    let draw = await game_actions.draw_card(sample_game_slug, "skip-base-a").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `New card position is: ` + draw);
    spinner.info(console_head + `Putting Chicken back into deck`);
    let chicken = await game_actions.draw_card(sample_game_slug, "skip-base-a").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `New chicken position is: ` + chicken);
    spinner.info(console_head + `Calling card function`);
    await game_actions.base_router(sample_game_slug, "skip-1").catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Called successfully`);
}

// Name : evaluation.game_deletion()
// Desc : deletes a test game and cleans up
// Author(s) : RAk3rman
exports.game_deletion = async function () {
    //Console header
    let console_head = `${chalk.bold.red('Evaluation')}: ${chalk.dim.redBright('G-DEL')} `;
    spinner.info(console_head + `${chalk.bold('Evaluating game deletion')}`);
    //Delete sample game
    spinner.info(console_head + `Deleting sample game (1 of 1)`);
    let sample_game = await game_actions.delete_game(sample_game_slug).catch(e => {failed_test(e)});
    spinner.succeed(console_head + `Deleted game with id: ` + sample_game);
}

//PRIVATE FUNCTIONS

// Name : failed_test()
// Desc : called when a test fails, exits program and returns 1 (error)
// Author(s) : RAk3rman
function failed_test (desc) {
    spinner.fail(`${chalk.bold.red('Evaluation')}: ${chalk.red('FAIL')} Failed previous test with error message: "` + desc + `"`);
    process.exit(1);
}