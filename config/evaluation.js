/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/config/evaluation.js
Desc     : evaluation suite for testing game,
           player, and card interactions
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora('');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_handler = require('../services/player-handler.js');

//Variables
let sample_game_id = "";

// Name : evaluation.game_creation()
// Desc : creates a test game and initializes to sample values
// Author(s) :
exports.game_creation = async function () {
    spinner.info(`${chalk.red('Evaluation')}: ${chalk.bold('Evaluating game creation')}`);
    //Create sample game
    spinner.info(`${chalk.red('Evaluation')}: Creating sample game (1 of 2)`);
    let sample_game = await game_actions.create_game().catch(e => {failed_test(e)});
    spinner.succeed(`${chalk.red('Evaluation')}: Created game with the following parameters: ` + JSON.stringify(sample_game));
    sample_game_id = sample_game["_id"];
    //Edit sample game
    spinner.info(`${chalk.red('Evaluation')}: ${chalk.redBright('N/A')} Checking sample game data (2 of 2)`);
    //TODO edit various parameters of sample game
}

// Name : evaluation.player_test()
// Desc : adds players to a sample game and tests interaction
// Author(s) :
exports.player_test = async function () {
    spinner.info(`${chalk.red('Evaluation')}: ${chalk.redBright('N/A')} ${chalk.bold('Evaluating player actions')}`);
    //TODO adds players to a sample game and tests interaction
}

// Name : evaluation.card_test()
// Desc : adds cards to a sample game and tests interaction
// Author(s) :
exports.card_test = async function () {
    spinner.info(`${chalk.red('Evaluation')}: ${chalk.redBright('N/A')} ${chalk.bold('Evaluating card actions')}`);
    //TODO adds cards to a sample game and tests interaction
}

// Name : evaluation.game_test()
// Desc : tests game functions and interaction
// Author(s) :
exports.game_test = async function () {
    spinner.info(`${chalk.red('Evaluation')}: ${chalk.redBright('N/A')} ${chalk.bold('Evaluating game actions')}`);
    //TODO tests game functions and interaction
}

// Name : evaluation.game_deletion()
// Desc : deletes a test game and cleans up
// Author(s) :
exports.game_deletion = async function () {
    spinner.info(`${chalk.red('Evaluation')}: ${chalk.bold('Evaluating game deletion')}`);
    //Delete sample game
    spinner.info(`${chalk.red('Evaluation')}: Deleting sample game (1 of 1)`);
    let sample_game = await game_actions.delete_game(sample_game_id).catch(e => {failed_test(e)});
    spinner.succeed(`${chalk.red('Evaluation')}: Deleted game with _id: ` + sample_game);
}

// Name : failed_test()
// Desc : called when a test fails, exits program and returns 1 (error)
// Author(s) : RAk3rman
function failed_test (desc) {
    spinner.fail(`${chalk.red('Evaluation')}: Failed previous test with error message: "` + desc + `"`);
    process.exit(1);
}