/*\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
Filename : exploding-chickens/public/js/home.js
Desc     : handles socket.io connection
           related to site wide statistics and modals
Author(s): RAk3rman
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\*/

//Open sample modal
function sample_modal() {
    Swal.fire({
        html: "<form class=method=\"POST\">\n" +
            "                    <!-- Email Input -->\n" +
            "                    <label for=\"code\" class=\"block mt-3 text-left text-xl font-bold text-gray-600\">Joining Lobby\n" +
            "                        </label>\n" +
            "                    <input id=\"code\" type=\"text\" name=\"code\" placeholder=\"enter-a-code\" autocomplete=\"text\" class=\"block w-full py-3 px-1 my-1\n" +
            "                    text-gray-800 appearance-none \n" +
            "                    border-b-2 border-gray-100\n" +
            "                    focus:text-gray-500 focus:outline-none focus:border-gray-200\" required maxlength=\"60\"\n" +
            "                        pattern=\"[a-z]*-[a-z]*-[a-z]*\" />\n" +
            "\n",
        showCancelButton: true,
        cancelButtonColor: '#374151',
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Confirm'
    }).then((result) => {
        if (result.isConfirmed) {
            //Validate input
            let code = document.getElementById("code").value;
            var letters = /^[A-Za-z]/;
            if (code.match(letters)) {
                Swal.fire(
                    'Deleted!',
                    'Your file has been deleted.',
                    'success'
                )
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Invalid code!',
                    footer: '<a href>Make sure your code is in a three-word format with dashes.</a>'
                })
            }
        }
    })
}
