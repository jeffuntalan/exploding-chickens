/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/error-routes.js
Desc     : all routes related error handling
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Export to app.js file
module.exports = function (fastify) {
    // Services
    let card_actions = require('../services/card-actions.js');
    let game_actions = require('../services/game-actions.js');
    let player_actions = require('../services/player-actions.js');

    // 404 error handler
    fastify.setNotFoundHandler({
        preValidation: (req, reply, done) => {
            // your code
            done()
        },
        preHandler: (req, reply, done) => {
            // your code
            done()
        }
    }, function (request, reply) {
        reply.status(404).view('/templates/error.hbs', { error_code: "404", title: "Page does not exist", desc_1: "Unfortunately, we could not find the page you are looking for.", desc_2: "Try a different link or visit the home page." });
    })

    // Other error code handler
    fastify.setErrorHandler(function (error, request, reply) {
        // Log error
        this.log.error(error);
        // Send error response
        if (error.statusCode === 429) {
            reply.status(404).view('/templates/error.hbs', { error_code: error.statusCode, title: "Request limit reached", desc_1: "Woah there, it looks like you made too many requests.", desc_2: "Please try again in a couple minutes." });
        } else {
            reply.status(404).view('/templates/error.hbs', { error_code: error.statusCode, title: "Internal server error", desc_1: "Unfortunately, we could not complete the action that was requested.", desc_2: "Please try again later." });
        }

    })
};