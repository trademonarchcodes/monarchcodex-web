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

/* =========================================================
   MONARCH CODEX — BANK PAYMENT MODULE
   ========================================================= */

(function () {

    "use strict";

    let bankPaymentDetails = null;


    function getElement(id) {

        return document.getElementById(id);

    }


    function formatBankAmount(amount, currency) {

        const value = Number(amount);

        if (!Number.isFinite(value)) {

            return "—";

        }

        const code = currency || "NGN";

        try {

            return value.toLocaleString(
                "en-NG",
                {
                    style: "currency",
                    currency: code,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

        } catch (error) {

            return `${code} ${value.toLocaleString("en-NG")}`;

        }

    }


    function setText(id, value) {

        const element = getElement(id);

        if (!element) {

            return;

        }

        element.textContent =
            value !== null &&
            value !== undefined &&
            value !== ""
                ? value
                : "—";

    }


    function showBankDetails() {

        const paymentSection =
            getElement("paymentDetailsPanel");

        const bankDetails =
            getElement("bankDetails");

        const cryptoDetails =
            getElement("cryptoDetails");

        const request =
            getElement("investmentRequest");


        if (paymentSection) {

            paymentSection.hidden = false;

        }


        if (bankDetails) {

            bankDetails.hidden = false;

        }


        if (cryptoDetails) {

            cryptoDetails.hidden = true;

        }


        if (request) {

            request.hidden = false;

        }


        const methodDisplay =
            getElement(
                "selectedPaymentMethodDisplay"
            );


        if (methodDisplay) {

            methodDisplay.textContent =
                "Bank Transfer";

        }


        document.dispatchEvent(
            new CustomEvent(
                "monarch:payment-method-selected",
                {
                    detail: {
                        method: "bank",
                        details:
                            bankPaymentDetails
                    }
                }
            )
        );

    }


    function renderBankPaymentDetails(details) {

        if (!details) {

            console.warn(
                "Monarch Codex: No bank payment details found."
            );

            return;

        }


        bankPaymentDetails = details;


        /*
         * BANK NAME
         */

        setText(
            "bankName",
            details.bank_name ||
            details.bank ||
            details.bankName
        );


        /*
         * ACCOUNT NAME
         */

        setText(
            "accountName",
            details.account_name ||
            details.account_holder ||
            details.accountName
        );


        /*
         * ACCOUNT NUMBER
         */

        setText(
            "accountNumber",
            details.account_number ||
            details.accountNumber
        );


        /*
         * AMOUNT
         */

        const amount =
            details.amount ||
            details.minimum_amount ||
            details.min_amount;


        if (amount !== undefined && amount !== null) {

            setText(
                "bankAmount",
                formatBankAmount(
                    amount,
                    details.currency || "NGN"
                )
            );

        }


        /*
         * CURRENCY
         */

        setText(
            "bankCurrency",
            details.currency || "NGN"
        );


        /*
         * INSTRUCTIONS
         */

        setText(
            "bankInstructions",
            details.instructions ||
            details.instruction ||
            details.description
        );


        /*
         * PAYMENT TITLE
         */

        setText(
            "bankPaymentTitle",
            details.title ||
            "Bank Transfer"
        );


        /*
         * SHOW BANK SECTION
         */

        showBankDetails();


        /*
         * EVENT
         */

        document.dispatchEvent(
            new CustomEvent(
                "monarch:bank-payment-loaded",
                {
                    detail: {
                        details:
                            bankPaymentDetails
                    }
                }
            )
        );

    }


    async function loadBankPaymentDetails() {

        try {

            if (
                typeof supabaseClient ===
                "undefined" ||
                !supabaseClient
            ) {

                console.error(
                    "Monarch Codex: supabaseClient is not available."
                );

                return;

            }


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("payment_details")
                    .select("*")
                    .eq(
                        "payment_type",
                        "bank"
                    )
                    .eq(
                        "active",
                        true
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(
                    "Bank payment loading error:",
                    error
                );

                return;

            }


            if (
                !data ||
                !Array.isArray(data) ||
                data.length === 0
            ) {

                console.warn(
                    "Monarch Codex: No active bank payment details found."
                );

                return;

            }


            renderBankPaymentDetails(
                data[0]
            );

        } catch (error) {

            console.error(
                "Monarch Codex: Unexpected bank payment error:",
                error
            );

        }

    }


    function hideBankDetails() {

        const bankDetails =
            getElement("bankDetails");

        if (bankDetails) {

            bankDetails.hidden = true;

        }

    }


    function initializeBankPaymentModule() {

        /*
         * LOAD BANK DETAILS
         */

        loadBankPaymentDetails();


        /*
         * BANK PAYMENT BUTTONS
         *
         * The module supports several possible
         * button IDs so it can work with the
         * existing dashboard without changing
         * the rest of the page.
         */

        const bankButton =
    getElement("bankPayment") ||
    getElement("bankPaymentButton") ||
    getElement("selectBankPayment") ||
    getElement("bankTransferButton");

        if (bankButton) {

            bankButton.addEventListener(
                "click",
                function () {

                    showBankDetails();

                }
            );

        }


        /*
         * LISTEN FOR PAYMENT METHOD EVENTS
         */

        document.addEventListener(
            "monarch:show-bank-payment",
            function () {

                showBankDetails();

            }
        );


        document.addEventListener(
            "monarch:payment-method-bank",
            function () {

                showBankDetails();

            }
        );

    }


    /*
     * INITIALIZE AFTER DOM LOAD
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeBankPaymentModule
        );

    } else {

        initializeBankPaymentModule();

    }


    /*
     * PUBLIC API
     *
     * Other dashboard modules can use these
     * functions without needing to access
     * the internal variables directly.
     */

    window.MonarchBankPayment = {

        load:
            loadBankPaymentDetails,

        show:
            showBankDetails,

        hide:
            hideBankDetails,

        getDetails:
            function () {

                return bankPaymentDetails;

            },

        formatAmount:
            formatBankAmount

    };


})();

/* =========================================================
   MONARCH CODEX — CRYPTO PAYMENT MODULE
   ========================================================= */

(function () {

    "use strict";

    let cryptoPaymentDetails = null;
    let selectedNetwork = null;


    /* =====================================================
       HELPERS
       ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }


    function escapeText(value) {

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


    function formatCryptoAmount(amount) {

        const value = Number(amount);

        if (!Number.isFinite(value)) {
            return "—";
        }

        return "$" + value.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }


    /* =====================================================
       EXTRACT NETWORK ADDRESS
       ===================================================== */

    function getNetworkAddress(
        details,
        network
    ) {

        if (!details || !network) {
            return "";
        }


        const normalized =
            String(network)
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/-/g, "");


        /*
         * Supports both dedicated database columns
         * and the existing wallet/address structures.
         */

        const possibleKeys = {

            bep20: [
                "bep20_address",
                "bep20_wallet",
                "bep20"
            ],

            arbitrum: [
                "arbitrum_address",
                "arbitrum_wallet",
                "arbitrum"
            ],

            ton: [
                "ton_address",
                "ton_wallet",
                "ton"
            ],

            solana: [
                "solana_address",
                "solana_wallet",
                "solana"
            ],

            erc20: [
                "erc20_address",
                "erc20_wallet",
                "erc20",
                "ethereum_address",
                "ethereum_wallet"
            ]

        };


        const keys =
            possibleKeys[normalized] ||
            [];


        for (
            const key of keys
        ) {

            if (
                details[key] !== null &&
                details[key] !== undefined &&
                String(details[key]).trim() !== ""
            ) {

                return String(
                    details[key]
                ).trim();

            }

        }


        /*
         * Support a JSON wallet_addresses object
         * if the payment record uses one.
         */

        const walletAddresses =
            details.wallet_addresses ||
            details.addresses ||
            details.wallets;


        if (
            walletAddresses &&
            typeof walletAddresses === "object"
        ) {

            const address =
                walletAddresses[normalized] ||
                walletAddresses[network] ||
                walletAddresses[
                    String(network).toUpperCase()
                ];


            if (
                address !== null &&
                address !== undefined &&
                String(address).trim() !== ""
            ) {

                return String(
                    address
                ).trim();

            }

        }


        /*
         * Existing EVM behavior:
         * BEP20 and Arbitrum share the same address.
         */

        if (
            normalized === "bep20" ||
            normalized === "arbitrum"
        ) {

            return (
                details.evm_address ||
                details.bep20_address ||
                details.arbitrum_address ||
                details.wallet_address ||
                details.address ||
                ""
            );

        }


        return (
            details.wallet_address ||
            details.address ||
            ""
        );

    }


    /* =====================================================
       DISPLAY WALLET
       ===================================================== */

    function displayWalletAddress(
        network
    ) {

        const walletBox =
            getElement("cryptoWalletBox");

        const walletAddress =
            getElement("cryptoWalletAddress");

        const selectedNetworkElement =
            getElement("selectedCryptoNetwork");


        if (selectedNetworkElement) {

            selectedNetworkElement.textContent =
                network || "—";

        }


        const address =
            getNetworkAddress(
                cryptoPaymentDetails,
                network
            );


        if (walletAddress) {

            walletAddress.textContent =
                address || "Wallet address unavailable";

        }


        if (walletBox) {

            walletBox.hidden = false;

        }


        selectedNetwork =
            network;

    }


    /* =====================================================
       DISPLAY CRYPTO DETAILS
       ===================================================== */

    function displayCryptoPaymentDetails(
        details
    ) {

        if (!details) {
            return;
        }


        cryptoPaymentDetails =
            details;


        const minimumAmount =
            getElement(
                "cryptoMinimumAmount"
            );

        const feeAmount =
            getElement(
                "cryptoFeeAmount"
            );

        const totalAmount =
            getElement(
                "cryptoTotalAmount"
            );

        const instructions =
            getElement(
                "cryptoInstructions"
            );


        const minimum =
            details.minimum_amount ??
            details.min_amount ??
            details.minimum ??
            0;


        const fee =
            details.fee_amount ??
            details.fee ??
            0;


        const total =
            details.total_amount ??
            details.total ??
            (
                Number(minimum) +
                Number(fee)
            );


        if (minimumAmount) {

            minimumAmount.textContent =
                formatCryptoAmount(
                    minimum
                );

        }


        if (feeAmount) {

            feeAmount.textContent =
                formatCryptoAmount(
                    fee
                );

        }


        if (totalAmount) {

            totalAmount.textContent =
                formatCryptoAmount(
                    total
                );

        }


        if (instructions) {

            instructions.textContent =
                details.instructions ||
                details.description ||
                "Send your payment using the selected network, then upload your payment receipt.";

        }


        /*
         * Default to the first available network.
         */

        const networkSelect =
            getElement("cryptoNetwork");


        if (networkSelect) {

            const currentValue =
                networkSelect.value;


            if (currentValue) {

                displayWalletAddress(
                    currentValue
                );

            }

        }

    }


    /* =====================================================
       LOAD CRYPTO PAYMENT DETAILS
       ===================================================== */

    async function loadCryptoPaymentDetails() {

        const cryptoDetails =
            getElement("cryptoDetails");


        if (!cryptoDetails) {
            return;
        }


        cryptoDetails.hidden = false;


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("payment_details")
                    .select("*")
                    .eq(
                        "payment_type",
                        "crypto"
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "Crypto payment details error:",
                    error
                );

                return;

            }


            if (!data) {

                console.warn(
                    "No crypto payment details found."
                );

                return;

            }


            displayCryptoPaymentDetails(
                data
            );


            window.MonarchDashboard =
                window.MonarchDashboard || {};


            window.MonarchDashboard.payment =
                window.MonarchDashboard.payment || {};


            window.MonarchDashboard
                .payment.crypto =
                    data;


        } catch (error) {

            console.error(
                "Unexpected crypto payment error:",
                error
            );

        }

    }


    /* =====================================================
       NETWORK SELECTOR
       ===================================================== */

    function initializeCryptoNetworkSelector() {

        const networkSelect =
            getElement("cryptoNetwork");


        if (!networkSelect) {
            return;
        }


        networkSelect.addEventListener(
            "change",
            function () {

                const network =
                    networkSelect.value;


                if (!network) {

                    const walletAddress =
                        getElement(
                            "cryptoWalletAddress"
                        );


                    if (walletAddress) {

                        walletAddress.textContent =
                            "Select a network";

                    }


                    return;

                }


                displayWalletAddress(
                    network
                );

            }
        );


        if (networkSelect.value) {

            displayWalletAddress(
                networkSelect.value
            );

        }

    }


    /* =====================================================
       COPY WALLET ADDRESS
       ===================================================== */

    function initializeCopyWalletButton() {

        const button =
            getElement(
                "copyWalletBtn"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async function () {

                const walletAddress =
                    getElement(
                        "cryptoWalletAddress"
                    );


                if (!walletAddress) {
                    return;
                }


                const address =
                    walletAddress.textContent.trim();


                if (
                    !address ||
                    address ===
                    "Wallet address unavailable" ||
                    address ===
                    "Select a network"
                ) {

                    return;

                }


                try {

                    await navigator
                        .clipboard
                        .writeText(
                            address
                        );


                    const originalText =
                        button.textContent;


                    button.textContent =
                        "Copied";


                    setTimeout(
                        function () {

                            button.textContent =
                                originalText;

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "Wallet copy failed:",
                        error
                    );

                }

            }
        );

    }


    /* =====================================================
       CRYPTO PAYMENT BUTTON
       ===================================================== */

    function initializeCryptoPaymentButton() {

        const button =
            getElement(
                "cryptoPayment"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async function () {

                const bankDetails =
                    getElement(
                        "bankDetails"
                    );

                const cryptoDetails =
                    getElement(
                        "cryptoDetails"
                    );


                if (bankDetails) {

                    bankDetails.hidden =
                        true;

                }


                if (cryptoDetails) {

                    cryptoDetails.hidden =
                        false;

                }


                const selectedMethod =
                    getElement(
                        "selectedPaymentMethodDisplay"
                    );


                if (selectedMethod) {

                    selectedMethod.textContent =
                        "Crypto Payment";

                }


                await loadCryptoPaymentDetails();

            }
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            initializeCryptoPaymentButton();

            initializeCryptoNetworkSelector();

            initializeCopyWalletButton();

        }
    );


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.MonarchDashboard =
        window.MonarchDashboard || {};


    window.MonarchDashboard.payment =
        window.MonarchDashboard.payment || {};


    window.MonarchDashboard
        .payment
        .loadCryptoDetails =
            loadCryptoPaymentDetails;


    window.MonarchDashboard
        .payment
        .getCryptoDetails =
            function () {

                return cryptoPaymentDetails;

            };


    window.MonarchDashboard
        .payment
        .getSelectedNetwork =
            function () {

                return selectedNetwork;

            };


    window.MonarchDashboard
        .payment
        .getWalletAddress =
            function (network) {

                return getNetworkAddress(
                    cryptoPaymentDetails,
                    network
                );

            };

})();

