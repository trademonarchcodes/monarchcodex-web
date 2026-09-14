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

    /* PREMIUM PROFILE DUPLICATE SYNC - ADD ONLY */
    const profileUidDup = getElement("profileUidDup");
    if (profileUidDup) {
        profileUidDup.textContent = currentProfile.uid || "—";
    }

    const profileRoleDetails2 = getElement("profileRoleDetails2");
    if (profileRoleDetails2) {
        profileRoleDetails2.textContent = role;
    }

    const profileUidFull = getElement("profileUidFull");
    if (profileUidFull) {
        profileUidFull.textContent = currentUser.id || "—";
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
        setLoadingMessage("Checking your account...");
        currentUser = await getCurrentUser();
        setLoadingMessage("Loading your member profile...");
        await loadCurrentProfile();
        renderProfile();
        initializeNavigation();
        initializeMobileMenu();
        initializeLogout();
        showDashboard();
        setLoadingMessage("Loading dashboard...");
        await loadPackages();
        await loadInvestmentHistory();
        await loadEarnings();
        await loadWithdrawals();
        await loadReferrals();
    } catch (error) {
        console.error("Dashboard initialization error:", error);
        showAuthError("Unable to load your member dashboard. Please log in again.");
    }
}


/* =========================================
   START DASHBOARD
========================================= */



/* =========================================
   LOAD PACKAGES
========================================= */

