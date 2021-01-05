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
const moment = require('moment');

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
        //emit_statistics(socket.id);

        //Retrieve game data
        socket.on('retrieve-game', async function (data) {
            spinner.start(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-game')} Preparing to send game data with slug: ` + data.slug  + ` and player_id: ` + data.player_id);
            //Get raw game details from mongodb
            let raw_game_details = await game_actions.game_details_slug(data.slug);
            //console.log(raw_game_details);
            //Prepare pretty game details
            let pretty_game_details = {
                players: [],
                discard_deck: [],
                slug: raw_game_details["slug"],
                created: moment(raw_game_details["created"]).calendar(),
                status: raw_game_details["status"],
                seat_playing: raw_game_details["seat_playing"],
                turn_direction: raw_game_details["turn_direction"],
                turns_remaining: raw_game_details["turns_remaining"]
            }
            //Sort and add players to json array
            raw_game_details["players"].sort(function(a, b) {
                return a.seat > b.seat;
            });
            //Loop through each player
            for (let i = 0; i < raw_game_details["players"].length; i++) {
                let card_array = filter_cards(raw_game_details["players"][i]._id, raw_game_details["cards"]);
                //Found current player, return extended details
                if (data.player_id === raw_game_details["players"][i]._id) {
                    pretty_game_details.players.push({
                        _id: raw_game_details["players"][i]._id,
                        cards: card_array,
                        card_num: card_array.length,
                        avatar: raw_game_details["players"][i].avatar,
                        status: raw_game_details["players"][i].status,
                        connection: raw_game_details["players"][i].connection,
                        nickname: raw_game_details["players"][i].nickname,
                        seat: raw_game_details["players"][i].seat,
                    });
                } else { //Found other player, return limited details
                    pretty_game_details.players.push({
                        _id: raw_game_details["players"][i]._id,
                        cards: [],
                        card_num: card_array.length,
                        avatar: raw_game_details["players"][i].avatar,
                        status: raw_game_details["players"][i].status,
                        connection: raw_game_details["players"][i].connection,
                        nickname: raw_game_details["players"][i].nickname,
                        seat: raw_game_details["players"][i].seat,
                    });
                }
            }
            //Get discard deck
            pretty_game_details.discard_deck = filter_cards("discard_deck", raw_game_details["cards"]);
            //Send game-data
            fastify.io.to(socket.id).emit(data.slug + "_" + data.player_id, pretty_game_details);
            spinner.succeed(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-game')} Sent game data with slug: ` + data.slug + ` and player_id: ` + data.player_id);
        })
    })

    //Filter cards by assignment and sort by position
    function filter_cards(assignment, card_array) {
        //Get cards in discard deck
        let temp_deck = [];
        for (let i = 0; i < card_array.length; i++) {
            //If the card is assigned to this player, add to hand
            if (card_array[i].assignment === assignment) {
                temp_deck.push(card_array[j]);
            }
        }
        //Sort card hand by position
        temp_deck.sort(function(a, b) {
            return a.position > b.position;
        });
        return temp_deck;
    }

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