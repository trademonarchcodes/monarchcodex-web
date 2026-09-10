const SUPABASE_URL = "https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_KEY = "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("MONARCH CODEX SCRIPT LOADED");

// =====================================================
// HELPERS
// =====================================================

function showMessage(message, type = "info") {
    const box = document.getElementById("message");

    if (!box) {
        alert(message);
        return;
    }

    box.textContent = message;
    box.className = `message ${type}`;
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";
    }, 4000);
}


function formatMoney(amount) {
    return `$${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


function statusBadge(status) {
    const safeStatus = status || "pending";

    return `
        <span class="status-badge status-${safeStatus}">
            ${safeStatus.toUpperCase()}
        </span>
    `;
}


// =====================================================
// AUTH
// =====================================================

async function getCurrentUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return user;
}


async function logout() {

    await supabase.auth.signOut();

    window.location.href = "login.html";
}


// =====================================================
// REGISTRATION
// =====================================================

async function registerUser() {

    const fullName =
        document.getElementById("fullName")?.value.trim();

    const email =
        document.getElementById("email")?.value.trim();

    const phone =
        document.getElementById("phone")?.value.trim();

    const password =
        document.getElementById("password")?.value;


    if (!fullName || !email || !password) {

        showMessage(
            "Please fill in all required fields.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showMessage(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }


    const { data, error } =
        await supabase.auth.signUp({

            email,
            password,

            options: {
                data: {
                    full_name: fullName,
                    phone: phone
                }
            }

        });


    if (error) {

        console.error(error);

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    if (data.user) {

        showMessage(
            "Account created successfully. Please check your email if confirmation is required.",
            "success"
        );


        setTimeout(() => {

            window.location.href = "login.html";

        }, 2000);
    }
}


// =====================================================
// LOGIN
// =====================================================

async function loginUser() {

    const email =
        document.getElementById("email")?.value.trim();

    const password =
        document.getElementById("password")?.value;


    if (!email || !password) {

        showMessage(
            "Enter your email and password.",
            "error"
        );

        return;
    }


    const { data, error } =
        await supabase.auth.signInWithPassword({

            email,
            password

        });


    if (error) {

        console.error(error);

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    if (data.user) {

        const { data: profile } =
            await supabase
                .from("profiles")
                .select("role,status")
                .eq("id", data.user.id)
                .single();


        if (profile?.role === "admin") {

            window.location.href = "admin.html";

        } else {

            window.location.href = "dashboard.html";

        }
    }
}


// =====================================================
// MEMBER DASHBOARD
// =====================================================

async function loadMemberDashboard() {

    const user = await getCurrentUser();


    if (!user) {

        window.location.href = "login.html";

        return;
    }


    const { data: profile, error } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();


    if (error) {

        console.error(error);

        return;
    }


    const nameElement =
        document.getElementById("memberName");


    if (nameElement) {

        nameElement.textContent =
            profile.full_name || "Monarch";
    }


    const emailElement =
        document.getElementById("memberEmail");


    if (emailElement) {

        emailElement.textContent =
            user.email || "";
    }


    await loadPackages();

    await loadInvestmentHistory(user.id);
}


// =====================================================
// PACKAGES
// =====================================================

async function loadPackages() {

    const container =
        document.getElementById("packageOptions");


    if (!container) return;


    const { data: packages, error } =
        await supabase
            .from("packages")
            .select("*")
            .eq("active", true)
            .order("amount", {
                ascending: true
            });


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load packages.</p>";

        return;
    }


    container.innerHTML = "";


    packages.forEach(pkg => {

        const card =
            document.createElement("div");


        card.className =
            "package-card";


        card.dataset.packageId =
            pkg.id;


        card.innerHTML = `

            <div class="package-name">
                ${pkg.name}
            </div>

            <div class="package-amount">
                ${formatMoney(pkg.amount)}
            </div>

        `;


        card.addEventListener("click", () => {

            document
                .querySelectorAll(".package-card")
                .forEach(item =>
                    item.classList.remove("selected")
                );


            card.classList.add("selected");


            const hiddenInput =
                document.getElementById("selectedPackage");


            if (hiddenInput) {

                hiddenInput.value =
                    pkg.id;
            }


            window.selectedPackageId =
                pkg.id;

        });


        container.appendChild(card);

    });
}


// =====================================================
// SUBMIT INVESTMENT
// =====================================================

async function submitInvestment() {

    const user =
        await getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    const packageId =
        window.selectedPackageId ||
        document.getElementById(
            "selectedPackage"
        )?.value;


    const paymentMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value;


    if (!packageId) {

        showMessage(
            "Please select an investment package.",
            "error"
        );

        return;
    }


    if (!paymentMethod) {

        showMessage(
            "Please select a payment method.",
            "error"
        );

        return;
    }


    const { error } =
        await supabase
            .from("investments")
            .insert({

                user_id: user.id,

                package_id: Number(packageId),

                payment_method: paymentMethod,

                status: "pending"

            });


    if (error) {

        console.error(error);

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Investment request submitted successfully. Awaiting confirmation.",
        "success"
    );


    await loadInvestmentHistory(user.id);
}


// =====================================================
// INVESTMENT HISTORY
// =====================================================

async function loadInvestmentHistory(userId) {

    const container =
        document.getElementById(
            "investmentHistory"
        );


    if (!container) return;


    const { data, error } =
        await supabase
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

        console.error(error);

        container.innerHTML =
            "<p>Unable to load investment history.</p>";

        return;
    }


    if (!data.length) {

        container.innerHTML = `

            <div class="empty-state">
                No investment requests yet.
            </div>

        `;

        return;
    }


    container.innerHTML =
        data.map(item => `

            <div class="history-row">

                <div>

                    <strong>
                        ${item.packages?.name || "Package"}
                    </strong>

                    <small>
                        ${formatDate(item.created_at)}
                    </small>

                </div>


                <div>
                    ${formatMoney(item.amount)}
                </div>


                <div>
                    ${
                        item.payment_method === "crypto"
                            ? "Crypto Funding"
                            : "Bank Account"
                    }
                </div>


                <div>
                    ${statusBadge(item.status)}
                </div>

            </div>

        `).join("");
}


// =====================================================
// ADMIN CHECK
// =====================================================

async function checkAdmin() {

    const user =
        await getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return null;
    }


    const { data: profile, error } =
        await supabase
            .from("profiles")
            .select(
                "id,full_name,role,status"
            )
            .eq("id", user.id)
            .single();


    if (error || !profile) {

        console.error(error);

        await logout();

        return null;
    }


    if (
        profile.role !== "admin" ||
        profile.status !== "active"
    ) {

        alert(
            "Admin access required."
        );

        window.location.href =
            "dashboard.html";

        return null;
    }


    return {
        user,
        profile
    };
}


// =====================================================
// ADMIN DASHBOARD
// =====================================================

async function loadAdminDashboard() {

    const admin =
        await checkAdmin();


    if (!admin) return;


    await loadAdminStats();

    await loadMembers();

    await loadInvestmentRequests();
}


// =====================================================
// ADMIN STATISTICS
// =====================================================

async function loadAdminStats() {

    const {
        data: profiles,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("role,status");


    if (profileError) {

        console.error(profileError);

        return;
    }


    const members =
        profiles.filter(
            p => p.role === "member"
        );


    const pendingMembers =
        members.filter(
            p => p.status === "pending"
        ).length;


    const {
        data: investments,
        error: investmentError
    } = await supabase
        .from("investments")
        .select("status");


    if (investmentError) {

        console.error(investmentError);

        return;
    }


    const confirmed =
        investments.filter(
            i => i.status === "confirmed"
        ).length;


    const rejected =
        investments.filter(
            i => i.status === "rejected"
        ).length;


    setStat(
        "totalMembers",
        members.length
    );


    setStat(
        "pendingMembers",
        pendingMembers
    );


    setStat(
        "confirmedInvestments",
        confirmed
    );


    setStat(
        "rejectedInvestments",
        rejected
    );
}


function setStat(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }
}


// =====================================================
// LOAD MEMBERS
// =====================================================

async function loadMembers() {

    const table =
        document.getElementById(
            "membersTable"
        );


    if (!table) return;


    const {
        data: members,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        table.innerHTML = `

            <tr>
                <td colspan="5">
                    Unable to load members.
                </td>
            </tr>

        `;

        return;
    }


    if (!members.length) {

        table.innerHTML = `

            <tr>
                <td colspan="5">
                    No members found.
                </td>
            </tr>

        `;

        return;
    }


    table.innerHTML =
        members.map(member => {

            let action = "";


            if (member.role === "admin") {

                action = `

                    <span class="admin-label">
                        ADMIN
                    </span>

                `;

            }

            else if (
                member.status === "pending"
            ) {

                action = `

                    <button
                        class="admin-btn approve-btn"
                        onclick="changeMemberStatus('${member.id}', 'active')">
                        Activate
                    </button>

                    <button
                        class="admin-btn reject-btn"
                        onclick="changeMemberStatus('${member.id}', 'blocked')">
                        Block
                    </button>

                `;

            }

            else if (
                member.status === "active"
            ) {

                action = `

                    <button
                        class="admin-btn reject-btn"
                        onclick="changeMemberStatus('${member.id}', 'blocked')">
                        Block
                    </button>

                `;

            }

            else {

                action = `

                    <button
                        class="admin-btn approve-btn"
                        onclick="changeMemberStatus('${member.id}', 'active')">
                        Activate
                    </button>

                `;
            }


            return `

                <tr>

                    <td>
                        ${member.full_name || "Unnamed Monarch"}
                    </td>

                    <td>
                        ${member.role}
                    </td>

                    <td>
                        ${statusBadge(member.status)}
                    </td>

                    <td>
                        ${formatDate(member.created_at)}
                    </td>

                    <td>
                        ${action}
                    </td>

                </tr>

            `;

        }).join("");
}


// =====================================================
// CHANGE MEMBER STATUS
// =====================================================

async function changeMemberStatus(
    userId,
    newStatus
) {

    const admin =
        await checkAdmin();


    if (!admin) return;


    const actionName =
        newStatus === "active"
            ? "activate"
            : "block";


    const confirmed =
        confirm(
            `Are you sure you want to ${actionName} this member?`
        );


    if (!confirmed) return;


    const { error } =
        await supabase
            .from("profiles")
            .update({
                status: newStatus
            })
            .eq("id", userId)
            .eq("role", "member");


    if (error) {

        console.error(error);

        alert(error.message);

        return;
    }


    await loadAdminStats();

    await loadMembers();
}


// =====================================================
// LOAD INVESTMENT REQUESTS
// =====================================================

async function loadInvestmentRequests() {

    const table =
        document.getElementById(
            "investmentsTable"
        );


    if (!table) return;


    const {
        data: investments,
        error
    } = await supabase
        .from("investments")
        .select(`
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
        `)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        table.innerHTML = `

            <tr>
                <td colspan="8">
                    Unable to load investment requests.
                </td>
            </tr>

        `;

        return;
    }


    if (!investments.length) {

        table.innerHTML = `

            <tr>
                <td colspan="8">
                    No investment requests found.
                </td>
            </tr>

        `;

        return;
    }


    table.innerHTML =
        investments.map(item => {

            let action = "";


            if (item.status === "pending") {

                action = `

                    <button
                        class="admin-btn approve-btn"
                        onclick="changeInvestmentStatus(${item.id}, 'confirmed')">
                        Confirm
                    </button>

                    <button
                        class="admin-btn reject-btn"
                        onclick="changeInvestmentStatus(${item.id}, 'rejected')">
                        Reject
                    </button>

                `;

            }

            else if (
                item.status === "confirmed"
            ) {

                action = `

                    <span class="confirmed-label">
                        CONFIRMED
                    </span>

                `;

            }

            else {

                action = `

                    <span class="rejected-label">
                        REJECTED
                    </span>

                `;
            }


            return `

                <tr>

                    <td>
                        ${item.profiles?.full_name || "Unknown Monarch"}
                    </td>

                    <td>
                        -
                    </td>

                    <td>
                        ${item.packages?.name || "Package"}
                    </td>

                    <td>
                        ${formatMoney(item.amount)}
                    </td>

                    <td>
                        ${
                            item.payment_method === "crypto"
                                ? "Crypto Funding"
                                : "Bank Account"
                        }
                    </td>

                    <td>
                        ${statusBadge(item.status)}
                    </td>

                    <td>
                        ${formatDate(item.created_at)}
                    </td>

                    <td>
                        ${action}
                    </td>

                </tr>

            `;

        }).join("");
}


// =====================================================
// CONFIRM / REJECT INVESTMENT
// =====================================================

async function changeInvestmentStatus(
    investmentId,
    newStatus
) {

    const admin =
        await checkAdmin();


    if (!admin) return;


    const action =
        newStatus === "confirmed"
            ? "confirm"
            : "reject";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} this investment request?`
        );


    if (!confirmed) return;


    const { error } =
        await supabase
            .from("investments")
            .update({
                status: newStatus
            })
            .eq("id", investmentId);


    if (error) {

        console.error(error);

        alert(error.message);

        return;
    }


    alert(
        newStatus === "confirmed"
            ? "Investment confirmed successfully."
            : "Investment rejected successfully."
    );


    await loadAdminStats();

    await loadInvestmentRequests();
}


