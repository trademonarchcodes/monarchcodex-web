// ======================================================
// MONARCH CODEX
// Supabase Authentication + Member Dashboard
// ======================================================

const SUPABASE_URL = "https://avaworleivncevaoqeny.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ======================================================
// MOBILE MENU
// ======================================================

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {

    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });

    navMenu.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {
            navMenu.classList.remove("active");
        });

    });
}


// ======================================================
// MESSAGE HELPERS
// ======================================================

function showMessage(element, message, type = "") {

    if (!element) return;

    element.textContent = message;
    element.className = "form-message";

    if (type) {
        element.classList.add(type);
    }
}


// ======================================================
// REGISTRATION
// ======================================================

const registrationForm =
    document.getElementById("registrationForm");

const registrationMessage =
    document.getElementById("registrationMessage");


if (registrationForm) {

    registrationForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullname =
            document.getElementById("fullname").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("password").value;


        if (!fullname || !email || !password) {

            showMessage(
                registrationMessage,
                "Please fill in all required fields.",
                "error"
            );

            return;
        }


        showMessage(
            registrationMessage,
            "CREATING ACCOUNT..."
        );


        const { data, error } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        full_name: fullname,
                        phone: phone
                    },

                    emailRedirectTo:
                        window.location.origin +
                        window.location.pathname

                }

            });


        if (error) {

            console.error(error);

            showMessage(
                registrationMessage,
                error.message,
                "error"
            );

            return;
        }


        if (data.user) {

            showMessage(
                registrationMessage,
                "Account created! Please check your email to confirm your account before logging in.",
                "success"
            );

            registrationForm.reset();

        }

    });

}


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;


        if (!email || !password) {

            showMessage(
                loginMessage,
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        showMessage(
            loginMessage,
            "LOGGING IN..."
        );


        const { data, error } =
            await supabaseClient.auth.signInWithPassword({

                email: email,
                password: password

            });


        if (error) {

            console.error(error);

            showMessage(
                loginMessage,
                error.message,
                "error"
            );

            return;
        }


        showMessage(
            loginMessage,
            "Login successful.",
            "success"
        );


        if (data.user) {

            await loadDashboard(data.user);

            setTimeout(() => {

                document
                    .getElementById("dashboard")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }, 300);

        }

    });

}


// ======================================================
// DASHBOARD VARIABLES
// ======================================================

const dashboard =
    document.getElementById("dashboard");

const memberName =
    document.getElementById("memberName");

const accountStatus =
    document.getElementById("accountStatus");

const memberEmail =
    document.getElementById("memberEmail");

const logoutButton =
    document.getElementById("logoutButton");

const investmentHistory =
    document.getElementById("investmentHistory");


// Selected investment information

let selectedPackageId = null;
let selectedPackageAmount = null;
let selectedPaymentMethod = null;


// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboard(user) {

    if (!user) return;


    // Show dashboard

    if (dashboard) {
        dashboard.style.display = "block";
    }


    // Display email

    if (memberEmail) {
        memberEmail.textContent =
            user.email || "—";
    }


    // Get member profile

    const { data: profile, error } =
        await supabaseClient
            .from("profiles")
            .select("full_name, phone, role, status")
            .eq("id", user.id)
            .maybeSingle();


    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        if (memberName) {
            memberName.textContent = "Monarch";
        }

        if (accountStatus) {
            accountStatus.textContent = "Pending";
        }

    } else if (profile) {

        if (memberName) {

            memberName.textContent =
                profile.full_name ||
                "Monarch";

        }


        if (accountStatus) {

            accountStatus.textContent =
                formatStatus(profile.status);

        }

    }


    // Load investment history

    await loadInvestmentHistory(user.id);

}


// ======================================================
// FORMAT STATUS
// ======================================================

function formatStatus(status) {

    if (!status) {
        return "Pending";
    }


    return status.charAt(0).toUpperCase() +
        status.slice(1);

}


// ======================================================
// PACKAGE SELECTION
// ======================================================

const packageButtons =
    document.querySelectorAll(".dashboard-package");