async function loadPackages() {
    const loading = getElement("packagesLoading");
    const grid = getElement("packagesGrid");
    const empty = getElement("packagesEmpty");

    try {
        showElement(loading);

        if (grid) {
            grid.innerHTML = "";
        }

        hideElement(empty);

        const { data, error } =
            await supabaseClient
                .from("packages")
                .select("*")
                .eq("active", true)
                .order("amount", {
                    ascending: true
                });

        if (error) {
            throw error;
        }

        hideElement(loading);

        if (!data || data.length === 0) {
            showElement(empty);
            return;
        }

        data.forEach(function (pkg) {

            const card =
                document.createElement("div");

            card.className = "package-card";

            card.innerHTML = `
                <h3>
                    ${escapeHtml(pkg.name)}
                </h3>

                <p>
                    Choose this package to continue
                    with your Monarch Codex investment.
                </p>

                <div class="package-price">
                    ${formatCurrency(pkg.amount)}
                </div>

                <button
                    type="button"
                    class="package-select-btn"
                    data-package-id="${pkg.id}"
                >
                    Select Package
                </button>
            `;

            grid.appendChild(card);
        });

        document
            .querySelectorAll(".package-select-btn")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const packageId =
                            this.dataset.packageId;

                        const selected =
                            data.find(function (pkg) {
                                return String(pkg.id) ===
                                    String(packageId);
                            });

                        if (selected) {
                            selectPackage(selected);
                        }
                    }
                );
            });

    } catch (error) {

        console.error(
            "Error loading packages:",
            error
        );

        hideElement(loading);

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Unable to Load Packages
                    </h3>

                    <p>
                        Please refresh the page
                        and try again.
                    </p>
                </div>
            `;
        }
    }
}


/* =========================================
   SELECT PACKAGE
========================================= */

function selectPackage(pkg) {

    selectedPackage = pkg;

    const selectedCard =
        getElement("selectedPackageCard");

    const paymentCard =
        getElement("paymentMethodCard");

    const packageName =
        getElement("selectedPackageName");

    const packageAmount =
        getElement("selectedPackageAmount");

    const packageId =
        getElement("selectedPackageId");

    const investmentAmount =
        getElement("investmentAmount");


    if (packageName) {
        packageName.textContent =
            pkg.name;
    }

    if (packageAmount) {
        packageAmount.textContent =
            formatCurrency(pkg.amount);
    }

    if (packageId) {
        packageId.value = pkg.id;
    }

    if (investmentAmount) {
        investmentAmount.value =
            pkg.amount;
    }


    showElement(selectedCard);
    showElement(paymentCard);

    loadPaymentMethods();

    const investmentSection =
        getElement("investmentSection");

    if (investmentSection) {
        investmentSection.classList.add(
            "active-section"
        );
    }

    window.scrollTo({
        top: selectedCard
            ? selectedCard.offsetTop - 20
            : 0,
        behavior: "smooth"
    });
}

/* =========================================
   LOAD PAYMENT METHODS
========================================= */

async function loadPaymentMethods() {

    const loading =
        getElement("paymentMethodsLoading");

    const grid =
        getElement("paymentMethodsGrid");

    try {

        showElement(loading);

        if (grid) {
            grid.innerHTML = "";
        }

        const { data, error } =
            await supabaseClient
                .from("payment_details")
                .select("*")
                .eq("active", true)
                .order("id", {
                    ascending: true
                });

        if (error) {
            throw error;
        }

        hideElement(loading);

        if (!data || data.length === 0) {

            if (grid) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <h3>No Payment Methods</h3>
                        <p>
                            No active payment methods
                            are currently available.
                        </p>
                    </div>
                `;
            }

            return;
        }

        data.forEach(function (method) {

            const card =
                document.createElement("div");

            card.className =
                "payment-method-card";

            card.innerHTML = `
                <h4>
                    ${escapeHtml(
                        method.title
                    )}
                </h4>

                <p>
                    ${escapeHtml(
                        method.payment_type ||
                        "Payment Method"
                    )}
                </p>
            `;

            card.addEventListener(
                "click",
                function () {
                    selectPaymentMethod(
                        method,
                        card
                    );
                }
            );

            grid.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Error loading payment methods:",
            error
        );

        hideElement(loading);

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Unable to Load Payment Methods
                    </h3>

                    <p>
                        Please refresh the page
                        and try again.
                    </p>
                </div>
            `;
        }
    }
}


/* =========================================
   SELECT PAYMENT METHOD
========================================= */

function selectPaymentMethod(method, card) {

    selectedPaymentMethod = method;

    document
        .querySelectorAll(".payment-method-card")
        .forEach(function (item) {
            item.classList.remove("selected");
        });

    if (card) {
        card.classList.add("selected");
    }

    const methodInput =
        getElement("selectedPaymentMethod");

    const detailIdInput =
        getElement("selectedPaymentDetailId");

    if (methodInput) {
        methodInput.value =
            method.payment_type ||
            method.title;
    }

    if (detailIdInput) {
        detailIdInput.value =
            method.id;
    }

    displayPaymentDetails(method);
}

/* =========================================
   DISPLAY PAYMENT DETAILS
========================================= */

function displayPaymentDetails(method) {

    const detailsArea =
        getElement("paymentDetailsArea");

    const bankPanel =
        getElement("bankPayment");

    const cryptoPanel =
        getElement("cryptoPayment");

    const instructions =
        getElement("paymentInstructions");


    showElement(detailsArea);

    hideElement(bankPanel);
    hideElement(cryptoPanel);


    if (instructions) {
        instructions.textContent =
            method.instructions ||
            "Follow the payment instructions below.";
    }


    const type =
        String(method.payment_type || "")
            .toLowerCase();


    if (
        type.includes("bank") ||
        method.bank_name ||
        method.account_number
    ) {
        displayBankDetails(method);
    } else {
        displayCryptoDetails(method);
    }
}


/* =========================================
   BANK PAYMENT DETAILS
========================================= */


function displayBankDetails(method) {
    const bankPanel = getElement("bankPayment");
    const bankName = getElement("bankName");
    const accountName = getElement("bankAccountName");
    const accountNumber = getElement("bankAccountNumber");
    const bankTotalAmount = getElement("bankTotalAmount");
    const bankFeeAmount = getElement("bankFeeAmount");
    const bankInstructions = getElement("bankPaymentInstructions");

    showElement(bankPanel);

    // Calculate amount based on selected package
    const pkgAmount = selectedPackage ? Number(selectedPackage.amount) : 30;
    // From DB: $30 = ₦42,000 base, fee ₦2,800 => rate 1400
    const baseRate = method.minimum_amount ? Number(method.minimum_amount) / 30 : 1400;
    const fee = method.fee_amount ? Number(method.fee_amount) : 2800;
    const baseNaira = pkgAmount * baseRate;
    const totalNaira = baseNaira + fee;

    if (bankName) bankName.textContent = method.bank_name || "OPAY";
    if (accountName) accountName.textContent = method.account_name || "—";
    if (accountNumber) accountNumber.textContent = method.account_number || "—";
    if (bankTotalAmount) bankTotalAmount.textContent = `₦${totalNaira.toLocaleString()} (Package ₦${baseNaira.toLocaleString()} + Fee ₦${fee.toLocaleString()})`;
    if (bankFeeAmount) bankFeeAmount.textContent = `Total to Transfer: ₦${totalNaira.toLocaleString()}`;
    if (bankInstructions) bankInstructions.textContent = `Minimum investment is ₦${baseNaira.toLocaleString()} for ${formatCurrency(pkgAmount)} package. A ₦${fee.toLocaleString()} fee applies. Total amount to transfer is ₦${totalNaira.toLocaleString()}. Transfer exact amount and upload receipt.`;

    // Add copy buttons if not exist
    addCopyButtonsForBank();

    showElement(getElement("receiptArea"));
}

function addCopyButtonsForBank() {
    const accNumEl = getElement("bankAccountNumber");
    if (accNumEl && !accNumEl.parentElement.querySelector(".copy-btn")) {
        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.textContent = "Copy";
        btn.type = "button";
        btn.onclick = () => {
            navigator.clipboard.writeText(accNumEl.textContent.trim());
            const old = btn.textContent; btn.textContent = "Copied!"; setTimeout(()=> btn.textContent = old, 1500);
        };
        accNumEl.parentElement.appendChild(btn);
    }
    const accNameEl = getElement("bankAccountName");
    if (accNameEl && !accNameEl.parentElement.querySelector(".copy-btn")) {
        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.textContent = "Copy";
        btn.type = "button";
        btn.onclick = () => {
            navigator.clipboard.writeText(accNameEl.textContent.trim());
            const old = btn.textContent; btn.textContent = "Copied!"; setTimeout(()=> btn.textContent = old, 1500);
        };
        accNameEl.parentElement.appendChild(btn);
    }
}



/* =========================================
   CRYPTO PAYMENT DETAILS
========================================= */

function displayCryptoDetails(method) {

    const cryptoPanel =
        getElement("cryptoPayment");

    const networkSelect =
        getElement("cryptoNetwork");

    const walletArea =
        getElement("cryptoWalletArea");


    showElement(cryptoPanel);

    hideElement(walletArea);


    if (!networkSelect) {
        return;
    }


    networkSelect.innerHTML = `
        <option value="">
            Select Network
        </option>
    `;


    /*
       The network may be stored as:

       "BTC"
       "TRC20"
       "ERC20"
       "BEP20"

       or multiple networks separated
       by commas.
    */

    const networkText =
        method.crypto_network || "";


    const networks =
        networkText
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);


    if (networks.length === 0) {

        networks.push(
            method.crypto_name || "Default Network"
        );
    }


    networks.forEach(function (network) {

        const option =
            document.createElement("option");

        option.value = network;
        option.textContent = network;

        networkSelect.appendChild(option);
    });


    networkSelect.onchange =
        function () {

            const network =
                this.value;

            if (!network) {
                hideElement(walletArea);
                return;
            }

            selectedCryptoNetwork =
                network;

            displayCryptoWallet(
                method,
                network
            );
        };
}

/* =========================================
   DISPLAY CRYPTO WALLET
========================================= */

function displayCryptoWallet(method, network) {

    const walletArea =
        getElement("cryptoWalletArea");

    const cryptoName =
        getElement("selectedCryptoName");

    const cryptoNetwork =
        getElement("selectedCryptoNetwork");

    const walletAddress =
        getElement("cryptoWalletAddress");


    showElement(walletArea);


    if (cryptoName) {
        cryptoName.textContent =
            method.crypto_name || "—";
    }

    if (cryptoNetwork) {
        cryptoNetwork.textContent =
            network || "—";
    }

    if (walletAddress) {
        walletAddress.textContent =
            method.wallet_address || "—";
    }


    showElement(
        getElement("receiptArea")
    );
}


/* =========================================
   COPY CRYPTO ADDRESS
========================================= */

function initializeCryptoCopy() {

    const button =
        getElement("copyCryptoAddressBtn");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function () {

            const wallet =
                getElement(
                    "cryptoWalletAddress"
                );

            if (!wallet) {
                return;
            }

            const address =
                wallet.textContent.trim();

            if (
                !address ||
                address === "—"
            ) {
                return;
            }


            try {

                await navigator.clipboard.writeText(
                    address
                );

                const originalText =
                    button.textContent;

                button.textContent =
                    "Copied!";

                setTimeout(function () {
                    button.textContent =
                        originalText;
                }, 1500);

            } catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );

                alert(
                    "Unable to copy the wallet address."
                );
            }
        }
    );
}

/* =========================================
   RECEIPT FILE HANDLING
========================================= */

function initializeReceiptUpload() {

    const input =
        getElement("receiptInput");

    const preview =
        getElement("receiptPreview");

    const submitButton =
        getElement("submitInvestmentBtn");

    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        function () {

            const file =
                this.files && this.files[0];

            if (!file) {
                hideElement(preview);

                if (submitButton) {
                    submitButton.disabled = true;
                }

                return;
            }


            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "application/pdf"
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {
                alert(
                    "Please upload a JPG, PNG or PDF file."
                );

                this.value = "";

                hideElement(preview);

                if (submitButton) {
                    submitButton.disabled = true;
                }

                return;
            }


            const maxSize =
                10 * 1024 * 1024;


            if (file.size > maxSize) {

                alert(
                    "Receipt file must not exceed 10MB."
                );

                this.value = "";

                hideElement(preview);

                if (submitButton) {
                    submitButton.disabled = true;
                }

                return;
            }


            if (preview) {

                preview.innerHTML = `
                    <strong>
                        Selected Receipt
                    </strong>

                    <p>
                        ${escapeHtml(file.name)}
                    </p>

                    <small>
                        ${(
                            file.size / 1024 / 1024
                        ).toFixed(2)} MB
                    </small>
                `;

                showElement(preview);
            }


            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    );
}


/* =========================================
   INITIALIZE INVESTMENT EVENTS
========================================= */

function initializeInvestmentEvents() {

    initializeCryptoCopy();

    initializeReceiptUpload();
}

/* =========================================
   SUBMIT INVESTMENT
========================================= */

async function submitInvestment() {

    const button =
        getElement("submitInvestmentBtn");

    const message =
        getElement("investmentMessage");

    const receiptInput =
        getElement("receiptInput");


    if (!currentUser) {
        showInvestmentMessage(
            "Please log in again.",
            "error"
        );
        return;
    }


    if (!selectedPackage) {
        showInvestmentMessage(
            "Please select an investment package.",
            "error"
        );
        return;
    }


    if (!selectedPaymentMethod) {
        showInvestmentMessage(
            "Please select a payment method.",
            "error"
        );
        return;
    }


    if (
        selectedPaymentMethod.payment_type
            ?.toLowerCase()
            .includes("crypto") &&
        !selectedCryptoNetwork
    ) {
        showInvestmentMessage(
            "Please select the crypto network.",
            "error"
        );
        return;
    }


    const file =
        receiptInput?.files?.[0];


    if (!file) {
        showInvestmentMessage(
            "Please upload your payment receipt.",
            "error"
        );
        return;
    }


    try {

        if (button) {
            button.disabled = true;
            button.textContent =
                "Submitting...";
        }


        showInvestmentMessage(
            "Creating your investment...",
            "success"
        );


        /* CREATE INVESTMENT */

        const { data: investment, error: investmentError } =
            await supabaseClient
                .from("investments")
                .insert({
                    user_id: currentUser.id,
                    package_id: selectedPackage.id,
                    amount: selectedPackage.amount,
                    payment_method:
                        selectedPaymentMethod.payment_type ||
                        selectedPaymentMethod.title,
                    status: "pending"
                })
                .select()
                .single();


        if (investmentError) {
            throw investmentError;
        }


        /* UPLOAD RECEIPT */

        const fileExtension =
            file.name.split(".").pop();


        const filePath =
            `${currentUser.id}/${investment.id}_${Date.now()}.${fileExtension}`;


        const { error: uploadError } =
            await supabaseClient.storage
                .from("payment-receipts")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        /* SAVE RECEIPT RECORD */

        const { error: receiptError } =
            await supabaseClient
                .from("payment_receipts")
                .insert({
                    investment_id:
                        investment.id,

                    user_id:
                        currentUser.id,

                    uid:
                        currentProfile.uid,

                    amount:
                        selectedPackage.amount,

                    payment_method:
                        selectedPaymentMethod.payment_type ||
                        selectedPaymentMethod.title,

                    file_name:
                        file.name,

                    file_path:
                        filePath,

                    file_type:
                        file.type,

                    file_size:
                        file.size,

                    verification_status:
                        "pending"
                });


        if (receiptError) {
            throw receiptError;
        }


        showInvestmentMessage(
            "Investment submitted successfully. Your payment receipt is now pending verification.",
            "success"
        );


        receiptInput.value = "";


        const preview =
            getElement("receiptPreview");

        hideElement(preview);


        if (button) {
            button.textContent =
                "Submitted";
        }


        await loadInvestmentHistory();


    } catch (error) {

        console.error(
            "Investment submission error:",
            error
        );


        showInvestmentMessage(
            error.message ||
            "Unable to submit investment. Please try again.",
            "error"
        );


        if (button) {
            button.disabled = false;
            button.textContent =
                "Submit Investment";
        }
    }
}


/* =========================================
   INVESTMENT MESSAGE
========================================= */

function showInvestmentMessage(
    message,
    type
) {

    const element =
        getElement("investmentMessage");

    if (!element) {
        return;
    }


    element.textContent = message;

    element.className =
        "form-message " +
        (type === "success"
            ? "success"
            : "error");


    showElement(element);
}


/* =========================================
   SUBMIT BUTTON EVENT
========================================= */

function initializeInvestmentSubmit() {

    const button =
        getElement("submitInvestmentBtn");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        submitInvestment
    );
}

/* =========================================
   INVESTMENT HISTORY
========================================= */

async function loadInvestmentHistory() {

    const loading =
        getElement("investmentHistoryLoading");

    const list =
        getElement("investmentHistory");

    const empty =
        getElement("investmentHistoryEmpty");


    try {

        showElement(loading);

        if (list) {
            list.innerHTML = "";
        }

        hideElement(empty);


        const { data, error } =
            await supabaseClient
                .from("investments")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("created_at", {
                    ascending: false
                });


        if (error) {
            throw error;
        }


        hideElement(loading);


        if (!data || data.length === 0) {
            showElement(empty);
            return;
        }


        data.forEach(function (investment) {

            const item =
                document.createElement("div");

            item.className =
                "investment-history-item";


            const status =
                String(
                    investment.status || "pending"
                ).toLowerCase();


            item.innerHTML = `
                <div class="history-top">

                    <h4>
                        Investment #${investment.id}
                    </h4>

                    <span class="status-badge status-${escapeHtml(status)}">
                        ${escapeHtml(status)}
                    </span>

                </div>

                <div class="history-details">

                    <span>
                        Amount:
                        <strong class="history-amount">
                            ${formatCurrency(
                                investment.amount
                            )}
                        </strong>
                    </span>

                    <span>
                        Payment:
                        ${escapeHtml(
                            investment.payment_method ||
                            "—"
                        )}
                    </span>

                    <span>
                        Date:
                        ${formatDate(
                            investment.created_at
                        )}
                    </span>

                </div>
            `;


            list.appendChild(item);
        });


    } catch (error) {

        console.error(
            "Investment history error:",
            error
        );


        hideElement(loading);


        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Unable to Load History
                    </h3>

                    <p>
                        Please refresh the page
                        and try again.
                    </p>
                </div>
            `;
        }
    }
}

