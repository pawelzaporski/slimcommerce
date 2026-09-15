'use strict';

const STORAGE_KEYS = {
    apiBase: 'slimcommerce.apiBase',
    token: 'slimcommerce.token',
    user: 'slimcommerce.user',
};

const DEFAULT_API_BASE = 'http://localhost:8080';
const MAX_LOG_ENTRIES = 50;

const state = {
    page: 1,
    perPage: 15,
    lastPage: 1,
    editingProductId: null,
    attributes: null,
    variantsProductId: null,
    editingVariantId: null,
};

const requestLog = [];

// --- Elementy DOM ---

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');

const loginForm = document.getElementById('login-form');
const apiBaseInput = document.getElementById('api-base');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const loginSubmit = document.getElementById('login-submit');

const whoami = document.getElementById('whoami');
const logoutBtn = document.getElementById('logout-btn');
const addProductBtn = document.getElementById('add-product-btn');

const listError = document.getElementById('list-error');
const productsBody = document.getElementById('products-body');

const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageIndicator = document.getElementById('page-indicator');
const perPageSelect = document.getElementById('per-page');

const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const productModalTitle = document.getElementById('product-modal-title');
const productFormError = document.getElementById('product-form-error');
const productCancelBtn = document.getElementById('product-cancel-btn');

const fieldExternalId = document.getElementById('field-external-id');
const fieldSku = document.getElementById('field-sku');
const fieldName = document.getElementById('field-name');
const fieldPrice = document.getElementById('field-price');
const fieldActive = document.getElementById('field-active');

const requestLogEl = document.getElementById('request-log');
const requestLogToggle = document.getElementById('request-log-toggle');
const requestLogSummary = document.getElementById('request-log-summary');
const requestLogBody = document.getElementById('request-log-body');
const requestLogList = document.getElementById('request-log-list');

const tabButtons = document.querySelectorAll('.tab-btn');
const pages = document.querySelectorAll('.page');

const attributesError = document.getElementById('attributes-error');
const attributesList = document.getElementById('attributes-list');
const addAttributeBtn = document.getElementById('add-attribute-btn');

const variantsModal = document.getElementById('variants-modal');
const variantsModalTitle = document.getElementById('variants-modal-title');
const variantsError = document.getElementById('variants-error');
const variantsBody = document.getElementById('variants-body');
const variantsCloseBtn = document.getElementById('variants-close-btn');

const variantForm = document.getElementById('variant-form');
const variantFormTitle = document.getElementById('variant-form-title');
const variantFormError = document.getElementById('variant-form-error');
const variantExternalId = document.getElementById('variant-external-id');
const variantSku = document.getElementById('variant-sku');
const variantEan = document.getElementById('variant-ean');
const variantPrice = document.getElementById('variant-price');
const variantStock = document.getElementById('variant-stock');
const variantAttributesFields = document.getElementById('variant-attributes-fields');
const variantResetBtn = document.getElementById('variant-reset-btn');

// --- Storage helpery ---

function getApiBase() {
    return localStorage.getItem(STORAGE_KEYS.apiBase) || DEFAULT_API_BASE;
}

function saveApiBase(value) {
    localStorage.setItem(STORAGE_KEYS.apiBase, value);
}

function getToken() {
    return localStorage.getItem(STORAGE_KEYS.token);
}

function getUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
}

// --- API klient ---

class ApiError extends Error {
    constructor(message, status, errors) {
        super(message);
        this.status = status;
        this.errors = errors || null;
    }
}

async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    let status = 0;

    try {
        const headers = { ...(options.headers || {}) };
        const token = getToken();

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (options.body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        let response;
        try {
            response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
        } catch {
            throw new ApiError('Nie można połączyć się z API. Sprawdź adres i czy backend działa.', 0);
        }

        status = response.status;

        if (response.status === 401) {
            clearSession();
            showView('login');
            throw new ApiError('Sesja wygasła — zaloguj się ponownie.', 401);
        }

        if (response.status === 204) {
            return null;
        }

        const rawText = await response.text();
        let payload = null;
        try {
            payload = rawText ? JSON.parse(rawText) : null;
        } catch {
            throw new ApiError('Serwer zwrócił niepoprawną odpowiedź (uszkodzony JSON). Sprawdź logi backendu.', response.status);
        }

        if (!response.ok) {
            const message = payload?.error || payload?.errors?.[Object.keys(payload.errors)[0]] || 'Wystąpił błąd.';
            throw new ApiError(message, response.status, payload?.errors);
        }

        if (payload === null) {
            throw new ApiError('Serwer zwrócił pustą odpowiedź.', response.status);
        }

        return payload;
    } catch (error) {
        if (error instanceof ApiError && error.status) {
            status = error.status;
        }
        throw error;
    } finally {
        logRequest(method, path, status);
    }
}

