/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/config/setup.js
Desc     : checks and sets up configuration values
           in env.json using data-store
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Packages
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora('');
const wipe = chalk.white;
const moment = require('moment');

// Name : setup.check_values()
// Desc : checks all env.json values and configures each value if invalid
// Author(s) : RAk3rman
exports.check_values = function (config_storage, stats_storage) {
    spinner.start(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] Checking configuration values`));
    let invalid_config = false;
    // Config value: webserver_port | the port where the webserver will listen for requests
    if (!config_storage.has('webserver_port') || config_storage.get('webserver_port') === '') {
        config_storage.set('webserver_port', 3000);
        spinner.warn(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] "webserver_port" value in config.json set to default: "3000"`));
    }
    // Config value: mongodb_url | the url used to access an external mongodb database
    if (!config_storage.has('mongodb_url') || config_storage.get('mongodb_url') === '') {
        config_storage.set('mongodb_url', 'mongodb://localhost:27017/exploding-chickens');
        spinner.warn(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] "mongodb_url" value in config.json set to default: "mongodb://localhost:27017/exploding-chickens"`));
    }
    // Config value: game_purge_interval | the verbosity of output to the console
    if (!config_storage.has('game_purge_age_hrs') || config_storage.get('game_purge_age_hrs') === '') {
        config_storage.set('game_purge_age_hrs', 12);
        spinner.warn(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] "game_purge_age_hrs" value in config.json set to default: "12"`));
    }
    // Exit if the config values are not set properly
    if (invalid_config) {
        spinner.info(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] Please check "config.json" and configure the appropriate values`));
        process.exit(0);
    } else {
        spinner.succeed(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] Configuration values have been propagated`));
    }
    // Check default stats values
    spinner.start(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] Checking stats`));
    let stats_array = ['games_played', 'mins_played', 'explosions', 'attacks', 'defuses', 'favors', 'reverses', 'seethefutures', 'shuffles', 'skips', 'sockets_active'];
    stats_array.forEach(element => {
        if (!stats_storage.has(element)) {
            stats_storage.set(element, 0);
            spinner.warn(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] "` + element + `" value in stats.json set to default: "0"`));
        }
    })
    spinner.succeed(wipe(`${chalk.bold.cyan('Setup')}:   [` + moment().format('MM/DD/YY-HH:mm:ss') + `] Statistic values have been propagated`));
}