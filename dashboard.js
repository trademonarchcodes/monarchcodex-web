/* =========================================
   PACKAGES
========================================= */

async function loadPackages() {
    const loading = getElement("packagesLoading");
    const grid = getElement("packagesGrid");
    const empty = getElement("packagesEmpty");

    try {
        if (loading) loading.classList.remove("hidden");
        if (grid) grid.innerHTML = "";
        if (empty) empty.classList.add("hidden");

        const { data, error } = await supabaseClient
            .from("packages")
            .select("*")
            .eq("active", true)
            .order("amount", { ascending: true });

        if (error) {
            throw error;
        }

        if (loading) loading.classList.add("hidden");

        if (!data || data.length === 0) {
            if (empty) empty.classList.remove("hidden");
            return;
        }

        data.forEach(function (pkg) {
            const card = document.createElement("div");

            card.className = "package-card";

            card.innerHTML = `
                <h3>${escapeHtml(pkg.name)}</h3>

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
                button.addEventListener("click", function () {
                    const packageId = this.dataset.packageId;

                    const selected = data.find(function (pkg) {
                        return String(pkg.id) === String(packageId);
                    });

                    if (selected) {
                        selectPackage(selected);
                    }
                });
            });

    } catch (error) {
        console.error("Error loading packages:", error);

        if (loading) loading.classList.add("hidden");

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to Load Packages</h3>
                    <p>Please refresh the page and try again.</p>
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

    const selectedSection =
        getElement("selectedInvestmentSection");

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
        packageName.textContent = pkg.name;
    }

    if (packageAmount) {
        packageAmount.textContent =
            formatCurrency(pkg.amount);
    }

    if (packageId) {
        packageId.value = pkg.id;
    }

    if (investmentAmount) {
        investmentAmount.value = pkg.amount;
    }

    if (selectedCard) {
        selectedCard.classList.remove("hidden");
    }

    if (paymentCard) {
        paymentCard.classList.remove("hidden");
    }

    if (selectedSection) {
        selectedSection.classList.add("active-section");
    }

    loadPaymentMethods();

    window.scrollTo({
        top: selectedCard
            ? selectedCard.offsetTop - 20
            : 0,
        behavior: "smooth"
    });
}