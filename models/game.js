/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/models/game.js
Desc     : mongoose model for each game,
           including players and cards
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
const mongoose = require('mongoose');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

//Player schema
let playerSchema = mongoose.Schema({
    nickname: {
        type: String,
        required: true
    },
    seat: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "connected"
    }
});

//Card schema
let cardSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    assignment: {
        type: String,
        required: true
    },
    position: {
        type: Number,
        required: true
    }
});

//Game schema
let gameSchema = mongoose.Schema({
    slug: {
        type: String,
        default: uniqueNamesGenerator({
            dictionaries: [adjectives, animals, colors],
            separator: '-',
            length: 2
        })
    },
    created: {
        type: Date,
        default: Date.now
    },
    seat_playing: {
        type: Number,
        default: 0
    },
    player: [playerSchema],
    card: [cardSchema]
});

//Export game model
module.exports = mongoose.model('game', gameSchema);