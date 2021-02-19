/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/config/setup.js
Desc     : checks and sets up configuration values
           in env.json using data-store
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora('');
const wipe = chalk.white;

// Name : setup.check_values()
// Desc : checks all env.json values and configures each value if invalid
// Author(s) : RAk3rman
exports.check_values = function (config_storage) {
    spinner.start(wipe(`${chalk.bold.cyan('Setup')}: Checking configuration values`));
    let invalid_config = false;
    //Config value: webserver_port | the port where the webserver will listen for requests
    if (!config_storage.has('webserver_port') || config_storage.get('webserver_port') === '') {
        config_storage.set('webserver_port', 3000);
        spinner.warn(wipe(`${chalk.bold.cyan('Setup')}: "webserver_port" value in config.json set to default: "3000"`));
    }
    //Config value: mongodb_url | the url used to access an external mongodb database
    if (!config_storage.has('mongodb_url') || config_storage.get('mongodb_url') === '') {
        config_storage.set('mongodb_url', 'mongodb://localhost:27017/exploding-chickens');
        spinner.warn(wipe(`${chalk.bold.cyan('Setup')}: "mongodb_url" value in config.json set to default: "mongodb://localhost:27017/exploding-chickens"`));
    }
    //Config value: verbose_debug_mode | the verbosity of output to the console
    if (!config_storage.has('verbose_debug_mode') || config_storage.get('verbose_debug_mode') === '') {
        config_storage.set('verbose_debug_mode', false);
        spinner.warn(wipe(`${chalk.bold.cyan('Setup')}: "verbose_debug_mode" value in config.json set to default: "false"`));
    }
    //Exit if the config values are not set properly
    if (invalid_config) {
        spinner.info(wipe(`${chalk.bold.cyan('Setup')}: Please check "env.json" and configure the appropriate values`));
        process.exit(0);
    } else {
        spinner.succeed(wipe(`${chalk.bold.cyan('Setup')}: Configuration values have been propagated`));
    }
}