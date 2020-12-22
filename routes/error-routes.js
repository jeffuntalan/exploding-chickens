/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/routes/error-routes.js
Desc     : all routes related error handling
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Export to app.js file
module.exports = function (app) {
    //Services
    let card_actions = require('../services/card-actions.js');
    let game_actions = require('../services/game-actions.js');
    let player_handler = require('../services/player-handler.js');

    //404 error handling
    app.use(function (req, res, next) {
        next(createError(404));
    });

    //Other error handling
    app.use(function (err, req, res, next) {
        //Pass through error message to webpage
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};
        //Render error page
        res.status(err.status || 500);
        res.render('pages/error.ejs', {title: 'Error'});
    });
};