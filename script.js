/* =========================================================
   MONARCH CODEX
   Supabase + Member Dashboard + Admin Command Center
   ========================================================= */

const SUPABASE_URL =
    "https://avaworleivncevaoqeny.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JiPjIh";


/* =========================================================
   SUPABASE INITIALIZATION
   ========================================================= */

let supabaseClient = null;

function getSupabase() {

    if (!supabaseClient) {

        if (
            typeof window.supabase === "undefined" ||
            typeof window.supabase.createClient !== "function"
        ) {
            throw new Error("Supabase library has not loaded yet.");
        }

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );
    }

    return supabaseClient;
}


/* =========================================================
   PAGE READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        setupMobileMenu();

        setupRegistration();

        setupLogin();

        setupLogout();

        setupAdminLogout();

        await setupMemberDashboard();

        await setupAdminDashboard();

    } catch (error) {

        console.error(
            "Monarch Codex error:",
            error
        );

    }

});


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const menuButton =
        document.getElementById("menuButton");

    const navLinks =
        document.getElementById("navLinks");

    if (!menuButton || !navLinks) {
        return;
    }

    menuButton.addEventListener("click", () => {

        navLinks.classList.toggle("active");

    });

}


/* =========================================================
   REGISTRATION
   ========================================================= */

function setupRegistration() {

    const form =
        document.getElementById("registrationForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const message =
            document.getElementById(
                "registrationMessage"
            );

        const fullName =
            document.getElementById(
                "fullname"
            ).value.trim();

        const email =
            document.getElementById(
                "email"
            ).value.trim();

        const phone =
            document.getElementById(
                "phone"
            ).value.trim();

        const password =
            document.getElementById(
                "password"
            ).value;

        if (!fullName || !email || !password) {

            if (message) {
                message.textContent =
                    "Please complete all required fields.";
            }

            return;
        }

        try {

            const supabase =
                getSupabase();

            if (message) {
                message.textContent =
                    "Creating your Monarch account...";
            }

            const {
                data,
                error
            } = await supabase.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        full_name: fullName,

                        phone: phone

                    }

                }

            });


            if (error) {
                throw error;
            }


            if (message) {

                if (
                    data.user &&
                    data.session
                ) {

                    message.textContent =
                        "Account created successfully. Redirecting...";

                    setTimeout(() => {

                        window.location.href =
                            "dashboard.html";

                    }, 1000);

                } else {

                    message.textContent =
                        "Account created. Please check your email to confirm your account.";

                }

            }

            form.reset();

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            if (message) {

                message.textContent =
                    error.message ||
                    "Registration failed.";

            }

        }

    });

}


/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {

    const form =
        document.getElementById("loginForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const message =
            document.getElementById(
                "loginMessage"
            );

        const email =
            document.getElementById(
                "loginEmail"
            ).value.trim();

        const password =
            document.getElementById(
                "loginPassword"
            ).value;


        if (!email || !password) {

            if (message) {
                message.textContent =
                    "Please enter your email and password.";
            }

            return;
        }


        try {

            const supabase =
                getSupabase();

            if (message) {
                message.textContent =
                    "Signing you in...";
            }


            const {
                data,
                error
            } = await supabase.auth.signInWithPassword({

                email: email,

                password: password

            });


            if (error) {
                throw error;
            }


            if (!data.session) {
                throw new Error(
                    "Login succeeded but no session was created."
                );
            }


            if (message) {
                message.textContent =
                    "Login successful. Redirecting...";
            }


            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 500);


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            if (message) {

                message.textContent =
                    error.message ||
                    "Login failed.";

            }

        }

    });

}


/* =========================================================
   MEMBER DASHBOARD
   ========================================================= */

