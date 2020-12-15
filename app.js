/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename    : exploding-chickens/app.js
Description : main application file
Author(s)   : RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

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
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const chalk = require('chalk');
const pkg = require('./package.json');
const ora = require('ora');
const spinner = ora('');
const ip = require('ip');

//Print header to console
console.log(chalk.red.bold('\nExploding Chickens v' + pkg.version + ' | ' + pkg.author));
console.log(chalk.white('--> Description: ' + pkg.description));
console.log(chalk.white('--> Github: ' + pkg.homepage + '\n'));

//Setup config.json datastore
spinner.start('Checking configuration values');
const config_storage = new dataStore({path: './config/env.json'});
let invalid_config = false;

//Config value: webserver_port | the port where the webserver will listen for requests
if (!config_storage.has('webserver_port') || config_storage.get('webserver_port') === '') {
    config_storage.set('webserver_port', 3000);
    spinner.warn('"webserver_port" value in config.json set to default: "3000"');
}
//Config value: mongodb_url | the url used to access an external mongodb database
if (!config_storage.has('mongodb_url') || config_storage.get('mongodb_url') === '') {
    config_storage.set('mongodb_url', 'mongodb://localhost:27017');
    spinner.warn('"mongodb_url" value in config.json set to default: "mongodb://localhost:27017"');
}
//Config value: express_secret | the session secret value used for express
if (!config_storage.has('express_secret') || config_storage.get('express_secret') === '') {
    let new_secret = uuidv4();
    config_storage.set('express_secret', new_secret);
    spinner.warn('"express_secret" value in config.json set to default: "' + new_secret + '"');
}
//Config value: verbose_debug_mode | the verbosity of output to the console
if (!config_storage.has('verbose_debug_mode') || config_storage.get('verbose_debug_mode') === '') {
    config_storage.set('verbose_debug_mode', false);
    spinner.warn('"verbose_debug_mode" value in config.json set to default: "false"');
}

//Exit if the config values are not set properly (and not in testing env)
if (invalid_config && (process.env.testENV || process.argv[2] !== "test")) {
    process.exit(1);
} else {
    spinner.succeed('Config values have been propagated');
}
//End of Packages and configuration - - - - - - - - - - - - - - - - - - - - - -


//Setup external connections - - - - - - - - - - - - - - - - - - - - - - - - -

//Prepare async mongoose connection messages
mongoose.connection.on('connected', function () {spinner.succeed(`${chalk.yellow('MongoDB')}: Connected successfully`)});
mongoose.connection.on('timeout', function () {spinner.fail(`${chalk.yellow('MongoDB')}: Connection timed out`)});
mongoose.connection.on('disconnected', function () {spinner.warn(`${chalk.yellow('MongoDB')}: Connection was interrupted`)});

spinner.start(`${chalk.yellow('MongoDB')}: Attempting to connect using url "` + config_storage.get('mongodb_url') + `"`);
mongoose.connect(config_storage.get('mongodb_url'), {useNewUrlParser: true,  useUnifiedTopology: true, connectTimeoutMS: 10000});

//End of Setup external connections - - - - - - - - - - - - - - - - - - - - - -

//process.exit(0);