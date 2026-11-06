const PORTFOLIOS_KEY = 'portfolios';
const ACTIVE_KEY = 'activePortfolioId';
const LEGACY_PROFILE_KEY = 'portfolio';
const LEGACY_ITEMS_KEY = 'portfolioItems';

const profileForm = document.querySelector('#profile-form');
const profileTitle = document.getElementById('profile-form-title');
const profileSubmit = document.getElementById('profile-submit');
const profileCancel = document.getElementById('profile-cancel');
const portfolioList = document.getElementById('portfolio-list');
const container = document.getElementById('portfolio-container');
const addButton = document.getElementById('add-portfolio');
const portfolioDisplay = document.getElementById('portfolio-display');
const itemsHeading = document.getElementById('items-heading');
const activeNote = document.getElementById('active-note');

let editingId = null;

function generateId() {
    if (window.crypto && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function normalizePortfolioItem(raw) {
    const item = raw || {};
    const reflection = item.reflection || {};

    return {
        id: String(item.id || generateId()),
        title: String(item.title || ''),
        type: String(item.type || ''),
        date: String(item.date || ''),
        role: String(item.role || ''),
        description: String(item.description ?? item.roleDescription ?? ''),
        skills: Array.isArray(item.skills) ? item.skills.map(String) : [],
        reflection: {
            did: String(reflection.did || ''),
            learned: String(reflection.learned || ''),
            challenge: String(reflection.challenge || ''),
            steps: String(reflection.steps || '')
        },
        evidence: Array.isArray(item.evidence) ? item.evidence.map(String) : []
    };
}

function normalizePortfolio(raw) {
    const p = raw || {};

    return {
        id: String(p.id || generateId()),
        displayName: String(p.displayName || ''),
        whatIEnjoy: String(p.whatIEnjoy || ''),
        whatIveTried: String(p.whatIveTried || ''),
        whatImCuriousAbout: String(p.whatImCuriousAbout || ''),
        items: Array.isArray(p.items) ? p.items.map(normalizePortfolioItem) : []
    };
}

function savePortfolios(portfolios) {
    localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios));
}

function migrateLegacyData() {
    let profile = null;
    let items = [];

    try {
        profile = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY));
    } catch (error) {
        console.error('Could not read legacy portfolio:', error);
    }

    try {
        const parsed = JSON.parse(localStorage.getItem(LEGACY_ITEMS_KEY));
        if (Array.isArray(parsed)) items = parsed;
    } catch (error) {
        console.error('Could not read legacy items:', error);
    }

    if (!profile && items.length === 0) return [];

    const portfolio = normalizePortfolio({
        displayName: (profile && profile.displayName) || 'Student',
        whatIEnjoy: profile && profile.whatIEnjoy,
        whatIveTried: profile && profile.whatIveTried,
        whatImCuriousAbout: profile && profile.whatImCuriousAbout,
        items: items
    });

    savePortfolios([portfolio]);
    localStorage.setItem(ACTIVE_KEY, portfolio.id);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
    localStorage.removeItem(LEGACY_ITEMS_KEY);

    return [portfolio];
}

function loadPortfolios() {
    const raw = localStorage.getItem(PORTFOLIOS_KEY);

    if (raw === null) {
        return migrateLegacyData();
    }

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(normalizePortfolio);
    } catch (error) {
        console.error('Could not restore Portfolios:', error);
    }

    return [];
}

function resolveActive(portfolios) {
    if (portfolios.length === 0) {
        localStorage.removeItem(ACTIVE_KEY);
        return null;
    }

    const savedId = localStorage.getItem(ACTIVE_KEY);
    let active = portfolios.find(function (p) { return p.id === savedId; });

    if (!active) {
        active = portfolios[0];
        localStorage.setItem(ACTIVE_KEY, active.id);
    }

    return active;
}

function makeButton(label, className, action, id) {
    const btn = el('button', className, label);
    btn.type = 'button';
    btn.dataset.action = action;
    btn.dataset.id = id;
    return btn;
}