/* =========================================================
   MONARCH CODEX — RECEIPT UPLOAD & INVESTMENT SUBMISSION
   ========================================================= */

let selectedReceiptFile = null;
let selectedPaymentMethod = "";


/* =========================================================
   PAYMENT METHOD EVENT
   ========================================================= */

document.addEventListener(
    "monarch:payment-method-selected",
    function (event) {

        selectedPaymentMethod =
            event.detail?.method || "";

        window.MonarchDashboard =
            window.MonarchDashboard || {};

        window.MonarchDashboard.investment =
            window.MonarchDashboard.investment || {};

        window.MonarchDashboard
            .investment
            .selectedPaymentMethod =
                selectedPaymentMethod;


        const methodDisplay =
            document.getElementById(
                "selectedPaymentMethodDisplay"
            );


        if (methodDisplay) {

            methodDisplay.textContent =
                selectedPaymentMethod === "bank"
                    ? "Bank Transfer"
                    : selectedPaymentMethod === "crypto"
                        ? "Crypto Payment"
                        : "—";

        }

    }
);


/* =========================================================
   RECEIPT FILE SELECTION
   ========================================================= */

const receiptInput =
    document.getElementById(
        "receiptInput"
    );


const submitInvestmentBtn =
    document.getElementById(
        "submitInvestmentBtn"
    );


