
const form = document.querySelector('#profile-form');
const STORAGE_KEY = 'portfolio';
const container = document.getElementById("portfolio-container");
const addButton = document.getElementById("add-portfolio");

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

    const newForm = firstForm.cloneNode(true);

    newForm.querySelectorAll("input").forEach(function (input) {
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

    const deleteButton = event.target.closest(".delete-portfolio");

    if (deleteButton) {

        const portfolioForm = deleteButton.closest(".portfolio-form");

        if (portfolioForm) {
            portfolioForm.remove();
        }

    }

});