function renderPortfolioList(portfolios, activeId) {
    portfolioList.innerHTML = '';

    if (portfolios.length === 0) {
        portfolioList.appendChild(
            el('p', 'text-muted', 'No portfolios yet. Create one with the form below.')
        );
        return;
    }

    portfolios.forEach(function (p) {
        const isActive = p.id === activeId;

        const col = el('div', 'col-md-6 col-lg-4');
        const card = el(
            'div',
            'card shadow-sm rounded-4 p-3 h-100 d-flex flex-column ' +
                (isActive ? 'border-success border-2' : 'border-0')
        );

        const name = el('h3', 'h5 fw-bold mb-1', p.displayName || 'Untitled');
        const meta = el(
            'p',
            'text-muted small mb-3',
            p.items.length + ' item(s)' + (isActive ? ' · Selected' : '')
        );

        const actions = el('div', 'd-flex gap-2 flex-wrap mt-auto');
        actions.append(
            makeButton('View', 'btn btn-sm btn-success', 'select', p.id),
            makeButton('Edit', 'btn btn-sm btn-outline-secondary', 'edit', p.id),
            makeButton('Delete', 'btn btn-sm btn-outline-danger', 'delete', p.id)
        );

        card.append(name, meta, actions);
        col.appendChild(card);
        portfolioList.appendChild(col);
    });
}

function showPortfolio(portfolio) {
    const p = portfolio || {};
    document.querySelector('#portfolio-name').textContent = p.displayName || 'Student';
    document.querySelector('#portfolio-enjoy').textContent = p.whatIEnjoy || '';
    document.querySelector('#portfolio-tried').textContent = p.whatIveTried || '';
    document.querySelector('#portfolio-curious').textContent = p.whatImCuriousAbout || '';
}

function showPortfolioItems(items, hasActive) {
    portfolioDisplay.innerHTML = '';

    if (!hasActive) {
        portfolioDisplay.appendChild(
            el('p', 'text-muted', 'Create or select a portfolio to see its items.')
        );
        return;
    }

    if (items.length === 0) {
        portfolioDisplay.appendChild(
            el('p', 'text-muted', 'This portfolio has no items yet.')
        );
        return;
    }

    items.forEach(function (item) {
        const card = el('div', 'card border-0 shadow-sm rounded-4 p-4 mb-3');

        const title = el('h3', 'h5 fw-bold', item.title);
        const type = el('p', '', 'Type: ' + item.type);
        const date = el('p', '', 'Date: ' + item.date);
        const role = el('p', '', 'Role: ' + item.role);
        const description = el('p', '', 'Role Description: ' + item.description);
        const skills = el('p', '', 'Skills: ' + item.skills.join(', '));
        const did = el('p', '', 'What I did: ' + item.reflection.did);
        const learned = el('p', '', 'What I learned: ' + item.reflection.learned);
        const challenge = el('p', '', 'Challenge: ' + item.reflection.challenge);
        const steps = el('p', '', 'Next steps: ' + item.reflection.steps);

        const evidence = el('div', '', 'Evidence: ');
        item.evidence.forEach(function (url, linkIndex) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = url;

            if (linkIndex > 0) {
                evidence.appendChild(document.createTextNode(' , '));
            }
            evidence.appendChild(link);
        });

        const deleteSavedButton = el(
            'button',
            'btn btn-outline-danger mt-3 delete-saved-portfolio',
            'Delete Portfolio Item'
        );
        deleteSavedButton.type = 'button';
        deleteSavedButton.dataset.id = item.id;

        card.append(
            title, type, date, role, description, skills,
            did, learned, challenge, steps, evidence, deleteSavedButton
        );
        portfolioDisplay.appendChild(card);
    });
}

function renderAll() {
    const portfolios = loadPortfolios();
    const active = resolveActive(portfolios);

    renderPortfolioList(portfolios, active ? active.id : null);
    showPortfolio(active);
    showPortfolioItems(active ? active.items : [], Boolean(active));

    if (itemsHeading) {
        itemsHeading.textContent = active
            ? 'Portfolio Items — ' + (active.displayName || 'Untitled')
            : 'Portfolio Items';
    }

    if (activeNote) {
        activeNote.textContent = active
            ? 'New items will be saved to: ' + (active.displayName || 'Untitled')
            : 'Create a portfolio first, then add items to it.';
    }
}

