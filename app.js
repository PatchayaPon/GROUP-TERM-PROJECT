const form = document.querySelector('#profile-form');
const STORAGE_KEY = 'portfolio';
const container = document.getElementById("portfolio-container");
const addButton = document.getElementById("add-portfolio");

const PORTFOLIO_ITEMS_KEY = 'portfolioItems';
const portfolioDisplay = document.getElementById("portfolio-display");

function showPortfolio(portfolio) {
    document.querySelector('#portfolio-name').textContent = portfolio.displayName;
    document.querySelector('#portfolio-enjoy').textContent = portfolio.whatIEnjoy;
    document.querySelector('#portfolio-tried').textContent = portfolio.whatIveTried;
    document.querySelector('#portfolio-curious').textContent = portfolio.whatImCuriousAbout;
}

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.querySelector('#displayName').value.trim();
    const error = document.querySelector('#profile-error');

    if (name === '') {
        error.textContent = 'Please enter your name.';
        return;
    }

    error.textContent = '';

    const portfolio = {
        displayName: name,
        whatIEnjoy: document.querySelector('#enjoy').value.trim(),
        whatIveTried: document.querySelector('#tried').value.trim(),
        whatImCuriousAbout: document.querySelector('#curious').value.trim()
    };

    showPortfolio(portfolio);

    const json = JSON.stringify(portfolio);
    localStorage.setItem(STORAGE_KEY, json);
});

const savedData = localStorage.getItem(STORAGE_KEY);

if (savedData !== null) {
    try {
        const savedPortfolio = JSON.parse(savedData);
        showPortfolio(savedPortfolio);
    } catch (error) {
        console.error('Could not restore the saved Portfolio:', error);
    }
}

addButton.addEventListener("click", function () {

    const firstForm = container.querySelector(".portfolio-form");

    if (!firstForm) {
        return;
    }

    const newForm = firstForm.cloneNode(true);

    newForm.querySelectorAll("input, textarea").forEach(function (input) {
        input.value = "";
    });

    newForm.querySelector(".form-error").textContent = "";

    newForm.querySelectorAll("[id]").forEach(function (element) {

        const oldId = element.id;
        const newId = oldId + "-" + Date.now();

        element.id = newId;

        newForm.querySelectorAll("label").forEach(function (label) {

            if (label.htmlFor === oldId) {
                label.htmlFor = newId;
            }

        });

    });

    container.appendChild(newForm);

});

container.addEventListener("click", function (event) {

    const addSkillButton = event.target.closest(".add-skill");

    if (addSkillButton) {

        const portfolioForm = addSkillButton.closest(".portfolio-form");
        const skillsContainer = portfolioForm.querySelector(".skills-container");
        const firstSkill = skillsContainer.querySelector(".skill-item");

        const newSkill = firstSkill.cloneNode(true);

        newSkill.querySelector("input").value = "";

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

        if (portfolioForm) {
            portfolioForm.remove();
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

        const skills = document.createElement("p");
        skills.textContent = "Skills: " + item.skills.join(", ");

        const reflection = document.createElement("p");
        reflection.textContent = "Reflection: " + item.reflection;

        const evidence = document.createElement("div");
        evidence.textContent = "Evidence: " + item.evidence.join(", ");

        card.append(title, type, date, role, skills, reflection, evidence);
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

container.addEventListener("submit", function (event) {
    const portfolioForm = event.target.closest(".portfolio-form");

    if (!portfolioForm) {
        return;
    }

    event.preventDefault();

    // ทำการ Validate ก่อนบันทึกข้อมูล
    if (!validatePortfolioForm(portfolioForm)) {
        return; // หยุดการทำงานและไม่บันทึกข้อมูลหากไม่ผ่าน
    }

    const skills = Array.from(
        portfolioForm.querySelectorAll('.skills-container input[name="skills"]')
    ).map(function (input) {
        return input.value.trim();
    });

    const evidence = Array.from(
        portfolioForm.querySelectorAll('.evidence-container input[name="evidence"]')
    ).map(function (input) {
        return input.value.trim();
    });

    const portfolioItem = {
        title: portfolioForm.querySelector('[name="title"]').value.trim(),
        type: portfolioForm.querySelector('[name="type"]').value.trim(),
        date: portfolioForm.querySelector('[name="date"]').value,
        role: portfolioForm.querySelector('[name="role"]').value.trim(),
        skills: skills,
        reflection: portfolioForm.querySelector('[name="reflection"].value.trim()') || portfolioForm.querySelector('[name="reflection"]').value.trim(),
        evidence: evidence
    };

    const portfolioItems = getSavedPortfolioItems();
    portfolioItems.push(portfolioItem);

    localStorage.setItem(
        PORTFOLIO_ITEMS_KEY,
        JSON.stringify(portfolioItems)
    );

    showPortfolioItems(portfolioItems);
    portfolioForm.reset();
    portfolioForm.querySelector(".form-error").textContent = "";
});

showPortfolioItems(getSavedPortfolioItems());