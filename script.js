/* =========================================
   MONARCH CODEX
   SUPABASE AUTHENTICATION
   LOGIN + REGISTRATION + DASHBOARD
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
       ELEMENTS
       ========================================= */

    const menuToggle =
        document.getElementById("menuToggle");

    const navMenu =
        document.getElementById("navMenu");

    const registrationForm =
        document.getElementById("registrationForm");

    const loginForm =
        document.getElementById("loginForm");

    const registrationMessage =
        document.getElementById("registrationMessage");

    const loginMessage =
        document.getElementById("loginMessage");

    const dashboard =
        document.getElementById("dashboard");

    const memberName =
        document.getElementById("memberName");

    const memberEmail =
        document.getElementById("memberEmail");

    const accountStatus =
        document.getElementById("accountStatus");

    const logoutButton =
        document.getElementById("logoutButton");


    /* =========================================
       MOBILE MENU
       ========================================= */

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
       CLOSE MENU WHEN CLICKING OUTSIDE
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

    if (registrationForm) {

        registrationForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


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


                if (
                    !fullname ||
                    !email ||
                    !phone ||
                    !password
                ) {

                    showRegistrationMessage(
                        "Please complete all fields.",
                        "error"
                    );

                    return;

                }


                if (password.length < 6) {

                    showRegistrationMessage(
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;

                }


                const submitButton =
                    registrationForm.querySelector(
                        "button[type='submit']"
                    );


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "CREATING ACCOUNT...";

                }


                showRegistrationMessage(
                    "Creating your Monarch Codex account...",
                    "loading"
                );


                try {

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


                    if (error) {

                        console.error(
                            "Registration error:",
                            error
                        );

                        showRegistrationMessage(
                            error.message,
                            "error"
                        );

                        return;

                    }


                    console.log(
                        "Registration successful:",
                        data
                    );


                    registrationForm.reset();


                    if (data.session) {

                        showRegistrationMessage(
                            "Account created successfully! You are now logged in.",
                            "success"
                        );

                        await loadDashboard();

                    } else {

                        showRegistrationMessage(
                            "Account created! Please check your email and confirm your account before logging in.",
                            "success"
                        );

                    }

                } catch (error) {

                    console.error(
                        "Unexpected registration error:",
                        error
                    );

                    showRegistrationMessage(
                        "Something went wrong. Please try again.",
                        "error"
                    );

                } finally {

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
       LOGIN
       ========================================= */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const email =
                    document
                        .getElementById("loginEmail")
                        .value
                        .trim();


                const password =
                    document
                        .getElementById("loginPassword")
                        .value;


                if (!email || !password) {

                    showLoginMessage(
                        "Please enter your email and password.",
                        "error"
                    );

                    return;

                }


                const submitButton =
                    loginForm.querySelector(
                        "button[type='submit']"
                    );


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "LOGGING IN...";

                }


                showLoginMessage(
                    "Checking your account...",
                    "loading"
                );


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth.signInWithPassword({

                            email: email,

                            password: password

                        });


                    if (error) {

                        console.error(
                            "Login error:",
                            error
                        );


                        showLoginMessage(
                            error.message,
                            "error"
                        );

                        return;

                    }


                    if (!data.session) {

                        showLoginMessage(
                            "Login could not be completed. Please try again.",
                            "error"
                        );

                        return;

                    }


                    showLoginMessage(
                        "Login successful. Welcome back, Monarch!",
                        "success"
                    );


                    loginForm.reset();


                    await loadDashboard();


                    /* Scroll to dashboard */

                    if (dashboard) {

                        setTimeout(
                            function () {

                                dashboard.scrollIntoView({
                                    behavior: "smooth"
                                });

                            },
                            300
                        );

                    }

                } catch (error) {

                    console.error(
                        "Unexpected login error:",
                        error
                    );


                    showLoginMessage(
                        "Something went wrong. Please try again.",
                        "error"
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "LOGIN";

                    }

                }

            }
        );

    }


    /* =========================================
       LOAD CURRENT SESSION
       ========================================= */

    async function checkCurrentSession() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.getSession();


            if (error) {

                console.error(
                    "Session error:",
                    error
                );

                return;

            }


            if (data.session) {

                await loadDashboard();

            }

        } catch (error) {

            console.error(
                "Could not check session:",
                error
            );

        }

    }


    /* =========================================
       LOAD DASHBOARD
       ========================================= */

    async function loadDashboard() {

        try {

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabaseClient.auth.getSession();


            if (
                sessionError ||
                !sessionData.session
            ) {

                hideDashboard();

                return;

            }


            const user =
                sessionData.session.user;


            /* ---------------------------------
               Get member profile
               --------------------------------- */

            const {
                data: profile,
                error: profileError
            } =
                await supabaseClient
                    .from("profiles")
                    .select(
                        "full_name, phone, role, status"
                    )
                    .eq("id", user.id)
                    .single();


            if (profileError) {

                console.error(
                    "Profile error:",
                    profileError
                );


                /*
                 * The account exists even if the
                 * profile has not loaded yet.
                 */

                if (memberName) {

                    memberName.textContent =
                        user.user_metadata?.full_name ||
                        "Monarch";

                }


                if (memberEmail) {

                    memberEmail.textContent =
                        user.email || "";

                }


                if (accountStatus) {

                    accountStatus.textContent =
                        "Account created";

                }

            } else {

                if (memberName) {

                    memberName.textContent =
                        profile.full_name ||
                        "Monarch";

                }


                if (memberEmail) {

                    memberEmail.textContent =
                        user.email || "";

                }


                if (accountStatus) {

                    accountStatus.textContent =
                        formatStatus(profile.status);

                }

            }


            showDashboard();


        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

        }

    }


    /* =========================================
       SHOW DASHBOARD
       ========================================= */

    function showDashboard() {

        if (dashboard) {

            dashboard.style.display =
                "block";

        }

    }


    /* =========================================
       HIDE DASHBOARD
       ========================================= */

    function hideDashboard() {

        if (dashboard) {

            dashboard.style.display =
                "none";

        }

    }


    /* =========================================
       LOGOUT
       ========================================= */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                logoutButton.disabled = true;

                logoutButton.textContent =
                    "LOGGING OUT...";


                try {

                    const {
                        error
                    } =
                        await supabaseClient.auth.signOut();


                    if (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                        alert(
                            "Unable to log out. Please try again."
                        );

                        return;

                    }


                    hideDashboard();


                    window.location.hash =
                        "#login";


                    window.location.reload();

                } catch (error) {

                    console.error(
                        "Unexpected logout error:",
                        error
                    );

                    alert(
                        "Something went wrong while logging out."
                    );

                } finally {

                    logoutButton.disabled = false;

                    logoutButton.textContent =
                        "LOGOUT";

                }

            }
        );

    }


    /* =========================================
       AUTH STATE LISTENER
       ========================================= */

    supabaseClient.auth.onAuthStateChange(
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                loadDashboard();

            } else {

                hideDashboard();

            }

        }
    );


    /* =========================================
       FORMAT ACCOUNT STATUS
       ========================================= */

    function formatStatus(status) {

        if (!status) {

            return "Pending";

        }


        switch (status) {

            case "active":

                return "Active";

            case "blocked":

                return "Blocked";

            case "pending":

                return "Pending verification";

            default:

                return status;

        }

    }


    /* =========================================
       REGISTRATION MESSAGE
       ========================================= */

    function showRegistrationMessage(
        message,
        type
    ) {

        if (!registrationMessage) {
            return;
        }


        registrationMessage.textContent =
            message;


        registrationMessage.className =
            "form-message " + type;

    }


    /* =========================================
       LOGIN MESSAGE
       ========================================= */

    function showLoginMessage(
        message,
        type
    ) {

        if (!loginMessage) {
            return;
        }


        loginMessage.textContent =
            message;


        loginMessage.className =
            "form-message " + type;

    }


    /* =========================================
       START
       ========================================= */

    checkCurrentSession();

});