/* =========================================
   LOAD EARNINGS
========================================= */

async function loadEarnings() {

    const list =
        getElement("earningsList");

    const empty =
        getElement("earningsEmpty");

    const totalElement =
        getElement("totalEarnings");

    const overviewElement =
        getElement("overviewEarnings");


    try {

        if (list) {
            list.innerHTML = "";
        }

        hideElement(empty);


        const { data, error } =
            await supabaseClient
                .from("earnings")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("created_at", {
                    ascending: false
                });


        if (error) {
            throw error;
        }


        if (!data || data.length === 0) {

            if (totalElement) {
                totalElement.textContent =
                    formatCurrency(0);
            }

            if (overviewElement) {
                overviewElement.textContent =
                    formatCurrency(0);
            }

            showElement(empty);
            return;
        }


        let total = 0;


        data.forEach(function (earning) {

            const amount =
                Number(earning.amount || 0);

            total += amount;


            const item =
                document.createElement("div");

            item.className =
                "earning-item";


            item.innerHTML = `
                <div class="earning-info">

                    <strong>
                        ${escapeHtml(
                            earning.description ||
                            "Earning"
                        )}
                    </strong>

                    <span>
                        ${formatDate(
                            earning.created_at
                        )}
                    </span>

                </div>

                <div class="earning-amount">
                    +${formatCurrency(amount)}
                </div>
            `;


            list.appendChild(item);
        });


        if (totalElement) {
            totalElement.textContent =
                formatCurrency(total);
        }

        if (overviewElement) {
            overviewElement.textContent =
                formatCurrency(total);
        }


    } catch (error) {

        console.error(
            "Earnings error:",
            error
        );


        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Unable to Load Earnings
                    </h3>

                    <p>
                        Please refresh the page
                        and try again.
                    </p>
                </div>
            `;
        }
    }
}

/* =========================================
   LOAD WITHDRAWALS
========================================= */

async function loadWithdrawals() {

    const list =
        getElement("withdrawalsList");

    const empty =
        getElement("withdrawalsEmpty");

    const totalElement =
        getElement("totalWithdrawn");

    const overviewElement =
        getElement("overviewWithdrawn");


    try {

        if (list) {
            list.innerHTML = "";
        }

        hideElement(empty);


        const { data, error } =
            await supabaseClient
                .from("withdrawals")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("updated_at", {
                    ascending: false
                });


        if (error) {
            throw error;
        }


        let total = 0;


        if (!data || data.length === 0) {

            if (totalElement) {
                totalElement.textContent =
                    formatCurrency(0);
            }

            if (overviewElement) {
                overviewElement.textContent =
                    formatCurrency(0);
            }

            showElement(empty);
            return;
        }


        data.forEach(function (withdrawal) {

            const amount =
                Number(withdrawal.amount || 0);

            if (
                String(withdrawal.status)
                    .toLowerCase() === "paid"
            ) {
                total += amount;
            }


            const item =
                document.createElement("div");

            item.className =
                "withdrawal-item";


            const status =
                String(
                    withdrawal.status ||
                    "pending"
                ).toLowerCase();


            item.innerHTML = `
                <div class="withdrawal-info">

                    <strong>
                        ${formatCurrency(amount)}
                    </strong>

                    <span>
                        ${escapeHtml(
                            withdrawal.withdrawal_method ||
                            withdrawal.withdrawal_type ||
                            "Withdrawal"
                        )}
                    </span>

                    <small>
                        ${formatDate(
                            withdrawal.updated_at
                        )}
                    </small>

                </div>

                <span class="status-badge status-${escapeHtml(status)}">
                    ${escapeHtml(status)}
                </span>
            `;


            list.appendChild(item);
        });


        if (totalElement) {
            totalElement.textContent =
                formatCurrency(total);
        }

        if (overviewElement) {
            overviewElement.textContent =
                formatCurrency(total);
        }


    } catch (error) {

        console.error(
            "Withdrawals error:",
            error
        );


        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Unable to Load Withdrawals
                    </h3>

                    <p>
                        Please refresh the page
                        and try again.
                    </p>
                </div>
            `;
        }
    }
}

