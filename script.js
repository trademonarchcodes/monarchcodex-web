/* =========================================
   MONARCH CODEX
   SUPABASE + MAIN JAVASCRIPT
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       SUPABASE CONNECTION
       ========================================= */

    const SUPABASE_URL =
        "https://avaworleivncevaoqeny.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );


    /* =========================================
       MOBILE MENU
       ========================================= */

    const menuToggle =
        document.getElementById("menuToggle");

    const navMenu =
        document.getElementById("navMenu");


    if (menuToggle && navMenu) {

        menuToggle.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

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

            }
        );


        const navLinks =
            navMenu.querySelectorAll("a");


        navLinks.forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    navMenu.classList.remove("active");

                    menuToggle.innerHTML = "☰";

                    menuToggle.setAttribute(
                        "aria-label",
                        "Open navigation"
                    );

                }
            );

        });

    }


    /* =========================================
       CLOSE MOBILE MENU OUTSIDE
       ========================================= */

    document.addEventListener(
        "click",
        function (event) {

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

        }
    );


    /* =========================================
       REGISTRATION
       ========================================= */

    const registrationForm =
        document.getElementById("registrationForm");

    const registrationMessage =
        document.getElementById("registrationMessage");


    if (registrationForm) {

        registrationForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                /* ---------------------------------
                   GET FORM VALUES
                   --------------------------------- */

                const fullname =
                    document
                        .getElementById("fullname")
                        .value
                        .trim();


                const email =
                    document
                        .getElementById("email")
                        .value
                        .trim();


                const phone =
                    document
                        .getElementById("phone")
                        .value
                        .trim();


                const password =
                    document
                        .getElementById("password")
                        .value;


                /* ---------------------------------
                   BASIC VALIDATION
                   --------------------------------- */

                if (!fullname || !email || !phone || !password) {

                    showMessage(
                        "Please complete all fields.",
                        "error"
                    );

                    return;

                }


                if (password.length < 6) {

                    showMessage(
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;

                }


                /* ---------------------------------
                   DISABLE BUTTON
                   --------------------------------- */

                const submitButton =
                    registrationForm.querySelector(
                        "button[type='submit']"
                    );


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "CREATING ACCOUNT...";

                }


                showMessage(
                    "Creating your Monarch Codex account...",
                    "loading"
                );


                try {

                    /* ---------------------------------
                       CREATE SUPABASE AUTH ACCOUNT
                       --------------------------------- */

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth.signUp({

                            email: email,

                            password: password,

                            options: {

                                data: {

                                    full_name: fullname,

                                    phone: phone

                                },

                                emailRedirectTo:
                                    window.location.origin

                            }

                        });


                    /* ---------------------------------
                       HANDLE ERROR
                       --------------------------------- */

                    if (error) {

                        console.error(
                            "Supabase registration error:",
                            error
                        );

                        showMessage(
                            error.message,
                            "error"
                        );

                        return;

                    }


                    /* ---------------------------------
                       SUCCESS
                       --------------------------------- */

                    console.log(
                        "Registration successful:",
                        data
                    );


                    if (data.session) {

                        showMessage(
                            "Account created successfully! Welcome to Monarch Codex.",
                            "success"
                        );

                    } else {

                        showMessage(
                            "Account created! Please check your email to confirm your account before logging in.",
                            "success"
                        );

                    }


                    /* ---------------------------------
                       CLEAR FORM
                       --------------------------------- */

                    registrationForm.reset();


                } catch (error) {

                    console.error(
                        "Unexpected registration error:",
                        error
                    );


                    showMessage(
                        "Something went wrong. Please try again.",
                        "error"
                    );

                } finally {

                    /* ---------------------------------
                       ENABLE BUTTON
                       --------------------------------- */

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "CREATE ACCOUNT";

                    }

                }

            }
        );

    }


    /* =========================================
       FORM MESSAGE FUNCTION
       ========================================= */

    function showMessage(message, type) {

        if (!registrationMessage) {
            return;
        }


        registrationMessage.textContent =
            message;


        registrationMessage.className =
            "form-message " + type;

    }

});