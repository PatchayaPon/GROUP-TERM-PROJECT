
const form = document.querySelector('#profile-form');
const STORAGE_KEY = 'portfolio';
const container = document.getElementById("portfolio-container");
const addButton = document.getElementById("add-portfolio");

const PORTFOLIO_ITEMS_KEY = 'portfolioItems';
const portfolioDisplay = document.getElementById("portfolio-display");

function showPortfolio(portfolio) {
    document.querySelector('#portfolio-name').textContent = portfolio.displayName || 'Student';
    document.querySelector('#portfolio-enjoy').textContent = portfolio.whatIEnjoy || '';
    document.querySelector('#portfolio-tried').textContent = portfolio.whatIveTried || '';
    document.querySelector('#portfolio-curious').textContent = portfolio.whatImCuriousAbout || '';
}

function validateProfileForm(formEl) {
    let isValid = true;

    function setError(inputElement, errorElement, message) {
        if (inputElement) inputElement.classList.add("is-invalid");
        if (errorElement) errorElement.innerHTML = `⚠️ ${message}`;
        isValid = false;
    }

    function clearError(inputElement, errorElement) {
        if (inputElement) inputElement.classList.remove("is-invalid");
        if (errorElement) errorElement.textContent = "";
    }

    const nameInput = formEl.querySelector('#displayName');
    const nameErr = formEl.querySelector('.error-display-name');
    clearError(nameInput, nameErr);
    if (!nameInput || !nameInput.value.trim()) {
        setError(nameInput, nameErr, "Add a name to show on your portfolio.");
    }

    const enjoyInput = formEl.querySelector('#enjoy');
    const enjoyErr = formEl.querySelector('.error-enjoy');
    clearError(enjoyInput, enjoyErr);
    if (!enjoyInput || !enjoyInput.value.trim()) {
        setError(enjoyInput, enjoyErr, "Tell us something you enjoy doing.");
    }

    const triedInput = formEl.querySelector('#tried');
    const triedErr = formEl.querySelector('.error-tried');
    clearError(triedInput, triedErr);
    if (!triedInput || !triedInput.value.trim()) {
        setError(triedInput, triedErr, "Share something you have tried.");
    }

    const curiousInput = formEl.querySelector('#curious');
    const curiousErr = formEl.querySelector('.error-curious');
    clearError(curiousInput, curiousErr);
    if (!curiousInput || !curiousInput.value.trim()) {
        setError(curiousInput, curiousErr, "Add something you are curious about.");
    }

    return isValid;
}

if (form) {
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!validateProfileForm(form)) {
            return;
        }

        const portfolio = {
            displayName: document.querySelector('#displayName').value.trim(),
            whatIEnjoy: document.querySelector('#enjoy').value.trim(),
            whatIveTried: document.querySelector('#tried').value.trim(),
            whatImCuriousAbout: document.querySelector('#curious').value.trim()
        };

        showPortfolio(portfolio);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    });
}

const savedData = localStorage.getItem(STORAGE_KEY);
if (savedData !== null) {
    try {
        const savedPortfolio = JSON.parse(savedData);
        showPortfolio(savedPortfolio);

        if (document.querySelector('#displayName')) document.querySelector('#displayName').value = savedPortfolio.displayName || '';
        if (document.querySelector('#enjoy')) document.querySelector('#enjoy').value = savedPortfolio.whatIEnjoy || '';
        if (document.querySelector('#tried')) document.querySelector('#tried').value = savedPortfolio.whatIveTried || '';
        if (document.querySelector('#curious')) document.querySelector('#curious').value = savedPortfolio.whatImCuriousAbout || '';
    } catch (error) {
        console.error('Could not restore the saved Portfolio:', error);
    }
}

if (addButton) {
    addButton.addEventListener("click", function () {
        const firstForm = container.querySelector(".portfolio-form");
        if (!firstForm) return;

        const newForm = firstForm.cloneNode(true);

        newForm.querySelectorAll("input, textarea").forEach(function (input) {
            input.value = "";
            input.classList.remove("is-invalid");
        });

        newForm.querySelectorAll(".small.text-danger").forEach(function (errEl) {
            errEl.textContent = "";
        });

        const statusText = newForm.querySelector('.form-status');
        if (statusText) {
            statusText.textContent = "This experience has not been saved yet. Check the highlighted fields.";
            statusText.className = "form-status text-muted small";
        }

        container.appendChild(newForm);
    });
}

