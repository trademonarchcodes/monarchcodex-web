/* =========================================
   MONARCH CODEX MEMBER DASHBOARD
   DASHBOARD.JS — PART 1
========================================= */


/* =========================================
   SUPABASE CONFIGURATION
========================================= */

const SUPABASE_URL =
    "https://avaworleivncevaoqeny.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* =========================================
   GLOBAL VARIABLES
========================================= */

let currentUser = null;
let currentProfile = null;

let selectedPackage = null;
let selectedPaymentMethod = null;
let selectedCryptoNetwork = null;


/* =========================================
   DOM HELPERS
========================================= */

function getElement(id) {
    return document.getElementById(id);
}

function showElement(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}

function hideElement(element) {
    if (element) {
        element.classList.add("hidden");
    }
}


/* =========================================
   SECURITY / FORMATTING HELPERS
========================================= */

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const div = document.createElement("div");
    div.textContent = String(value);

    return div.innerHTML;
}


function formatCurrency(amount) {
    const number = Number(amount || 0);

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    }).format(number);
}


function formatDate(dateValue) {
    if (!dateValue) {
        return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


/* =========================================
   LOADING / ERROR HANDLING
========================================= */

function setLoadingMessage(message) {
    const loadingMessage =
        getElement("loadingMessage");

    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}


function showAuthError(message) {
    const appLoading =
        getElement("appLoading");

    const appShell =
        getElement("appShell");

    const authError =
        getElement("authError");

    const authErrorMessage =
        getElement("authErrorMessage");

    if (appLoading) {
        appLoading.classList.add("hidden");
    }

    if (appShell) {
        appShell.classList.add("hidden");
    }

    if (authErrorMessage) {
        authErrorMessage.textContent = message;
    }

    if (authError) {
        authError.classList.remove("hidden");
    }
}


function showDashboard() {
    const appLoading =
        getElement("appLoading");

    const appShell =
        getElement("appShell");

    const authError =
        getElement("authError");

    if (appLoading) {
        appLoading.classList.add("hidden");
    }

    if (authError) {
        authError.classList.add("hidden");
    }

    if (appShell) {
        appShell.classList.remove("hidden");
    }
}


/* =========================================
   GET CURRENT USER
========================================= */

async function getCurrentUser() {
    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data || !data.user) {
        throw new Error(
            "No authenticated user found."
        );
    }

    return data.user;
}


/* =========================================
   LOAD MEMBER PROFILE
========================================= */

async function loadCurrentProfile() {
    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        throw error;
    }

    currentProfile = data;

    return data;
}


/* =========================================
   GET INITIALS
========================================= */

