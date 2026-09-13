/* =========================================================
   MONARCH CODEX
   SHARED APPLICATION CORE
   ========================================================= */

(function () {

    "use strict";

    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const SUPABASE_URL =
        "https://avaworleivncevaoqeny.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";


    /* =====================================================
       SUPABASE CLIENT
       ===================================================== */

    let client = null;


    function getSupabase() {

        if (client) {
            return client;
        }

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {
            console.error(
                "MONARCH CODEX: Supabase library is not available."
            );

            return null;
        }

        client =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

        return client;
    }


    /* =====================================================
       UTILITIES
       ===================================================== */

    function formatMoney(amount) {

        const value =
            Number(amount);

        if (!Number.isFinite(value)) {
            return "$0.00";
        }

        return "$" +
            value.toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
    }


    function formatDate(date) {

        if (!date) {
            return "—";
        }

        const parsed =
            new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return "—";
        }

        return parsed.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getElement(id) {

        return document.getElementById(id);
    }


    function showMessage(
        message,
        type = "info",
        elementId = "registrationMessage"
    ) {

        const element =
            getElement(elementId);

        if (!element) {
            console.log(message);
            return;
        }

        element.textContent =
            message;

        element.className =
            `form-message ${type}`;

        element.style.display =
            "block";
    }


    function hideMessage(elementId) {

        const element =
            getElement(elementId);

        if (!element) {
            return;
        }

        element.style.display =
            "none";
    }


    /* =====================================================
       AUTHENTICATION
       ===================================================== */

    async function getCurrentUser() {

        const supabase =
            getSupabase();

        if (!supabase) {
            return null;
        }

        const {
            data,
            error
        } =
            await supabase.auth.getUser();

        if (error) {

            console.error(
                "MONARCH CODEX AUTH:",
                error
            );

            return null;
        }

        return data?.user || null;
    }


    async function getCurrentSession() {

        const supabase =
            getSupabase();

        if (!supabase) {
            return null;
        }

        const {
            data,
            error
        } =
            await supabase.auth.getSession();

        if (error) {

            console.error(
                "MONARCH CODEX SESSION:",
                error
            );

            return null;
        }

        return data?.session || null;
    }


    async function getCurrentProfile() {

        const supabase =
            getSupabase();

        if (!supabase) {
            return null;
        }

        const user =
            await getCurrentUser();

        if (!user) {
            return null;
        }

        const {
            data,
            error
        } =
            await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

        if (error) {

            console.error(
                "MONARCH CODEX PROFILE:",
                error
            );

            return null;
        }

        return data || null;
    }


    async function logout() {

        const supabase =
            getSupabase();

        if (supabase) {
            await supabase.auth.signOut();
        }

        window.location.href =
            "login.html";
    }


    /* =====================================================
       PROFILE / ROLE
       ===================================================== */

    async function getUserAccess() {

        const user =
            await getCurrentUser();

        if (!user) {
            return null;
        }

        const profile =
            await getCurrentProfile();

        if (!profile) {
            return null;
        }

        return {
            user,
            profile,
            role:
                profile.role || "member",
            status:
                profile.status || "pending"
        };
    }


    function isAdmin(profile) {

        if (!profile) {
            return false;
        }

        return [
            "admin",
            "administrator",
            "super_admin"
        ].includes(
            String(
                profile.role || ""
            ).toLowerCase()
        );
    }


    function isActiveMember(profile) {

        if (!profile) {
            return false;
        }

        return (
            profile.status ===
            "active"
        );
    }


    /* =====================================================
       REFERRAL FOUNDATION
       ===================================================== */

    function getReferralCode() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const referral =
            params.get("ref");

        if (!referral) {
            return null;
        }

        const cleaned =
            referral
                .trim()
                .toUpperCase();

        if (!cleaned) {
            return null;
        }

        return cleaned;
    }


    function getReferralLink(
        uid
    ) {

        if (!uid) {
            return "";
        }

        const base =
            window.location.origin +
            window.location.pathname
                .replace(
                    /[^/]*$/,
                    ""
                );

        return (
            base +
            "register.html?ref=" +
            encodeURIComponent(uid)
        );
    }


    /* =====================================================
       AUTH REDIRECTION
       ===================================================== */

    async function redirectAuthenticatedUser() {

        const access =
            await getUserAccess();

        if (!access) {
            return false;
        }

        const {
            profile
        } = access;

        if (
            isAdmin(profile) &&
            isActiveMember(profile)
        ) {
            window.location.href =
                "admin.html";

            return true;
        }

        if (
            profile.status ===
            "pending"
        ) {
            return false;
        }

        if (
            profile.status ===
            "blocked"
        ) {
            return false;
        }

        if (
            isActiveMember(profile)
        ) {
            window.location.href =
                "dashboard.html";

            return true;
        }

        return false;
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.MonarchCodex =
        window.MonarchCodex || {};

    window.MonarchCodex.core = {

        /* Supabase */
        getSupabase,

        /* Utilities */
        formatMoney,
        formatDate,
        escapeHtml,
        getElement,
        showMessage,
        hideMessage,

        /* Authentication */
        getCurrentUser,
        getCurrentSession,
        getCurrentProfile,
        getUserAccess,
        logout,

        /* Access */
        isAdmin,
        isActiveMember,
        redirectAuthenticatedUser,

        /* Referrals */
        getReferralCode,
        getReferralLink

    };


    /* =====================================================
       STARTUP
       ===================================================== */

    console.log(
        "MONARCH CODEX CORE LOADED"
    );

})();