function validateProfileForm(formEl) {
    let isValid = true;

    function setError(inputElement, errorElement, message) {
        if (inputElement) inputElement.classList.add('is-invalid');
        if (errorElement) errorElement.innerHTML = `⚠️ ${message}`;
        isValid = false;
    }

    function clearError(inputElement, errorElement) {
        if (inputElement) inputElement.classList.remove('is-invalid');
        if (errorElement) errorElement.textContent = '';
    }

    const fields = [
        ['#displayName', '.error-display-name', 'Add a name to show on your portfolio.'],
        ['#enjoy', '.error-enjoy', 'Tell us something you enjoy doing.'],
        ['#tried', '.error-tried', 'Share something you have tried.'],
        ['#curious', '.error-curious', 'Add something you are curious about.']
    ];

    fields.forEach(function (f) {
        const input = formEl.querySelector(f[0]);
        const err = formEl.querySelector(f[1]);
        clearError(input, err);
        if (!input || !input.value.trim()) {
            setError(input, err, f[2]);
        }
    });

    return isValid;
}

function resetProfileForm() {
    editingId = null;
    profileForm.reset();
    profileForm.querySelectorAll('.is-invalid').forEach(function (e) {
        e.classList.remove('is-invalid');
    });
    profileForm.querySelectorAll('.small.text-danger').forEach(function (e) {
        e.textContent = '';
    });
    profileTitle.textContent = 'Create your portfolio';
    profileSubmit.textContent = 'Create portfolio';
    profileCancel.classList.add('d-none');
}

if (profileForm) {
    profileForm.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!validateProfileForm(profileForm)) return;

        const values = {
            displayName: document.querySelector('#displayName').value.trim(),
            whatIEnjoy: document.querySelector('#enjoy').value.trim(),
            whatIveTried: document.querySelector('#tried').value.trim(),
            whatImCuriousAbout: document.querySelector('#curious').value.trim()
        };

        const portfolios = loadPortfolios();

        if (editingId) {
            const target = portfolios.find(function (p) { return p.id === editingId; });
            if (target) Object.assign(target, values);
            savePortfolios(portfolios);
            localStorage.setItem(ACTIVE_KEY, editingId);
        } else {
            const created = normalizePortfolio(Object.assign({ id: generateId(), items: [] }, values));
            portfolios.push(created);
            savePortfolios(portfolios);
            localStorage.setItem(ACTIVE_KEY, created.id);
        }

        resetProfileForm();
        renderAll();
    });
}

if (profileCancel) {
    profileCancel.addEventListener('click', resetProfileForm);
}

portfolioList.addEventListener('click', function (event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'select') {
        localStorage.setItem(ACTIVE_KEY, id);
        renderAll();
    }

    if (action === 'edit') {
        const target = loadPortfolios().find(function (p) { return p.id === id; });
        if (!target) return;

        document.querySelector('#displayName').value = target.displayName;
        document.querySelector('#enjoy').value = target.whatIEnjoy;
        document.querySelector('#tried').value = target.whatIveTried;
        document.querySelector('#curious').value = target.whatImCuriousAbout;

        editingId = id;
        profileTitle.textContent = 'Edit portfolio';
        profileSubmit.textContent = 'Save changes';
        profileCancel.classList.remove('d-none');
        profileForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (action === 'delete') {
        if (!window.confirm('Delete this portfolio and all of its items?')) return;

        const remaining = loadPortfolios().filter(function (p) { return p.id !== id; });
        savePortfolios(remaining);

        if (editingId === id) resetProfileForm();
        if (localStorage.getItem(ACTIVE_KEY) === id) localStorage.removeItem(ACTIVE_KEY);

        renderAll();
    }
});

