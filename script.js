/* =========================================================
   MONARCH CODEX
   Supabase Authentication + Member Dashboard
   ========================================================= */

/* ---------------- SUPABASE ---------------- */

const SUPABASE_URL = "https://avaworleivncevaoqeny.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* ---------------- DOM HELPERS ---------------- */

function get(id) {
  return document.getElementById(id);
}

function showMessage(element, message, type = "") {
  if (!element) return;

  element.textContent = message;
  element.className = "form-message";

  if (type) {
    element.classList.add(type);
  }
}


/* ---------------- MOBILE MENU ---------------- */

const menuToggle = get("menuToggle");
const navLinks = get("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}


/* ---------------- REGISTRATION ---------------- */

const registrationForm = get("registrationForm");

if (registrationForm) {
  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullname = get("fullname")?.value.trim();
    const email = get("email")?.value.trim();
    const phone = get("phone")?.value.trim();
    const password = get("password")?.value;

    const message = get("registrationMessage");

    if (!fullname || !email || !password) {
      showMessage(
        message,
        "Please fill in all required fields.",
        "error"
      );
      return;
    }

    if (password.length < 6) {
      showMessage(
        message,
        "Password must contain at least 6 characters.",
        "error"
      );
      return;
    }

    showMessage(
      message,
      "CREATING ACCOUNT...",
      "loading"
    );

    try {
      const { data, error } =
        await supabaseClient.auth.signUp({
          email,
          password,
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
        console.error("Registration error:", error);

        showMessage(
          message,
          error.message,
          "error"
        );

        return;
      }

      if (data.user) {
        showMessage(
          message,
          "Account created successfully. Please check your email and confirm your account before logging in.",
          "success"
        );

        registrationForm.reset();
      }

    } catch (error) {
      console.error("Registration exception:", error);

      showMessage(
        message,
        "Unable to connect to the authentication server. Please try again.",
        "error"
      );
    }
  });
}


/* ---------------- LOGIN ---------------- */

const loginForm = get("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = get("loginEmail")?.value.trim();
    const password = get("loginPassword")?.value;

    const message = get("loginMessage");

    if (!email || !password) {
      showMessage(
        message,
        "Please enter your email and password.",
        "error"
      );
      return;
    }

    showMessage(
      message,
      "SIGNING IN...",
      "loading"
    );

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

      if (error) {
        console.error("Login error:", error);

        showMessage(
          message,
          error.message,
          "error"
        );

        return;
      }

      if (!data.session) {
        showMessage(
          message,
          "Login completed, but no active session was created.",
          "error"
        );

        return;
      }

      showMessage(
        message,
        "LOGIN SUCCESSFUL.",
        "success"
      );

      await loadDashboard(data.user);

    } catch (error) {
      console.error("Login exception:", error);

      showMessage(
        message,
        "Failed to connect to Supabase. Please check your internet connection and try again.",
        "error"
      );
    }
  });
}


/* ---------------- SESSION CHECK ---------------- */

async function checkCurrentSession() {
  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      return;
    }

    if (session && session.user) {
      await loadDashboard(session.user);
    } else {
      hideDashboard();
    }

  } catch (error) {
    console.error("Session check failed:", error);
    hideDashboard();
  }
}


/* ---------------- LOAD DASHBOARD ---------------- */

async function loadDashboard(user) {
  const dashboard = get("dashboard");

  if (!dashboard || !user) {
    return;
  }

  try {
    const {
      data: profile,
      error
    } = await supabaseClient
      .from("profiles")
      .select("full_name, phone, role, status")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile error:", error);

      /*
       * The authentication session is still valid.
       * We don't destroy it simply because profile loading failed.
       */

      showDashboard();

      if (get("memberName")) {
        get("memberName").textContent =
          user.user_metadata?.full_name ||
          "Monarch";
      }

      if (get("memberEmail")) {
        get("memberEmail").textContent =
          user.email || "";
      }

      return;
    }

    if (get("memberName")) {
      get("memberName").textContent =
        profile.full_name || "Monarch";
    }

    if (get("memberEmail")) {
      get("memberEmail").textContent =
        user.email || "";
    }

    if (get("accountStatus")) {
      get("accountStatus").textContent =
        profile.status
          ? profile.status.toUpperCase()
          : "PENDING";
    }

    showDashboard();

    await loadPackages();
    await loadInvestmentHistory(user.id);

  } catch (error) {
    console.error("Dashboard error:", error);
  }
}


/* ---------------- SHOW / HIDE DASHBOARD ---------------- */

function showDashboard() {
  const dashboard = get("dashboard");

  if (!dashboard) return;

  dashboard.style.display = "block";

  const loginSection = document.getElementById("login");

  if (loginSection) {
    loginSection.style.display = "none";
  }

  dashboard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function hideDashboard() {
  const dashboard = get("dashboard");

  if (dashboard) {
    dashboard.style.display = "none";
  }

  const loginSection = document.getElementById("login");

  if (loginSection) {
    loginSection.style.display = "";
  }
}


/* ---------------- PACKAGE SELECTION ---------------- */

let selectedPackageId = null;
let selectedPackageAmount = null;
let selectedPaymentMethod = null;

async function loadPackages() {
  const container = get("dashboardPackages");

  if (!container) return;

  try {
    const {
      data: packages,
      error
    } = await supabaseClient
      .from("packages")
      .select("id, name, amount")
      .eq("active", true)
      .order("amount", {
        ascending: true
      });

    if (error) {
      console.error("Packages error:", error);
      return;
    }

    container.innerHTML = "";

    packages.forEach((pkg) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "dashboard-package";
      button.textContent = pkg.name;

      button.dataset.packageId = pkg.id;
      button.dataset.amount = pkg.amount;

      button.addEventListener("click", () => {
        selectPackage(pkg);
      });

      container.appendChild(button);
    });

  } catch (error) {
    console.error("Package loading failed:", error);
  }
}


