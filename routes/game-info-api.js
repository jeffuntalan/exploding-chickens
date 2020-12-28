/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/game-info-api.js
Desc     : all routes related to game information
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

    //Example API route
    fastify.get('/api/example-2', (req, reply) => {
        game.find({bib_number: req.query.bib_number}, function (err, details) {
            if (err) {
                console.log("ENTRY Resolver: Retrieve failed: " + err);
                reply.send(err);
            } else {
                console.log("ENTRY Resolver: Entry Sent: " + JSON.stringify(details))
            }
            reply.json(details);
        });
    })
};