container.addEventListener("click", function (event) {
    const addSkillButton = event.target.closest(".add-skill");
    if (addSkillButton) {
        const portfolioForm = addSkillButton.closest(".portfolio-form");
        const skillsContainer = portfolioForm.querySelector(".skills-container");
        const firstSkill = skillsContainer.querySelector(".skill-item");
        const newSkill = firstSkill.cloneNode(true);
        newSkill.querySelector("input").value = "";
        newSkill.querySelector("input").classList.remove("is-invalid");
        skillsContainer.appendChild(newSkill);
    }

    const deleteFieldButton = event.target.closest(".delete-field");
    if (deleteFieldButton) {
        const skillItem = deleteFieldButton.closest(".skill-item");
        const skillsContainer = skillItem.closest(".skills-container");
        if (skillsContainer.querySelectorAll(".skill-item").length > 1) {
            skillItem.remove();
        } else {
            skillItem.querySelector("input").value = "";
        }
    }

    const addEvidenceButton = event.target.closest(".add-evidence");
    if (addEvidenceButton) {
        const portfolioForm = addEvidenceButton.closest(".portfolio-form");
        const evidenceContainer = portfolioForm.querySelector(".evidence-container");
        const firstEvidence = evidenceContainer.querySelector(".evidence-item");
        const newEvidence = firstEvidence.cloneNode(true);
        newEvidence.querySelector("input").value = "";
        newEvidence.querySelector("input").classList.remove("is-invalid");
        evidenceContainer.appendChild(newEvidence);
    }

    const deleteEvidenceButton = event.target.closest(".delete-evidence");
    if (deleteEvidenceButton) {
        const evidenceItem = deleteEvidenceButton.closest(".evidence-item");
        const evidenceContainer = evidenceItem.closest(".evidence-container");
        if (evidenceContainer.querySelectorAll(".evidence-item").length > 1) {
            evidenceItem.remove();
        } else {
            evidenceItem.querySelector("input").value = "";
        }
    }

    const deleteButton = event.target.closest(".delete-portfolio");
    if (deleteButton) {
        const portfolioForm = deleteButton.closest(".portfolio-form");
        if (portfolioForm && container.querySelectorAll(".portfolio-form").length > 1) {
            portfolioForm.remove();
        } else if (portfolioForm) {
            portfolioForm.reset();
            portfolioForm.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
            portfolioForm.querySelectorAll(".small.text-danger").forEach(el => el.textContent = "");
        }
    }
});

function showPortfolioItems(items) {
    portfolioDisplay.innerHTML = "";

    items.forEach(function (item) {
        const card = document.createElement("div");
        card.className = "card border-0 shadow-sm rounded-4 p-4 mb-3";

        const title = document.createElement("h3");
        title.className = "h5 fw-bold";
        title.textContent = item.title;

        const type = document.createElement("p");
        type.textContent = "Type: " + item.type;

        const date = document.createElement("p");
        date.textContent = "Date: " + item.date;

        const role = document.createElement("p");
        role.textContent = "Role: " + item.role;

        const roleDescription = document.createElement("p");
        roleDescription.textContent = "Role Description: " + (item.roleDescription || "");

        const skills = document.createElement("p");
        skills.textContent = "Skills: " + item.skills.join(", ");

        const reflection = document.createElement("p");
        reflection.textContent = "Reflection: " + item.reflection;

        const evidence = document.createElement("div");
        evidence.textContent = "Evidence: ";

        item.evidence.forEach(function (url, index) {
            const link = document.createElement("a");

            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = url;

            if (index > 0) {
                evidence.appendChild(document.createTextNode(" , "));
            }

            evidence.appendChild(link);
        });

        card.append(title, type, date, role, roleDescription, skills, reflection, evidence);
        portfolioDisplay.appendChild(card);
    });
}

function getSavedPortfolioItems() {
    const savedItems = localStorage.getItem(PORTFOLIO_ITEMS_KEY);
    if (savedItems !== null) {
        try {
            return JSON.parse(savedItems);
        } catch (error) {
            console.error("Could not restore Portfolio Items:", error);
        }
    }
    return [];
}