const receiptConfirmation =
    document.getElementById(
        "receiptConfirmation"
    );


if (receiptInput) {

    receiptInput.addEventListener(
        "change",
        function () {

            selectedReceiptFile =
                this.files?.[0] || null;


            if (!receiptConfirmation) {

                return;

            }


            if (!selectedReceiptFile) {

                receiptConfirmation.textContent =
                    "";

                return;

            }


            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "application/pdf"
            ];


            if (
                !allowedTypes.includes(
                    selectedReceiptFile.type
                )
            ) {

                selectedReceiptFile = null;

                this.value = "";

                receiptConfirmation.textContent =
                    "Please upload a JPG, PNG, WEBP or PDF receipt.";

                return;

            }


            const maxSize =
                10 * 1024 * 1024;


            if (
                selectedReceiptFile.size >
                maxSize
            ) {

                selectedReceiptFile = null;

                this.value = "";

                receiptConfirmation.textContent =
                    "Receipt file must not exceed 10MB.";

                return;

            }


            receiptConfirmation.textContent =
                `Receipt selected: ${selectedReceiptFile.name}`;

        }
    );

}


/* =========================================================
   INVESTMENT SUBMISSION
   ========================================================= */

async function submitInvestmentRequest() {

    const currentUser =
        window.MonarchCodex?.user;


    if (!currentUser) {

        alert(
            "Your session has expired. Please log in again."
        );

        return;

    }


    const investmentState =
        window.MonarchDashboard?.investment;


    const selectedPackage =
        investmentState?.selectedPackage;


    const paymentMethod =
        investmentState?.selectedPaymentMethod ||
        selectedPaymentMethod;


    if (!selectedPackage) {

        alert(
            "Please select an investment package."
        );

        return;

    }


    if (!paymentMethod) {

        alert(
            "Please select a payment method."
        );

        return;

    }


    if (!selectedReceiptFile) {

        alert(
            "Please upload your payment receipt."
        );

        return;

    }


    const packageAmount =
        Number(
            selectedPackage.amount ??
            selectedPackage.price ??
            0
        );


    if (
        !Number.isFinite(
            packageAmount
        ) ||
        packageAmount <= 0
    ) {

        alert(
            "Unable to determine the investment amount."
        );

        return;

    }


    if (submitInvestmentBtn) {

        submitInvestmentBtn.disabled =
            true;

        submitInvestmentBtn.textContent =
            "Submitting...";

    }


    if (receiptConfirmation) {

        receiptConfirmation.textContent =
            "Uploading receipt and creating investment request...";

    }


    let investment = null;
    let uploadedReceiptPath = null;


    try {

        /* =================================================
           1. CREATE PENDING INVESTMENT
           ================================================= */

        const {
            data: investmentData,
            error: investmentError
        } =
            await supabaseClient
                .from("investments")
                .insert({
                    user_id:
                        currentUser.id,

                    package_id:
                        selectedPackage.id,

                    amount:
                        packageAmount,

                    payment_method:
                        paymentMethod,

                    status:
                        "pending"
                })
                .select()
                .single();


        if (investmentError) {

            throw investmentError;

        }


        investment =
            investmentData;


        /* =================================================
           2. UPLOAD RECEIPT
           ================================================= */

        const fileExtension =
            selectedReceiptFile.name.includes(".")
                ? selectedReceiptFile.name
                    .split(".")
                    .pop()
                    .toLowerCase()
                : "file";


        const uniqueFileName =
            `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;


        uploadedReceiptPath =
            `${currentUser.id}/${investment.id}/${uniqueFileName}`;


        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("payment-receipts")
                .upload(
                    uploadedReceiptPath,
                    selectedReceiptFile,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false
                    }
                );


        if (uploadError) {

            throw uploadError;

        }


        /* =================================================
           3. GET MEMBER UID
           ================================================= */

        let memberUid = "";


        try {

            const {
                data: profileData
            } =
                await supabaseClient
                    .from("profiles")
                    .select("uid")
                    .eq(
                        "id",
                        currentUser.id
                    )
                    .single();


            memberUid =
                profileData?.uid || "";

        } catch (profileError) {

            console.warn(
                "Could not load member UID:",
                profileError
            );

        }


        /* =================================================
           4. CREATE PAYMENT RECEIPT
           ================================================= */

        const {
            error: receiptError
        } =
            await supabaseClient
                .from("payment_receipts")
                .insert({
                    investment_id:
                        investment.id,

                    user_id:
                        currentUser.id,

                    uid:
                        memberUid,

                    amount:
                        packageAmount,

                    payment_method:
                        paymentMethod,

                    file_name:
                        selectedReceiptFile.name,

                    file_path:
                        uploadedReceiptPath,

                    file_type:
                        selectedReceiptFile.type,

                    file_size:
                        selectedReceiptFile.size,

                    verification_status:
                        "pending"
                });


        if (receiptError) {

            throw receiptError;

        }


        /* =================================================
           5. SUCCESS
           ================================================= */

        if (receiptConfirmation) {

            receiptConfirmation.textContent =
                "Investment request submitted successfully. Your payment is pending admin verification.";

        }


        alert(
            "Investment request submitted successfully."
        );


        /* =================================================
           6. RESET FORM
           ================================================= */

        selectedReceiptFile =
            null;


        if (receiptInput) {

            receiptInput.value =
                "";

        }


        if (submitInvestmentBtn) {

            submitInvestmentBtn.disabled =
                false;

            submitInvestmentBtn.textContent =
                "Submit Investment Request";

        }


        /* =================================================
           7. REFRESH INVESTMENT INFORMATION
           ================================================= */

        if (
            window.MonarchDashboard
                ?.investment
                ?.loadHistory
        ) {

            await window.MonarchDashboard
                .investment
                .loadHistory();

        }


        if (
            window.MonarchDashboard
                ?.investment
                ?.loadStats
        ) {

            await window.MonarchDashboard
                .investment
                .loadStats();

        }


        document.dispatchEvent(
            new CustomEvent(
                "monarch:investment-submitted",
                {
                    detail: {
                        investment:
                            investment
                    }
                }
            )
        );


    } catch (error) {

        console.error(
            "Investment submission error:",
            error
        );


        /* =================================================
           ROLLBACK INVESTMENT
           ================================================= */

        if (investment?.id) {

            try {

                await supabaseClient
                    .from("investments")
                    .delete()
                    .eq(
                        "id",
                        investment.id
                    );

            } catch (rollbackError) {

                console.error(
                    "Investment rollback failed:",
                    rollbackError
                );

            }

        }


        /* =================================================
           REMOVE UPLOADED RECEIPT
           ================================================= */

        if (uploadedReceiptPath) {

            try {

                await supabaseClient
                    .storage
                    .from("payment-receipts")
                    .remove([
                        uploadedReceiptPath
                    ]);

            } catch (storageError) {

                console.error(
                    "Receipt cleanup failed:",
                    storageError
                );

            }

        }


        if (receiptConfirmation) {

            receiptConfirmation.textContent =
                error?.message ||
                "Unable to submit investment request. Please try again.";

        }


        alert(
            error?.message ||
            "Unable to submit investment request."
        );


        if (submitInvestmentBtn) {

            submitInvestmentBtn.disabled =
                false;

            submitInvestmentBtn.textContent =
                "Submit Investment Request";

        }

    }

}


/* =========================================================
   SUBMIT BUTTON
   ========================================================= */

if (submitInvestmentBtn) {

    submitInvestmentBtn.addEventListener(
        "click",
        submitInvestmentRequest
    );

}


/* =========================================================
   PUBLIC INVESTMENT API
   ========================================================= */

window.MonarchDashboard =
    window.MonarchDashboard || {};

window.MonarchDashboard.investment =
    window.MonarchDashboard.investment || {};


window.MonarchDashboard
    .investment
    .submit =
        submitInvestmentRequest;


window.MonarchDashboard
    .investment
    .getReceiptFile =
        function () {

            return selectedReceiptFile;

        };
