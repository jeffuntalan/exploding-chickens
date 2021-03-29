/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/services/socket-handler.js
Desc     : handles all socket.io actions
           and sends data back to client
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora('');
const wipe = chalk.white;
const moment = require('moment');

//Services
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_actions = require('../services/player-actions.js');

//Export to app.js file
module.exports = function (fastify) {
    spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: Successfully opened socket.io connection`));

    // Name : socket.on.connection
    // Desc : runs when a new connection is created through socket.io
    // Author(s) : RAk3rman
    fastify.io.on('connection', function (socket) {
        spinner.info(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.green('new-connection  ')} Socket ID: ` + socket.id ));
        let player_data = {};

        // Name : socket.on.player-connected
        // Desc : runs when the client receives game data and is hosting a valid player
        // Author(s) : RAk3rman
        socket.on('player-connected', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('player-connected')} ${chalk.dim.yellow(data.slug)} Updating player status`));
            //Verify game and player exists
            if (await game.exists({ slug: data.slug, "players._id": data.player_id })) {
                //Update connection and local player data
                player_data = data;
                await player_actions.update_connection(data.slug, data.player_id, "connected");
                spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('player-connected')} ${chalk.dim.yellow(data.slug)} Player now ${chalk.dim.green('connected')} with player_id: ` + data.player_id));
                //Update clients
                await update_game_ui(data.slug, "", "player-connected");
            } else {
                //Emit error event with error
                spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('player-connected')} ${chalk.dim.yellow(data.slug)} Game does not exist`));
                fastify.io.to(socket.id).emit(data.slug + "-error", "Game does not exist");
            }
        })

        // Name : socket.on.retrieve-game
        // Desc : runs when game data is requested from the client
        // Author(s) : RAk3rman
        socket.on('retrieve-game', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-game   ')} ${chalk.dim.yellow(data.slug)} Checking to see if game exists`));
            //Verify game exists
            if (await game.exists({ slug: data.slug })) {
                //Send updated game data
                await update_game_ui(data.slug, socket.id, "retrieve-game   ");
            } else {
                //Emit error event with error
                spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-game   ')} ${chalk.dim.yellow(data.slug)} Game does not exist`));
                fastify.io.to(socket.id).emit(data.slug + "-error", "Game does not exist");
            }
        })

        // Name : socket.on.create-player
        // Desc : runs when a new player to be created
        // Author(s) : RAk3rman
        socket.on('create-player', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('create-player   ')} ${chalk.dim.yellow(data.slug)} Preparing to create player with nickname: ` + data.nickname + `, avatar: ` + data.avatar));
            //Verify game exists
            if (await game.exists({ slug: data.slug })) {
                //Get game details
                let raw_game_details = await game_actions.game_details_slug(data.slug);
                //Determine host assignment
                let created_player;
                if (raw_game_details["players"].length === 0) { //Add player as host
                    created_player = await player_actions.modify_player(data.slug, undefined, data.nickname, 0, data.avatar, "host", "idle", "connected");
                } else { //Add as player
                    created_player = await player_actions.modify_player(data.slug, undefined, data.nickname, raw_game_details["players"].length, data.avatar, "player", "idle", "connected");
                }
                //Return player_id to client
                fastify.io.to(socket.id).emit("player-created", created_player);
                spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('create-player   ')} ${chalk.dim.yellow(data.slug)} Created new player for game with player_id: ` + created_player));
                //Update clients
                await update_game_ui(data.slug, "", "create-player   ");
            } else {
                //Emit error event with error
                spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('create-player   ')} ${chalk.dim.yellow(data.slug)} Game does not exist`));
                fastify.io.to(socket.id).emit(data.slug + "-error", "Game does not exist");
            }
        })

        // Name : socket.on.start-game
        // Desc : runs when the host requests the game to start
        // Author(s) : RAk3rman
        socket.on('start-game', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('start-game      ')} ${chalk.dim.yellow(data.slug)} Starting game`));
            // Verify game exists
            if (await game.exists({ slug: data.slug, "players._id": data.player_id })) {
                // Get game details
                let game_details = await game_actions.game_details_slug(data.slug);
                // Verify host
                if (validate_host(data.player_id, game_details)) {
                    //Make sure we have the correct number of players
                    if (game_details.players.length > 1 && game_details.players.length < 5) {
                        // Reset game
                        await game_actions.reset_game(game_details, "playing", "in_game");
                        // Create hand for each player
                        await player_actions.create_hand(data.slug);
                        // Randomize seat positions
                        await player_actions.randomize_seats(data.slug);
                        // Emit start game event
                        spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('start-game      ')} ${chalk.dim.yellow(data.slug)} Game has started`));
                        await update_game_ui(data.slug, "", "start-game      ");
                    } else {
                        spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('start-game      ')} ${chalk.dim.yellow(data.slug)} 2-5 players are required`));
                        fastify.io.to(socket.id).emit(data.slug + "-error", "You must have 2-5 players");
                    }
                } else {
                    spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('start-game      ')} ${chalk.dim.yellow(data.slug)} Tried to complete host action`));
                    fastify.io.to(socket.id).emit(data.slug + "-error", "You are not the host");
                }
            } else {
                spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('start-game      ')} ${chalk.dim.yellow(data.slug)} Game does not exist`));
                fastify.io.to(socket.id).emit(data.slug + "-error", "Game does not exist");
            }
        })

        // Name : socket.on.reset-game
        // Desc : runs when the host requests the game to reset back to the lobby
        // Author(s) : RAk3rman
        socket.on('reset-game', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('reset-game      ')} ${chalk.dim.yellow(data.slug)} Resetting game`));
            // Verify game exists
            if (await game.exists({ slug: data.slug, "players._id": data.player_id })) {
                // Get game details
                let game_details = await game_actions.game_details_slug(data.slug);
                // Verify host
                if (validate_host(data.player_id, game_details)) {
                    // Reset game
                    await game_actions.reset_game(game_details, "idle", "in_lobby");
                    // Emit reset game event
                    spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('reset-game      ')} ${chalk.dim.yellow(data.slug)} Game has been reset`));
                    await update_game_ui(data.slug, "", "reset-game      ");
                } else {
                    spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('reset-game      ')} ${chalk.dim.yellow(data.slug)} Tried to complete host action`));
                    fastify.io.to(socket.id).emit(data.slug + "-error", "You are not the host");
                }
            } else {
                spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('reset-game      ')} ${chalk.dim.yellow(data.slug)} Game does not exist`));
                fastify.io.to(socket.id).emit(data.slug + "-error", "Game does not exist");
            }
        })

        // Name : socket.on.play-card
        // Desc : runs when a card is played on the client
        // Author(s) : RAk3rman
        socket.on('play-card', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Playing card with card_id: ` + data.card_id));
            // Verify game exists
            if (await game.exists({ slug: data.slug, "players._id": data.player_id })) {
                // Get game details
                let game_details = await game_actions.game_details_slug(data.slug);
                if (validate_turn(data.player_id, game_details)) {
                    if (game_details.status === "in_game") {
                        // Send card id to router
                        let action_res = await game_actions.base_router(game_details, data.player_id, data.card_id, data.target);
                        if (action_res === true) {
                            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Card successfully played and discarded`));
                            // Update clients
                            await update_game_ui(data.slug, "", "play-card       ");
                        } else if (action_res === "seethefuture") {
                            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Card successfully played and discarded, calling back top 3`));
                            // Update clients
                            await update_game_ui(data.slug, "", "play-card       ");
                            // Trigger stf callback
                            fastify.io.to(socket.id).emit(data.slug + "-callback", {
                                trigger: "seethefuture",
                                payload: await card_actions.filter_cards("draw_deck", game_details["cards"])
                            });
                        } else if (action_res === "favor_target") {
                            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Requesting target from player for favor card`));
                            // Trigger stf callback
                            fastify.io.to(socket.id).emit(data.slug + "-callback", {
                                trigger: "favor_target",
                                payload: {
                                    game_details: await get_game_export(data.slug, "play-card       "),
                                    card_id: data.card_id
                                }
                            });
                        } else if (action_res === "winner") {
                            // Emit reset game event and winner
                            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Game ended due to player win`));
                            await update_game_ui(data.slug, "", "reset-game      ");
                        } else {
                            spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Error while playing card: ` + action_res));
                            fastify.io.to(socket.id).emit(data.slug + "-error", action_res);
                        }
                    } else {
                        spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Game has not started`));
                        fastify.io.to(socket.id).emit(data.slug + "-error", "Game has not started");
                    }
                } else {
                    spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} It is not the current players turn`));
                    fastify.io.to(socket.id).emit(data.slug + "-error", "Please wait your turn");
                }
            } else {
                spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Game does not exist`));
                fastify.io.to(socket.id).emit(data.slug + "-error", "Game does not exist");
            }
        })

        // Name : socket.on.draw-card
        // Desc : runs when a card is drawn on the client
        // Author(s) : RAk3rman
        socket.on('draw-card', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('draw-card       ')} ${chalk.dim.yellow(data.slug)} Drawing new card for player_id: ` + data.player_id));
            // Verify game exists
            if (await game.exists({ slug: data.slug, "players._id": data.player_id })) {
                // Get game details
                let game_details = await game_actions.game_details_slug(data.slug);
                if (validate_turn(data.player_id, game_details)) {
                    if (game_details.status === "in_game") {
                        // Draw card from draw deck and place in hand
                        let card_drawn = await game_actions.draw_card(game_details, data.player_id);
                        // Check if card drawn in an ec
                        if (card_drawn["action"] !== "chicken") {
                            game_details = await game_actions.game_details_slug(data.slug);
                            await game_actions.advance_turn(game_details);
                            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('draw-card       ')} ${chalk.dim.yellow(data.slug)} Drew new card and advanced turn for player_id:` + data.player_id));
                        } else {
                            // fastify.io.emit(data.slug + "-callback", {
                            //     player_id: data.player_id,
                            //     action: "chicken"
                            // });
                            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('draw-card       ')} ${chalk.dim.yellow(data.slug)} Drew chicken for player_id:` + data.player_id));
                        }
                        // Update clients
                        await update_game_ui(data.slug, "", "draw-card       ");

                    } else {
                        spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('play-card       ')} ${chalk.dim.yellow(data.slug)} Game has not started`));
                        fastify.io.to(socket.id).emit(data.slug + "-error", "Game has not started");
                    }
                } else {
                    spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('draw-card       ')} ${chalk.dim.yellow(data.slug)} It is not the current players turn`));
                    fastify.io.to(socket.id).emit(data.slug + "-error", "Please wait your turn");
                }
            } else {
                spinner.warn(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('draw-card       ')} ${chalk.dim.yellow(data.slug)} Game does not exist`));
                fastify.io.to(socket.id).emit(data.slug + "-error", "Game does not exist");
            }
        })

        // Name : socket.on.retrieve-stats
        // Desc : runs when stats are requested from the home page
        // Author(s) : RAk3rman
        socket.on('retrieve-stats', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('retrieve-stats  ')} ${chalk.dim.yellow(data.slug)} Retrieving statistics`));
            //Send statistics

        })

        // Name : socket.on.check-slug
        // Desc : runs when we need to see if a slug exists in the db
        // Author(s) : RAk3rman
        socket.on('check-slug', async function (data) {
            spinner.start(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('check-slug      ')} ${chalk.dim.yellow(data.slug)} Checking game slug`));
            //Check to see if game exists
            if (await game.exists({ slug: data.slug })) {
                fastify.io.to(socket.id).emit("slug-response", data.slug);
            } else {
                fastify.io.to(socket.id).emit("slug-response", false);
            }
            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan('check-slug      ')} ${chalk.dim.yellow(data.slug)} Sent back validity for game slug`));
        })

        // Name : socket.on.disconnect
        // Desc : runs when the client disconnects
        // Author(s) : RAk3rman
        socket.on('disconnect', async function () {
            spinner.info(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.red('new-disconnect  ')} Socket ID: ` + socket.id));
            //Mark player as disconnected if active
            if (await game.exists({ slug: player_data["slug"] }) && player_data["slug"] && player_data["player_id"]) {
                //Update connection and local player data
                await player_actions.update_connection(player_data["slug"], player_data["player_id"], "offline");
                spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.red('disconnect      ')} ${chalk.dim.yellow(player_data["slug"])} Player now ${chalk.dim.red('offline')}: ` + player_data["player_id"]));
                //Update clients
                await update_game_ui(player_data["slug"], "", "disconnect      ");
            }
        });
    })

    // Name : validate_host(player_id, game_details)
    // Desc : returns a bool stating if the player_id is a host
    // Author(s) : RAk3rman
    function validate_host(player_id, game_details) {
        //Find player
        for (let i = 0; i < game_details.players.length; i++) {
            if (game_details.players[i]._id === player_id) {
                if (game_details.players[i].type === "host") {
                    return true
                } else {
                    return false;
                }
            }
        }
    }

    // Name : validate_turn(player_id, game_details)
    // Desc : returns a bool stating if the player_id is on its turn
    // Author(s) : RAk3rman
    function validate_turn(player_id, game_details) {
        //Find player
        for (let i = 0; i < game_details.players.length; i++) {
            if (game_details.players[i]._id === player_id) {
                if (game_details.players[i].seat === game_details.seat_playing) {
                    return true
                } else {
                    return false;
                }
            }
        }
    }

    // Name : update_game_ui(slug, target, source)
    // Desc : sends an event containing game data
    // Author(s) : RAk3rman
    async function update_game_ui(slug, target, source) {
        //Get raw pretty game details
        let pretty_game_details = await get_game_export(slug, source);
        if (pretty_game_details !== {}) {
            //Send game data
            if (target === "") {
                fastify.io.emit(slug + "-update", pretty_game_details);
            } else {
                fastify.io.to(target).emit(slug + "-update", pretty_game_details);
            }
            spinner.succeed(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan(source)} ${chalk.dim.yellow(slug)} Sent game update event`));
        } else {
            spinner.fail(wipe(`${chalk.bold.blue('Socket')}: ${chalk.dim.cyan(source)} ${chalk.dim.yellow(slug)} Game does not exist`));
        }
    }

    // Name : update_game_ui(slug, target, source)
    // Desc : sends an event containing game data
    // Author(s) : RAk3rman
    async function get_game_export(slug, source) {
        //Get raw game details from mongodb
        let raw_game_details = await game_actions.game_details_slug(slug);
        if (raw_game_details !== null) {
            //Determine number of exploding chickens
            let ec_count = 0;
            for (let i = 0; i < raw_game_details["cards"].length; i++) {
                //If the card is assigned to this player, add to hand
                if (raw_game_details["cards"][i].action === "chicken" && raw_game_details["cards"][i].assignment === "draw_deck") {
                    ec_count += 1;
                }
            }
            //Prepare pretty game details
            let draw_deck = await card_actions.filter_cards("draw_deck", raw_game_details["cards"]);
            let pretty_game_details = {
                players: [],
                discard_deck: [],
                slug: raw_game_details["slug"],
                created: moment(raw_game_details["created"]).calendar(),
                status: raw_game_details["status"],
                seat_playing: raw_game_details["seat_playing"],
                turn_direction: raw_game_details["turn_direction"],
                turns_remaining: raw_game_details["turns_remaining"],
                cards_remaining: draw_deck.length,
                ec_remaining: ec_count,
                trigger: source.trim()
            }
            //Sort and add players to json array
            raw_game_details["players"].sort(function(a, b) {
                return a.seat - b.seat;
            });
            //Loop through each player
            for (let i = 0; i < raw_game_details["players"].length; i++) {
                let card_array = await card_actions.filter_cards(raw_game_details["players"][i]._id, raw_game_details["cards"]);
                // Sort card hand in reverse order
                card_array.sort(function(a, b) {
                    return b.position - a.position;
                });
                //Found current player, return extended details
                pretty_game_details.players.push({
                    _id: raw_game_details["players"][i]._id,
                    cards: card_array,
                    card_num: card_array.length,
                    avatar: raw_game_details["players"][i].avatar,
                    type: raw_game_details["players"][i].type,
                    status: raw_game_details["players"][i].status,
                    connection: raw_game_details["players"][i].connection,
                    nickname: raw_game_details["players"][i].nickname,
                    seat: raw_game_details["players"][i].seat,
                });
            }
            //Get discard deck
            pretty_game_details.discard_deck = await card_actions.filter_cards("discard_deck", raw_game_details["cards"]);
            //Send game data
            return pretty_game_details;
        } else {
            return {};
        }
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
