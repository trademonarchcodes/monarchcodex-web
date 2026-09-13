/* =========================================================
   MONARCH CODEX — MEMBER DASHBOARD
   dashboard.js
   PART 1/4 — SUPABASE + AUTH + PROFILE + NAVIGATION
   ========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "https://avaworleivncevaoqeny.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";


/* =========================================================
   CREATE SUPABASE CLIENT
   ========================================================= */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;

let currentProfile = null;

let selectedPackage = null;

let selectedPaymentMethod = null;

let selectedCryptoNetwork = null;


/* =========================================================
   SHORT DOM HELPER
   ========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   SET TEXT SAFELY
   ========================================================= */

function setText(id, value) {

    const element = getElement(id);

    if (!element) return;

    element.textContent =
        value === null ||
        value === undefined ||
        value === ""
            ? "—"
            : value;
}


/* =========================================================
   SHOW / HIDE ELEMENT
   ========================================================= */

function showElement(id) {

    const element = getElement(id);

    if (element) {
        element.style.display = "";
    }
}


function hideElement(id) {

    const element = getElement(id);

    if (element) {
        element.style.display = "none";
    }
}


/* =========================================================
   LOADING SCREEN
   ========================================================= */

function showLoading(message) {

    const loading = getElement("appLoading");

    const loadingMessage =
        getElement("loadingMessage");

    if (loading) {
        loading.style.display = "flex";
    }

    if (loadingMessage) {
        loadingMessage.textContent =
            message || "Securing your member dashboard…";
    }
}


function hideLoading() {

    const loading = getElement("appLoading");

    if (loading) {
        loading.style.display = "none";
    }
}


/* =========================================================
   AUTH ERROR
   ========================================================= */

function showAuthError(message) {

    const loading = getElement("appLoading");

    const shell = getElement("appShell");

    const error = getElement("authError");

    const errorMessage =
        getElement("authErrorMessage");

    if (loading) {
        loading.style.display = "none";
    }

    if (shell) {
        shell.style.display = "none";
    }

    if (error) {
        error.style.display = "flex";
    }

    if (errorMessage) {
        errorMessage.textContent =
            message ||
            "We could not secure your member session.";
    }
}


/* =========================================================
   SHOW APPLICATION
   ========================================================= */

function showApplication() {

    const loading = getElement("appLoading");

    const error = getElement("authError");

    const shell = getElement("appShell");

    if (loading) {
        loading.style.display = "none";
    }

    if (error) {
        error.style.display = "none";
    }

    if (shell) {
        shell.style.display = "block";
    }
}


/* =========================================================
   GET CURRENT AUTH USER
   ========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(
            "Authentication error:",
            error
        );

        throw error;
    }

    return data.user;
}


/* =========================================================
   LOAD MEMBER PROFILE
   ========================================================= */

async function loadCurrentProfile(userId) {

    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        throw error;
    }

    return data;
}


/* =========================================================
   GET MEMBER INITIALS
   ========================================================= */

