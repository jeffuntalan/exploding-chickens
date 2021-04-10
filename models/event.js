/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/models/event.js
Desc     : mongoose model for logging
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Packages
let mongoose = require('mongoose');

// Event schema
module.exports = mongoose.Schema({
    event: {
        type: String,
        required: true
    },
    player_id: {
        type: String,
        required: true
    },
    seat_playing: {
        type: Number,
        required: true
    },
    turn_direction: {
        type: String,
        required: true
    },
    turns_remaining: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    players: {
        type: Array,
        required: true
    },
    cards: {
        type: Array,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});