// --- Log ostatnich zapytań ---

function logRequest(method, path, status) {
    requestLog.unshift({ method, path, status, time: new Date() });

    if (requestLog.length > MAX_LOG_ENTRIES) {
        requestLog.length = MAX_LOG_ENTRIES;
    }

    renderRequestLog();
}

function renderRequestLog() {
    const last = requestLog[0];

    requestLogSummary.textContent = last
        ? `Ostatnie zapytania (${requestLog.length}) — ${last.method} ${last.path} → ${last.status || 'ERR'}`
        : 'Brak zapytań';

    requestLogList.innerHTML = '';

    for (const entry of requestLog) {
        const li = document.createElement('li');
        const ok = entry.status >= 200 && entry.status < 400;
        const timeLabel = entry.time.toLocaleTimeString('pl-PL', { hour12: false });

        li.innerHTML = `
            <span class="log-time">${timeLabel}</span>
            <span class="log-method">${entry.method}</span>
            <span class="log-path">${escapeHtml(entry.path)}</span>
            <span class="log-status ${ok ? 'ok' : 'fail'}">${entry.status || 'ERR'}</span>
        `;

        requestLogList.appendChild(li);
    }
}

requestLogToggle.addEventListener('click', () => {
    const isExpanded = requestLogEl.classList.toggle('expanded');
    requestLogBody.hidden = !isExpanded;
});

// --- Widoki ---

function showView(name) {
    const isLogin = name === 'login';
    loginView.hidden = !isLogin;
    appView.hidden = isLogin;
}

function switchPage(pageId) {
    for (const page of pages) {
        page.hidden = page.id !== pageId;
    }

    for (const btn of tabButtons) {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    }

    if (pageId === 'attributes-page') {
        loadAttributes();
    }
}

for (const btn of tabButtons) {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
}

function formatPrice(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : value;
}

// --- Logowanie ---

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.hidden = true;
    loginSubmit.disabled = true;

    saveApiBase(apiBaseInput.value.trim() || DEFAULT_API_BASE);

    try {
        const payload = await apiFetch('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: passwordInput.value,
            }),
        });

        saveSession(payload.token, payload.user);
        passwordInput.value = '';
        enterApp();
    } catch (error) {
        loginError.textContent = error.message;
        loginError.hidden = false;
    } finally {
        loginSubmit.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => {
    clearSession();
    showView('login');
});

function enterApp() {
    const user = getUser();
    whoami.textContent = user ? `${user.name} (${user.role})` : '';
    showView('app');
    switchPage('products-page');
    state.page = 1;
    loadProducts();
}

// --- Lista produktów ---

async function loadProducts() {
    listError.hidden = true;
    productsBody.innerHTML = '<tr><td colspan="7" class="muted">Ładowanie...</td></tr>';

    try {
        const payload = await apiFetch(`/api/admin/products?page=${state.page}&per_page=${state.perPage}`);
        state.lastPage = payload.meta.last_page;
        renderProducts(payload.data);
        updatePaginationControls(payload.meta);
    } catch (error) {
        if (error.status === 401) return;
        productsBody.innerHTML = '';
        listError.textContent = error.message;
        listError.hidden = false;
    }
}

function renderProducts(products) {
    if (products.length === 0) {
        productsBody.innerHTML = '<tr><td colspan="7" class="muted">Brak produktów.</td></tr>';
        return;
    }

    productsBody.innerHTML = '';

    for (const product of products) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.external_id ? escapeHtml(product.external_id) : '—'}</td>
            <td>${escapeHtml(product.sku)}</td>
            <td>${escapeHtml(product.name)}</td>
            <td>${formatPrice(product.base_price)}</td>
            <td><span class="badge ${product.is_active ? 'active' : 'inactive'}">${product.is_active ? 'Tak' : 'Nie'}</span></td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="variants">Warianty</button>
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="variants"]').addEventListener('click', () => openVariantsModal(product));
        row.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(product));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(product));

        productsBody.appendChild(row);
    }
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

