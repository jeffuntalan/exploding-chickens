/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/game-actions-api.js
Desc     : all routes related to game actions
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Export to app.js file
module.exports = function (app) {
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
    app.route('/api/game/actions/create')
        .post(
            function (req, res) {
                game.find({bib_number: req.query.bib_number}, function (err, details) {
                    if (err) {
                        console.log("ENTRY Resolver: Retrieve failed: " + err);
                        res.send(err);
                    } else {
                        console.log("ENTRY Resolver: Entry Sent: " + JSON.stringify(details))
                    }
                    res.json(details);
                });
            }
        );
};