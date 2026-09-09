/* =========================================================
   MONARCH CODEX
   Main Application Script
   ========================================================= */

/* -----------------------------
   SUPABASE CONFIGURATION
----------------------------- */

const SUPABASE_URL = "https://avaworleivncevaoqeny.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

let supabaseClient = null;


/* -----------------------------
   INITIALIZE SUPABASE
----------------------------- */

function initializeSupabase() {
    if (
        typeof window.supabase === "undefined" ||
        !window.supabase.createClient
    ) {
        console.error("Supabase library has not loaded.");
        return false;
    }

    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );
    }

    return true;
}


/* -----------------------------
   HELPER FUNCTIONS
----------------------------- */

function getElement(id) {
    return document.getElementById(id);
}


function setMessage(id, message, type = "") {
    const element = getElement(id);

    if (!element) return;

    element.textContent = message;

    element.className = "form-message";

    if (type) {
        element.classList.add(type);
    }
}


function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatAmount(amount) {
    return "$" + Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


/* -----------------------------
   MOBILE MENU
----------------------------- */

function setupMobileMenu() {
    const menuButton = getElement("menuButton");
    const navLinks = document.querySelector(".nav-links");

    if (!menuButton || !navLinks) return;

    menuButton.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}


/* -----------------------------
   REGISTRATION
----------------------------- */

async function handleRegistration(event) {
    event.preventDefault();

    if (!initializeSupabase()) {
        setMessage(
            "registrationMessage",
            "System is still loading. Please try again.",
            "error"
        );
        return;
    }

    const fullname = getElement("fullname")?.value.trim();
    const email = getElement("email")?.value.trim();
    const phone = getElement("phone")?.value.trim();
    const password = getElement("password")?.value;

    if (!fullname || !email || !phone || !password) {
        setMessage(
            "registrationMessage",
            "Please complete all fields.",
            "error"
        );
        return;
    }

    if (password.length < 6) {
        setMessage(
            "registrationMessage",
            "Password must be at least 6 characters.",
            "error"
        );
        return;
    }

    const button = event.target.querySelector("button[type='submit']");

    if (button) {
        button.disabled = true;
        button.textContent = "Creating Account...";
    }

    setMessage(
        "registrationMessage",
        "Creating your Monarch Codex account...",
        ""
    );

    try {
        const redirectURL =
            window.location.origin +
            window.location.pathname.replace(
                "register.html",
                "login.html"
            );

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullname,
                    phone: phone
                },
                emailRedirectTo: redirectURL
            }
        });

        if (error) {
            throw error;
        }

        if (data.user) {
            if (data.session) {
                setMessage(
                    "registrationMessage",
                    "Account created successfully. Redirecting to login...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);

            } else {
                setMessage(
                    "registrationMessage",
                    "Account created. Please check your email and confirm your account before logging in.",
                    "success"
                );
            }
        }

    } catch (error) {

        console.error("Registration error:", error);

        setMessage(
            "registrationMessage",
            error.message || "Registration failed. Please try again.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Create Account";
        }
    }
}


/* -----------------------------
   LOGIN
----------------------------- */

async function handleLogin(event) {
    event.preventDefault();

    if (!initializeSupabase()) {
        setMessage(
            "loginMessage",
            "System is still loading. Please try again.",
            "error"
        );
        return;
    }

    const email = getElement("loginEmail")?.value.trim();
    const password = getElement("loginPassword")?.value;

    if (!email || !password) {
        setMessage(
            "loginMessage",
            "Please enter your email and password.",
            "error"
        );
        return;
    }

    const button = event.target.querySelector("button[type='submit']");

    if (button) {
        button.disabled = true;
        button.textContent = "Logging In...";
    }

    setMessage(
        "loginMessage",
        "Signing you in...",
        ""
    );

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw error;
        }

        if (!data.session) {
            throw new Error("Login session could not be created.");
        }

        setMessage(
            "loginMessage",
            "Login successful. Opening your dashboard...",
            "success"
        );

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 700);

    } catch (error) {

        console.error("Login error:", error);

        setMessage(
            "loginMessage",
            error.message || "Login failed. Please check your details.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Login";
        }
    }
}


