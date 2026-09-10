/* =====================================================
   MONARCH CODEX
   Main JavaScript
   ===================================================== */

const SUPABASE_URL =
    "https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_KEY =
    "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";
let db;


/* =====================================================
   START SUPABASE
   ===================================================== */

function startSupabase() {

    if (!window.supabase) {
        console.error("Supabase library not loaded.");
        return false;
    }

    if (!db) {
        db = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );
    }

    return true;
}


/* =====================================================
   GET ELEMENT
   ===================================================== */

function $(id) {
    return document.getElementById(id);
}


/* =====================================================
   PAGE READY
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Monarch Codex JavaScript loaded.");

    startSupabase();

    setupMobileMenu();

    setupRegistration();

    setupLogin();

    setupInvestment();

    setupLogout();

    checkDashboard();

});


/* =====================================================
   MOBILE MENU
   ===================================================== */

function setupMobileMenu() {

    const menuButton = $("menuButton");
    const navLinks = $("navLinks");

    if (!menuButton || !navLinks) {
        return;
    }

    menuButton.addEventListener("click", function () {

        navLinks.classList.toggle("active");

    });

}


/* =====================================================
   REGISTRATION
   ===================================================== */

function setupRegistration() {

    const form = $("registrationForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!startSupabase()) {
            showMessage(
                "registrationMessage",
                "System is loading. Please try again.",
                "error"
            );
            return;
        }

        const fullname =
            $("fullname").value.trim();

        const email =
            $("email").value.trim();

        const phone =
            $("phone").value.trim();

        const password =
            $("password").value;


        if (!fullname || !email || !phone || !password) {

            showMessage(
                "registrationMessage",
                "Please fill in all fields.",
                "error"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "registrationMessage",
                "Password must contain at least 6 characters.",
                "error"
            );

            return;
        }


        const button =
            form.querySelector("button[type='submit']");

        if (button) {
            button.disabled = true;
            button.textContent = "Creating Account...";
        }


        showMessage(
            "registrationMessage",
            "Creating your account...",
            ""
        );


        try {

            const loginPage =
                window.location.origin +
                window.location.pathname.replace(
                    "register.html",
                    "login.html"
                );


            const result =
                await db.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {
                            full_name: fullname,
                            phone: phone
                        },

                        emailRedirectTo: loginPage
                    }

                });


            if (result.error) {
                throw result.error;
            }


            showMessage(
                "registrationMessage",
                "Account created successfully. Check your email to confirm your account.",
                "success"
            );


            form.reset();


        } catch (error) {

            console.error(error);

            showMessage(
                "registrationMessage",
                error.message ||
                "Registration failed.",
                "error"
            );

        }


        if (button) {

            button.disabled = false;

            button.textContent =
                "Create Account";

        }

    });

}


/* =====================================================
   LOGIN
   ===================================================== */

