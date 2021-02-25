/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/test/test.js
Desc     : evaluation suite for testing game,
           player, and card interactions
Author(s): RAk3rman, SengdowJones, Vincent Do
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let game = require('../models/game.js');
let assert = require('chai').assert;
let mongoose = require('mongoose');
const moment = require('moment');
const chalk = require('chalk');
const pkg = require('../package.json');
const ora = require('ora');
const spinner = ora('');
const wipe = chalk.white;
const dataStore = require('data-store');
const config_storage = new dataStore({path: '../config/config.json'});

//Services
let setup = require('../config/setup.js');
let card_actions = require('../services/card-actions.js');
let game_actions = require('../services/game-actions.js');
let player_actions = require('../services/player-actions.js');

// Variables
let game_id;

// Name : test.before
// Desc : get everything setup for test cases
// Author(s) : RAk3rman
before(done => {
    console.log(chalk.blue.bold('\nExploding Chickens v' + pkg.version + ' | BACKEND TEST'));
    // Check configuration values
    setup.check_values(config_storage);
    // Connect to mongodb using mongoose
    spinner.start(wipe(`${chalk.bold.yellow('Mongoose')}: Attempting to connect using url "` + config_storage.get('mongodb_url') + `"`));
    mongoose.connection.on('connected', function () {
        spinner.succeed(wipe(`${chalk.bold.yellow('Mongoose')}: Connected successfully at ` + config_storage.get('mongodb_url')));
        spinner.info(wipe(`${chalk.bold.red('Mocha')}: Starting unit tests for BACKEND`));
        done();
    });
    mongoose.connect(config_storage.get('mongodb_url'), {useNewUrlParser: true,  useUnifiedTopology: true, connectTimeoutMS: 10000});
    mongoose.set('useFindAndModify', false);
});

// Name : test.game_creation
// Desc : creates a test game and initializes to sample values
// Author(s) : RAk3rman
describe('Game setup', function() {
    let game_details_create;
    describe('#game_actions.create_game()', function() {
        it('create new sample game', function(done) {
            game_actions.create_game().then(result => {
                game_details_create = result;
                game_id = result._id;
                done();
            })
        });
        it('slug exists', function() {
            assert(game_details_create.slug);
        });
        it('no players exist', function() {
            assert.equal(game_details_create.players.length, 0);
        });
        it('no cards exist', function() {
            assert.equal(game_details_create.cards.length, 0);
        });
    });
    describe('#game_actions.game_details_slug(slug)', function() {
        let game_details_slug;
        it('search for existing game', function(done) {
            game_actions.game_details_slug(game_details_create.slug).then(result => {
                game_details_slug = result;
                done();
            })
        });
        it('games match', function() {
            assert.equal(game_details_create.slug, game_details_slug.slug);
        });
    });
    describe('#game_actions.game_details_id(_id)', function() {
        let game_details_slug;
        it('search for existing game', function(done) {
            game_actions.game_details_id(game_id).then(result => {
                game_details_slug = result;
                done();
            })
        });
        it('games match', function() {
            assert.equal(game_details_create.slug, game_details_slug.slug);
        });
    });
    describe('#game_actions.import_cards(game_id, pack_loc)', function() {
        let card_count;
        it('importing cards', function(done) {
            game_actions.import_cards(game_id, '../packs/base.json').then(result => {
                card_count = result;
                done();
            })
        });
        it('card count match', function() {
            game_actions.game_details_id(game_id).then(result => {
                assert.equal(result.cards.length, card_count);
            })
        });
    });
});

// Name : test.players
// Desc : adds players to a sample game and tests interaction
// Author(s) : RAk3rman
// describe('Players', function() {
//
// });

// Name : test.cards
// Desc : adds cards to a sample game and tests interaction
// Author(s) : RAk3rman
// describe('Cards', function() {
//
// });

// Name : test.gameplay
// Desc : tests game functions and interaction
// Author(s) : RAk3rman
// describe('Gameplay', function() {
//
// });

// Name : test.game_deletion
// Desc : deletes a test game and cleans up
// Author(s) : RAk3rman
describe('Game deletion', function() {
    describe('#game_actions.game_purge(debug)', function() {
        let game_id_temp;
        it('create purgeable game', function(done) {
            game.create({
                created: moment().subtract(5, 'hours')
            }, function (err, created_game) {
                if (!err) {
                    game_id_temp = created_game._id;
                    done();
                }
            });
        });
        it('purging games', function(done) {
            game_actions.game_purge(false).then(result => {
                done();
            })
        });
        it('verifying purge', async function() {
            assert.isNotOk(await game.exists({ _id: game_id_temp }));
        });
    });
    describe('#game_actions.delete_game(game_id))', function() {
        it('deleting sample game', function(done) {
            game_actions.delete_game(game_id).then(result => {
                done();
            })
        });
        it('verifying deletion', async function() {
            assert.isNotOk(await game.exists({ _id: game_id }));
        });
    });
});

// Name : test.after
// Desc : clean everything up after test cases
// Author(s) : RAk3rman
after(done => {
    // Close mongoose connection
    spinner.info(wipe(`${chalk.bold.yellow('Mongoose')}: Closing mongodb connection`));
    mongoose.disconnect().then(result => {done()});
});