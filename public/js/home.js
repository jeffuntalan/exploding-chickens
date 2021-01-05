/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/home.js
Desc     : handles socket.io connection
           related to site wide statistics and modals
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Open sample modal
function sample_modal() {
    Swal.fire({
        html: "<h2 class=\"mt-3 py-50 text-center font-semibold text-3xl lg:text-4xl text-gray-800\">\n" +
            "                    Join A Lobby\n" +
            "                </h2>\n" +
            "\n" +
            "                <form class=\"mt-10\" method=\"POST\">\n" +
            "                    <!-- Email Input -->\n" +
            "                    <label for=\"code\" class=\"block text-xs font-semibold text-gray-600 uppercase\">Code\n" +
            "                        (word-word-word)</label>\n" +
            "                    <input id=\"code\" type=\"text\" name=\"code\" placeholder=\"enter-a-code\" autocomplete=\"text\" class=\"block w-full py-3 px-1 mt-2 \n" +
            "                    text-gray-800 appearance-none \n" +
            "                    border-b-2 border-gray-100\n" +
            "                    focus:text-gray-500 focus:outline-none focus:border-gray-200\" required maxlength=\"60\"\n" +
            "                        pattern=\"[a-z]*-[a-z]*-[a-z]*\" />\n" +
            "\n" +
            "                    <!-- Auth Buttton -->\n" +
            "                    <button type=\"submit\" class=\"w-full py-3 mt-10 bg-gray-800 rounded-sm\n" +
            "                    font-medium text-white uppercase\n" +
            "                    focus:outline-none hover:bg-gray-700 hover:shadow-none\">\n" +
            "                        Play\n" +
            "                    </button>\n" +
            "                </form>",
        showCancelButton: true,
        cancelButtonColor: '#374151',
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Confirm'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire(
                'Deleted!',
                'Your file has been deleted.',
                'success'
            )
        }
    })
}
