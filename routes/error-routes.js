/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/error-routes.js
Desc     : all routes related error handling
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Export to app.js file
module.exports = function (fastify) {
    //Services
    let card_actions = require('../services/card-actions.js');
    let game_actions = require('../services/game-actions.js');
    let player_actions = require('../services/player-actions.js');

    //404 error handler
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
        reply.status(404).view('/templates/error.hbs', {});
    })

    //Other error code handler
    fastify.setErrorHandler(function (error, request, reply) {
        // Log error
        this.log.error(error);
        // Send error response
        reply.status(error.statusCode).view('/templates/error.hbs', { error_code: error.statusCode });
    })
};