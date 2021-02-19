/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/game-actions-api.js
Desc     : all routes related to game actions
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Export to app.js file
module.exports = function (fastify) {
    //Packages
    let game = require('../models/game.js');
    const dataStore = require('data-store');
    const config_storage = new dataStore({path: './config/config.json'});
    let verbose_debug_mode = config_storage.get('verbose_debug_mode');
    const chalk = require('chalk');
    const ora = require('ora');
    const spinner = ora('');
    const wipe = chalk.white;

    //Services
    let card_actions = require('../services/card-actions.js');
    let game_actions = require('../services/game-actions.js');
    let player_actions = require('../services/player-actions.js');

    //Create game route, expecting a player nickname
    fastify.post('/game/create', async function (req, reply) {
        //Create sample game
        spinner.info(wipe(`${chalk.bold.red('API')}:    ${chalk.dim.cyan('create-game     ')} Received request to create new game`));
        let game_details = await game_actions.create_game().catch(e => {failed_step(e, reply)});
        spinner.succeed(wipe(`${chalk.bold.red('API')}:    ${chalk.dim.cyan('create-game     ')} ${chalk.dim.yellow(game_details["slug"])} Created new game`));
        let game_id = game_details["_id"];
        //Import cards
        let card_count = await game_actions.import_cards(game_id, '../packs/base.json').catch(e => {failed_step(e, reply)});
        spinner.succeed(wipe(`${chalk.bold.red('API')}:    ${chalk.dim.cyan('create-game     ')} ${chalk.dim.yellow(game_details["slug"])} Imported ` + chalk.bold(card_count) + ` cards from base.json`));
        //Redirect to game url
        reply.redirect("/game/" + game_details["slug"]);
    })

    //Failed step in api
    function failed_step (desc, reply) {
        spinner.fail(wipe(`${chalk.bold.red('API')}: ${chalk.red('FAIL')} Failed previous step with error message: "` + desc + `"`));
        reply.code(500);
    }
};