packageButtons.forEach((button) => {

    button.addEventListener("click", async () => {

        const amount =
            Number(
                button.dataset.packageAmount
            );


        if (!amount) {

            console.error(
                "Invalid package amount."
            );

            return;
        }


        // Get package from Supabase

        const { data: packageData, error } =
            await supabaseClient
                .from("packages")
                .select("id, name, amount")
                .eq("amount", amount)
                .eq("active", true)
                .maybeSingle();


        if (error || !packageData) {

            console.error(
                "Package loading error:",
                error
            );

            const message =
                document.getElementById(
                    "investmentMessage"
                );

            showMessage(
                message,
                "This investment package is currently unavailable.",
                "error"
            );

            return;
        }


        selectedPackageId =
            packageData.id;

        selectedPackageAmount =
            Number(packageData.amount);


        // Clear previous package selection

        packageButtons.forEach((item) => {
            item.classList.remove("selected");
        });


        // Highlight selected package

        button.classList.add("selected");


        // Display selected package

        const selectedBox =
            document.getElementById(
                "selectedPackageBox"
            );

        const selectedAmount =
            document.getElementById(
                "selectedPackageAmount"
            );


        if (selectedBox) {
            selectedBox.style.display = "block";
        }


        if (selectedAmount) {

            selectedAmount.textContent =
                "$" +
                selectedPackageAmount.toLocaleString();

        }


        // Show payment methods

        const paymentBox =
            document.getElementById(
                "paymentMethodBox"
            );


        if (paymentBox) {
            paymentBox.style.display = "block";
        }


        // Reset payment method

        selectedPaymentMethod = null;


        document
            .querySelectorAll(".payment-option")
            .forEach((option) => {

                option.classList.remove(
                    "selected"
                );

            });


        const submitButton =
            document.getElementById(
                "submitInvestment"
            );


        if (submitButton) {
            submitButton.style.display = "none";
        }


        const investmentMessage =
            document.getElementById(
                "investmentMessage"
            );


        showMessage(
            investmentMessage,
            ""
        );

    });

});


// ======================================================
// PAYMENT METHOD SELECTION
// ======================================================

const paymentOptions =
    document.querySelectorAll(".payment-option");


paymentOptions.forEach((option) => {

    option.addEventListener("click", () => {

        if (!selectedPackageId) {

            const message =
                document.getElementById(
                    "investmentMessage"
                );

            showMessage(
                message,
                "Please select an investment package first.",
                "error"
            );

            return;
        }


        selectedPaymentMethod =
            option.dataset.paymentMethod;


        paymentOptions.forEach((item) => {

            item.classList.remove(
                "selected"
            );

        });


        option.classList.add("selected");


        const submitButton =
            document.getElementById(
                "submitInvestment"
            );


        if (submitButton) {
            submitButton.style.display = "block";
        }


        const investmentMessage =
            document.getElementById(
                "investmentMessage"
            );


        showMessage(
            investmentMessage,
            ""
        );

    });

});


// ======================================================
// SUBMIT INVESTMENT REQUEST
// ======================================================

const submitInvestment =
    document.getElementById(
        "submitInvestment"
    );


