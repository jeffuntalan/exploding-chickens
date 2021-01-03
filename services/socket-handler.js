/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/socket-handler.js
Desc     : handles all socket.io actions
           and sends data back to client
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora('');

//Export to app.js file
module.exports = function (fastify) {
    spinner.succeed(`${chalk.bold.blue('Socket')}: Successfully opened socket.io connection`);

    //Services
    let card_actions = require('../services/card-actions.js');
    let game_actions = require('../services/game-actions.js');
    let player_actions = require('../services/player-actions.js');

    //New connection
    fastify.io.on('connection', function (socket) {
        spinner.info(`${chalk.bold.blue('Socket')}: Client connected with socket id: ` + socket.id );
        emit_statistics(socket.id);

        //Retrieve game data
        socket.on('retrieve-game', async function (data) {
            spinner.info(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-game')} Sending game data with slug: ` + data.slug );
            fastify.io.to(socket.id).emit('game-data', await game_actions.game_details_slug(data.slug))
        })
    })

    //Emit statistics
    function emit_statistics(socket_id) {
        if (socket_id === undefined) {
            fastify.io.emit('statistics', {
                games_online: 0,
                players_online: 0
            })
        } else {
            fastify.io.to(socket_id).emit('statistics', {
                games_online: 0,
                players_online: 0
            })
        }
    }
};