if (addButton) {
    addButton.addEventListener('click', function () {
        const firstForm = container.querySelector('.portfolio-form');
        if (!firstForm) return;

        const newForm = firstForm.cloneNode(true);

        newForm.querySelectorAll('input, textarea').forEach(function (input) {
            input.value = '';
            input.classList.remove('is-invalid');
        });

        newForm.querySelectorAll('.small.text-danger').forEach(function (errEl) {
            errEl.textContent = '';
        });

        const statusText = newForm.querySelector('.form-status');
        if (statusText) {
            statusText.textContent = 'This experience has not been saved yet. Check the highlighted fields.';
            statusText.className = 'form-status text-muted small';
        }

        container.appendChild(newForm);
    });
}

container.addEventListener('click', function (event) {
    const addSkillButton = event.target.closest('.add-skill');

    if (addSkillButton) {
        const portfolioForm = addSkillButton.closest('.portfolio-form');
        const skillsContainer = portfolioForm.querySelector('.skills-container');
        const firstSkill = skillsContainer.querySelector('.skill-item');
        const newSkill = firstSkill.cloneNode(true);

        newSkill.querySelector('input').value = '';
        newSkill.querySelector('input').classList.remove('is-invalid');

        skillsContainer.appendChild(newSkill);
    }

    const deleteFieldButton = event.target.closest('.delete-field');

    if (deleteFieldButton) {
        const skillItem = deleteFieldButton.closest('.skill-item');
        const skillsContainer = skillItem.closest('.skills-container');

        if (skillsContainer.querySelectorAll('.skill-item').length > 1) {
            skillItem.remove();
        } else {
            skillItem.querySelector('input').value = '';
        }
    }

    const addEvidenceButton = event.target.closest('.add-evidence');

    if (addEvidenceButton) {
        const portfolioForm = addEvidenceButton.closest('.portfolio-form');
        const evidenceContainer = portfolioForm.querySelector('.evidence-container');
        const firstEvidence = evidenceContainer.querySelector('.evidence-item');
        const newEvidence = firstEvidence.cloneNode(true);

        newEvidence.querySelector('input').value = '';
        newEvidence.querySelector('input').classList.remove('is-invalid');

        evidenceContainer.appendChild(newEvidence);
    }

    const deleteEvidenceButton = event.target.closest('.delete-evidence');

    if (deleteEvidenceButton) {
        const evidenceItem = deleteEvidenceButton.closest('.evidence-item');
        const evidenceContainer = evidenceItem.closest('.evidence-container');

        if (evidenceContainer.querySelectorAll('.evidence-item').length > 1) {
            evidenceItem.remove();
        } else {
            evidenceItem.querySelector('input').value = '';
        }
    }

    const deleteButton = event.target.closest('.delete-portfolio');

    if (deleteButton) {
        const portfolioForm = deleteButton.closest('.portfolio-form');

        if (portfolioForm && container.querySelectorAll('.portfolio-form').length > 1) {
            portfolioForm.remove();
        } else if (portfolioForm) {
            portfolioForm.reset();
            portfolioForm.querySelectorAll('.is-invalid').forEach(function (e) { e.classList.remove('is-invalid'); });
            portfolioForm.querySelectorAll('.small.text-danger').forEach(function (e) { e.textContent = ''; });
        }
    }
});

portfolioDisplay.addEventListener('click', function (event) {
    const deleteButton = event.target.closest('.delete-saved-portfolio');
    if (!deleteButton) return;

    const id = deleteButton.dataset.id;
    const portfolios = loadPortfolios();
    const active = resolveActive(portfolios);
    if (!active) return;

    active.items = active.items.filter(function (item) { return item.id !== id; });
    savePortfolios(portfolios);
    renderAll();
});