function updatePaginationControls(meta) {
    pageIndicator.textContent = `Strona ${meta.current_page} z ${meta.last_page} (${meta.total} produktów)`;
    prevPageBtn.disabled = meta.current_page <= 1;
    nextPageBtn.disabled = meta.current_page >= meta.last_page;
}

prevPageBtn.addEventListener('click', () => {
    if (state.page > 1) {
        state.page -= 1;
        loadProducts();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (state.page < state.lastPage) {
        state.page += 1;
        loadProducts();
    }
});

perPageSelect.addEventListener('change', () => {
    state.perPage = Number(perPageSelect.value);
    state.page = 1;
    loadProducts();
});

// --- Modal dodawania / edycji ---

function openCreateModal() {
    state.editingProductId = null;
    productModalTitle.textContent = 'Dodaj produkt';
    productForm.reset();
    fieldActive.checked = true;
    productFormError.hidden = true;
    productModal.hidden = false;
    fieldSku.focus();
}

function openEditModal(product) {
    state.editingProductId = product.id;
    productModalTitle.textContent = `Edytuj produkt #${product.id}`;
    fieldExternalId.value = product.external_id ?? '';
    fieldSku.value = product.sku;
    fieldName.value = product.name;
    fieldPrice.value = product.base_price;
    fieldActive.checked = Boolean(product.is_active);
    productFormError.hidden = true;
    productModal.hidden = false;
    fieldSku.focus();
}

function closeModal() {
    productModal.hidden = true;
}

addProductBtn.addEventListener('click', openCreateModal);
productCancelBtn.addEventListener('click', closeModal);
productModal.addEventListener('click', (event) => {
    if (event.target === productModal) closeModal();
});

productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    productFormError.hidden = true;

    const body = {
        external_id: fieldExternalId.value.trim() || null,
        sku: fieldSku.value.trim(),
        name: fieldName.value.trim(),
        base_price: Number(fieldPrice.value),
        is_active: fieldActive.checked,
    };

    const isEditing = state.editingProductId !== null;
    const path = isEditing ? `/api/admin/products/${state.editingProductId}` : '/api/admin/products';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('product-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(path, { method, body: JSON.stringify(body) });
        closeModal();
        loadProducts();
    } catch (error) {
        productFormError.textContent = error.message;
        productFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteProduct(product) {
    const confirmed = window.confirm(`Usunąć produkt "${product.name}" (SKU: ${product.sku})?`);
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
        if (productsBody.children.length === 1 && state.page > 1) {
            state.page -= 1;
        }
        loadProducts();
    } catch (error) {
        if (error.status === 401) return;
        listError.textContent = error.message;
        listError.hidden = false;
    }
}

// --- Cechy (attributes) ---

async function loadAttributes() {
    attributesError.hidden = true;
    attributesList.innerHTML = '<p class="muted">Ładowanie...</p>';

    try {
        state.attributes = await apiFetch('/api/admin/attributes');
        renderAttributes();
    } catch (error) {
        if (error.status === 401) return;
        state.attributes = [];
        attributesList.innerHTML = '';
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

async function ensureAttributesLoaded() {
    if (state.attributes === null) {
        await loadAttributes();
    }

    return state.attributes || [];
}

function renderAttributes() {
    const attributes = state.attributes || [];

    if (attributes.length === 0) {
        attributesList.innerHTML = '<p class="muted">Brak zdefiniowanych cech.</p>';
        return;
    }

    attributesList.innerHTML = '';

    for (const attribute of attributes) {
        const card = document.createElement('div');
        card.className = 'attribute-card';

        const chips = (attribute.values || [])
            .map((v) => `
                <span class="value-chip" data-value-id="${v.id}">
                    ${escapeHtml(v.value)}
                    <button type="button" data-action="edit-value" title="Edytuj">&#9998;</button>
                    <button type="button" data-action="delete-value" title="Usuń">&times;</button>
                </span>
            `)
            .join('');

        card.innerHTML = `
            <div class="attribute-card-header">
                <h3>${escapeHtml(attribute.name)}</h3>
                <div class="attribute-card-actions">
                    <button type="button" class="secondary" data-action="edit-attribute">Edytuj</button>
                    <button type="button" class="danger" data-action="delete-attribute">Usuń</button>
                </div>
            </div>
            <div class="value-chips">${chips || '<span class="muted">Brak wartości.</span>'}</div>
            <form class="add-value-form" data-action="add-value">
                <input type="text" placeholder="Nowa wartość, np. XL" required>
                <button type="submit" class="secondary">Dodaj</button>
            </form>
        `;

        card.querySelector('[data-action="edit-attribute"]').addEventListener('click', () => editAttribute(attribute));
        card.querySelector('[data-action="delete-attribute"]').addEventListener('click', () => deleteAttribute(attribute));

        for (const chip of card.querySelectorAll('.value-chip')) {
            const valueId = Number(chip.dataset.valueId);
            const value = (attribute.values || []).find((v) => v.id === valueId);

            chip.querySelector('[data-action="edit-value"]').addEventListener('click', () => editAttributeValue(value));
            chip.querySelector('[data-action="delete-value"]').addEventListener('click', () => deleteAttributeValue(value));
        }

        card.querySelector('[data-action="add-value"]').addEventListener('submit', (event) => addAttributeValue(event, attribute));

        attributesList.appendChild(card);
    }
}

addAttributeBtn.addEventListener('click', async () => {
    const name = window.prompt('Nazwa nowej cechy (np. Rozmiar):');
    if (!name || !name.trim()) return;

    try {
        await apiFetch('/api/admin/attributes', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
});

async function editAttribute(attribute) {
    const name = window.prompt('Nowa nazwa cechy:', attribute.name);
    if (!name || !name.trim() || name.trim() === attribute.name) return;

    try {
        await apiFetch(`/api/admin/attributes/${attribute.id}`, { method: 'PUT', body: JSON.stringify({ name: name.trim() }) });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

async function deleteAttribute(attribute) {
    const confirmed = window.confirm(`Usunąć cechę "${attribute.name}" wraz ze wszystkimi jej wartościami?`);
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/attributes/${attribute.id}`, { method: 'DELETE' });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

async function addAttributeValue(event, attribute) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const value = input.value.trim();
    if (!value) return;

    try {
        await apiFetch(`/api/admin/attributes/${attribute.id}/values`, { method: 'POST', body: JSON.stringify({ value }) });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

async function editAttributeValue(value) {
    const newValue = window.prompt('Nowa wartość:', value.value);
    if (!newValue || !newValue.trim() || newValue.trim() === value.value) return;

    try {
        await apiFetch(`/api/admin/attribute-values/${value.id}`, { method: 'PUT', body: JSON.stringify({ value: newValue.trim() }) });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

async function deleteAttributeValue(value) {
    const confirmed = window.confirm(`Usunąć wartość "${value.value}"?`);
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/attribute-values/${value.id}`, { method: 'DELETE' });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

// --- Warianty produktu ---

async function openVariantsModal(product) {
    state.variantsProductId = product.id;
    variantsModalTitle.textContent = `Warianty produktu: ${product.name}`;
    variantsModal.hidden = false;

    resetVariantForm();
    await ensureAttributesLoaded();
    renderVariantAttributeFields([]);
    loadVariants(product.id);
}

function closeVariantsModal() {
    variantsModal.hidden = true;
    state.variantsProductId = null;
}

variantsCloseBtn.addEventListener('click', closeVariantsModal);
variantsModal.addEventListener('click', (event) => {
    if (event.target === variantsModal) closeVariantsModal();
});

async function loadVariants(productId) {
    variantsError.hidden = true;
    variantsBody.innerHTML = '<tr><td colspan="6" class="muted">Ładowanie...</td></tr>';

    try {
        const variants = await apiFetch(`/api/admin/products/${productId}/variants`);
        renderVariantsTable(variants);
    } catch (error) {
        if (error.status === 401) return;
        variantsBody.innerHTML = '';
        variantsError.textContent = error.message;
        variantsError.hidden = false;
    }
}

function renderVariantsTable(variants) {
    if (variants.length === 0) {
        variantsBody.innerHTML = '<tr><td colspan="6" class="muted">Brak wariantów.</td></tr>';
        return;
    }

    variantsBody.innerHTML = '';

    for (const variant of variants) {
        const row = document.createElement('tr');
        const attrLabels = (variant.attribute_values || []).map((v) => escapeHtml(v.value)).join(', ');

        row.innerHTML = `
            <td>${escapeHtml(variant.sku)}</td>
            <td>${variant.ean ? escapeHtml(variant.ean) : '—'}</td>
            <td>${formatPrice(variant.price)}</td>
            <td>${variant.stock}</td>
            <td>${attrLabels || '—'}</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => editVariant(variant));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteVariant(variant));

        variantsBody.appendChild(row);
    }
}

function renderVariantAttributeFields(selectedValueIds) {
    const attributes = state.attributes || [];
    variantAttributesFields.innerHTML = '';

    if (attributes.length === 0) {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'variant-attr-fields';

    for (const attribute of attributes) {
        const field = document.createElement('div');
        const selectedValue = (attribute.values || []).find((v) => selectedValueIds.includes(v.id));

        const options = (attribute.values || [])
            .map((v) => `<option value="${v.id}" ${selectedValue && selectedValue.id === v.id ? 'selected' : ''}>${escapeHtml(v.value)}</option>`)
            .join('');

        field.innerHTML = `
            <label>${escapeHtml(attribute.name)}</label>
            <select data-attribute-id="${attribute.id}">
                <option value="">—</option>
                ${options}
            </select>
        `;

        wrapper.appendChild(field);
    }

    variantAttributesFields.appendChild(wrapper);
}

function collectSelectedAttributeValueIds() {
    const ids = [];

    for (const select of variantAttributesFields.querySelectorAll('select')) {
        if (select.value) {
            ids.push(Number(select.value));
        }
    }

    return ids;
}

function resetVariantForm() {
    state.editingVariantId = null;
    variantFormTitle.textContent = 'Dodaj wariant';
    variantForm.reset();
    variantFormError.hidden = true;
    renderVariantAttributeFields([]);
}

variantResetBtn.addEventListener('click', resetVariantForm);

function editVariant(variant) {
    state.editingVariantId = variant.id;
    variantFormTitle.textContent = `Edytuj wariant: ${variant.sku}`;
    variantExternalId.value = variant.external_id ?? '';
    variantSku.value = variant.sku;
    variantEan.value = variant.ean ?? '';
    variantPrice.value = variant.price;
    variantStock.value = variant.stock;
    variantFormError.hidden = true;
    renderVariantAttributeFields((variant.attribute_values || []).map((v) => v.id));
    variantSku.focus();
}

variantForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    variantFormError.hidden = true;

    if (!state.variantsProductId) return;

    const body = {
        external_id: variantExternalId.value.trim() || null,
        sku: variantSku.value.trim(),
        ean: variantEan.value.trim() || null,
        price: Number(variantPrice.value),
        stock: Number(variantStock.value) || 0,
        attribute_value_ids: collectSelectedAttributeValueIds(),
    };

    const isEditing = state.editingVariantId !== null;
    const path = isEditing
        ? `/api/admin/variants/${state.editingVariantId}`
        : `/api/admin/products/${state.variantsProductId}/variants`;
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('variant-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(path, { method, body: JSON.stringify(body) });
        resetVariantForm();
        loadVariants(state.variantsProductId);
    } catch (error) {
        variantFormError.textContent = error.message;
        variantFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteVariant(variant) {
    const confirmed = window.confirm(`Usunąć wariant "${variant.sku}"?`);
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/variants/${variant.id}`, { method: 'DELETE' });
        if (state.editingVariantId === variant.id) {
            resetVariantForm();
        }
        loadVariants(state.variantsProductId);
    } catch (error) {
        if (error.status === 401) return;
        variantsError.textContent = error.message;
        variantsError.hidden = false;
    }
}

// --- Start ---

apiBaseInput.value = getApiBase();

if (getToken()) {
    enterApp();
} else {
    showView('login');
}