function getInitials(name) {
    if (!name) {
        return "M";
    }

    const parts = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* =========================================
   RENDER PROFILE INFORMATION
========================================= */

function renderProfile() {
    if (!currentProfile) {
        return;
    }

    const name =
        currentProfile.full_name || "Member";

    const phone =
        currentProfile.phone || "Not provided";

    const role =
        currentProfile.role || "member";

    const status =
        currentProfile.status || "pending";

    const initials =
        getInitials(name);


    /* SIDEBAR */

    const sidebarInitial =
        getElement("sidebarMemberInitial");

    const sidebarName =
        getElement("sidebarMemberName");

    if (sidebarInitial) {
        sidebarInitial.textContent = initials;
    }

    if (sidebarName) {
        sidebarName.textContent = name;
    }


    /* HEADER */

    const headerName =
        getElement("headerMemberName");

    if (headerName) {
        headerName.textContent = name;
    }


    /* OVERVIEW */

    const overviewInitial =
        getElement("overviewInitial");

    const overviewName =
        getElement("overviewName");

    const overviewFullName =
        getElement("overviewFullName");

    const overviewEmail =
        getElement("overviewEmail");

    const overviewPhone =
        getElement("overviewPhone");

    const overviewUid =
        getElement("overviewUid");


    if (overviewInitial) {
        overviewInitial.textContent = initials;
    }

    if (overviewName) {
        overviewName.textContent = name;
    }

    if (overviewFullName) {
        overviewFullName.textContent = name;
    }

    if (overviewEmail) {
        overviewEmail.textContent =
            currentUser.email || "—";
    }

    if (overviewPhone) {
        overviewPhone.textContent = phone;
    }

    if (overviewUid) {
        overviewUid.textContent =
            currentProfile.uid || "—";
    }


    /* PROFILE */

    const profileInitial =
        getElement("profileInitial");

    const profileName =
        getElement("profileName");

    const profileRole =
        getElement("profileRole");

    const profileStatus =
        getElement("profileStatus");

    const profileFullName =
        getElement("profileFullName");

    const profileEmail =
        getElement("profileEmail");

    const profilePhone =
        getElement("profilePhone");

    const profileUid =
        getElement("profileUid");

    const profileRoleDetails =
        getElement("profileRoleDetails");

    const profileAccountStatus =
        getElement("profileAccountStatus");

    const profileCreatedAt =
        getElement("profileCreatedAt");


    if (profileInitial) {
        profileInitial.textContent = initials;
    }

    if (profileName) {
        profileName.textContent = name;
    }

    if (profileRole) {
        profileRole.textContent = role;
    }

    if (profileStatus) {
        profileStatus.textContent = status;
    }

    if (profileFullName) {
        profileFullName.textContent = name;
    }

    if (profileEmail) {
        profileEmail.textContent =
            currentUser.email || "—";
    }

    if (profilePhone) {
        profilePhone.textContent = phone;
    }

    if (profileUid) {
        profileUid.textContent =
            currentProfile.uid || "—";
    }

    if (profileRoleDetails) {
        profileRoleDetails.textContent = role;
    }

    if (profileAccountStatus) {
        profileAccountStatus.textContent = status;
    }

    if (profileCreatedAt) {
        profileCreatedAt.textContent =
            formatDate(currentProfile.created_at);
    }


    /* ACCOUNT STATUS */

    const accountStatus =
        getElement("accountStatus");

    if (accountStatus) {
        accountStatus.textContent =
            status.charAt(0).toUpperCase() +
            status.slice(1);
    }
}

/* =========================================
   NAVIGATION
========================================= */

function switchSection(sectionName) {
    const sections = document.querySelectorAll(
        ".dashboard-section"
    );

    sections.forEach(function (section) {
        section.classList.remove("active-section");
    });

    const targetSection =
        getElement(sectionName + "Section");

    if (targetSection) {
        targetSection.classList.add("active-section");
    }

    const navItems =
        document.querySelectorAll(".nav-item");

    navItems.forEach(function (item) {
        item.classList.remove("active");

        if (item.dataset.section === sectionName) {
            item.classList.add("active");
        }
    });

    closeMobileSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================
   NAVIGATION EVENTS
========================================= */

function initializeNavigation() {
    document
        .querySelectorAll(".nav-item")
        .forEach(function (item) {

            item.addEventListener("click", function () {
                switchSection(
                    this.dataset.section
                );
            });
        });


    document
        .querySelectorAll("[data-section-target]")
        .forEach(function (button) {

            button.addEventListener("click", function () {
                switchSection(
                    this.dataset.sectionTarget
                );
            });
        });
}


/* =========================================
   MOBILE SIDEBAR
========================================= */

function openMobileSidebar() {
    const sidebar =
        getElement("sidebar");

    if (sidebar) {
        sidebar.classList.add("mobile-open");
    }
}


function closeMobileSidebar() {
    const sidebar =
        getElement("sidebar");

    if (sidebar) {
        sidebar.classList.remove("mobile-open");
    }
}


function initializeMobileMenu() {
    const menuButton =
        getElement("mobileMenuBtn");

    if (menuButton) {
        menuButton.addEventListener(
            "click",
            function () {

                const sidebar =
                    getElement("sidebar");

                if (!sidebar) {
                    return;
                }

                sidebar.classList.toggle(
                    "mobile-open"
                );
            }
        );
    }
}


/* =========================================
   LOGOUT
========================================= */

async function logoutUser() {
    try {
        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.href = "login.html";

    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to log out. Please try again."
        );
    }
}


function initializeLogout() {
    const logoutButton =
        getElement("logoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logoutUser
        );
    }

    const returnLoginButton =
        getElement("returnLoginBtn");

    if (returnLoginButton) {
        returnLoginButton.addEventListener(
            "click",
            function () {
                window.location.href =
                    "login.html";
            }
        );
    }
}


/* =========================================
   DASHBOARD INITIALIZATION
========================================= */

async function initializeDashboard() {

    try {

        setLoadingMessage(
            "Checking your account..."
        );

        currentUser =
            await getCurrentUser();

        setLoadingMessage(
            "Loading your member profile..."
        );

        await loadCurrentProfile();

        renderProfile();

        initializeNavigation();
        initializeMobileMenu();
        initializeLogout();

        showDashboard();

        setLoadingMessage(
            "Loading dashboard..."
        );

        await loadPackages();

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

        showAuthError(
            "Unable to load your member dashboard. Please log in again."
        );
    }
}


/* =========================================
   START DASHBOARD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeDashboard();
    }
);