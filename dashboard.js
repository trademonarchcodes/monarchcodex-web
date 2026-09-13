/* =========================================================
   MONARCH CODEX — DASHBOARD CORE
   PART 1
   ========================================================= */

"use strict";

/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
    "https://avaworleivncevaoqeny.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   GLOBAL APPLICATION STATE
   ========================================================= */

window.MonarchCodex = {

    version: "1.0.0",

    supabase: supabaseClient,

    user: null,

    profile: null,

    modules: {},

    state: {},

    initialized: false

};


/* =========================================================
   MODULE REGISTRY
   ========================================================= */

window.MonarchCodex.registerModule = function (
    name,
    module
) {

    if (!name) {

        console.error(
            "MONARCH CODEX: Module name is required."
        );

        return;
    }


    if (
        typeof module !== "object" ||
        module === null
    ) {

        console.error(
            "MONARCH CODEX: Invalid module:",
            name
        );

        return;
    }


    if (
        window.MonarchCodex.modules[name]
    ) {

        console.warn(
            "MONARCH CODEX: Module already registered:",
            name
        );

        return;
    }


    window.MonarchCodex.modules[name] =
        module;


    console.log(
        "MONARCH CODEX: Module registered:",
        name
    );

};


/* =========================================================
   MODULE INITIALIZATION
   ========================================================= */

window.MonarchCodex.initializeModules =
    async function () {

        const modules =
            window.MonarchCodex.modules;


        for (
            const name of Object.keys(modules)
        ) {

            const module =
                modules[name];


            if (
                typeof module.init !== "function"
            ) {

                continue;
            }


            try {

                await module.init(
                    window.MonarchCodex
                );


                console.log(
                    "MONARCH CODEX: Module initialized:",
                    name
                );


            } catch (error) {

                console.error(
                    "MONARCH CODEX: Module initialization failed:",
                    name,
                    error
                );

            }

        }

    };


/* =========================================================
   SHARED UTILITIES
   ========================================================= */

window.MonarchCodex.utils = {

    escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";
        }


        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    },


    formatNumber(
        value,
        decimals = 2
    ) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number)
        ) {

            return "0.00";
        }


        return number.toLocaleString(
            "en-US",
            {
                minimumFractionDigits:
                    decimals,

                maximumFractionDigits:
                    decimals
            }
        );

    },


    formatMoney(
        value,
        decimals = 2
    ) {

        return "$" +
            this.formatNumber(
                value,
                decimals
            );

    },


    formatDate(value) {

        if (!value) {

            return "—";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";
        }


        return date.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    },


    setLoadingMessage(message) {

        const element =
            document.getElementById(
                "loadingMessage"
            );


        if (element) {

            element.textContent =
                message;

        }

    }

};


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getUser();


    if (error) {

        console.error(
            "Authentication error:",
            error
        );

        return null;
    }


    return data?.user || null;

}


/* =========================================================
   PROFILE LOADING
   ========================================================= */

async function loadCurrentProfile(
    userId
) {

    const {
        data,
        error
    } =
        await supabaseClient
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
   SHOW APPLICATION
   ========================================================= */

function showApplication() {

    const loading =
        document.getElementById(
            "appLoading"
        );


    const shell =
        document.getElementById(
            "appShell"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (shell) {

        shell.style.display =
            "block";

    }

}


/* =========================================================
   SHOW AUTHENTICATION ERROR
   ========================================================= */

function showAuthenticationError(
    message
) {

    const loading =
        document.getElementById(
            "appLoading"
        );


    if (!loading) {

        return;
    }


    loading.innerHTML = `

        <div class="loading-box">

            <h1>
                MONARCH CODEX
            </h1>

            <p class="error-message">
                ${
                    window.MonarchCodex
                        .utils
                        .escapeHTML(
                            message
                        )
                }
            </p>

        </div>

    `;

}


/* =========================================================
   UPDATE BASIC MEMBER INFORMATION
   ========================================================= */

function updateMemberInformation() {

    const profile =
        window.MonarchCodex.profile;


    const user =
        window.MonarchCodex.user;


    const welcomeName =
        document.getElementById(
            "welcomeName"
        );


    const welcomeMessage =
        document.getElementById(
            "welcomeMessage"
        );


    if (!profile) {

        if (welcomeName) {

            welcomeName.textContent =
                "Welcome";

        }


        if (welcomeMessage) {

            welcomeMessage.textContent =
                "Your dashboard is ready.";

        }


        return;

    }


    const name =
        profile.full_name ||
        profile.name ||
        user?.email ||
        "Member";


    if (welcomeName) {

        welcomeName.textContent =
            "Welcome, " + name;

    }


    if (welcomeMessage) {

        welcomeMessage.textContent =
            "Your MONARCH CODEX member dashboard is ready.";

    }

}


/* =========================================================
   CORE INITIALIZATION
   ========================================================= */

async function initializeMonarchCodex() {

    try {

        window.MonarchCodex.utils
            .setLoadingMessage(
                "Checking your account..."
            );


        const user =
            await getCurrentUser();


        if (!user) {

            showAuthenticationError(
                "You are not logged in. Please return to the login page."
            );

            return;
        }


        window.MonarchCodex.user =
            user;


        window.MonarchCodex.utils
            .setLoadingMessage(
                "Loading your profile..."
            );


        const profile =
            await loadCurrentProfile(
                user.id
            );


        window.MonarchCodex.profile =
            profile;


        updateMemberInformation();


        showApplication();


        window.MonarchCodex.utils
            .setLoadingMessage(
                "Loading dashboard modules..."
            );


        await window.MonarchCodex
            .initializeModules();


        window.MonarchCodex.initialized =
            true;


        console.log(
            "MONARCH CODEX dashboard initialized."
        );


    } catch (error) {

        console.error(
            "MONARCH CODEX dashboard initialization failed:",
            error
        );


        showAuthenticationError(
            "We could not load your dashboard. Please refresh and try again."
        );

    }

}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        console.log(
            "MONARCH CODEX auth event:",
            event
        );


        if (
            event === "SIGNED_OUT"
        ) {

            window.location.href =
                "index.html";

        }

    }
);


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMonarchCodex();

    }
);