async function setupMemberDashboard() {

    const dashboardName =
        document.getElementById(
            "dashboardName"
        );

    const investmentForm =
        document.getElementById(
            "investmentForm"
        );

    /*
       If none of the member-dashboard elements exist,
       this isn't the member dashboard.
    */

    if (
        !dashboardName &&
        !investmentForm
    ) {
        return;
    }


    /*
       Don't run member-dashboard logic on admin.html.
    */

    if (
        document.getElementById(
            "adminTotalMembers"
        )
    ) {
        return;
    }


    try {

        const supabase =
            getSupabase();


        const {
            data: {
                session
            }
        } = await supabase.auth.getSession();


        if (!session) {

            window.location.href =
                "login.html";

            return;

        }


        await loadMemberProfile(
            session.user.id
        );


        await loadPackages();


        await loadInvestmentHistory(
            session.user.id
        );


        setupInvestmentForm(
            session.user.id
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


/* =========================================================
   LOAD MEMBER PROFILE
   ========================================================= */

async function loadMemberProfile(
    userId
) {

    const supabase =
        getSupabase();


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(
            "full_name, phone, role, status"
        )
        .eq("id", userId)
        .single();


    if (error) {

        console.error(
            "Profile error:",
            error
        );

        return;

    }


    const dashboardName =
        document.getElementById(
            "dashboardName"
        );

    const profileName =
        document.getElementById(
            "profileName"
        );

    const profilePhone =
        document.getElementById(
            "profilePhone"
        );

    const profileStatus =
        document.getElementById(
            "profileStatus"
        );

    const profileStatusInfo =
        document.getElementById(
            "profileStatusInfo"
        );


    if (dashboardName) {

        dashboardName.textContent =
            data.full_name ||
            "Monarch";

    }


    if (profileName) {

        profileName.textContent =
            data.full_name ||
            "Not available";

    }


    if (profilePhone) {

        profilePhone.textContent =
            data.phone ||
            "Not provided";

    }


    if (profileStatus) {

        profileStatus.textContent =
            capitalizeStatus(
                data.status
            );

    }


    if (profileStatusInfo) {

        profileStatusInfo.textContent =
            capitalizeStatus(
                data.status
            );

    }

}


/* =========================================================
   LOAD PACKAGES
   ========================================================= */

async function loadPackages() {

    const select =
        document.getElementById(
            "packageSelect"
        );

    if (!select) {
        return;
    }


    const supabase =
        getSupabase();


    const {
        data,
        error
    } = await supabase
        .from("packages")
        .select(
            "id, name, amount"
        )
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
            "Package error:",
            error
        );

        return;

    }


    select.innerHTML =
        '<option value="">Select a package</option>';


    data.forEach((pkg) => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            pkg.id;

        option.textContent =
            `${pkg.name} — $${Number(
                pkg.amount
            ).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2
                }
            )}`;

        select.appendChild(
            option
        );

    });

}


/* =========================================================
   INVESTMENT FORM
   ========================================================= */

function setupInvestmentForm(
    userId
) {

    const form =
        document.getElementById(
            "investmentForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const packageSelect =
                document.getElementById(
                    "packageSelect"
                );

            const paymentMethod =
                document.getElementById(
                    "paymentMethod"
                );

            const message =
                document.getElementById(
                    "investmentMessage"
                );


            const packageId =
                packageSelect.value;

            const payment =
                paymentMethod.value;


            if (
                !packageId ||
                !payment
            ) {

                if (message) {

                    message.textContent =
                        "Please select a package and payment method.";

                }

                return;

            }


            try {

                const supabase =
                    getSupabase();


                if (message) {

                    message.textContent =
                        "Submitting your investment request...";

                }


                const {
                    error
                } = await supabase
                    .from("investments")
                    .insert({

                        user_id:
                            userId,

                        package_id:
                            Number(packageId),

                        payment_method:
                            payment

                    });


                if (error) {
                    throw error;
                }


                if (message) {

                    message.textContent =
                        "Investment request submitted successfully.";

                }


                form.reset();


                await loadInvestmentHistory(
                    userId
                );


            } catch (error) {

                console.error(
                    "Investment error:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message ||
                        "Unable to submit investment request.";

                }

            }

        }
    );

}


/* =========================================================
   INVESTMENT HISTORY
   ========================================================= */

async function loadInvestmentHistory(
    userId
) {

    const table =
        document.getElementById(
            "investmentHistory"
        );

    if (!table) {
        return;
    }


    const supabase =
        getSupabase();


    const {
        data,
        error
    } = await supabase
        .from("investments")
        .select(
            `
            id,
            amount,
            payment_method,
            status,
            created_at,
            packages (
                name
            )
            `
        )
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


    if (error) {

        console.error(
            "Investment history error:",
            error
        );

        table.innerHTML =
            `<tr>
                <td colspan="5">
                    Unable to load investment history.
                </td>
            </tr>`;

        return;

    }


    if (!data || data.length === 0) {

        table.innerHTML =
            `<tr>
                <td colspan="5">
                    No investment requests yet.
                </td>
            </tr>`;

        return;

    }


    table.innerHTML = "";


    data.forEach(
        (investment) => {

            const row =
                document.createElement(
                    "tr"
                );


            const packageName =
                investment.packages &&
                investment.packages.name
                    ? investment.packages.name
                    : "Investment Package";


            const amount =
                Number(
                    investment.amount
                ).toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2
                    }
                );


            const payment =
                investment.payment_method ===
                "crypto"
                    ? "Crypto"
                    : "Bank";


            const status =
                capitalizeStatus(
                    investment.status
                );


            const date =
                new Date(
                    investment.created_at
                ).toLocaleDateString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    }
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(packageName)}
                </td>

                <td>
                    $${amount}
                </td>

                <td>
                    ${payment}
                </td>

                <td>
                    ${status}
                </td>

                <td>
                    ${date}
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