function isValidHttpUrl(value) {
    if (/\s/.test(value)) return false;

    let url;
    try {
        url = new URL(value);
    } catch (_) {
        return false;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const host = url.hostname;
    return (
        host === 'localhost' ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
        /^([a-z0-9-]+\.)+[a-z][a-z0-9-]+$/i.test(host)
    );
}

function validatePortfolioForm(portfolioForm) {
    let isValid = true;

    function setError(inputElement, errorElement, message) {
        if (inputElement) inputElement.classList.add('is-invalid');
        if (errorElement) errorElement.innerHTML = `⚠️ ${message}`;
        isValid = false;
    }

    function clearError(inputElement, errorElement) {
        if (inputElement) inputElement.classList.remove('is-invalid');
        if (errorElement) errorElement.textContent = '';
    }

    const titleInput = portfolioForm.querySelector('[name="title"]');
    const titleErr = portfolioForm.querySelector('.error-title');
    clearError(titleInput, titleErr);
    if (!titleInput.value.trim()) {
        setError(titleInput, titleErr, 'Add a title for this experience.');
    }

    const typeInput = portfolioForm.querySelector('[name="type"]');
    const typeErr = portfolioForm.querySelector('.error-type');
    clearError(typeInput, typeErr);
    if (!typeInput.value.trim()) {
        setError(typeInput, typeErr, 'Add a type, such as project, course, or activity.');
    }

    const dateInput = portfolioForm.querySelector('[name="date"]');
    const dateErr = portfolioForm.querySelector('.error-date');
    clearError(dateInput, dateErr);
    if (!dateInput.value || isNaN(Date.parse(dateInput.value))) {
        setError(dateInput, dateErr, 'Choose the date you completed or started this experience.');
    }

    const roleInput = portfolioForm.querySelector('[name="role"]');
    const roleErr = portfolioForm.querySelector('.error-role');
    clearError(roleInput, roleErr);
    if (!roleInput.value.trim()) {
        setError(roleInput, roleErr, 'Describe what you did or contributed.');
    }

    const skillInputs = Array.from(portfolioForm.querySelectorAll('.skills-container input[name="skills"]'));
    const skillsErr = portfolioForm.querySelector('.error-skills');
    clearError(null, skillsErr);
    skillInputs.forEach(function (input) { input.classList.remove('is-invalid'); });

    const skillMessages = [];
    const seenSkills = new Set();
    let filledSkills = 0;

    skillInputs.forEach(function (input, index) {
        const value = input.value.trim();
        if (value === '') return;

        filledSkills++;

        let problem = '';
        if (value.length > 40) {
            problem = 'is too long (max 40 characters).';
        } else if (!/\p{L}/u.test(value)) {
            problem = 'must contain at least one letter, e.g. HTML or Teamwork.';
        } else if (seenSkills.has(value.toLowerCase())) {
            problem = 'is a duplicate. Remove it or enter a different skill.';
        }
        seenSkills.add(value.toLowerCase());

        if (problem) {
            input.classList.add('is-invalid');
            skillMessages.push('Skill ' + (index + 1) + ' ' + problem);
        }
    });

    if (filledSkills === 0) {
        if (skillInputs[0]) skillInputs[0].classList.add('is-invalid');
        skillMessages.push('Add at least one skill, e.g. HTML or Teamwork.');
    }

    if (skillMessages.length > 0) {
        setError(null, skillsErr, skillMessages.join('<br>⚠️ '));
    }

    const reflectionErr = portfolioForm.querySelector('.error-reflection');
    const reflectionInputs = ['did', 'learned', 'challenge', 'steps'].map(function (name) {
        return portfolioForm.querySelector('[name="' + name + '"]');
    });

    clearError(null, reflectionErr);

    reflectionInputs.forEach(function (input) {
        input.classList.remove('is-invalid');

        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            setError(null, reflectionErr, 'Please complete all reflection fields.');
        }
    });

    const evidenceInputs = Array.from(portfolioForm.querySelectorAll('.evidence-container input[name="evidence"]'));
    const evidenceErr = portfolioForm.querySelector('.error-evidence');
    clearError(null, evidenceErr);
    evidenceInputs.forEach(function (input) { input.classList.remove('is-invalid'); });

    const evidenceMessages = [];
    const seenLinks = new Set();
    let filledLinks = 0;

    evidenceInputs.forEach(function (input, index) {
        const value = input.value.trim();
        if (value === '') return;

        filledLinks++;

        let problem = '';
        if (!/^https?:\/\//i.test(value)) {
            problem = 'must start with http:// or https://, e.g. https://github.com/yourname.';
        } else if (!isValidHttpUrl(value)) {
            problem = 'does not look like a real web address. Check for typos or spaces.';
        } else if (seenLinks.has(value.toLowerCase())) {
            problem = 'is a duplicate. Remove it or enter a different link.';
        }
        seenLinks.add(value.toLowerCase());

        if (problem) {
            input.classList.add('is-invalid');
            evidenceMessages.push('Link ' + (index + 1) + ' ' + problem);
        }
    });

    if (filledLinks === 0) {
        if (evidenceInputs[0]) evidenceInputs[0].classList.add('is-invalid');
        evidenceMessages.push('Add at least one evidence link, e.g. https://github.com/yourname/project.');
    }

    if (evidenceMessages.length > 0) {
        setError(null, evidenceErr, evidenceMessages.join('<br>⚠️ '));
    }

    const statusText = portfolioForm.querySelector('.form-status');
    if (statusText) {
        if (!isValid) {
            statusText.textContent = 'This experience has not been saved yet. Check the highlighted fields.';
            statusText.className = 'form-status text-danger small';
        } else {
            statusText.textContent = '';
        }
    }

    return isValid;
}

