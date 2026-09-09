/* =========================================
   MONARCH CODEX
   MAIN JAVASCRIPT
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* ================================
       MOBILE MENU
       ================================ */

    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", function () {

            navMenu.classList.toggle("active");

            if (navMenu.classList.contains("active")) {

                menuToggle.innerHTML = "✕";

                menuToggle.setAttribute(
                    "aria-label",
                    "Close navigation"
                );

            } else {

                menuToggle.innerHTML = "☰";

                menuToggle.setAttribute(
                    "aria-label",
                    "Open navigation"
                );

            }

        });


        /* Close menu when a navigation link is clicked */

        const navLinks = navMenu.querySelectorAll("a");

        navLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                navMenu.classList.remove("active");

                menuToggle.innerHTML = "☰";

                menuToggle.setAttribute(
                    "aria-label",
                    "Open navigation"
                );

            });

        });

    }


    /* ================================
       CLOSE MENU WHEN CLICKING OUTSIDE
       ================================ */

    document.addEventListener("click", function (event) {

        if (!menuToggle || !navMenu) {
            return;
        }

        const clickedInsideMenu =
            navMenu.contains(event.target);

        const clickedToggle =
            menuToggle.contains(event.target);

        if (
            !clickedInsideMenu &&
            !clickedToggle &&
            navMenu.classList.contains("active")
        ) {

            navMenu.classList.remove("active");

            menuToggle.innerHTML = "☰";

            menuToggle.setAttribute(
                "aria-label",
                "Open navigation"
            );

        }

    });


    /* ================================
       REGISTRATION FORM
       TEMPORARY HANDLER
       ================================ */

    const registrationForm =
        document.getElementById("registrationForm");

    if (registrationForm) {

        registrationForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                alert(
                    "Monarch Codex registration will be connected to the secure database soon."
                );

            }
        );

    }

});