/* =========================================
   LOAD REFERRALS
========================================= */

async function loadReferrals() {

    const list =
        getElement("referralsList");

    const empty =
        getElement("referralsEmpty");

    const totalElement =
        getElement("totalReferrals");

    const overviewElement =
        getElement("overviewReferrals");


    try {

        if (list) {
            list.innerHTML = "";
        }

        hideElement(empty);


        const { data, error } =
            await supabaseClient
                .from("referrals")
                .select("*")
                .eq("referrer_id", currentUser.id)
                .order("created_at", {
                    ascending: false
                });


        if (error) {
            throw error;
        }


        const referrals =
            data || [];


        if (totalElement) {
            totalElement.textContent =
                referrals.length;
        }

        if (overviewElement) {
            overviewElement.textContent =
                referrals.length;
        }


        if (referrals.length === 0) {
            showElement(empty);
            return;
        }


        referrals.forEach(function (referral, index) {

            const item =
                document.createElement("div");

            item.className =
                "referral-item";


            item.innerHTML = `
                <div class="referral-info">

                    <strong>
                        Referral #${index + 1}
                    </strong>

                    <span>
                        Member ID:
                        ${escapeHtml(
                            referral.referred_user_id
                        )}
                    </span>

                    <small>
                        Joined:
                        ${formatDate(
                            referral.created_at
                        )}
                    </small>

                </div>

                <div class="referral-code">
                    ${escapeHtml(
                        referral.referral_code ||
                        "—"
                    )}
                </div>
            `;


            list.appendChild(item);
        });


    } catch (error) {

        console.error(
            "Referrals error:",
            error
        );


        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Unable to Load Referrals
                    </h3>

                    <p>
                        Please refresh the page
                        and try again.
                    </p>
                </div>
            `;
        }
    }
}

/* =========================================
   REFRESH DASHBOARD DATA
========================================= */

async function refreshDashboardData() {

    if (!currentUser) {
        return;
    }

    await Promise.all([
        loadInvestmentHistory(),
        loadEarnings(),
        loadWithdrawals(),
        loadReferrals()
    ]);
}


/* =========================================
   INITIALIZE ALL DASHBOARD EVENTS
========================================= */

function initializeAllDashboardEvents() {

    initializeInvestmentEvents();

    initializeInvestmentSubmit();

    initializeCryptoCopy();
}

/* =========================================
   COMPLETE DASHBOARD STARTUP
========================================= */

async function startDashboard() {

    try {

        await initializeDashboard();

        if (!currentUser) {
            return;
        }

        initializeAllDashboardEvents();

        await refreshDashboardData();

        console.log(
            "Monarch Codex dashboard loaded successfully."
        );

    } catch (error) {

        console.error(
            "Dashboard startup error:",
            error
        );
    }
}


/* =========================================
   START AFTER PAGE LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        startDashboard();

    }
);

console.log("MONARCH CODEX DASHBOARD.JS IS RUNNING");
    /* REFERRAL CODE + LINK GENERATION */
    const referralCodeEl = getElement("referralCode");
    const referralLinkEl = getElement("referralLink");
    if (referralCodeEl && currentProfile) {
        // Use uid if exists, else first 6 chars of id uppercase
        const code = (currentProfile.uid || currentUser.id.substring(0,6)).toUpperCase();
        referralCodeEl.textContent = code;
        if (referralLinkEl) {
            referralLinkEl.value = `https://monarch-codex.pages.dev/register.html?ref=${code}`;
        }
    }

    const copyCodeBtn = getElement("copyReferralCodeBtn");
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener("click", function() {
            const codeEl = getElement("referralCode");
            if (codeEl) {
                navigator.clipboard.writeText(codeEl.textContent).then(()=> {
                    const old = copyCodeBtn.textContent;
                    copyCodeBtn.textContent = "Copied!";
                    setTimeout(()=> copyCodeBtn.textContent = old, 1500);
                });
            }
        });
    }

    const copyLinkBtn = getElement("copyReferralLinkBtn");
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener("click", function() {
            const linkEl = getElement("referralLink");
            if (linkEl) {
                navigator.clipboard.writeText(linkEl.value).then(()=> {
                    const old = copyLinkBtn.textContent;
                    copyLinkBtn.textContent = "Copied!";
                    setTimeout(()=> copyLinkBtn.textContent = old, 1500);
                });
            }
        });
    }

    