async function setupAdminDashboard() {

    const adminPage =
        document.getElementById(
            "adminTotalMembers"
        );


    if (!adminPage) {
        return;
    }


    try {

        const supabase =
            getSupabase();


        const {
            data: {
                session
            }
        } = await supabase.auth.getSession();


        if (!session) {

            window.location.href =
                "login.html";

            return;

        }


        /*
           First verify that this account is actually
           an active administrator.
        */

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select(
                "full_name, role, status"
            )
            .eq(
                "id",
                session.user.id
            )
            .single();


        if (
            profileError ||
            !profile ||
            profile.role !== "admin" ||
            profile.status !== "active"
        ) {

            alert(
                "Administrator access required."
            );

            window.location.href =
                "dashboard.html";

            return;

        }


        await loadAdminMembers();

        await loadAdminInvestments();


    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );

    }

}


/* =========================================================
   LOAD ADMIN MEMBERS
   ========================================================= */

async function loadAdminMembers() {

    const table =
        document.getElementById(
            "adminMembersTable"
        );

    if (!table) {
        return;
    }


    const supabase =
        getSupabase();


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(
            "id, full_name, phone, role, status, created_at"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Admin members error:",
            error
        );

        table.innerHTML =
            `<tr>
                <td colspan="5">
                    Unable to load members.
                </td>
            </tr>`;

        return;

    }


    const total =
        data.length;


    const active =
        data.filter(
            member =>
                member.status ===
                "active"
        ).length;


    const pending =
        data.filter(
            member =>
                member.status ===
                "pending"
        ).length;


    setText(
        "adminTotalMembers",
        total
    );

    setText(
        "adminActiveMembers",
        active
    );

    setText(
        "adminPendingMembers",
        pending
    );


    if (data.length === 0) {

        table.innerHTML =
            `<tr>
                <td colspan="5">
                    No Monarch accounts found.
                </td>
            </tr>`;

        return;

    }


    table.innerHTML = "";


    data.forEach(
        (member) => {

            const row =
                document.createElement(
                    "tr"
                );


            const joined =
                new Date(
                    member.created_at
                ).toLocaleDateString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    }
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        member.full_name ||
                        "Unnamed Monarch"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.phone ||
                        "Not provided"
                    )}
                </td>

                <td>
                    ${capitalizeStatus(
                        member.status
                    )}
                </td>

                <td>
                    ${capitalizeStatus(
                        member.role
                    )}
                </td>

                <td>
                    ${joined}
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   LOAD ADMIN INVESTMENTS
   ========================================================= */

async function loadAdminInvestments() {

    const table =
        document.getElementById(
            "adminInvestmentsTable"
        );

    if (!table) {
        return;
    }


    const supabase =
        getSupabase();


    const {
        data,
        error
    } = await supabase
        .from("investments")
        .select(
            `
            id,
            amount,
            payment_method,
            status,
            created_at,
            profiles (
                full_name
            ),
            packages (
                name
            )
            `
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Admin investment error:",
            error
        );

        table.innerHTML =
            `<tr>
                <td colspan="6">
                    Unable to load investment requests.
                </td>
            </tr>`;

        return;

    }


    const pending =
        data.filter(
            investment =>
                investment.status ===
                "pending"
        ).length;


    setText(
        "adminInvestmentRequests",
        pending
    );


    if (!data || data.length === 0) {

        table.innerHTML =
            `<tr>
                <td colspan="6">
                    No investment requests found.
                </td>
            </tr>`;

        return;

    }


    table.innerHTML = "";


    data.forEach(
        (investment) => {

            const row =
                document.createElement(
                    "tr"
                );


            const memberName =
                investment.profiles &&
                investment.profiles.full_name
                    ? investment.profiles.full_name
                    : "Unknown Monarch";


            const packageName =
                investment.packages &&
                investment.packages.name
                    ? investment.packages.name
                    : "Package";


            const amount =
                Number(
                    investment.amount
                ).toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2
                    }
                );


            const payment =
                investment.payment_method ===
                "crypto"
                    ? "Crypto"
                    : "Bank";


            const status =
                capitalizeStatus(
                    investment.status
                );


            const date =
                new Date(
                    investment.created_at
                ).toLocaleDateString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    }
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        memberName
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        packageName
                    )}
                </td>

                <td>
                    $${amount}
                </td>

                <td>
                    ${payment}
                </td>

                <td>
                    ${status}
                </td>

                <td>
                    ${date}
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   MEMBER LOGOUT
   ========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            try {

                const supabase =
                    getSupabase();

                await supabase.auth.signOut();

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   ADMIN LOGOUT
   ========================================================= */

function setupAdminLogout() {

    const button =
        document.getElementById(
            "adminLogoutBtn"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            try {

                const supabase =
                    getSupabase();

                await supabase.auth.signOut();

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Admin logout error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   HELPERS
   ========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.textContent =
            value;
    }

}


function capitalizeStatus(
    value
) {

    if (!value) {
        return "Unknown";
    }

    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value).slice(1);

}


function escapeHtml(
    value
) {

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

}