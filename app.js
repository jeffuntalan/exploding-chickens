/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/app.js
Desc     : main application file
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages and configuration - - - - - - - - - - - - - - - - - - - - - - - - -

//Declare packages
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dataStore = require('data-store');
const config_storage = new dataStore({path: './config/config.json'});
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const chalk = require('chalk');
const pkg = require('./package.json');
const ora = require('ora');
const spinner = ora('');
const ip = require('ip');

//Configuration
let config_setup = require('./config/setup.js');

//Services
let card_actions = require('./services/card-actions.js');
let game_actions = require('./services/game-actions.js');
let player_handler = require('./services/player-handler.js');

//Print header to console
console.log(chalk.blue.bold('\nExploding Chickens v' + pkg.version + ' | ' + pkg.author));
console.log(chalk.white('--> Description: ' + pkg.description));
console.log(chalk.white('--> Github: ' + pkg.homepage + '\n'));

//Check configuration values
config_setup.check_values(config_storage);

//End of Packages and configuration - - - - - - - - - - - - - - - - - - - - - -


//Express and main functions - - - - - - - - - - - - - - - - - - - - - - - - -

//End of Express and main functions - - - - - - - - - - - - - - - - - - - - - -


//Setup external connections - - - - - - - - - - - - - - - - - - - - - - - - -

//Prepare async mongoose connection messages
mongoose.connection.on('connected', function () {spinner.succeed(`${chalk.yellow('Mongoose')}: Connected successfully`)});
mongoose.connection.on('timeout', function () {spinner.fail(`${chalk.yellow('Mongoose')}: Connection timed out`)});
mongoose.connection.on('disconnected', function () {spinner.warn(`${chalk.yellow('Mongoose')}: Connection was interrupted`)});
//Connect to mongodb using mongoose
spinner.start(`${chalk.yellow('Mongoose')}: Attempting to connect using url "` + config_storage.get('mongodb_url') + `"`);
mongoose.connect(config_storage.get('mongodb_url'), {useNewUrlParser: true,  useUnifiedTopology: true, connectTimeoutMS: 10000});

//End of Setup external connections - - - - - - - - - - - - - - - - - - - - - -

//process.exit(0);