// =====================================================
// PAGE STARTUP
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const page =
            window.location.pathname;


        // REGISTER

        if (
            document.getElementById(
                "registerForm"
            ) ||
            page.includes("register.html")
        ) {

            const form =
                document.getElementById(
                    "registerForm"
                );


            if (form) {

                form.addEventListener(
                    "submit",
                    async event => {

                        event.preventDefault();

                        await registerUser();

                    }
                );

            }

        }


        // LOGIN

        if (
            document.getElementById(
                "loginForm"
            ) ||
            page.includes("login.html")
        ) {

            const form =
                document.getElementById(
                    "loginForm"
                );


            if (form) {

                form.addEventListener(
                    "submit",
                    async event => {

                        event.preventDefault();

                        await loginUser();

                    }
                );

            }

        }


        // MEMBER DASHBOARD

        if (
            page.includes(
                "dashboard.html"
            )
        ) {

            await loadMemberDashboard();

        }


        // ADMIN DASHBOARD

        if (
            page.includes(
                "admin.html"
            )
        ) {

            await loadAdminDashboard();

        }

    }
);


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.logout =
    logout;

window.registerUser =
    registerUser;

window.loginUser =
    loginUser;

window.submitInvestment =
    submitInvestment;

window.changeMemberStatus =
    changeMemberStatus;

window.changeInvestmentStatus =
    changeInvestmentStatus;

window.loadAdminDashboard =
    loadAdminDashboard;

window.loadMembers =
    loadMembers;

window.loadInvestmentRequests =
    loadInvestmentRequests;