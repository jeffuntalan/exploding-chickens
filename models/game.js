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
    avatar: {
        type: String,
        default: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    type: {
        type: String,
        default: "player"
    },
    status: {
        type: String,
        default: "idle"
    },
    connection: {
        type: String,
        default: "online"
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
    seat_playing: {
        type: Number,
        default: 0
    },
    turn_direction: {
        type: String,
        default: "forward"
    },
    turns_remaining: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        default: "in_lobby"
    },
    created: {
        type: Date,
        default: Date.now
    },
    players: [playerSchema],
    cards: [cardSchema]
});

//Export game model
module.exports = mongoose.model('game', gameSchema);