/* =========================================================
   MONARCH CODEX — MODULE NAVIGATION CONTROLLER
   ========================================================= */

(function () {

    "use strict";

    let activeModule = "overview";


    /* =====================================================
       SHOW DASHBOARD MODULE
       ===================================================== */

    function showDashboardModule(moduleName) {

        if (!moduleName) {
            moduleName = "overview";
        }


        const panels =
            document.querySelectorAll(
                "[data-module-panel]"
            );


        const buttons =
            document.querySelectorAll(
                "[data-module]"
            );


        let moduleExists = false;


        panels.forEach(function (panel) {

            const panelName =
                panel.getAttribute(
                    "data-module-panel"
                );


            if (panelName === moduleName) {

                panel.classList.add("active");

                panel.removeAttribute(
                    "hidden"
                );

                moduleExists = true;

            } else {

                panel.classList.remove("active");

                panel.setAttribute(
                    "hidden",
                    "hidden"
                );

            }

        });


        /* =================================================
           UPDATE NAVIGATION BUTTONS
           ================================================= */

        buttons.forEach(function (button) {

            const buttonModule =
                button.getAttribute(
                    "data-module"
                );


            if (
                buttonModule === moduleName &&
                moduleExists
            ) {

                button.classList.add("active");

                button.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                button.classList.remove("active");

                button.removeAttribute(
                    "aria-current"
                );

            }

        });


        /* =================================================
           FALLBACK TO OVERVIEW
           ================================================= */

        if (!moduleExists) {

            moduleName = "overview";


            panels.forEach(function (panel) {

                const panelName =
                    panel.getAttribute(
                        "data-module-panel"
                    );


                if (
                    panelName === "overview"
                ) {

                    panel.classList.add(
                        "active"
                    );

                    panel.removeAttribute(
                        "hidden"
                    );

                } else {

                    panel.classList.remove(
                        "active"
                    );

                    panel.setAttribute(
                        "hidden",
                        "hidden"
                    );

                }

            });


            buttons.forEach(function (button) {

                const buttonModule =
                    button.getAttribute(
                        "data-module"
                    );


                if (
                    buttonModule === "overview"
                ) {

                    button.classList.add(
                        "active"
                    );

                    button.setAttribute(
                        "aria-current",
                        "page"
                    );

                } else {

                    button.classList.remove(
                        "active"
                    );

                    button.removeAttribute(
                        "aria-current"
                    );

                }

            });

        }


        activeModule =
            moduleName;


        /* =================================================
           NOTIFY MODULE SYSTEM
           ================================================= */

        document.dispatchEvent(
            new CustomEvent(
                "monarch:module-change",
                {
                    detail: {
                        module:
                            activeModule
                    }
                }
            )
        );

    }


    /* =====================================================
       NAVIGATION CLICK HANDLER
       ===================================================== */

    function initializeModuleNavigation() {

        const navigation =
            document.getElementById(
                "dashboardNavigation"
            );


        if (!navigation) {
            return;
        }


        navigation.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-module]"
                    );


                if (!button) {
                    return;
                }


                const moduleName =
                    button.getAttribute(
                        "data-module"
                    );


                if (!moduleName) {
                    return;
                }


                event.preventDefault();


                showDashboardModule(
                    moduleName
                );

            }
        );


        /* Start on Overview */

        showDashboardModule(
            "overview"
        );

    }


    /* =====================================================
       PUBLIC DASHBOARD API
       ===================================================== */

    window.MonarchDashboard =
        window.MonarchDashboard || {};


    window.MonarchDashboard.navigation = {

        show:
            showDashboardModule,

        getActive:
            function () {
                return activeModule;
            },

        initialize:
            initializeModuleNavigation

    };


    /* =====================================================
       INITIALIZE
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeModuleNavigation
        );

    } else {

        initializeModuleNavigation();

    }

})();

/* =========================================================
   MONARCH CODEX — INVESTMENT PACKAGE MODULE
   ========================================================= */