container.addEventListener('submit', function (event) {
    const portfolioForm = event.target.closest('.portfolio-form');
    if (!portfolioForm) return;

    event.preventDefault();

    const statusText = portfolioForm.querySelector('.form-status');
    const portfolios = loadPortfolios();
    const active = resolveActive(portfolios);

    if (!active) {
        if (statusText) {
            statusText.textContent = 'Create a portfolio first, then add items to it.';
            statusText.className = 'form-status text-danger small';
        }
        return;
    }

    if (!validatePortfolioForm(portfolioForm)) return;

    const skills = Array.from(
        portfolioForm.querySelectorAll('.skills-container input[name="skills"]')
    ).map(function (input) { return input.value.trim(); }).filter(Boolean);

    const evidence = Array.from(
        portfolioForm.querySelectorAll('.evidence-container input[name="evidence"]')
    ).map(function (input) { return input.value.trim(); }).filter(Boolean);

    const portfolioItem = normalizePortfolioItem({
        id: generateId(),
        title: portfolioForm.querySelector('[name="title"]').value.trim(),
        type: portfolioForm.querySelector('[name="type"]').value.trim(),
        date: portfolioForm.querySelector('[name="date"]').value,
        role: portfolioForm.querySelector('[name="role"]').value.trim(),
        description: portfolioForm.querySelector('[name="roleDescription"]').value.trim(),
        skills: skills,
        reflection: {
            did: portfolioForm.querySelector('[name="did"]').value.trim(),
            learned: portfolioForm.querySelector('[name="learned"]').value.trim(),
            challenge: portfolioForm.querySelector('[name="challenge"]').value.trim(),
            steps: portfolioForm.querySelector('[name="steps"]').value.trim()
        },
        evidence: evidence
    });

    active.items.push(portfolioItem);
    savePortfolios(portfolios);
    renderAll();

    portfolioForm.reset();
    portfolioForm.querySelectorAll('.is-invalid').forEach(function (e) { e.classList.remove('is-invalid'); });
    portfolioForm.querySelectorAll('.small.text-danger').forEach(function (e) { e.textContent = ''; });

    if (statusText) {
        statusText.textContent = 'Experience saved to "' + (active.displayName || 'Untitled') + '"!';
        statusText.className = 'form-status text-success small fw-bold';
    }
});

container.addEventListener('input', function (event) {
    const input = event.target;
    if (!input.classList.contains('is-invalid')) return;

    const group = input.closest('.skills-container, .evidence-container');
    if (!group) return;

    input.classList.remove('is-invalid');
    if (group.querySelector('.is-invalid')) return;

    const err = group.parentElement.querySelector('.error-skills, .error-evidence');
    if (err) err.textContent = '';
});

const themeToggle = document.getElementById('theme-toggle');

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
    localStorage.setItem('theme', theme);
}

setTheme(localStorage.getItem('theme') || 'dark');

themeToggle.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-bs-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

renderAll();