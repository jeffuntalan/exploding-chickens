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

    //Services
    let card_actions = require('../services/card-actions.js');
    let game_actions = require('../services/game-actions.js');
    let player_handler = require('../services/player-handler.js');

    //Create game route, expecting a player nickname
    fastify.post('/game/create', async function (req, reply) {
        console.log(req.body.nickname);
        //Call function to create game
        let game_data = await game_actions.create_game()
        // -- do stuff and redirect with game url
        reply.redirect("/game/" + "slug");
        //Create player
        await player_handler.modify_player(game_data[0].slug, undefined, req.body.nickname, 0, "online")
    })
};
