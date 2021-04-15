/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/game-actions-api.js
Desc     : all routes related to game actions
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Export to app.js file
module.exports = function (fastify) {

    // Packages
    const chalk = require('chalk');
    const ora = require('ora');
    const spinner = ora('');
    const wipe = chalk.white;
    const moment = require('moment');

    // Services
    let game_actions = require('../services/game-actions.js');

    // Create game route, expecting a player nickname
    fastify.post('/game/create', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, async function (req, reply) {
        // Create sample game
        spinner.start(wipe(`${chalk.bold.white('API')}:     [` + moment().format('MM/DD/YY-HH:mm:ss') + `] ${chalk.dim.cyan('create-game     ')} Received request to create new game`));
        let game_details = await game_actions.create_game().catch(e => {failed_step(e, reply)});
        spinner.succeed(wipe(`${chalk.bold.white('API')}:     [` + moment().format('MM/DD/YY-HH:mm:ss') + `] ${chalk.dim.cyan('create-game     ')} ${chalk.dim.yellow(game_details["slug"])} Created new game`));
        let game_id = game_details["_id"];
        // Import cards
        let card_count = await game_actions.import_cards(game_id, '../packs/base.json').catch(e => {failed_step(e, reply)});
        spinner.succeed(wipe(`${chalk.bold.white('API')}:     [` + moment().format('MM/DD/YY-HH:mm:ss') + `] ${chalk.dim.cyan('create-game     ')} ${chalk.dim.yellow(game_details["slug"])} Imported ` + chalk.bold(card_count) + ` cards from base.json`));
        // Redirect to game url
        reply.redirect("/game/" + game_details["slug"]);
    })

    // Failed step in api
    function failed_step (desc, reply) {
        spinner.fail(wipe(`${chalk.bold.white('API')}:     [` + moment().format('MM/DD/YY-HH:mm:ss') + `] ${chalk.red('FAIL')} Failed previous step with error message: "` + desc + `"`));
        reply.code(500);
    }
};
