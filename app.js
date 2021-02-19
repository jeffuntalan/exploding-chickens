/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/app.js
Desc     : main application file
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Packages and configuration - - - - - - - - - - - - - - - - - - - - - - - - -

// Declare packages
let game = require('./models/game.js');
const pino = require('pino');
const path = require('path')
let mongoose = require('mongoose');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const chalk = require('chalk');
const pkg = require('./package.json');
const ora = require('ora');
const spinner = ora('');
const ip = require('ip');

// Configuration & testing
let setup = require('./config/setup.js');
let evaluation = require('./config/evaluation.js');

// Services
let card_actions = require('./services/card-actions.js');
let game_actions = require('./services/game-actions.js');
let player_actions = require('./services/player-actions.js');
let socket_handler = require('./services/socket-handler.js');

// Print header to console
console.clear();
console.log(chalk.blue.bold('\nExploding Chickens v' + pkg.version + ((process.argv[2] !== undefined) ? ' | ' + process.argv[2].toUpperCase() : "" )));
console.log(chalk.white('--> Contributors: ' + pkg.author));
console.log(chalk.white('--> Description: ' + pkg.description));
console.log(chalk.white('--> Github: ' + pkg.homepage + '\n'));

// Check configuration values
setup.check_values(config_storage);

// End of Packages and configuration - - - - - - - - - - - - - - - - - - - - - -


// Fastify and main functions - - - - - - - - - - - - - - - - - - - - - - - - - -

// Declare fastify
const fastify = require('fastify')({logger: false});

// Prepare rendering template
fastify.register(require('point-of-view'), {
    engine: {
        handlebars: require('handlebars')
    },
})
fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/',
})
fastify.register(require('fastify-socket.io'), {})
fastify.register(require('fastify-formbody'))
fastify.register(require('fastify-rate-limit'), {
    max: 15,
    timeWindow: '1 minutes' // Change to 5 for production
})
// Routers
let game_actions_api = require('./routes/game-actions-api.js');
let error_routes = require('./routes/error-routes.js');

// Import routes
game_actions_api(fastify);
error_routes(fastify);

// Home page
fastify.get('/', (req, reply) => {
    reply.view('/templates/home.hbs', { active_games: 0, title: "Home" })
})

// Game page
fastify.get('/game/:_id', async function (req, reply) {
    // Make sure game exists
    if (await game.exists({ slug: req.params._id })) {
        reply.view('/templates/game.hbs', { slug: req.params._id, version: pkg.version })
    } else {
        reply.status(404).view('/templates/error.hbs', { error_code: "404", title: "Game does not exist", desc_1: "Unfortunately, we could not find the game lobby you are looking for.", desc_2: "Try a different link or create a new game on the home page." });
    }
})

// End of Fastify and main functions - - - - - - - - - - - - - - - - - - - - - -


// Setup external connections - - - - - - - - - - - - - - - - - - - - - - - - -

// Prepare async mongoose connection messages
mongoose.connection.on('connected', function () {mongoose_connected()});
mongoose.connection.on('timeout', function () {spinner.fail(`${chalk.bold.yellow('Mongoose')}: Connection timed out`);mongoose_disconnected()});
mongoose.connection.on('disconnected', function () {spinner.warn(`${chalk.bold.yellow('Mongoose')}: Connection was interrupted`);mongoose_disconnected()});

// Connect to mongodb using mongoose
spinner.start(`${chalk.bold.yellow('Mongoose')}: Attempting to connect using url "` + config_storage.get('mongodb_url') + `"`);
mongoose.connect(config_storage.get('mongodb_url'), {useNewUrlParser: true,  useUnifiedTopology: true, connectTimeoutMS: 10000});
mongoose.set('useFindAndModify', false);

// When mongoose establishes a connection with mongodb
function mongoose_connected() {
    spinner.succeed(`${chalk.bold.yellow('Mongoose')}: Connected successfully at ` + config_storage.get('mongodb_url'));
    // Start purge game cycle
    game_actions.game_purge().then(r => {});
    setInterval(game_actions.game_purge, 3600000);
    // Start webserver using config values
    spinner.info(`${chalk.bold.magenta('Fastify')}: Attempting to start http webserver on port ` + config_storage.get('webserver_port'));
    fastify.listen(config_storage.get('webserver_port'), function (err, address) {
        if (err) {
            fastify.log.error(err)
            process.exit(1)
        }
        // Open socket.io connection
        socket_handler(fastify);
        // Check if we are in testing environment
        if (!(process.env.testENV || process.argv[2] !== "test")) {
            spinner.info(`${chalk.bold.red('Evaluation')}: ${chalk.bold.underline('Starting evaluation suite')}`);
            const run_eval = async () => {
                await evaluation.game_creation();
                await evaluation.player_test();
                //await evaluation.card_test();
                //await evaluation.game_test();
                await evaluation.game_deletion();
            }
            run_eval().then(() => {
                spinner.succeed(`${chalk.bold.red('Evaluation')}: ${chalk.bold.underline('Evaluation suite completed successfully')}`);
                process.exit(0);
            });
        }
    })
}

// When mongoose losses a connection with mongodb
function mongoose_disconnected() {
    spinner.succeed(`${chalk.bold.magenta('Fastify')}: Stopping http webserver on port ` + config_storage.get('webserver_port'));
    //server.close();
}

// End of Setup external connections - - - - - - - - - - - - - - - - - - - - - -