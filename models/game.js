/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/models/game.js
Desc     : mongoose model for each game,
           including players and cards
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

//Player schema
let playerSchema = mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4()
    },
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
    _id: {
        type: String,
        required: true
    },
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
        default: "draw_deck"
    },
    position: {
        type: Number,
        required: true
    }
});

//Game schema
let gameSchema = mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4()
    },
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
    turn_direction: {
        type: String,
        default: "forward"
    },
    players: [playerSchema],
    cards: [cardSchema]
});

//Export game model
module.exports = mongoose.model('game', gameSchema);