function getInitials(name) {

    if (!name) {
        return "M";
    }

    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   LOAD PROFILE INTO DASHBOARD
   ========================================================= */

function renderProfile(profile) {

    if (!profile) {
        return;
    }

    const fullName =
        profile.full_name ||
        currentUser?.email ||
        "Member";

    const email =
        currentUser?.email ||
        "—";

    const phone =
        profile.phone ||
        "—";

    const role =
        profile.role ||
        "member";

    const status =
        profile.status ||
        "pending";

    const initials =
        getInitials(fullName);


    /* ---------------------------------------------
       SIDEBAR
       --------------------------------------------- */

    setText(
        "sidebarMemberInitial",
        initials
    );

    setText(
        "sidebarMemberName",
        fullName
    );


    /* ---------------------------------------------
       HEADER
       --------------------------------------------- */

    setText(
        "headerMemberName",
        fullName
    );


    /* ---------------------------------------------
       OVERVIEW
       --------------------------------------------- */

    setText(
        "overviewInitial",
        initials
    );

    setText(
        "overviewName",
        fullName
    );

    setText(
        "overviewEmail",
        email
    );

    setText(
        "overviewPhone",
        phone
    );


    /* ---------------------------------------------
       PROFILE SECTION
       --------------------------------------------- */

    setText(
        "profileInitial",
        initials
    );

    setText(
        "profileName",
        fullName
    );

    setText(
        "profileFullName",
        fullName
    );

    setText(
        "profileEmail",
        email
    );

    setText(
        "profilePhone",
        phone
    );

    setText(
        "profileRole",
        role
    );

    setText(
        "profileAccountStatus",
        status
    );


    /* ---------------------------------------------
       PROFILE STATUS
       --------------------------------------------- */

    setText(
        "profileStatus",
        status
    );

    setText(
        "accountStatus",
        status
    );


    /* ---------------------------------------------
       CREATED DATE
       --------------------------------------------- */

    if (profile.created_at) {

        const date =
            new Date(profile.created_at);

        if (!Number.isNaN(date.getTime())) {

            setText(
                "profileCreatedAt",
                date.toLocaleDateString(
                    undefined,
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                )
            );
        }
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-section]"
        );

    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );


    navItems.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const target =
                    button.dataset.section;

                if (!target) {
                    return;
                }


                /* Remove active navigation */

                navItems.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );
                    }
                );


                /* Activate clicked navigation */

                button.classList.add(
                    "active"
                );


                /* Hide all sections */

                sections.forEach(
                    function (section) {

                        section.classList.remove(
                            "active-section"
                        );
                    }
                );


                /* Show selected section */

                const targetSection =
                    getElement(
                        "section-" + target
                    );

                if (targetSection) {

                    targetSection.classList.add(
                        "active-section"
                    );
                }


                /* Close mobile sidebar */

                closeMobileSidebar();


                /* Scroll to top */

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );
    });
}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function initializeMobileSidebar() {

    const menuButton =
        getElement("mobileMenuBtn");

    const sidebar =
        document.querySelector(
            ".dashboard-sidebar"
        );

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            function () {

                if (sidebar) {
                    sidebar.classList.toggle(
                        "open"
                    );
                }

                if (overlay) {
                    overlay.classList.toggle(
                        "show"
                    );
                }
            }
        );
    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileSidebar
        );
    }
}


/* =========================================================
   CLOSE MOBILE SIDEBAR
   ========================================================= */

function closeMobileSidebar() {

    const sidebar =
        document.querySelector(
            ".dashboard-sidebar"
        );

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );
    }

    if (overlay) {

        overlay.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutMember() {

    try {

        const {
            error
        } = await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to log out right now. Please try again."
        );
    }
}


/* =========================================================
   INITIALIZE LOGOUT BUTTON
   ========================================================= */

function initializeLogout() {

    const logoutButton =
        getElement("logoutBtn");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        logoutMember
    );
}


/* =========================================================
   RETURN TO LOGIN
   ========================================================= */

function initializeReturnLogin() {

    const button =
        getElement("returnLoginBtn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            window.location.href =
                "index.html";
        }
    );
}


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeDashboard() {

    try {

        showLoading(
            "Securing your member dashboard…"
        );


        /* ---------------------------------------------
           CHECK AUTHENTICATION
           --------------------------------------------- */

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            showAuthError(
                "Please log in to access your member dashboard."
            );

            return;
        }


        /* ---------------------------------------------
           LOAD PROFILE
           --------------------------------------------- */

        currentProfile =
            await loadCurrentProfile(
                currentUser.id
            );


        if (!currentProfile) {

            showAuthError(
                "Your member profile could not be found. Please contact the administrator."
            );

            return;
        }


        /* ---------------------------------------------
           RENDER PROFILE
           --------------------------------------------- */

        renderProfile(
            currentProfile
        );


        /* ---------------------------------------------
           NAVIGATION
           --------------------------------------------- */

        initializeNavigation();

        initializeMobileSidebar();

        initializeLogout();

        initializeReturnLogin();


        /* ---------------------------------------------
           SHOW DASHBOARD
           --------------------------------------------- */

        showApplication();


        console.log(
            "MONARCH CODEX dashboard initialized successfully."
        );

    } catch (error) {

        console.error(
            "Dashboard initialization failed:",
            error
        );

                showAuthError(
            "Unable to load your member dashboard. Please try again."
        );
    }
}


/* =========================================================
   START DASHBOARD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeDashboard();

    }
);