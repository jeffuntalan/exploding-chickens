/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/models/game.js
Desc     : mongoose model for players
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Packages
let mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Player schema
module.exports = mongoose.Schema({
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
        default: "/public/avatars/default.png"
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
