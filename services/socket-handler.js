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

    // Name : socket.on.connection
    // Desc : runs when a new connection is created through socket.io
    // Author(s) : RAk3rman
    fastify.io.on('connection', function (socket) {
        spinner.info(`${chalk.bold.blue('Socket')}: Client connected with socket id: ` + socket.id );

        // Name : socket.on.retrieve-game
        // Desc : runs when game data is requested from the client
        // Author(s) : RAk3rman
        socket.on('retrieve-game', async function (data) {
            spinner.start(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('check-slug')} Checking to see if game exists with slug: ` + data.slug);
            //Send updated game data
            await update_game(data.slug, socket.id, "retrieve-game");
        })

        // Name : socket.on.check-slug
        // Desc : runs when we need to see if a slug exists in the db
        // Author(s) : RAk3rman
        socket.on('check-slug', async function (data) {
            spinner.start(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-game')} Preparing to send game with slug: ` + data.slug);
            //Check to see if game exists
            if (await game_actions.game_details_slug(data.slug) === null) {
                fastify.io.to(socket.id).emit("slug-response", false)
            } else {
                fastify.io.to(socket.id).emit("slug-response", data.slug)
            }
            spinner.succeed(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-game')} Sent back validity for slug: ` + data.slug);
        })

        // Name : socket.on.create-player
        // Desc : runs when a new player to be created
        // Author(s) : RAk3rman
        socket.on('create-player', async function (data) {
            spinner.start(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('create-player')} Preparing to create player for game with slug: ` + data.slug + `, nickname: ` + data.nickname + `, avatar: ` + data.avatar);
            //Get game details
            let raw_game_details = await game_actions.game_details_slug(data.slug);
            //Determine host assignment
            let created_player;
            if (raw_game_details["players"].length === 0) { //Add player as host
                created_player = await player_actions.modify_player(raw_game_details["_id"], undefined, data.nickname, 0, data.avatar, "host", "idle", "offline");
            } else { //Add as player
                created_player = await player_actions.modify_player(raw_game_details["_id"], undefined, data.nickname, raw_game_details["players"].length, data.avatar, "player", "idle", "offline");
            }
            //Return player_id to client
            fastify.io.to(socket.id).emit("player-created", created_player);
            spinner.succeed(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('create-player')} Created new player for game with slug: ` + data.slug + ` and player_id: ` + created_player);
            //Update clients
            await update_game(data.slug, "", "create-player");
        })

        // Name : socket.on.disconnect
        // Desc : runs when the client disconnects
        // Author(s) : RAk3rman
        socket.on('disconnect', function () {
            console.log('socketHandler: User Disconnected');
        });
    })

    // Name : update_game(slug, target, source)
    // Desc : sends an event containing game data
    // Author(s) : RAk3rman
    async function update_game(slug, target, source) {
        //Get raw game details from mongodb
        let raw_game_details = await game_actions.game_details_slug(slug);
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
        }
        //Get discard deck
        pretty_game_details.discard_deck = filter_cards("discard_deck", raw_game_details["cards"]);
        //Send game-data
        if (target === "") {
            fastify.io.emit(slug, pretty_game_details);
        } else {
            fastify.io.to(target).emit(slug, pretty_game_details);
        }
        spinner.succeed(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan(source)} Sent game data with slug: ` + slug);
    }

    // Name : filter_cards(assignment, card_array)
    // Desc : filters and sorts cards based on assignment and position
    // Author(s) : RAk3rman
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

    // Name : emit_statistics(target)
    // Desc : sends statistics used on the home page
    // Author(s) : RAk3rman
    function emit_statistics(target) {
        if (target === undefined) {
            fastify.io.emit('statistics', {
                games_online: 0,
                players_online: 0
            })
        } else {
            fastify.io.to(target).emit('statistics', {
                games_online: 0,
                players_online: 0
            })
        }
    }
};