function validatePortfolioForm(portfolioForm) {
    let isValid = true;

    function setError(inputElement, errorElement, message) {
        if (inputElement) inputElement.classList.add("is-invalid");
        if (errorElement) errorElement.innerHTML = `⚠️ ${message}`;
        isValid = false;
    }

    function clearError(inputElement, errorElement) {
        if (inputElement) inputElement.classList.remove("is-invalid");
        if (errorElement) errorElement.textContent = "";
    }

    const titleInput = portfolioForm.querySelector('[name="title"]');
    const titleErr = portfolioForm.querySelector('.error-title');
    clearError(titleInput, titleErr);
    if (!titleInput.value.trim()) {
        setError(titleInput, titleErr, "Add a title for this experience.");
    }

    const typeInput = portfolioForm.querySelector('[name="type"]');
    const typeErr = portfolioForm.querySelector('.error-type');
    clearError(typeInput, typeErr);
    if (!typeInput.value.trim()) {
        setError(typeInput, typeErr, "Add a type, such as project, course, or activity.");
    }

    const dateInput = portfolioForm.querySelector('[name="date"]');
    const dateErr = portfolioForm.querySelector('.error-date');
    clearError(dateInput, dateErr);
    if (!dateInput.value || isNaN(Date.parse(dateInput.value))) {
        setError(dateInput, dateErr, "Choose the date you completed or started this experience.");
    }

    const roleInput = portfolioForm.querySelector('[name="role"]');
    const roleErr = portfolioForm.querySelector('.error-role');
    clearError(roleInput, roleErr);
    if (!roleInput.value.trim()) {
        setError(roleInput, roleErr, "Describe what you did or contributed.");
    }

    const skillInputs = portfolioForm.querySelectorAll('.skills-container input[name="skills"]');
    const skillsErr = portfolioForm.querySelector('.error-skills');
    clearError(null, skillsErr);
    let hasValidSkill = false;
    skillInputs.forEach(input => input.classList.remove("is-invalid"));

    for (let input of skillInputs) {
        if (input.value.trim() !== '') {
            hasValidSkill = true;
        } else {
            input.classList.add("is-invalid");
        }
    }

    if (!hasValidSkill) {
        setError(null, skillsErr, "Add at least one skill.");
    }

    const reflectionInput = portfolioForm.querySelector('[name="reflection"]');
    const reflectionErr = portfolioForm.querySelector('.error-reflection');
    clearError(reflectionInput, reflectionErr);
    if (!reflectionInput.value.trim()) {
        setError(reflectionInput, reflectionErr, "Share one thing you learned.");
    }

    const evidenceInputs = portfolioForm.querySelectorAll('.evidence-container input[name="evidence"]');
    const evidenceErr = portfolioForm.querySelector('.error-evidence');
    clearError(null, evidenceErr);
    let hasValidEvidence = false;
    let hasUrlError = false;
    evidenceInputs.forEach(input => input.classList.remove("is-invalid"));

    for (let input of evidenceInputs) {
        const val = input.value.trim();
        if (val !== '') {
            try {
                new URL(val);
                hasValidEvidence = true;
            } catch (_) {
                input.classList.add("is-invalid");
                hasUrlError = true;
            }
        } else {
            input.classList.add("is-invalid");
        }
    }

    if (hasUrlError) {
        setError(null, evidenceErr, "Please enter a valid URL (e.g. https://example.com).");
    } else if (!hasValidEvidence) {
        setError(null, evidenceErr, "Add at least one evidence link.");
    }

    const statusText = portfolioForm.querySelector('.form-status');
    if (statusText) {
        if (!isValid) {
            statusText.textContent = "This experience has not been saved yet. Check the highlighted fields.";
            statusText.className = "form-status text-danger small";
        } else {
            statusText.textContent = "";
        }
    }

    return isValid;
}

container.addEventListener("submit", function (event) {
    const portfolioForm = event.target.closest(".portfolio-form");
    if (!portfolioForm) return;

    event.preventDefault();

    if (!validatePortfolioForm(portfolioForm)) {
        return;
    }

    const skills = Array.from(
        portfolioForm.querySelectorAll('.skills-container input[name="skills"]')
    ).map(input => input.value.trim());

    const evidence = Array.from(
        portfolioForm.querySelectorAll('.evidence-container input[name="evidence"]')
    ).map(input => input.value.trim());

    const portfolioItem = {
        title: portfolioForm.querySelector('[name="title"]').value.trim(),
        type: portfolioForm.querySelector('[name="type"]').value.trim(),
        date: portfolioForm.querySelector('[name="date"]').value,
        role: portfolioForm.querySelector('[name="role"]').value.trim(),
        roleDescription: portfolioForm.querySelector('[name="roleDescription"]')?.value.trim() || "",
        skills: skills,
        reflection: portfolioForm.querySelector('[name="reflection"]').value.trim(),
        evidence: evidence
    };

    const portfolioItems = getSavedPortfolioItems();
    portfolioItems.push(portfolioItem);

    localStorage.setItem(PORTFOLIO_ITEMS_KEY, JSON.stringify(portfolioItems));
    showPortfolioItems(portfolioItems);

    portfolioForm.reset();
    portfolioForm.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    portfolioForm.querySelectorAll(".small.text-danger").forEach(el => el.textContent = "");

    const statusText = portfolioForm.querySelector('.form-status');
    if (statusText) {
        statusText.textContent = "Experience saved successfully!";
        statusText.className = "form-status text-success small fw-bold";
    }
});

showPortfolioItems(getSavedPortfolioItems());

document.documentElement.setAttribute(
    'data-bs-theme',
    localStorage.getItem('theme') || 'dark'
);

const themeToggle = document.getElementById('theme-toggle');

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
    localStorage.setItem('theme', theme);
}

setTheme(localStorage.getItem('theme') || 'dark');

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});