if (submitInvestment) {

    submitInvestment.addEventListener(
        "click",
        async () => {

            // Make sure user is logged in

            const {
                data: {
                    user
                }
            } =
                await supabaseClient.auth.getUser();


            if (!user) {

                showMessage(
                    document.getElementById(
                        "investmentMessage"
                    ),
                    "Please log in again before submitting an investment request.",
                    "error"
                );

                return;
            }


            // Validate selection

            if (!selectedPackageId) {

                showMessage(
                    document.getElementById(
                        "investmentMessage"
                    ),
                    "Please select an investment package.",
                    "error"
                );

                return;
            }


            if (!selectedPaymentMethod) {

                showMessage(
                    document.getElementById(
                        "investmentMessage"
                    ),
                    "Please select a payment method.",
                    "error"
                );

                return;
            }


            submitInvestment.disabled = true;

            submitInvestment.textContent =
                "SUBMITTING...";


            // Insert investment request

            const { data, error } =
                await supabaseClient
                    .from("investments")
                    .insert({

                        user_id: user.id,

                        package_id:
                            selectedPackageId,

                        amount:
                            selectedPackageAmount,

                        payment_method:
                            selectedPaymentMethod,

                        status: "pending"

                    })
                    .select()
                    .single();


            if (error) {

                console.error(
                    "Investment request error:",
                    error
                );


                showMessage(
                    document.getElementById(
                        "investmentMessage"
                    ),
                    error.message,
                    "error"
                );


                submitInvestment.disabled = false;

                submitInvestment.textContent =
                    "Submit Investment Request";

                return;
            }


            console.log(
                "Investment created:",
                data
            );


            const paymentName =
                selectedPaymentMethod === "bank"
                    ? "Bank Account"
                    : "Crypto Funding";


            showMessage(
                document.getElementById(
                    "investmentMessage"
                ),
                `Investment request submitted successfully. Package: $${selectedPackageAmount.toLocaleString()} — Payment method: ${paymentName}. Your request is pending confirmation.`,
                "success"
            );


            // Reset selection

            selectedPackageId = null;

            selectedPackageAmount = null;

            selectedPaymentMethod = null;


            packageButtons.forEach((button) => {

                button.classList.remove(
                    "selected"
                );

            });


            paymentOptions.forEach((option) => {

                option.classList.remove(
                    "selected"
                );

            });


            const selectedBox =
                document.getElementById(
                    "selectedPackageBox"
                );


            if (selectedBox) {
                selectedBox.style.display = "none";
            }


            const paymentBox =
                document.getElementById(
                    "paymentMethodBox"
                );


            if (paymentBox) {
                paymentBox.style.display = "none";
            }


            submitInvestment.style.display =
                "none";


            submitInvestment.disabled = false;

            submitInvestment.textContent =
                "Submit Investment Request";


            // Refresh history

            await loadInvestmentHistory(user.id);

        }
    );

}


// ======================================================
// LOAD INVESTMENT HISTORY
// ======================================================

async function loadInvestmentHistory(userId) {

    if (!investmentHistory || !userId) {
        return;
    }


    investmentHistory.innerHTML =
        "<p>Loading your investment requests...</p>";


    const { data, error } =
        await supabaseClient
            .from("investments")
            .select(`
                id,
                amount,
                payment_method,
                status,
                created_at,
                packages (
                    name
                )
            `)
            .eq("user_id", userId)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "Investment history error:",
            error
        );


        investmentHistory.innerHTML =
            "<p>Unable to load investment requests.</p>";

        return;
    }


    if (!data || data.length === 0) {

        investmentHistory.innerHTML =
            "<p>You have no investment requests yet.</p>";

        return;
    }


    investmentHistory.innerHTML = "";


    data.forEach((investment) => {

        const card =
            document.createElement("div");


        card.className =
            "investment-history-card";


        const packageName =
            investment.packages?.name ||
            "Investment Package";


        const paymentMethod =
            investment.payment_method === "bank"
                ? "Bank Account"
                : "Crypto Funding";


        const status =
            formatStatus(
                investment.status
            );


        const date =
            new Date(
                investment.created_at
            ).toLocaleDateString();


        card.innerHTML = `

            <div>

                <strong>
                    ${escapeHtml(packageName)}
                </strong>

                <p>
                    Amount:
                    $${Number(investment.amount).toLocaleString()}
                </p>

                <p>
                    Payment:
                    ${escapeHtml(paymentMethod)}
                </p>

                <p>
                    Date:
                    ${escapeHtml(date)}
                </p>

            </div>

            <div>

                <strong>
                    ${escapeHtml(status)}
                </strong>

            </div>

        `;


        investmentHistory.appendChild(card);

    });

}


// ======================================================
// BASIC HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const { error } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                return;
            }


            if (dashboard) {
                dashboard.style.display = "none";
            }


            window.location.hash = "login";


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


// ======================================================
// CHECK CURRENT SESSION
// ======================================================

async function checkCurrentSession() {

    const {
        data: {
            session
        }
    } =
        await supabaseClient.auth.getSession();


    if (session?.user) {

        await loadDashboard(
            session.user
        );

    } else {

        if (dashboard) {
            dashboard.style.display = "none";
        }

    }

}


// ======================================================
// AUTH STATE CHANGES
// ======================================================

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );


        if (
            event === "SIGNED_IN" &&
            session?.user
        ) {

            await loadDashboard(
                session.user
            );

        }


        if (
            event === "SIGNED_OUT"
        ) {

            if (dashboard) {
                dashboard.style.display = "none";
            }

        }

    }
);


// ======================================================
// START APPLICATION
// ======================================================

checkCurrentSession();