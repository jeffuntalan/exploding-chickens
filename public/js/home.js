/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/home.js
Desc     : handles socket.io connection
           related to site wide statistics and modals
Author(s): RAk3rman, SengdowJones
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Declare socket.io
let socket = io();

//Open join game modal
function join_game_modal() {
    Swal.fire({
        html: "<h1 class=\"text-5xl text-gray-700 mt-4\" style=\"font-family: Bebas Neue\">JOINING<a class=\"text-yellow-400\"> </a>GAME</h1>\n" +
            "<div class=\"mt-4 flex w-full max-w-sm mx-auto space-x-3 shadow-md\">\n" +
            "    <input\n" +
            "        class=\"text-center flex-1 appearance-none border border-transparent w-full py-2 px-10 bg-white text-gray-700 placeholder-gray-400 rounded-sm text-base border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500\"\n" +
            "        type=\"text\" id=\"game_slug\" placeholder=\"Please enter a game code\">\n" +
            "</div>",
        showCancelButton: true,
        confirmButtonColor: '#fbbf24',
        cancelButtonColor: '#374151',
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Join'
    }).then((result) => {
        if (result.isConfirmed) {
            //Get game slug from input
            let passed_slug = document.getElementById("game_slug").value;
            //Input validation
            if (passed_slug !== "" && /^[a-z-]+$/.test(passed_slug)) {
                socket.emit('check-slug', {
                    slug: passed_slug
                });
            } else {
                invalid_game_slug();
            }
        }
    })
}

//Invalid game slug
function invalid_game_slug() {
    Swal.fire({
        html: "<h1 class=\"text-4xl text-gray-700 mt-3\" style=\"font-family: Bebas Neue\">JOINING<a class=\"text-yellow-400\"> </a>GAME</h1>\n" +
            "<div class=\"my-3 flex w-full max-w-sm mx-auto space-x-3 shadow-md\">\n" +
            "    <input\n" +
            "        class=\"text-center flex-1 appearance-none border border-transparent w-full py-2 px-10 bg-white text-gray-700 placeholder-gray-400 rounded-sm text-base border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500\"\n" +
            "        type=\"text\" id=\"game_slug\" placeholder=\"Please enter a game code\">\n" +
            "</div>",
        showCancelButton: true,
        confirmButtonColor: '#fbbf24',
        cancelButtonColor: '#374151',
        cancelButtonText: 'Spectate',
        confirmButtonText: 'Join Game',
        icon: "error"
    }).then((result) => {
        if (result.isConfirmed) {
            //Get game slug from input
            let passed_slug = document.getElementById("game_slug").value;
            //Input validation
            if (passed_slug !== "" && /^[a-z-]+$/.test(passed_slug)) {
                socket.emit('check-slug', {
                    slug: passed_slug
                });
            } else {
                invalid_game_slug();
            }
        }
    })
}

//Handle incoming slug response
socket.on("slug-response", function (data) {
    console.log(data);
    if (data === false) {
        invalid_game_slug();
    } else {
        window.location.href = "/game/" + data;
    }
});
