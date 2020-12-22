/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/game-actions-api.js
Desc     : all routes related to game actions
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Export to app.js file
module.exports = function (app) {
    //Services
    let card_actions = require('../services/card-actions.js');
    let game_actions = require('../services/game-actions.js');
    let player_handler = require('../services/player-handler.js');

    //Example API route
    // app.route('/api/example')
    //     .post(game_actions.create_game());
};