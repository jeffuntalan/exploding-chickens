/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/game/interface.js
Desc     : handles ui updates and actions on the interface
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

// Name : frontend-game.itr_update_players()
// Desc : updates players
function itr_update_players() {

}

// Name : frontend-game.itr_update_pstatus()
// Desc : updates only the status symbol of players
function itr_update_pstatus() {

}

// Name : frontend-game.itr_update_pcards()
// Desc : updates only the cards icon of players
function itr_update_pcards() {

}

// Name : frontend-game.itr_update_discard()
// Desc : updates discard deck
function itr_update_discard() {

}

// Name : frontend-game.itr_update_hand()
// Desc : updates users hand
function itr_update_hand() {

}

// Name : frontend-game.create_stat_dot(status, connection, margin, id)
// Desc : returns the html for a pulsating status dot
function create_stat_dot(status, connection, margin, id) {
    return "<span class=\"" + stat_dot_class(status, connection, margin) + "\" id=\"" + id + "\"></span>"
}

// Name : frontend-game.stat_dot_class(status, connection, margin)
// Desc : returns the class for a status dot
function stat_dot_class(status, connection, margin) {
    if (status === "exploded") {
        return "animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-red-500"
    } else if (connection === "connected") {
        return "animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-green-500"
    } else if (connection === "offline") {
        return "animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-yellow-400"
    } else {
        return "animate-pulse inline-flex rounded-full h-1.5 w-1.5 mb-0.5 " + margin + " align-middle bg-gray-500"
    }
}