function selectPackage(pkg) {
  selectedPackageId = pkg.id;
  selectedPackageAmount = Number(pkg.amount);

  const amountBox = get("selectedPackageAmount");
  const packageBox = get("selectedPackageBox");
  const paymentBox = get("paymentMethodBox");

  if (amountBox) {
    amountBox.textContent =
      "$" + Number(pkg.amount).toLocaleString();
  }

  if (packageBox) {
    packageBox.style.display = "block";
  }

  if (paymentBox) {
    paymentBox.style.display = "block";
  }

  document
    .querySelectorAll(".dashboard-package")
    .forEach((button) => {
      button.classList.remove("selected");

      if (
        Number(button.dataset.packageId) ===
        Number(pkg.id)
      ) {
        button.classList.add("selected");
      }
    });

  selectedPaymentMethod = null;

  document
    .querySelectorAll("[data-payment-method]")
    .forEach((button) => {
      button.classList.remove("selected");
    });

  const investmentMessage = get("investmentMessage");

  if (investmentMessage) {
    investmentMessage.textContent = "";
  }
}


/* ---------------- PAYMENT METHOD ---------------- */

document
  .querySelectorAll("[data-payment-method]")
  .forEach((button) => {

    button.addEventListener("click", () => {

      selectedPaymentMethod =
        button.dataset.paymentMethod;

      document
        .querySelectorAll("[data-payment-method]")
        .forEach((item) => {
          item.classList.remove("selected");
        });

      button.classList.add("selected");

      const message = get("investmentMessage");

      if (message) {
        message.textContent =
          "Payment method selected: " +
          selectedPaymentMethod.toUpperCase();
      }
    });

  });


/* ---------------- INVESTMENT REQUEST ---------------- */

const submitInvestment = get("submitInvestment");

if (submitInvestment) {
  submitInvestment.addEventListener("click", async () => {

    const message = get("investmentMessage");

    if (!selectedPackageId) {
      showMessage(
        message,
        "Please select an investment package.",
        "error"
      );
      return;
    }

    if (!selectedPaymentMethod) {
      showMessage(
        message,
        "Please select a payment method.",
        "error"
      );
      return;
    }

    submitInvestment.disabled = true;

    showMessage(
      message,
      "SUBMITTING INVESTMENT REQUEST...",
      "loading"
    );

    try {
      const {
        data: {
          user
        }
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showMessage(
          message,
          "Your session has expired. Please log in again.",
          "error"
        );

        submitInvestment.disabled = false;
        return;
      }

      const {
        error
      } = await supabaseClient
        .from("investments")
        .insert({
          user_id: user.id,
          package_id: selectedPackageId,
          amount: selectedPackageAmount,
          payment_method: selectedPaymentMethod,
          status: "pending"
        });

      if (error) {
        console.error(
          "Investment error:",
          error
        );

        showMessage(
          message,
          error.message,
          "error"
        );

        submitInvestment.disabled = false;
        return;
      }

      showMessage(
        message,
        "Investment request submitted successfully. Your request is pending confirmation.",
        "success"
      );

      await loadInvestmentHistory(user.id);

    } catch (error) {
      console.error(
        "Investment exception:",
        error
      );

      showMessage(
        message,
        "Unable to submit your investment request.",
        "error"
      );

    } finally {
      submitInvestment.disabled = false;
    }

  });
}


/* ---------------- INVESTMENT HISTORY ---------------- */

async function loadInvestmentHistory(userId) {
  const history = get("investmentHistory");

  if (!history) return;

  try {
    const {
      data: investments,
      error
    } = await supabaseClient
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

      history.innerHTML =
        "<p>Unable to load investment history.</p>";

      return;
    }

    if (!investments || investments.length === 0) {
      history.innerHTML =
        "<p>No investment requests yet.</p>";

      return;
    }

    history.innerHTML = "";

    investments.forEach((investment) => {

      const item =
        document.createElement("div");

      item.className =
        "investment-history-item";

      const packageName =
        investment.packages?.name ||
        "Investment Package";

      const amount =
        Number(investment.amount)
          .toLocaleString();

      const status =
        String(investment.status)
          .toUpperCase();

      item.innerHTML = `
        <strong>${escapeHTML(packageName)}</strong>
        <span>$${amount}</span>
        <span>${escapeHTML(
          investment.payment_method
        )}</span>
        <span>${escapeHTML(status)}</span>
      `;

      history.appendChild(item);
    });

  } catch (error) {
    console.error(
      "History exception:",
      error
    );
  }
}


/* ---------------- LOGOUT ---------------- */

const logoutButton = get("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {

    logoutButton.disabled = true;

    try {
      const {
        error
      } = await supabaseClient.auth.signOut();

      if (error) {
        console.error(
          "Logout error:",
          error
        );

        return;
      }

      selectedPackageId = null;
      selectedPackageAmount = null;
      selectedPaymentMethod = null;

      hideDashboard();

      window.location.hash = "login";

      window.location.reload();

    } catch (error) {
      console.error(
        "Logout exception:",
        error
      );

    } finally {
      logoutButton.disabled = false;
    }
  });
}


/* ---------------- AUTH STATE ---------------- */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "Auth event:",
      event
    );

    if (
      session &&
      session.user &&
      (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED"
      )
    ) {
      await loadDashboard(session.user);
    }

    if (event === "SIGNED_OUT") {
      hideDashboard();
    }
  }
);


/* ---------------- SECURITY HELPER ---------------- */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ---------------- START APPLICATION ---------------- */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    checkCurrentSession();
  }
);