/* -----------------------------
   GET CURRENT SESSION
----------------------------- */

async function getCurrentSession() {
    if (!initializeSupabase()) {
        return null;
    }

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            return null;
        }

        return data.session;

    } catch (error) {

        console.error("Could not get session:", error);
        return null;
    }
}


/* -----------------------------
   DASHBOARD PROTECTION
----------------------------- */

async function protectDashboard() {

    const isDashboard =
        window.location.pathname.endsWith("dashboard.html");

    if (!isDashboard) return;

    const session = await getCurrentSession();

    if (!session) {

        window.location.href = "login.html";

        return;
    }

    await loadDashboard(session.user);
}


/* -----------------------------
   LOAD MEMBER PROFILE
----------------------------- */

async function loadDashboard(user) {

    if (!user || !supabaseClient) return;

    try {

        const { data: profile, error } =
            await supabaseClient
                .from("profiles")
                .select("full_name, phone, role, status")
                .eq("id", user.id)
                .single();

        if (error) {
            throw error;
        }

        const dashboardName = getElement("dashboardName");
        const profileName = getElement("profileName");
        const profilePhone = getElement("profilePhone");
        const profileStatus = getElement("profileStatus");

        const name =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            "Monarch";

        if (dashboardName) {
            dashboardName.textContent = name;
        }

        if (profileName) {
            profileName.textContent = name;
        }

        if (profilePhone) {
            profilePhone.textContent =
                profile?.phone || "Not provided";
        }

        if (profileStatus) {
            profileStatus.textContent =
                profile?.status || "pending";
        }

        await loadPackages();
        await loadInvestmentHistory(user.id);

    } catch (error) {

        console.error("Dashboard error:", error);

        setMessage(
            "investmentMessage",
            "Unable to load your account information.",
            "error"
        );
    }
}


/* -----------------------------
   LOAD INVESTMENT PACKAGES
----------------------------- */

async function loadPackages() {

    const packageSelect = getElement("packageSelect");

    if (!packageSelect || !supabaseClient) return;

    try {

        const { data: packages, error } =
            await supabaseClient
                .from("packages")
                .select("id, name, amount")
                .eq("active", true)
                .order("amount", {
                    ascending: true
                });

        if (error) {
            throw error;
        }

        packageSelect.innerHTML =
            '<option value="">Select a package</option>';

        if (!packages || packages.length === 0) {

            packageSelect.innerHTML =
                '<option value="">No packages available</option>';

            return;
        }

        packages.forEach((pkg) => {

            const option = document.createElement("option");

            option.value = pkg.id;

            option.textContent =
                `${pkg.name} — ${formatAmount(pkg.amount)}`;

            packageSelect.appendChild(option);
        });

    } catch (error) {

        console.error("Package loading error:", error);

        packageSelect.innerHTML =
            '<option value="">Unable to load packages</option>';
    }
}


/* -----------------------------
   INVESTMENT REQUEST
----------------------------- */