function setupLogin() {

    const form = $("loginForm");

    if (!form) {
        return;
    }


    form.addEventListener("submit", async function (event) {

        event.preventDefault();


        if (!startSupabase()) {

            showMessage(
                "loginMessage",
                "System is loading. Please try again.",
                "error"
            );

            return;
        }


        const email =
            $("loginEmail").value.trim();

        const password =
            $("loginPassword").value;


        if (!email || !password) {

            showMessage(
                "loginMessage",
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        const button =
            form.querySelector("button[type='submit']");


        if (button) {

            button.disabled = true;

            button.textContent =
                "Logging In...";

        }


        showMessage(
            "loginMessage",
            "Signing you in...",
            ""
        );


        try {

            const result =
                await db.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (result.error) {
                throw result.error;
            }


            showMessage(
                "loginMessage",
                "Login successful. Opening dashboard...",
                "success"
            );


            setTimeout(function () {

                window.location.href =
                    "dashboard.html";

            }, 700);


        } catch (error) {

            console.error(error);

            showMessage(
                "loginMessage",
                error.message ||
                "Login failed.",
                "error"
            );

        }


        if (button) {

            button.disabled = false;

            button.textContent =
                "Login";

        }

    });

}


/* =====================================================
   DASHBOARD CHECK
   ===================================================== */

async function checkDashboard() {

    const isDashboard =
        window.location.pathname.endsWith(
            "dashboard.html"
        );


    if (!isDashboard) {
        return;
    }


    if (!startSupabase()) {

        window.location.href =
            "login.html";

        return;
    }


    const result =
        await db.auth.getSession();


    if (result.error || !result.data.session) {

        window.location.href =
            "login.html";

        return;
    }


    const user =
        result.data.session.user;


    await loadProfile(user);

}


/* =====================================================
   LOAD PROFILE
   ===================================================== */

async function loadProfile(user) {

    try {

        const result =
            await db
                .from("profiles")
                .select(
                    "full_name, phone, role, status"
                )
                .eq("id", user.id)
                .single();


        if (result.error) {
            throw result.error;
        }


        const profile =
            result.data;


        const name =
            profile.full_name ||
            user.user_metadata?.full_name ||
            "Monarch";


        if ($("dashboardName")) {

            $("dashboardName").textContent =
                name;

        }


        if ($("profileName")) {

            $("profileName").textContent =
                name;

        }


        if ($("profilePhone")) {

            $("profilePhone").textContent =
                profile.phone ||
                "Not provided";

        }


        if ($("profileStatus")) {

            $("profileStatus").textContent =
                profile.status ||
                "pending";

        }


        await loadPackages();

        await loadHistory(user.id);


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

    }

}


/* =====================================================
   LOAD PACKAGES
   ===================================================== */

async function loadPackages() {

    const select =
        $("packageSelect");


    if (!select) {
        return;
    }


    try {

        const result =
            await db
                .from("packages")
                .select(
                    "id, name, amount"
                )
                .eq("active", true)
                .order(
                    "amount",
                    {
                        ascending: true
                    }
                );


        if (result.error) {
            throw result.error;
        }


        select.innerHTML =
            '<option value="">Select a package</option>';


        result.data.forEach(function (pkg) {

            const option =
                document.createElement("option");


            option.value =
                pkg.id;


            option.textContent =
                pkg.name +
                " — $" +
                Number(pkg.amount).toLocaleString();


            select.appendChild(option);

        });


    } catch (error) {

        console.error(
            "Package error:",
            error
        );

    }

}


/* =====================================================
   INVESTMENT
   ===================================================== */

function setupInvestment() {

    const form =
        $("investmentForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!startSupabase()) {
                return;
            }


            const sessionResult =
                await db.auth.getSession();


            if (
                sessionResult.error ||
                !sessionResult.data.session
            ) {

                window.location.href =
                    "login.html";

                return;
            }


            const user =
                sessionResult.data.session.user;


            const packageId =
                $("packageSelect").value;


            const paymentMethod =
                $("paymentMethod").value;


            if (!packageId || !paymentMethod) {

                showMessage(
                    "investmentMessage",
                    "Please select a package and payment method.",
                    "error"
                );

                return;
            }


            const button =
                form.querySelector(
                    "button[type='submit']"
                );


            if (button) {

                button.disabled = true;

                button.textContent =
                    "Submitting...";

            }


            try {

                const result =
                    await db
                        .from("investments")
                        .insert({

                            user_id:
                                user.id,

                            package_id:
                                Number(packageId),

                            payment_method:
                                paymentMethod,

                            status:
                                "pending"

                        });


                if (result.error) {
                    throw result.error;
                }


                showMessage(
                    "investmentMessage",
                    "Investment request submitted successfully.",
                    "success"
                );


                form.reset();


                await loadHistory(
                    user.id
                );


            } catch (error) {

                console.error(error);


                showMessage(
                    "investmentMessage",
                    error.message ||
                    "Request failed.",
                    "error"
                );

            }


            if (button) {

                button.disabled = false;

                button.textContent =
                    "Submit Investment Request";

            }

        }
    );

}


/* =====================================================
   INVESTMENT HISTORY
   ===================================================== */

async function loadHistory(userId) {

    const table =
        $("investmentHistory");


    if (!table) {
        return;
    }


    try {

        const result =
            await db
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
                .eq(
                    "user_id",
                    userId
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (result.error) {
            throw result.error;
        }


        if (
            !result.data ||
            result.data.length === 0
        ) {

            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        No investment requests yet.
                    </td>
                </tr>
            `;

            return;
        }


        table.innerHTML = "";


        result.data.forEach(
            function (investment) {

                const row =
                    document.createElement("tr");


                const packageName =
                    investment.packages?.name ||
                    "Package";


                const payment =
                    investment.payment_method ===
                    "crypto"
                        ? "Crypto Funding"
                        : "Bank Account";


                const status =
                    investment.status ||
                    "pending";


                const amount =
                    "$" +
                    Number(
                        investment.amount
                    ).toLocaleString();


                const date =
                    new Date(
                        investment.created_at
                    ).toLocaleDateString();


                row.innerHTML = `

                    <td>
                        ${escapeHTML(packageName)}
                    </td>

                    <td>
                        ${escapeHTML(amount)}
                    </td>

                    <td>
                        ${escapeHTML(payment)}
                    </td>

                    <td>
                        ${escapeHTML(status)}
                    </td>

                    <td>
                        ${escapeHTML(date)}
                    </td>

                `;


                table.appendChild(row);

            }
        );


    } catch (error) {

        console.error(
            "History error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load history.
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   LOGOUT
   ===================================================== */

function setupLogout() {

    const button =
        $("logoutBtn");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function () {

            if (!startSupabase()) {
                return;
            }


            button.disabled = true;


            const result =
                await db.auth.signOut();


            if (result.error) {

                console.error(
                    result.error
                );

                button.disabled = false;

                alert(
                    "Logout failed. Please try again."
                );

                return;
            }


            window.location.href =
                "login.html";

        }
    );

}


/* =====================================================
   MESSAGE
   ===================================================== */

function showMessage(
    id,
    message,
    type
) {

    const element =
        $(id);


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "form-message";


    if (type) {

        element.classList.add(
            type
        );

    }

}


/* =====================================================
   SECURITY HELPER
   ===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
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

}