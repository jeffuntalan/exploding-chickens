/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename    : exploding-chickens/models/game.js
Description : mongoose model for each game,
              including players and cards
Author(s)   : RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/
const mongoose = require('mongoose');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

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

module.exports = mongoose.model('game', gameSchema);