async function handleInvestment(event) {

    event.preventDefault();

    if (!initializeSupabase()) {
        setMessage(
            "investmentMessage",
            "System is still loading. Please try again.",
            "error"
        );
        return;
    }

    const session = await getCurrentSession();

    if (!session) {

        window.location.href = "login.html";

        return;
    }

    const packageId =
        getElement("packageSelect")?.value;

    const paymentMethod =
        getElement("paymentMethod")?.value;

    if (!packageId || !paymentMethod) {

        setMessage(
            "investmentMessage",
            "Please select a package and payment method.",
            "error"
        );

        return;
    }

    const button =
        event.target.querySelector("button[type='submit']");

    if (button) {
        button.disabled = true;
        button.textContent = "Submitting...";
    }

    setMessage(
        "investmentMessage",
        "Submitting your investment request...",
        ""
    );

    try {

        /*
         IMPORTANT:
         The database trigger automatically sets
         the correct amount from the selected package.
        */

        const { error } =
            await supabaseClient
                .from("investments")
                .insert({
                    user_id: session.user.id,
                    package_id: Number(packageId),
                    payment_method: paymentMethod,
                    status: "pending"
                });

        if (error) {
            throw error;
        }

        setMessage(
            "investmentMessage",
            "Investment request submitted successfully. It is now pending review.",
            "success"
        );

        const form = getElement("investmentForm");

        if (form) {
            form.reset();
        }

        await loadInvestmentHistory(session.user.id);

    } catch (error) {

        console.error("Investment error:", error);

        setMessage(
            "investmentMessage",
            error.message ||
            "Investment request could not be submitted.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Submit Investment Request";
        }
    }
}


/* -----------------------------
   INVESTMENT HISTORY
----------------------------- */

async function loadInvestmentHistory(userId) {

    const history =
        getElement("investmentHistory");

    if (!history || !supabaseClient) return;

    try {

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
            throw error;
        }

        if (!data || data.length === 0) {

            history.innerHTML = `
                <tr>
                    <td colspan="5">
                        No investment requests yet.
                    </td>
                </tr>
            `;

            return;
        }

        history.innerHTML = "";

        data.forEach((investment) => {

            const row =
                document.createElement("tr");

            const packageName =
                investment.packages?.name ||
                "Investment Package";

            const payment =
                investment.payment_method === "crypto"
                    ? "Crypto Funding"
                    : "Bank Account";

            const status =
                investment.status || "pending";

            row.innerHTML = `
                <td>${escapeHTML(packageName)}</td>

                <td>${escapeHTML(
                    formatAmount(investment.amount)
                )}</td>

                <td>${escapeHTML(payment)}</td>

                <td>
                    <span class="status-badge status-${escapeHTML(status)}">
                        ${escapeHTML(
                            status.charAt(0).toUpperCase() +
                            status.slice(1)
                        )}
                    </span>
                </td>

                <td>${escapeHTML(
                    formatDate(investment.created_at)
                )}</td>
            `;

            history.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Investment history error:",
            error
        );

        history.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load investment history.
                </td>
            </tr>
        `;
    }
}


/* -----------------------------
   LOGOUT
----------------------------- */

async function handleLogout() {

    if (!initializeSupabase()) return;

    const button = getElement("logoutBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Logging out...";
    }

    try {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.href = "login.html";

    } catch (error) {

        console.error("Logout error:", error);

        if (button) {
            button.disabled = false;
            button.textContent = "Logout";
        }

        alert("Logout failed. Please try again.");
    }
}


/* -----------------------------
   AUTH STATE LISTENER
----------------------------- */

function setupAuthListener() {

    if (!initializeSupabase()) return;

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            console.log(
                "Auth event:",
                event
            );

            /*
             Do not automatically redirect
             from login/register here.
             The individual pages handle
             their own navigation.
            */

        }
    );
}


/* -----------------------------
   PAGE SETUP
----------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeSupabase();

        setupMobileMenu();

        setupAuthListener();


        /* Registration page */

        const registrationForm =
            getElement("registrationForm");

        if (registrationForm) {

            registrationForm.addEventListener(
                "submit",
                handleRegistration
            );
        }


        /* Login page */

        const loginForm =
            getElement("loginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        /* Investment form */

        const investmentForm =
            getElement("investmentForm");

        if (investmentForm) {

            investmentForm.addEventListener(
                "submit",
                handleInvestment
            );
        }


        /* Logout */

        const logoutBtn =
            getElement("logoutBtn");

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                handleLogout
            );
        }


        /* Protect dashboard */

        await protectDashboard();
    }
);