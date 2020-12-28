/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/app.js
Desc     : main application file
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages and configuration - - - - - - - - - - - - - - - - - - - - - - - - -

//Declare packages
const pino = require('pino')();
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

//Configuration & testing
let setup = require('./config/setup.js');
let evaluation = require('./config/evaluation.js');

//Services
let card_actions = require('./services/card-actions.js');
let game_actions = require('./services/game-actions.js');
let player_handler = require('./services/player-handler.js');

//Print header to console
console.log(chalk.blue.bold('\nExploding Chickens v' + pkg.version + ' | ' + pkg.author));
console.log(chalk.white('--> Description: ' + pkg.description));
console.log(chalk.white('--> Github: ' + pkg.homepage + '\n'));

//Check configuration values
setup.check_values(config_storage);

//End of Packages and configuration - - - - - - - - - - - - - - - - - - - - - -


//Fastify and main functions - - - - - - - - - - - - - - - - - - - - - - - - - -

//Declare fastify
const fastify = require('fastify')({logger: {prettyPrint: true}});

//Prepare rendering template
fastify.register(require('point-of-view'), {
    engine: {
        handlebars: require('handlebars')
    }
})

//Routers
let game_actions_api = require('./routes/game-actions-api.js');
let game_info_api = require('./routes/game-info-api.js');
let site_routes = require('./routes/site-routes.js');
let error_routes = require('./routes/error-routes.js');

//Import routes
// game_actions_api(app);
// game_info_api(app);
// site_routes(app);
// error_routes(app);

//Home page
fastify.get('/', (req, reply) => {
    reply.view('/templates/home.hbs', { text: 'text' })
})

//End of Fastify and main functions - - - - - - - - - - - - - - - - - - - - - -


//Setup external connections - - - - - - - - - - - - - - - - - - - - - - - - -

//Prepare async mongoose connection messages
mongoose.connection.on('connected', function () {mongoose_connected()});
mongoose.connection.on('timeout', function () {spinner.fail(`${chalk.bold.yellow('Mongoose')}: Connection timed out`);mongoose_disconnected()});
mongoose.connection.on('disconnected', function () {spinner.warn(`${chalk.bold.yellow('Mongoose')}: Connection was interrupted`);mongoose_disconnected()});

//Connect to mongodb using mongoose
spinner.start(`${chalk.bold.yellow('Mongoose')}: Attempting to connect using url "` + config_storage.get('mongodb_url') + `"`);
mongoose.connect(config_storage.get('mongodb_url'), {useNewUrlParser: true,  useUnifiedTopology: true, connectTimeoutMS: 10000});
mongoose.set('useFindAndModify', false);

//When mongoose establishes a connection with mongodb
function mongoose_connected() {
    spinner.succeed(`${chalk.bold.yellow('Mongoose')}: Connected successfully at ` + config_storage.get('mongodb_url'));
    //Start webserver using config values
    spinner.info(`${chalk.bold.blue('Fastify')}: Attempting to start http webserver on port ` + config_storage.get('webserver_port'));
    fastify.listen(config_storage.get('webserver_port'), function (err, address) {
        if (err) {
            fastify.log.error(err)
            process.exit(1)
        }
        //Check if we are in testing environment
        if (!(process.env.testENV || process.argv[2] !== "test")) {
            spinner.info(`${chalk.bold.red('Evaluation')}: ${chalk.bold.underline('Starting evaluation suite')}`);
            const run_eval = async () => {
                await evaluation.game_creation();
                await evaluation.player_test();
                await evaluation.card_test();
                await evaluation.game_test();
                await evaluation.game_deletion();
            }
            run_eval().then(() => {
                spinner.succeed(`${chalk.bold.red('Evaluation')}: ${chalk.bold.underline('Evaluation suite completed successfully')}`);
                process.exit(0);
            });
        }
    })
}

//When mongoose losses a connection with mongodb
function mongoose_disconnected() {
    spinner.succeed(`${chalk.cyan('Fastify')}: Stopping http webserver on port ` + config_storage.get('webserver_port'));
    //server.close();
}

//End of Setup external connections - - - - - - - - - - - - - - - - - - - - - -