(function () {

    "use strict";

    let investmentPackages = [];
    let selectedPackage = null;


    /* =====================================================
       ELEMENT HELPERS
       ===================================================== */

    function getPackagesGrid() {

        return document.getElementById(
            "packagesGrid"
        );

    }


    /* =====================================================
       FORMAT MONEY
       ===================================================== */

    function formatInvestmentAmount(amount) {

        const value =
            Number(amount);

        if (!Number.isFinite(value)) {

            return "$0.00";

        }

        return value.toLocaleString(
            "en-US",
            {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapePackageText(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       LOADING
       ===================================================== */

    function renderPackagesLoading() {

        const grid =
            getPackagesGrid();

        if (!grid) {

            return;

        }

        grid.innerHTML = `
            <div class="module-placeholder">
                Loading investment packages...
            </div>
        `;

    }


    /* =====================================================
       ERROR
       ===================================================== */

    function renderPackagesError(message) {

        const grid =
            getPackagesGrid();

        if (!grid) {

            return;

        }

        grid.innerHTML = `
            <div class="module-placeholder">
                ${escapePackageText(message)}
            </div>
        `;

    }


    /* =====================================================
       EMPTY
       ===================================================== */

    function renderPackagesEmpty() {

        const grid =
            getPackagesGrid();

        if (!grid) {

            return;

        }

        grid.innerHTML = `
            <div class="module-placeholder">
                No investment packages are currently available.
            </div>
        `;

    }


    /* =====================================================
       RENDER PACKAGES
       ===================================================== */

    function renderPackages(packages) {

        const grid =
            getPackagesGrid();

        if (!grid) {

            return;

        }


        if (
            !packages ||
            packages.length === 0
        ) {

            renderPackagesEmpty();

            return;

        }


        grid.innerHTML =
            packages.map(
                function (pkg) {

                    const name =
                        pkg.name ||
                        pkg.title ||
                        "Investment Package";

                    const amount =
                        Number(pkg.amount) || 0;

                    const description =
                        pkg.description ||
                        "Investment opportunity";

                    const duration =
                        pkg.duration ||
                        pkg.duration_days ||
                        "";

                    const profit =
                        pkg.profit_percentage ??
                        pkg.profit ??
                        null;


                    return `
                        <article
                            class="investment-package-card"
                            data-package-id="${escapePackageText(pkg.id)}"
                        >

                            <div class="package-card-content">

                                <h4 class="package-name">
                                    ${escapePackageText(name)}
                                </h4>

                                <div class="package-amount">
                                    ${formatInvestmentAmount(amount)}
                                </div>

                                <p class="package-description">
                                    ${escapePackageText(description)}
                                </p>

                                ${
                                    duration
                                    ? `
                                        <div class="package-detail">

                                            <span>
                                                Duration
                                            </span>

                                            <strong>
                                                ${escapePackageText(duration)}
                                            </strong>

                                        </div>
                                    `
                                    : ""
                                }

                                ${
                                    profit !== null
                                    ? `
                                        <div class="package-detail">

                                            <span>
                                                Profit
                                            </span>

                                            <strong>
                                                ${escapePackageText(profit)}%
                                            </strong>

                                        </div>
                                    `
                                    : ""
                                }

                                <button
                                    type="button"
                                    class="select-package-btn"
                                    data-select-package="${escapePackageText(pkg.id)}"
                                >
                                    Select Package
                                </button>

                            </div>

                        </article>
                    `;

                }
            ).join("");


        /* =================================================
           PACKAGE SELECTION
           ================================================= */

        grid.querySelectorAll(
            "[data-select-package]"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const packageId =
                            button.getAttribute(
                                "data-select-package"
                            );


                        selectInvestmentPackage(
                            packageId
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       SELECT PACKAGE
       ===================================================== */

    function selectInvestmentPackage(
        packageId
    ) {

        selectedPackage =
            investmentPackages.find(
                function (pkg) {

                    return String(pkg.id) ===
                        String(packageId);

                }
            ) || null;


        if (!selectedPackage) {

            return;

        }


        window.MonarchDashboard =
            window.MonarchDashboard || {};


        window.MonarchDashboard.investment =
            window.MonarchDashboard.investment || {};


        window.MonarchDashboard
            .investment
            .selectedPackage =
                selectedPackage;


        /* ---------------------------------------------
           Update selected package information
           --------------------------------------------- */

        const packageName =
            document.getElementById(
                "selectedPackageName"
            );


        const amountDisplay =
            document.getElementById(
                "investmentAmountDisplay"
            );


        const amountInput =
            document.getElementById(
                "investmentAmount"
            );


        const name =
            selectedPackage.name ||
            selectedPackage.title ||
            "Investment Package";


        const amount =
            Number(
                selectedPackage.amount
            ) || 0;


        if (packageName) {

            packageName.textContent =
                name;

        }


        if (amountDisplay) {

            amountDisplay.textContent =
                formatInvestmentAmount(
                    amount
                );

        }


        if (amountInput) {

            amountInput.value =
                amount;

        }


        /* ---------------------------------------------
           Show payment section
           --------------------------------------------- */

        const paymentSection =
            document.getElementById(
                "paymentSection"
            );


        if (paymentSection) {

            paymentSection.hidden =
                false;

        }


        /* ---------------------------------------------
           Scroll to payment section
           --------------------------------------------- */

        if (paymentSection) {

            paymentSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }


        /* ---------------------------------------------
           Notify other modules
           --------------------------------------------- */

        document.dispatchEvent(
            new CustomEvent(
                "monarch:package-selected",
                {
                    detail: {
                        package:
                            selectedPackage
                    }
                }
            )
        );

    }


    /* =====================================================
       LOAD PACKAGES FROM SUPABASE
       ===================================================== */

    async function loadInvestmentPackages() {

        const grid =
            getPackagesGrid();


        if (!grid) {

            return;

        }


        renderPackagesLoading();


        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            renderPackagesError(
                "Database connection is not available."
            );

            return;

        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("packages")
                    .select("*")
                    .eq(
                        "active",
                        true
                    )
                    .order(
                        "amount",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                console.error(
                    "Package loading error:",
                    error
                );


                renderPackagesError(
                    "Unable to load investment packages."
                );


                return;

            }


            investmentPackages =
                Array.isArray(data)
                    ? data
                    : [];


            renderPackages(
                investmentPackages
            );


            /* -----------------------------------------
               Make package data globally available
               ----------------------------------------- */

            window.MonarchDashboard =
                window.MonarchDashboard || {};


            window.MonarchDashboard.investment =
                window.MonarchDashboard.investment || {};


            window.MonarchDashboard
                .investment
                .packages =
                    investmentPackages;


            document.dispatchEvent(
                new CustomEvent(
                    "monarch:packages-loaded",
                    {
                        detail: {
                            packages:
                                investmentPackages
                        }
                    }
                )
            );


        } catch (error) {

            console.error(
                "Unexpected package error:",
                error
            );


            renderPackagesError(
                "Something went wrong while loading packages."
            );

        }

    }


    /* =====================================================
       RELOAD PACKAGES
       ===================================================== */

    async function reloadInvestmentPackages() {

        await loadInvestmentPackages();

    }


    /* =====================================================
       PUBLIC INVESTMENT API
       ===================================================== */

    window.MonarchDashboard =
        window.MonarchDashboard || {};


    window.MonarchDashboard.investment =
        window.MonarchDashboard.investment || {};


    window.MonarchDashboard
        .investment
        .loadPackages =
            loadInvestmentPackages;


    window.MonarchDashboard
        .investment
        .reloadPackages =
            reloadInvestmentPackages;


    window.MonarchDashboard
        .investment
        .getPackages =
            function () {

                return investmentPackages;

            };


    window.MonarchDashboard
        .investment
        .getSelectedPackage =
            function () {

                return selectedPackage;

            };


    /* =====================================================
       LOAD WHEN INVESTMENTS TAB OPENS
       ===================================================== */

    document.addEventListener(
        "monarch:module-change",
        function (event) {

            if (
                event.detail &&
                event.detail.module ===
                "investments"
            ) {

                if (
                    investmentPackages.length ===
                    0
                ) {

                    loadInvestmentPackages();

                }

            }

        }
    );


    /* =====================================================
       LOAD IF INVESTMENTS IS INITIAL MODULE
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const investmentPanel =
                document.getElementById(
                    "module-investments"
                );


            if (
                investmentPanel &&
                investmentPanel.classList.contains(
                    "active"
                )
            ) {

                loadInvestmentPackages();

            }

        }
    );

})();