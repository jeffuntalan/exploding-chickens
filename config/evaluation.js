/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/config/evaluation.js
Desc     : evaluation suite for testing game,
           player, and card creation
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora('');

// Name : evaluation.game_creation()
// Desc : creates a test game and initializes to sample values
// Author(s) :
exports.game_creation = function () {
    spinner.info(`${chalk.red('Evaluation')}: Evaluating game creation`);
    //TODO creates a test game and initializes to sample values
}

// Name : evaluation.player_test()
// Desc : adds players to a sample game and tests interaction
// Author(s) :
exports.player_test = function () {
    spinner.info(`${chalk.red('Evaluation')}: Evaluating player actions`);
    //TODO adds players to a sample game and tests interaction
}

// Name : evaluation.card_test()
// Desc : adds cards to a sample game and tests interaction
// Author(s) :
exports.card_test = function () {
    spinner.info(`${chalk.red('Evaluation')}: Evaluating card actions`);
    //TODO adds cards to a sample game and tests interaction
}

// Name : evaluation.game_test()
// Desc : tests game functions and interaction
// Author(s) :
exports.game_test = function () {
    spinner.info(`${chalk.red('Evaluation')}: Evaluating game actions`);
    //TODO tests game functions and interaction
}

// Name : failed_test()
// Desc : called when a test fails, exits program and returns 1 (error)
// Author(s) : RAk3rman
function failed_test (desc) {
    spinner.fail(`${chalk.red('Evaluation')}: Failed test "` + desc + `"`);
    process.exit(1);
}