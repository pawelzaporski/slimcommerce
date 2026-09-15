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
    editingVariantId: null,
    categories: null,
    editingCategoryId: null,
    clientsPage: 1,
    clientsLastPage: 1,
    editingClientId: null,
    ordersPage: 1,
    ordersLastPage: 1,
    editingOrderId: null,
    editingOrderTotal: null,
    orderDraftItems: [],
    orderProducts: null,
    editingShippingId: null,
    shippingMethods: null,
    editingUserId: null,
    editingPaymentMethodId: null,
    paymentMethods: null,
    cartsPage: 1,
    cartsLastPage: 1,
    editingCartId: null,
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
const whoamiAvatar = document.getElementById('whoami-avatar');
const logoutBtn = document.getElementById('logout-btn');
const addProductBtn = document.getElementById('add-product-btn');
const pageTitle = document.getElementById('page-title');
const pageActions = document.querySelectorAll('.page-action');

const listError = document.getElementById('list-error');
const productsBody = document.getElementById('products-body');

const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageIndicator = document.getElementById('page-indicator');
const perPageSelect = document.getElementById('per-page');

const productFormPage = document.getElementById('product-form-page');
const productForm = document.getElementById('product-form');
const productFormHeading = document.getElementById('product-form-heading');
const productFormError = document.getElementById('product-form-error');
const productCancelBtn = document.getElementById('product-cancel-btn');
const productFormBackBtn = document.getElementById('product-form-back-btn');
const productVariantsSection = document.getElementById('product-variants-section');
const productVariantsHint = document.getElementById('product-variants-hint');

const fieldExternalId = document.getElementById('field-external-id');
const fieldSku = document.getElementById('field-sku');
const fieldName = document.getElementById('field-name');
const fieldPrice = document.getElementById('field-price');
const fieldEan = document.getElementById('field-ean');
const fieldEanWrap = document.getElementById('field-ean-wrap');
const fieldEanHint = document.getElementById('field-ean-hint');
const fieldActive = document.getElementById('field-active');

const requestLogEl = document.getElementById('request-log');
const requestLogToggle = document.getElementById('request-log-toggle');
const requestLogSummary = document.getElementById('request-log-summary');
const requestLogBody = document.getElementById('request-log-body');
const requestLogList = document.getElementById('request-log-list');

const tabButtons = document.querySelectorAll('.sidebar-nav-item');
const pages = document.querySelectorAll('.page');

const attributesError = document.getElementById('attributes-error');
const attributesList = document.getElementById('attributes-list');
const addAttributeBtn = document.getElementById('add-attribute-btn');

const variantsError = document.getElementById('variants-error');
const variantsBody = document.getElementById('variants-body');

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

const textPromptModal = document.getElementById('text-prompt-modal');
const textPromptForm = document.getElementById('text-prompt-form');
const textPromptTitle = document.getElementById('text-prompt-title');
const textPromptLabel = document.getElementById('text-prompt-label');
const textPromptInput = document.getElementById('text-prompt-input');
const textPromptError = document.getElementById('text-prompt-error');
const textPromptCancelBtn = document.getElementById('text-prompt-cancel-btn');

const confirmModal = document.getElementById('confirm-modal');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalMessage = document.getElementById('confirm-modal-message');
const confirmModalCancelBtn = document.getElementById('confirm-modal-cancel-btn');
const confirmModalConfirmBtn = document.getElementById('confirm-modal-confirm-btn');

// --- Kategorie ---
const addCategoryBtn = document.getElementById('add-category-btn');
const categoriesError = document.getElementById('categories-error');
const categoriesBody = document.getElementById('categories-body');
const fieldCategories = document.getElementById('field-categories');

const categoryModal = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');
const categoryModalTitle = document.getElementById('category-modal-title');
const categoryName = document.getElementById('category-name');
const categorySlug = document.getElementById('category-slug');
const categoryParent = document.getElementById('category-parent');
const categoryFormError = document.getElementById('category-form-error');
const categoryCancelBtn = document.getElementById('category-cancel-btn');

// --- Klienci ---
const addClientBtn = document.getElementById('add-client-btn');
const clientsError = document.getElementById('clients-error');
const clientsBody = document.getElementById('clients-body');
const clientsPrevPageBtn = document.getElementById('clients-prev-page');
const clientsNextPageBtn = document.getElementById('clients-next-page');
const clientsPageIndicator = document.getElementById('clients-page-indicator');

const clientFormPage = document.getElementById('client-form-page');
const clientForm = document.getElementById('client-form');
const clientFormHeading = document.getElementById('client-form-heading');
const clientFormError = document.getElementById('client-form-error');
const clientFormBackBtn = document.getElementById('client-form-back-btn');
const clientCancelBtn = document.getElementById('client-cancel-btn');
const clientFirstName = document.getElementById('client-first-name');
const clientLastName = document.getElementById('client-last-name');
const clientEmail = document.getElementById('client-email');
const clientPassword = document.getElementById('client-password');
const clientPasswordLabel = document.getElementById('client-password-label');
const clientType = document.getElementById('client-type');
const clientCompanyName = document.getElementById('client-company-name');
const clientNip = document.getElementById('client-nip');
const clientDiscount = document.getElementById('client-discount');

const clientAddressesSection = document.getElementById('client-addresses-section');
const clientAddressesHint = document.getElementById('client-addresses-hint');
const addressesError = document.getElementById('addresses-error');
const addressesBody = document.getElementById('addresses-body');
const addressForm = document.getElementById('address-form');
const addressFormError = document.getElementById('address-form-error');
const addressType = document.getElementById('address-type');
const addressStreet = document.getElementById('address-street');
const addressCity = document.getElementById('address-city');
const addressPostalCode = document.getElementById('address-postal-code');
const addressCountry = document.getElementById('address-country');

// --- Koszyki ---
const addCartBtn = document.getElementById('add-cart-btn');
const cartsError = document.getElementById('carts-error');
const cartsBody = document.getElementById('carts-body');
const cartsPrevPageBtn = document.getElementById('carts-prev-page');
const cartsNextPageBtn = document.getElementById('carts-next-page');
const cartsPageIndicator = document.getElementById('carts-page-indicator');

const cartFormPage = document.getElementById('cart-form-page');
const cartForm = document.getElementById('cart-form');
const cartFormHeading = document.getElementById('cart-form-heading');
const cartFormError = document.getElementById('cart-form-error');
const cartFormBackBtn = document.getElementById('cart-form-back-btn');
const cartCancelBtn = document.getElementById('cart-cancel-btn');
const cartName = document.getElementById('cart-name');
const cartClientSelect = document.getElementById('cart-client');
const cartStatusWrap = document.getElementById('cart-status-wrap');
const cartStatusSelect = document.getElementById('cart-status');
const cartTokenWrap = document.getElementById('cart-token-wrap');
const cartToken = document.getElementById('cart-token');

const cartItemsSection = document.getElementById('cart-items-section');
const cartItemsHint = document.getElementById('cart-items-hint');
const cartItemsError = document.getElementById('cart-items-error');
const cartItemsBody = document.getElementById('cart-items-body');
const cartItemForm = document.getElementById('cart-item-form');
const cartItemFormError = document.getElementById('cart-item-form-error');
const cartItemProductSelect = document.getElementById('cart-item-product');
const cartItemVariantSelect = document.getElementById('cart-item-variant');
const cartItemQty = document.getElementById('cart-item-qty');
const cartItemCustomPrice = document.getElementById('cart-item-custom-price');

// --- Zamówienia ---
const addOrderBtn = document.getElementById('add-order-btn');
const ordersError = document.getElementById('orders-error');
const ordersBody = document.getElementById('orders-body');
const ordersPrevPageBtn = document.getElementById('orders-prev-page');
const ordersNextPageBtn = document.getElementById('orders-next-page');
const ordersPageIndicator = document.getElementById('orders-page-indicator');

const orderFormPage = document.getElementById('order-form-page');
const orderForm = document.getElementById('order-form');
const orderFormHeading = document.getElementById('order-form-heading');
const orderFormError = document.getElementById('order-form-error');
const orderFormBackBtn = document.getElementById('order-form-back-btn');
const orderCancelBtn = document.getElementById('order-cancel-btn');
const orderSaveBtn = document.getElementById('order-save-btn');
const orderClientSelect = document.getElementById('order-client');
const orderStatusWrap = document.getElementById('order-status-wrap');
const orderStatusSelect = document.getElementById('order-status');
const orderBillingAddressSelect = document.getElementById('order-billing-address');
const orderDeliveryAddressSelect = document.getElementById('order-delivery-address');
const orderShippingMethodSelect = document.getElementById('order-shipping-method');

const orderItemsBody = document.getElementById('order-items-body');
const orderTotalValue = document.getElementById('order-total-value');
const orderItemPicker = document.getElementById('order-item-picker');
const orderItemProductSelect = document.getElementById('order-item-product');
const orderItemVariantSelect = document.getElementById('order-item-variant');
const orderItemQty = document.getElementById('order-item-qty');
const orderItemAddBtn = document.getElementById('order-item-add-btn');
const orderItemsHint = document.getElementById('order-items-hint');

const orderPaymentsSection = document.getElementById('order-payments-section');
const paymentsError = document.getElementById('payments-error');
const paymentsBody = document.getElementById('payments-body');
const paymentForm = document.getElementById('payment-form');
const paymentFormError = document.getElementById('payment-form-error');
const paymentAmount = document.getElementById('payment-amount');
const paymentMethod = document.getElementById('payment-method');
const paymentStatus = document.getElementById('payment-status');

// --- Użytkownicy panelu ---
const addUserBtn = document.getElementById('add-user-btn');
const usersError = document.getElementById('users-error');
const usersBody = document.getElementById('users-body');

const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');
const userModalTitle = document.getElementById('user-modal-title');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userPassword = document.getElementById('user-password');
const userPasswordLabel = document.getElementById('user-password-label');
const userRole = document.getElementById('user-role');
const userFormError = document.getElementById('user-form-error');
const userCancelBtn = document.getElementById('user-cancel-btn');

// --- Metody dostawy ---
const addShippingBtn = document.getElementById('add-shipping-btn');
const shippingError = document.getElementById('shipping-error');
const shippingBody = document.getElementById('shipping-body');

const shippingModal = document.getElementById('shipping-modal');
const shippingForm = document.getElementById('shipping-form');
const shippingModalTitle = document.getElementById('shipping-modal-title');
const shippingName = document.getElementById('shipping-name');
const shippingRate = document.getElementById('shipping-rate');
const shippingFormError = document.getElementById('shipping-form-error');
const shippingCancelBtn = document.getElementById('shipping-cancel-btn');

// --- Metody płatności ---
const addPaymentMethodBtn = document.getElementById('add-payment-method-btn');
const paymentMethodsError = document.getElementById('payment-methods-error');
const paymentMethodsBody = document.getElementById('payment-methods-body');

const paymentMethodModal = document.getElementById('payment-method-modal');
const paymentMethodForm = document.getElementById('payment-method-form');
const paymentMethodModalTitle = document.getElementById('payment-method-modal-title');
const paymentMethodName = document.getElementById('payment-method-name');
const paymentMethodFormError = document.getElementById('payment-method-form-error');
const paymentMethodCancelBtn = document.getElementById('payment-method-cancel-btn');

// --- Dialogi (zastępują window.prompt/window.confirm, które nie są w pełni
// niezawodne w zsandboksowanym renderze Electron) ---

let textPromptResolver = null;

function textPromptDialog({ title, label, initialValue = '', placeholder = '' }) {
    textPromptTitle.textContent = title;
    textPromptLabel.textContent = label;
    textPromptInput.value = initialValue;
    textPromptInput.placeholder = placeholder;
    textPromptError.hidden = true;
    textPromptModal.hidden = false;
    textPromptInput.focus();
    textPromptInput.select();

    return new Promise((resolve) => {
        textPromptResolver = resolve;
    });
}

function closeTextPromptDialog(result) {
    textPromptModal.hidden = true;
    if (textPromptResolver) {
        textPromptResolver(result);
        textPromptResolver = null;
    }
}

textPromptForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = textPromptInput.value.trim();

    if (!value) {
        textPromptError.textContent = 'To pole jest wymagane.';
        textPromptError.hidden = false;
        return;
    }

    closeTextPromptDialog(value);
});

textPromptCancelBtn.addEventListener('click', () => closeTextPromptDialog(null));
textPromptModal.addEventListener('click', (event) => {
    if (event.target === textPromptModal) closeTextPromptDialog(null);
});

let confirmResolver = null;

function confirmDialog(message, { title = 'Potwierdź', confirmLabel = 'Usuń' } = {}) {
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModalConfirmBtn.textContent = confirmLabel;
    confirmModal.hidden = false;

    return new Promise((resolve) => {
        confirmResolver = resolve;
    });
}

function closeConfirmDialog(result) {
    confirmModal.hidden = true;
    if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
    }
}

confirmModalConfirmBtn.addEventListener('click', () => closeConfirmDialog(true));
confirmModalCancelBtn.addEventListener('click', () => closeConfirmDialog(false));
confirmModal.addEventListener('click', (event) => {
    if (event.target === confirmModal) closeConfirmDialog(false);
});

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

function switchPage(pageId, activeNavId = pageId) {
    for (const page of pages) {
        page.hidden = page.id !== pageId;
    }

    for (const btn of tabButtons) {
        const isActive = btn.dataset.page === activeNavId;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            pageTitle.textContent = btn.dataset.title;
        }
    }

    for (const action of pageActions) {
        action.hidden = action.dataset.pageAction !== pageId;
    }

    if (pageId === 'attributes-page') {
        loadAttributes();
    }

    if (pageId === 'categories-page') {
        loadCategories();
    }

    if (pageId === 'clients-page') {
        state.clientsPage = 1;
        loadClients();
    }

    if (pageId === 'orders-page') {
        state.ordersPage = 1;
        loadOrders();
    }

    if (pageId === 'carts-page') {
        state.cartsPage = 1;
        loadCarts();
    }

    if (pageId === 'users-page') {
        loadUsers();
    }

    if (pageId === 'shipping-page') {
        loadShippingMethods();
    }

    if (pageId === 'payment-methods-page') {
        loadPaymentMethods();
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
    whoamiAvatar.textContent = user?.name ? user.name.trim().charAt(0).toUpperCase() : '?';
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
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openProductEditPage(product));
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

// --- Podstrona: dodaj / edytuj produkt (+ warianty) ---

async function openProductCreatePage() {
    state.editingProductId = null;
    productFormHeading.textContent = 'Nowy produkt';
    productForm.reset();
    fieldActive.checked = true;
    fieldEanWrap.hidden = false;
    fieldEanHint.hidden = false;
    productFormError.hidden = true;
    productVariantsSection.hidden = true;
    productVariantsHint.hidden = false;
    switchPage('product-form-page', 'products-page');
    fieldSku.focus();

    await ensureCategoriesLoaded();
    renderProductCategoryCheckboxes([]);
}

async function openProductEditPage(product) {
    state.editingProductId = product.id;
    productFormHeading.textContent = `Edytuj produkt: ${product.name}`;
    fieldExternalId.value = product.external_id ?? '';
    fieldSku.value = product.sku;
    fieldName.value = product.name;
    fieldPrice.value = product.base_price;
    fieldEan.value = '';
    fieldEanWrap.hidden = true;
    fieldEanHint.hidden = true;
    fieldActive.checked = Boolean(product.is_active);
    productFormError.hidden = true;
    productVariantsHint.hidden = true;
    productVariantsSection.hidden = false;
    switchPage('product-form-page', 'products-page');
    fieldSku.focus();

    await ensureCategoriesLoaded();
    renderProductCategoryCheckboxes((product.categories || []).map((c) => c.id));

    resetVariantForm();
    await ensureAttributesLoaded();
    renderVariantAttributeFields([]);
    loadVariants(product.id);
}

function backToProductsList() {
    switchPage('products-page');
    loadProducts();
}

addProductBtn.addEventListener('click', openProductCreatePage);
productCancelBtn.addEventListener('click', backToProductsList);
productFormBackBtn.addEventListener('click', backToProductsList);

productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    productFormError.hidden = true;

    const isEditing = state.editingProductId !== null;

    const body = {
        external_id: fieldExternalId.value.trim() || null,
        sku: fieldSku.value.trim(),
        name: fieldName.value.trim(),
        base_price: Number(fieldPrice.value),
        is_active: fieldActive.checked,
        category_ids: collectSelectedCategoryIds(),
    };

    if (!isEditing) {
        body.ean = fieldEan.value.trim() || null;
    }

    const path = isEditing ? `/api/admin/products/${state.editingProductId}` : '/api/admin/products';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('product-save-btn');
    submitBtn.disabled = true;

    try {
        const saved = await apiFetch(path, { method, body: JSON.stringify(body) });
        await openProductEditPage(saved);
        loadProducts();
    } catch (error) {
        productFormError.textContent = error.message;
        productFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteProduct(product) {
    const confirmed = await confirmDialog(`Usunąć produkt "${product.name}" (SKU: ${product.sku})?`, { title: 'Usuń produkt' });
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
    const name = await textPromptDialog({
        title: 'Dodaj cechę',
        label: 'Nazwa cechy',
        placeholder: 'np. Rozmiar',
    });
    if (!name) return;

    try {
        await apiFetch('/api/admin/attributes', { method: 'POST', body: JSON.stringify({ name }) });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
});

async function editAttribute(attribute) {
    const name = await textPromptDialog({
        title: 'Edytuj cechę',
        label: 'Nazwa cechy',
        initialValue: attribute.name,
    });
    if (!name || name === attribute.name) return;

    try {
        await apiFetch(`/api/admin/attributes/${attribute.id}`, { method: 'PUT', body: JSON.stringify({ name }) });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

async function deleteAttribute(attribute) {
    const confirmed = await confirmDialog(`Usunąć cechę "${attribute.name}" wraz ze wszystkimi jej wartościami?`, {
        title: 'Usuń cechę',
    });
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
    const newValue = await textPromptDialog({
        title: 'Edytuj wartość',
        label: 'Wartość',
        initialValue: value.value,
    });
    if (!newValue || newValue === value.value) return;

    try {
        await apiFetch(`/api/admin/attribute-values/${value.id}`, { method: 'PUT', body: JSON.stringify({ value: newValue }) });
        loadAttributes();
    } catch (error) {
        if (error.status === 401) return;
        attributesError.textContent = error.message;
        attributesError.hidden = false;
    }
}

async function deleteAttributeValue(value) {
    const confirmed = await confirmDialog(`Usunąć wartość "${value.value}"?`, { title: 'Usuń wartość' });
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

    if (!state.editingProductId) return;

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
        : `/api/admin/products/${state.editingProductId}/variants`;
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('variant-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(path, { method, body: JSON.stringify(body) });
        resetVariantForm();
        loadVariants(state.editingProductId);
    } catch (error) {
        variantFormError.textContent = error.message;
        variantFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteVariant(variant) {
    const confirmed = await confirmDialog(`Usunąć wariant "${variant.sku}"?`, { title: 'Usuń wariant' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/variants/${variant.id}`, { method: 'DELETE' });
        if (state.editingVariantId === variant.id) {
            resetVariantForm();
        }
        loadVariants(state.editingProductId);
    } catch (error) {
        if (error.status === 401) return;
        variantsError.textContent = error.message;
        variantsError.hidden = false;
    }
}

// --- Kategorie ---

async function loadCategories() {
    categoriesError.hidden = true;
    categoriesBody.innerHTML = '<tr><td colspan="4" class="muted">Ładowanie...</td></tr>';

    try {
        state.categories = await apiFetch('/api/admin/categories');
        renderCategories();
    } catch (error) {
        if (error.status === 401) return;
        state.categories = [];
        categoriesBody.innerHTML = '';
        categoriesError.textContent = error.message;
        categoriesError.hidden = false;
    }
}

async function ensureCategoriesLoaded() {
    if (state.categories === null) {
        await loadCategories();
    }

    return state.categories || [];
}

function renderCategories() {
    const categories = state.categories || [];

    if (categories.length === 0) {
        categoriesBody.innerHTML = '<tr><td colspan="4" class="muted">Brak kategorii.</td></tr>';
        return;
    }

    const byId = new Map(categories.map((c) => [c.id, c]));
    categoriesBody.innerHTML = '';

    for (const category of categories) {
        const parentName = category.parent_id && byId.has(category.parent_id) ? byId.get(category.parent_id).name : '—';
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${escapeHtml(category.name)}</td>
            <td>${escapeHtml(category.slug)}</td>
            <td>${escapeHtml(parentName)}</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openCategoryModal(category));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCategory(category));

        categoriesBody.appendChild(row);
    }
}

function populateCategoryParentOptions(selectEl, excludeId = null) {
    const categories = state.categories || [];
    selectEl.innerHTML = '<option value="">— brak —</option>';

    for (const category of categories) {
        if (category.id === excludeId) continue;
        const option = document.createElement('option');
        option.value = String(category.id);
        option.textContent = category.name;
        selectEl.appendChild(option);
    }
}

function openCategoryModal(category = null) {
    state.editingCategoryId = category ? category.id : null;
    categoryModalTitle.textContent = category ? 'Edytuj kategorię' : 'Dodaj kategorię';
    categoryName.value = category ? category.name : '';
    categorySlug.value = category ? category.slug : '';
    categoryFormError.hidden = true;
    populateCategoryParentOptions(categoryParent, category ? category.id : null);
    categoryParent.value = category && category.parent_id ? String(category.parent_id) : '';
    categoryModal.hidden = false;
    categoryName.focus();
}

function closeCategoryModal() {
    categoryModal.hidden = true;
}

addCategoryBtn.addEventListener('click', () => openCategoryModal());
categoryCancelBtn.addEventListener('click', closeCategoryModal);
categoryModal.addEventListener('click', (event) => {
    if (event.target === categoryModal) closeCategoryModal();
});

categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    categoryFormError.hidden = true;

    const body = {
        name: categoryName.value.trim(),
        parent_id: categoryParent.value ? Number(categoryParent.value) : null,
    };

    if (categorySlug.value.trim()) {
        body.slug = categorySlug.value.trim();
    }

    const isEditing = state.editingCategoryId !== null;
    const path = isEditing ? `/api/admin/categories/${state.editingCategoryId}` : '/api/admin/categories';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('category-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(path, { method, body: JSON.stringify(body) });
        closeCategoryModal();
        loadCategories();
    } catch (error) {
        categoryFormError.textContent = error.message;
        categoryFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteCategory(category) {
    const confirmed = await confirmDialog(`Usunąć kategorię "${category.name}"? Podkategorie zostaną przeniesione na najwyższy poziom.`, { title: 'Usuń kategorię' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
        loadCategories();
    } catch (error) {
        if (error.status === 401) return;
        categoriesError.textContent = error.message;
        categoriesError.hidden = false;
    }
}

function renderProductCategoryCheckboxes(selectedIds = []) {
    const categories = state.categories || [];

    if (categories.length === 0) {
        fieldCategories.innerHTML = '<p class="muted">Brak zdefiniowanych kategorii.</p>';
        return;
    }

    fieldCategories.innerHTML = '';

    for (const category of categories) {
        const label = document.createElement('label');
        label.className = 'checkbox-chip';
        label.innerHTML = `
            <input type="checkbox" value="${category.id}" ${selectedIds.includes(category.id) ? 'checked' : ''}>
            ${escapeHtml(category.name)}
        `;
        fieldCategories.appendChild(label);
    }
}

function collectSelectedCategoryIds() {
    return [...fieldCategories.querySelectorAll('input[type="checkbox"]:checked')].map((el) => Number(el.value));
}

// --- Klienci ---

async function loadClients() {
    clientsError.hidden = true;
    clientsBody.innerHTML = '<tr><td colspan="6" class="muted">Ładowanie...</td></tr>';

    try {
        const payload = await apiFetch(`/api/admin/clients?page=${state.clientsPage}&per_page=15`);
        state.clientsLastPage = payload.meta.last_page;
        renderClients(payload.data);
        updateClientsPaginationControls(payload.meta);
    } catch (error) {
        if (error.status === 401) return;
        clientsBody.innerHTML = '';
        clientsError.textContent = error.message;
        clientsError.hidden = false;
    }
}

const CLIENT_TYPE_LABELS = { b2c: 'B2C', b2b: 'B2B', gov: 'Sektor publ.' };

function renderClients(clients) {
    if (clients.length === 0) {
        clientsBody.innerHTML = '<tr><td colspan="6" class="muted">Brak klientów.</td></tr>';
        return;
    }

    clientsBody.innerHTML = '';

    for (const client of clients) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${escapeHtml(client.first_name)} ${escapeHtml(client.last_name)}</td>
            <td>${client.company_name ? escapeHtml(client.company_name) : '—'}</td>
            <td>${escapeHtml(client.email)}</td>
            <td>${CLIENT_TYPE_LABELS[client.client_type] || escapeHtml(client.client_type)}</td>
            <td>${Number(client.discount_percent) > 0 ? formatPrice(client.discount_percent) + '%' : '—'}</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openClientEditPage(client));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteClient(client));

        clientsBody.appendChild(row);
    }
}

function updateClientsPaginationControls(meta) {
    clientsPageIndicator.textContent = `Strona ${meta.current_page} z ${meta.last_page} (${meta.total} klientów)`;
    clientsPrevPageBtn.disabled = meta.current_page <= 1;
    clientsNextPageBtn.disabled = meta.current_page >= meta.last_page;
}

clientsPrevPageBtn.addEventListener('click', () => {
    if (state.clientsPage > 1) {
        state.clientsPage -= 1;
        loadClients();
    }
});

clientsNextPageBtn.addEventListener('click', () => {
    if (state.clientsPage < state.clientsLastPage) {
        state.clientsPage += 1;
        loadClients();
    }
});

function openClientCreatePage() {
    state.editingClientId = null;
    clientFormHeading.textContent = 'Nowy klient';
    clientForm.reset();
    clientType.value = 'b2c';
    clientDiscount.value = '0';
    clientPassword.required = true;
    clientPasswordLabel.textContent = 'Hasło *';
    clientFormError.hidden = true;
    clientAddressesSection.hidden = true;
    clientAddressesHint.hidden = false;
    switchPage('client-form-page', 'clients-page');
    clientFirstName.focus();
}

async function openClientEditPage(client) {
    state.editingClientId = client.id;
    clientFormHeading.textContent = `Edytuj klienta: ${client.first_name} ${client.last_name}`;
    clientFirstName.value = client.first_name;
    clientLastName.value = client.last_name;
    clientEmail.value = client.email;
    clientPassword.value = '';
    clientPassword.required = false;
    clientPasswordLabel.textContent = 'Hasło (podaj tylko, gdy zmieniasz)';
    clientType.value = client.client_type;
    clientCompanyName.value = client.company_name ?? '';
    clientNip.value = client.nip ?? '';
    clientDiscount.value = client.discount_percent;
    clientFormError.hidden = true;
    clientAddressesHint.hidden = true;
    clientAddressesSection.hidden = false;
    switchPage('client-form-page', 'clients-page');
    clientFirstName.focus();

    loadAddresses(client.id);
}

function backToClientsList() {
    switchPage('clients-page');
    loadClients();
}

addClientBtn.addEventListener('click', openClientCreatePage);
clientCancelBtn.addEventListener('click', backToClientsList);
clientFormBackBtn.addEventListener('click', backToClientsList);

clientForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clientFormError.hidden = true;

    const body = {
        first_name: clientFirstName.value.trim(),
        last_name: clientLastName.value.trim(),
        email: clientEmail.value.trim(),
        client_type: clientType.value,
        company_name: clientCompanyName.value.trim() || null,
        nip: clientNip.value.trim() || null,
        discount_percent: Number(clientDiscount.value) || 0,
    };

    if (clientPassword.value) {
        body.password = clientPassword.value;
    }

    const isEditing = state.editingClientId !== null;
    const path = isEditing ? `/api/admin/clients/${state.editingClientId}` : '/api/admin/clients';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('client-save-btn');
    submitBtn.disabled = true;

    try {
        const saved = await apiFetch(path, { method, body: JSON.stringify(body) });
        await openClientEditPage(saved);
        loadClients();
    } catch (error) {
        clientFormError.textContent = error.message;
        clientFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteClient(client) {
    const confirmed = await confirmDialog(`Usunąć klienta "${client.first_name} ${client.last_name}"?`, { title: 'Usuń klienta' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/clients/${client.id}`, { method: 'DELETE' });
        loadClients();
    } catch (error) {
        if (error.status === 401) return;
        clientsError.textContent = error.message;
        clientsError.hidden = false;
    }
}

// --- Adresy klienta ---

const ADDRESS_TYPE_LABELS = { billing: 'Rozliczeniowy', delivery: 'Dostawy' };

async function loadAddresses(clientId) {
    addressesError.hidden = true;
    addressesBody.innerHTML = '<tr><td colspan="6" class="muted">Ładowanie...</td></tr>';

    try {
        const client = await apiFetch(`/api/admin/clients/${clientId}`);
        renderAddresses(client.addresses || []);
    } catch (error) {
        if (error.status === 401) return;
        addressesBody.innerHTML = '';
        addressesError.textContent = error.message;
        addressesError.hidden = false;
    }
}

function renderAddresses(addresses) {
    if (addresses.length === 0) {
        addressesBody.innerHTML = '<tr><td colspan="6" class="muted">Brak adresów.</td></tr>';
        return;
    }

    addressesBody.innerHTML = '';

    for (const address of addresses) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${ADDRESS_TYPE_LABELS[address.type] || escapeHtml(address.type)}</td>
            <td>${escapeHtml(address.street)}</td>
            <td>${escapeHtml(address.city)}</td>
            <td>${escapeHtml(address.postal_code)}</td>
            <td>${escapeHtml(address.country)}</td>
            <td class="row-actions">
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteAddress(address));

        addressesBody.appendChild(row);
    }
}

addressForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    addressFormError.hidden = true;

    if (!state.editingClientId) return;

    const body = {
        type: addressType.value,
        street: addressStreet.value.trim(),
        city: addressCity.value.trim(),
        postal_code: addressPostalCode.value.trim(),
        country: addressCountry.value.trim(),
    };

    const submitBtn = document.getElementById('address-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(`/api/admin/clients/${state.editingClientId}/addresses`, { method: 'POST', body: JSON.stringify(body) });
        addressForm.reset();
        addressCountry.value = 'Polska';
        loadAddresses(state.editingClientId);
    } catch (error) {
        addressFormError.textContent = error.message;
        addressFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteAddress(address) {
    const confirmed = await confirmDialog('Usunąć ten adres?', { title: 'Usuń adres' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/addresses/${address.id}`, { method: 'DELETE' });
        loadAddresses(state.editingClientId);
    } catch (error) {
        if (error.status === 401) return;
        addressesError.textContent = error.message;
        addressesError.hidden = false;
    }
}

// --- Koszyki ---

const CART_STATUSES = ['active', 'abandoned', 'converted'];
const CART_STATUS_LABELS = {
    active: 'Aktywny',
    abandoned: 'Porzucony',
    converted: 'Zrealizowany',
};

async function loadCarts() {
    cartsError.hidden = true;
    cartsBody.innerHTML = '<tr><td colspan="7" class="muted">Ładowanie...</td></tr>';

    try {
        const payload = await apiFetch(`/api/admin/carts?page=${state.cartsPage}&per_page=15`);
        state.cartsLastPage = payload.meta.last_page;
        renderCarts(payload.data);
        updateCartsPaginationControls(payload.meta);
    } catch (error) {
        if (error.status === 401) return;
        cartsBody.innerHTML = '';
        cartsError.textContent = error.message;
        cartsError.hidden = false;
    }
}

function renderCarts(carts) {
    if (carts.length === 0) {
        cartsBody.innerHTML = '<tr><td colspan="7" class="muted">Brak koszyków.</td></tr>';
        return;
    }

    cartsBody.innerHTML = '';

    for (const cart of carts) {
        const row = document.createElement('tr');
        const clientName = cart.client ? `${cart.client.first_name} ${cart.client.last_name}` : '— gość —';
        const lastActivity = cart.last_interaction_at ? new Date(cart.last_interaction_at).toLocaleString('pl-PL') : '—';

        row.innerHTML = `
            <td>#${cart.id}</td>
            <td>${escapeHtml(cart.name || '—')}</td>
            <td>${escapeHtml(clientName)}</td>
            <td><span class="badge status-${escapeHtml(cart.status)}">${escapeHtml(CART_STATUS_LABELS[cart.status] || cart.status)}</span></td>
            <td>${cart.items_count ?? 0}</td>
            <td>${lastActivity}</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openCartEditPage(cart.id));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCart(cart));

        cartsBody.appendChild(row);
    }
}

function updateCartsPaginationControls(meta) {
    cartsPageIndicator.textContent = `Strona ${meta.current_page} z ${meta.last_page} (${meta.total} koszyków)`;
    cartsPrevPageBtn.disabled = meta.current_page <= 1;
    cartsNextPageBtn.disabled = meta.current_page >= meta.last_page;
}

cartsPrevPageBtn.addEventListener('click', () => {
    if (state.cartsPage > 1) {
        state.cartsPage -= 1;
        loadCarts();
    }
});

cartsNextPageBtn.addEventListener('click', () => {
    if (state.cartsPage < state.cartsLastPage) {
        state.cartsPage += 1;
        loadCarts();
    }
});

function populateCartStatusSelect() {
    cartStatusSelect.innerHTML = CART_STATUSES
        .map((s) => `<option value="${s}">${CART_STATUS_LABELS[s]}</option>`)
        .join('');
}

async function populateCartClientSelect(selectedId = null) {
    const payload = await apiFetch('/api/admin/clients?per_page=100');
    cartClientSelect.innerHTML = '<option value="">— gość (bez klienta) —</option>' + payload.data
        .map((c) => `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)} (${escapeHtml(c.email)})</option>`)
        .join('');
}

async function populateCartItemProductSelect() {
    const products = await ensureOrderProductsLoaded();
    cartItemProductSelect.innerHTML = '<option value="">— wybierz —</option>' + products
        .map((p) => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`)
        .join('');
}

cartItemProductSelect.addEventListener('change', async () => {
    const productId = cartItemProductSelect.value;

    if (!productId) {
        cartItemVariantSelect.innerHTML = '<option value="">— najpierw wybierz produkt —</option>';
        cartItemVariantSelect.disabled = true;
        return;
    }

    cartItemVariantSelect.disabled = false;
    cartItemVariantSelect.innerHTML = '<option value="">Ładowanie...</option>';

    try {
        const variants = await apiFetch(`/api/admin/products/${productId}/variants`);
        cartItemVariantSelect.innerHTML = variants
            .map((v) => `<option value="${v.id}">${escapeHtml(v.sku)} — ${formatPrice(v.price)} zł (stan: ${v.stock})</option>`)
            .join('') || '<option value="">Brak wariantów</option>';
    } catch {
        cartItemVariantSelect.innerHTML = '<option value="">Błąd ładowania wariantów</option>';
    }
});

function openCartCreatePage() {
    state.editingCartId = null;
    cartFormHeading.textContent = 'Nowy koszyk';
    cartForm.reset();
    cartFormError.hidden = true;
    cartStatusWrap.hidden = true;
    cartTokenWrap.hidden = true;
    cartItemsSection.hidden = true;
    cartItemsHint.hidden = false;
    switchPage('cart-form-page', 'carts-page');
    cartName.focus();

    populateCartClientSelect();
}

async function openCartEditPage(cartId) {
    cartFormError.hidden = true;
    switchPage('cart-form-page', 'carts-page');
    cartFormHeading.textContent = 'Ładowanie...';

    try {
        const cart = await apiFetch(`/api/admin/carts/${cartId}`);

        state.editingCartId = cart.id;
        cartFormHeading.textContent = `Koszyk: ${cart.name || '#' + cart.id}`;
        cartName.value = cart.name || '';
        cartStatusWrap.hidden = false;
        populateCartStatusSelect();
        cartStatusSelect.value = cart.status;
        cartTokenWrap.hidden = false;
        cartToken.value = cart.token || '';
        cartItemsHint.hidden = true;
        cartItemsSection.hidden = false;

        await populateCartClientSelect(cart.client_id);
        await populateCartItemProductSelect();
        cartItemVariantSelect.innerHTML = '<option value="">— najpierw wybierz produkt —</option>';
        cartItemVariantSelect.disabled = true;

        renderCartItems(cart.items || []);
    } catch (error) {
        cartFormError.textContent = error.message;
        cartFormError.hidden = false;
    }
}

function backToCartsList() {
    switchPage('carts-page');
    loadCarts();
}

addCartBtn.addEventListener('click', openCartCreatePage);
cartCancelBtn.addEventListener('click', backToCartsList);
cartFormBackBtn.addEventListener('click', backToCartsList);

cartForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    cartFormError.hidden = true;

    const isEditing = state.editingCartId !== null;

    const body = {
        name: cartName.value.trim() || null,
        client_id: cartClientSelect.value ? Number(cartClientSelect.value) : null,
    };

    if (isEditing) {
        body.status = cartStatusSelect.value;
    }

    const path = isEditing ? `/api/admin/carts/${state.editingCartId}` : '/api/admin/carts';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('cart-save-btn');
    submitBtn.disabled = true;

    try {
        const saved = await apiFetch(path, { method, body: JSON.stringify(body) });
        await openCartEditPage(saved.id);
        loadCarts();
    } catch (error) {
        cartFormError.textContent = error.message;
        cartFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteCart(cart) {
    const confirmed = await confirmDialog(`Usunąć koszyk "${cart.name || '#' + cart.id}"?`, { title: 'Usuń koszyk' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/carts/${cart.id}`, { method: 'DELETE' });
        loadCarts();
    } catch (error) {
        if (error.status === 401) return;
        cartsError.textContent = error.message;
        cartsError.hidden = false;
    }
}

// --- Pozycje koszyka ---

function renderCartItems(items) {
    if (items.length === 0) {
        cartItemsBody.innerHTML = '<tr><td colspan="4" class="muted">Brak pozycji.</td></tr>';
        return;
    }

    cartItemsBody.innerHTML = '';

    for (const item of items) {
        const row = document.createElement('tr');
        const sku = item.variant ? item.variant.sku : `#${item.variant_id}`;
        const price = item.custom_price ?? (item.variant ? item.variant.price : null);

        row.innerHTML = `
            <td>${escapeHtml(sku)}</td>
            <td>${item.quantity}</td>
            <td>${price !== null ? formatPrice(price) : '—'}${item.custom_price ? ' (niestandardowa)' : ''}</td>
            <td class="row-actions">
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCartItem(item));

        cartItemsBody.appendChild(row);
    }
}

cartItemForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    cartItemFormError.hidden = true;

    if (!state.editingCartId) return;

    const variantId = cartItemVariantSelect.value;
    if (!variantId) {
        cartItemFormError.textContent = 'Wybierz wariant produktu.';
        cartItemFormError.hidden = false;
        return;
    }

    const body = {
        variant_id: Number(variantId),
        quantity: Math.max(1, Number(cartItemQty.value) || 1),
        custom_price: cartItemCustomPrice.value ? Number(cartItemCustomPrice.value) : null,
    };

    const submitBtn = document.getElementById('cart-item-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(`/api/admin/carts/${state.editingCartId}/items`, { method: 'POST', body: JSON.stringify(body) });
        cartItemForm.reset();
        cartItemQty.value = '1';
        const cart = await apiFetch(`/api/admin/carts/${state.editingCartId}`);
        renderCartItems(cart.items || []);
    } catch (error) {
        cartItemFormError.textContent = error.message;
        cartItemFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteCartItem(item) {
    const confirmed = await confirmDialog('Usunąć tę pozycję?', { title: 'Usuń pozycję' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/cart-items/${item.id}`, { method: 'DELETE' });
        const cart = await apiFetch(`/api/admin/carts/${state.editingCartId}`);
        renderCartItems(cart.items || []);
    } catch (error) {
        if (error.status === 401) return;
        cartItemsError.textContent = error.message;
        cartItemsError.hidden = false;
    }
}

// --- Zamówienia ---

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
const ORDER_STATUS_LABELS = {
    pending: 'Oczekujące',
    paid: 'Opłacone',
    shipped: 'Wysłane',
    completed: 'Zrealizowane',
    cancelled: 'Anulowane',
};

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const PAYMENT_STATUS_LABELS = {
    pending: 'Oczekująca',
    paid: 'Opłacona',
    failed: 'Nieudana',
    refunded: 'Zwrócona',
};

async function loadOrders() {
    ordersError.hidden = true;
    ordersBody.innerHTML = '<tr><td colspan="6" class="muted">Ładowanie...</td></tr>';

    try {
        const payload = await apiFetch(`/api/admin/orders?page=${state.ordersPage}&per_page=15`);
        state.ordersLastPage = payload.meta.last_page;
        renderOrders(payload.data);
        updateOrdersPaginationControls(payload.meta);
    } catch (error) {
        if (error.status === 401) return;
        ordersBody.innerHTML = '';
        ordersError.textContent = error.message;
        ordersError.hidden = false;
    }
}

function renderOrders(orders) {
    if (orders.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="6" class="muted">Brak zamówień.</td></tr>';
        return;
    }

    ordersBody.innerHTML = '';

    for (const order of orders) {
        const row = document.createElement('tr');
        const clientName = order.client ? `${order.client.first_name} ${order.client.last_name}` : '—';
        const date = order.created_at ? new Date(order.created_at).toLocaleDateString('pl-PL') : '—';

        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${escapeHtml(clientName)}</td>
            <td><span class="badge status-${escapeHtml(order.status)}">${escapeHtml(ORDER_STATUS_LABELS[order.status] || order.status)}</span></td>
            <td>${formatPrice(order.total_amount)}</td>
            <td>${date}</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="view">Szczegóły</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="view"]').addEventListener('click', () => openOrderEditPage(order.id));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteOrder(order));

        ordersBody.appendChild(row);
    }
}

function updateOrdersPaginationControls(meta) {
    ordersPageIndicator.textContent = `Strona ${meta.current_page} z ${meta.last_page} (${meta.total} zamówień)`;
    ordersPrevPageBtn.disabled = meta.current_page <= 1;
    ordersNextPageBtn.disabled = meta.current_page >= meta.last_page;
}

ordersPrevPageBtn.addEventListener('click', () => {
    if (state.ordersPage > 1) {
        state.ordersPage -= 1;
        loadOrders();
    }
});

ordersNextPageBtn.addEventListener('click', () => {
    if (state.ordersPage < state.ordersLastPage) {
        state.ordersPage += 1;
        loadOrders();
    }
});

async function ensureOrderProductsLoaded() {
    if (state.orderProducts === null) {
        try {
            const payload = await apiFetch('/api/admin/products?per_page=100');
            state.orderProducts = payload.data;
        } catch {
            state.orderProducts = [];
        }
    }

    return state.orderProducts;
}

async function ensureShippingMethodsLoaded() {
    if (state.shippingMethods === null) {
        try {
            state.shippingMethods = await apiFetch('/api/admin/shipping-methods');
        } catch {
            state.shippingMethods = [];
        }
    }

    return state.shippingMethods;
}

function populateOrderStatusSelect() {
    orderStatusSelect.innerHTML = ORDER_STATUSES
        .map((s) => `<option value="${s}">${ORDER_STATUS_LABELS[s]}</option>`)
        .join('');
}

function populatePaymentStatusSelect() {
    paymentStatus.innerHTML = PAYMENT_STATUSES
        .map((s) => `<option value="${s}">${PAYMENT_STATUS_LABELS[s]}</option>`)
        .join('');
}

async function populatePaymentMethodSelect() {
    const methods = await ensurePaymentMethodsLoaded();
    paymentMethod.innerHTML = '<option value="">— wybierz —</option>' + methods
        .map((m) => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>`)
        .join('');
}

async function populateOrderClientSelect(selectedId = null) {
    const payload = await apiFetch('/api/admin/clients?per_page=100');
    orderClientSelect.innerHTML = '<option value="">— wybierz —</option>' + payload.data
        .map((c) => `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)} (${escapeHtml(c.email)})</option>`)
        .join('');
}

async function populateOrderShippingSelect(selectedId = null) {
    const methods = await ensureShippingMethodsLoaded();
    orderShippingMethodSelect.innerHTML = '<option value="">— brak —</option>' + methods
        .map((m) => `<option value="${m.id}" data-rate="${m.flat_rate}" ${selectedId === m.id ? 'selected' : ''}>${escapeHtml(m.name)} (${formatPrice(m.flat_rate)} zł)</option>`)
        .join('');
}

async function populateOrderAddressSelects(clientId, selected = {}) {
    orderBillingAddressSelect.innerHTML = '<option value="">— brak —</option>';
    orderDeliveryAddressSelect.innerHTML = '<option value="">— brak —</option>';

    if (!clientId) return;

    try {
        const client = await apiFetch(`/api/admin/clients/${clientId}`);
        const addresses = client.addresses || [];

        for (const address of addresses) {
            const label = `${ADDRESS_TYPE_LABELS[address.type] || address.type}: ${address.street}, ${address.city}`;
            const billingSelected = selected.billing_address_id === address.id ? 'selected' : '';
            const deliverySelected = selected.delivery_address_id === address.id ? 'selected' : '';

            orderBillingAddressSelect.insertAdjacentHTML('beforeend', `<option value="${address.id}" ${billingSelected}>${escapeHtml(label)}</option>`);
            orderDeliveryAddressSelect.insertAdjacentHTML('beforeend', `<option value="${address.id}" ${deliverySelected}>${escapeHtml(label)}</option>`);
        }
    } catch {
        // brak adresów - selecty zostają puste
    }
}

orderClientSelect.addEventListener('change', () => {
    const clientId = orderClientSelect.value ? Number(orderClientSelect.value) : null;
    populateOrderAddressSelects(clientId);
});

async function populateOrderItemProductSelect() {
    const products = await ensureOrderProductsLoaded();
    orderItemProductSelect.innerHTML = '<option value="">— wybierz —</option>' + products
        .map((p) => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`)
        .join('');
}

orderItemProductSelect.addEventListener('change', async () => {
    const productId = orderItemProductSelect.value;

    if (!productId) {
        orderItemVariantSelect.innerHTML = '<option value="">— najpierw wybierz produkt —</option>';
        orderItemVariantSelect.disabled = true;
        return;
    }

    orderItemVariantSelect.disabled = false;
    orderItemVariantSelect.innerHTML = '<option value="">Ładowanie...</option>';

    try {
        const variants = await apiFetch(`/api/admin/products/${productId}/variants`);
        orderItemVariantSelect.innerHTML = variants
            .map((v) => `<option value="${v.id}" data-price="${v.price}" data-sku="${escapeHtml(v.sku)}">${escapeHtml(v.sku)} — ${formatPrice(v.price)} zł (stan: ${v.stock})</option>`)
            .join('') || '<option value="">Brak wariantów</option>';
    } catch {
        orderItemVariantSelect.innerHTML = '<option value="">Błąd ładowania wariantów</option>';
    }
});

orderItemAddBtn.addEventListener('click', () => {
    const variantOption = orderItemVariantSelect.selectedOptions[0];
    if (!variantOption || !variantOption.value) return;

    const quantity = Math.max(1, Number(orderItemQty.value) || 1);

    state.orderDraftItems.push({
        variantId: Number(variantOption.value),
        sku: variantOption.dataset.sku,
        price: Number(variantOption.dataset.price),
        quantity,
    });

    orderItemQty.value = '1';
    renderOrderItems();
});

function renderOrderItems() {
    const items = state.orderDraftItems;
    const isEditing = state.editingOrderId !== null;

    if (items.length === 0) {
        orderItemsBody.innerHTML = '<tr><td colspan="5" class="muted">Brak pozycji.</td></tr>';
    } else {
        orderItemsBody.innerHTML = '';

        items.forEach((item, index) => {
            const row = document.createElement('tr');
            const lineTotal = item.price * item.quantity;

            row.innerHTML = `
                <td>${escapeHtml(item.sku)}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${formatPrice(lineTotal)}</td>
                <td class="row-actions">${isEditing ? '' : '<button type="button" class="danger" data-action="remove">Usuń</button>'}</td>
            `;

            if (!isEditing) {
                row.querySelector('[data-action="remove"]').addEventListener('click', () => {
                    state.orderDraftItems.splice(index, 1);
                    renderOrderItems();
                });
            }

            orderItemsBody.appendChild(row);
        });
    }

    if (isEditing) {
        // W trybie podglądu total_amount to wartość wyliczona i zapisana
        // przez backend przy tworzeniu zamówienia (obejmuje koszt dostawy
        // z tamtego momentu) - nie przeliczamy jej ponownie po stronie klienta.
        orderTotalValue.textContent = formatPrice(state.editingOrderTotal ?? 0);
        return;
    }

    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingOption = orderShippingMethodSelect.selectedOptions[0];
    const shippingRate = shippingOption && shippingOption.value ? Number(shippingOption.dataset.rate || 0) : 0;

    orderTotalValue.textContent = formatPrice(itemsTotal + shippingRate);
}

orderShippingMethodSelect.addEventListener('change', renderOrderItems);

async function openOrderCreatePage() {
    state.editingOrderId = null;
    state.editingOrderTotal = null;
    state.orderDraftItems = [];
    orderFormHeading.textContent = 'Nowe zamówienie';
    orderForm.reset();
    orderFormError.hidden = true;
    orderStatusWrap.hidden = true;
    orderClientSelect.disabled = false;
    orderItemPicker.hidden = false;
    orderItemsHint.hidden = true;
    orderPaymentsSection.hidden = true;
    orderSaveBtn.textContent = 'Utwórz zamówienie';

    switchPage('order-form-page', 'orders-page');

    orderBillingAddressSelect.innerHTML = '<option value="">— brak —</option>';
    orderDeliveryAddressSelect.innerHTML = '<option value="">— brak —</option>';
    orderItemVariantSelect.innerHTML = '<option value="">— najpierw wybierz produkt —</option>';
    orderItemVariantSelect.disabled = true;

    await Promise.all([
        populateOrderClientSelect(),
        populateOrderShippingSelect(),
        populateOrderItemProductSelect(),
    ]);

    renderOrderItems();
}

async function openOrderEditPage(orderId) {
    orderFormError.hidden = true;
    switchPage('order-form-page', 'orders-page');
    orderFormHeading.textContent = 'Ładowanie...';

    try {
        const order = await apiFetch(`/api/admin/orders/${orderId}`);

        state.editingOrderId = order.id;
        state.editingOrderTotal = Number(order.total_amount);
        state.orderDraftItems = (order.items || []).map((item) => ({
            variantId: item.variant_id,
            sku: item.variant ? item.variant.sku : `#${item.variant_id}`,
            price: Number(item.unit_price),
            quantity: item.quantity,
        }));

        orderFormHeading.textContent = `Zamówienie #${order.id}`;
        orderStatusWrap.hidden = false;
        populateOrderStatusSelect();
        orderStatusSelect.value = order.status;
        orderClientSelect.disabled = true;
        orderItemPicker.hidden = true;
        orderItemsHint.hidden = false;
        orderPaymentsSection.hidden = false;
        orderSaveBtn.textContent = 'Zapisz zmiany';

        await populateOrderClientSelect(order.client_id);
        await populateOrderAddressSelects(order.client_id, {
            billing_address_id: order.billing_address_id,
            delivery_address_id: order.delivery_address_id,
        });
        await populateOrderShippingSelect(order.shipping_method_id);

        renderOrderItems();
        populatePaymentStatusSelect();
        await populatePaymentMethodSelect();
        renderPayments(order.payments || []);
    } catch (error) {
        orderFormError.textContent = error.message;
        orderFormError.hidden = false;
    }
}

function backToOrdersList() {
    switchPage('orders-page');
    loadOrders();
}

addOrderBtn.addEventListener('click', openOrderCreatePage);
orderCancelBtn.addEventListener('click', backToOrdersList);
orderFormBackBtn.addEventListener('click', backToOrdersList);

orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    orderFormError.hidden = true;

    const isEditing = state.editingOrderId !== null;

    if (!isEditing && state.orderDraftItems.length === 0) {
        orderFormError.textContent = 'Dodaj co najmniej jedną pozycję zamówienia.';
        orderFormError.hidden = false;
        return;
    }

    const body = isEditing
        ? {
            status: orderStatusSelect.value,
            billing_address_id: orderBillingAddressSelect.value ? Number(orderBillingAddressSelect.value) : null,
            delivery_address_id: orderDeliveryAddressSelect.value ? Number(orderDeliveryAddressSelect.value) : null,
            shipping_method_id: orderShippingMethodSelect.value ? Number(orderShippingMethodSelect.value) : null,
        }
        : {
            client_id: Number(orderClientSelect.value),
            billing_address_id: orderBillingAddressSelect.value ? Number(orderBillingAddressSelect.value) : null,
            delivery_address_id: orderDeliveryAddressSelect.value ? Number(orderDeliveryAddressSelect.value) : null,
            shipping_method_id: orderShippingMethodSelect.value ? Number(orderShippingMethodSelect.value) : null,
            items: state.orderDraftItems.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
        };

    const path = isEditing ? `/api/admin/orders/${state.editingOrderId}` : '/api/admin/orders';
    const method = isEditing ? 'PUT' : 'POST';

    orderSaveBtn.disabled = true;

    try {
        const saved = await apiFetch(path, { method, body: JSON.stringify(body) });
        await openOrderEditPage(saved.id);
        loadOrders();
    } catch (error) {
        orderFormError.textContent = error.message;
        orderFormError.hidden = false;
    } finally {
        orderSaveBtn.disabled = false;
    }
});

async function deleteOrder(order) {
    const confirmed = await confirmDialog(`Usunąć zamówienie #${order.id}?`, { title: 'Usuń zamówienie' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/orders/${order.id}`, { method: 'DELETE' });
        loadOrders();
    } catch (error) {
        if (error.status === 401) return;
        ordersError.textContent = error.message;
        ordersError.hidden = false;
    }
}

// --- Płatności ---

function renderPayments(payments) {
    if (payments.length === 0) {
        paymentsBody.innerHTML = '<tr><td colspan="4" class="muted">Brak płatności.</td></tr>';
        return;
    }

    paymentsBody.innerHTML = '';

    for (const payment of payments) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${formatPrice(payment.amount)}</td>
            <td>${escapeHtml(payment.method)}</td>
            <td>${escapeHtml(PAYMENT_STATUS_LABELS[payment.status] || payment.status)}</td>
            <td class="row-actions">
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="delete"]').addEventListener('click', () => deletePayment(payment));

        paymentsBody.appendChild(row);
    }
}

paymentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    paymentFormError.hidden = true;

    if (!state.editingOrderId) return;

    const body = {
        amount: Number(paymentAmount.value),
        method: paymentMethod.value.trim(),
        status: paymentStatus.value,
    };

    const submitBtn = document.getElementById('payment-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(`/api/admin/orders/${state.editingOrderId}/payments`, { method: 'POST', body: JSON.stringify(body) });
        paymentForm.reset();
        const order = await apiFetch(`/api/admin/orders/${state.editingOrderId}`);
        renderPayments(order.payments || []);
    } catch (error) {
        paymentFormError.textContent = error.message;
        paymentFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deletePayment(payment) {
    const confirmed = await confirmDialog('Usunąć tę płatność?', { title: 'Usuń płatność' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/payments/${payment.id}`, { method: 'DELETE' });
        const order = await apiFetch(`/api/admin/orders/${state.editingOrderId}`);
        renderPayments(order.payments || []);
    } catch (error) {
        if (error.status === 401) return;
        paymentsError.textContent = error.message;
        paymentsError.hidden = false;
    }
}

// --- Użytkownicy panelu ---

async function loadUsers() {
    usersError.hidden = true;
    usersBody.innerHTML = '<tr><td colspan="4" class="muted">Ładowanie...</td></tr>';

    try {
        const users = await apiFetch('/api/admin/users');
        renderUsers(users);
    } catch (error) {
        if (error.status === 401) return;
        usersBody.innerHTML = '';
        usersError.textContent = error.message;
        usersError.hidden = false;
    }
}

const USER_ROLE_LABELS = { superadmin: 'Superadmin', admin: 'Admin' };

function renderUsers(users) {
    if (users.length === 0) {
        usersBody.innerHTML = '<tr><td colspan="4" class="muted">Brak użytkowników.</td></tr>';
        return;
    }

    usersBody.innerHTML = '';

    for (const user of users) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(USER_ROLE_LABELS[user.role] || user.role)}</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openUserModal(user));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteUser(user));

        usersBody.appendChild(row);
    }
}

function openUserModal(user = null) {
    state.editingUserId = user ? user.id : null;
    userModalTitle.textContent = user ? 'Edytuj użytkownika' : 'Dodaj użytkownika';
    userName.value = user ? user.name : '';
    userEmail.value = user ? user.email : '';
    userPassword.value = '';
    userPassword.required = !user;
    userPasswordLabel.textContent = user ? 'Hasło (podaj tylko, gdy zmieniasz)' : 'Hasło *';
    userRole.value = user ? user.role : 'admin';
    userFormError.hidden = true;
    userModal.hidden = false;
    userName.focus();
}

function closeUserModal() {
    userModal.hidden = true;
}

addUserBtn.addEventListener('click', () => openUserModal());
userCancelBtn.addEventListener('click', closeUserModal);
userModal.addEventListener('click', (event) => {
    if (event.target === userModal) closeUserModal();
});

userForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    userFormError.hidden = true;

    const body = {
        name: userName.value.trim(),
        email: userEmail.value.trim(),
        role: userRole.value,
    };

    if (userPassword.value) {
        body.password = userPassword.value;
    }

    const isEditing = state.editingUserId !== null;
    const path = isEditing ? `/api/admin/users/${state.editingUserId}` : '/api/admin/users';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('user-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(path, { method, body: JSON.stringify(body) });
        closeUserModal();
        loadUsers();
    } catch (error) {
        userFormError.textContent = error.message;
        userFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteUser(user) {
    const confirmed = await confirmDialog(`Usunąć użytkownika "${user.name}"?`, { title: 'Usuń użytkownika' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
        loadUsers();
    } catch (error) {
        if (error.status === 401) return;
        usersError.textContent = error.message;
        usersError.hidden = false;
    }
}

// --- Metody dostawy ---

async function loadShippingMethods() {
    shippingError.hidden = true;
    shippingBody.innerHTML = '<tr><td colspan="3" class="muted">Ładowanie...</td></tr>';

    try {
        state.shippingMethods = await apiFetch('/api/admin/shipping-methods');
        renderShippingMethods();
    } catch (error) {
        if (error.status === 401) return;
        state.shippingMethods = [];
        shippingBody.innerHTML = '';
        shippingError.textContent = error.message;
        shippingError.hidden = false;
    }
}

function renderShippingMethods() {
    const methods = state.shippingMethods || [];

    if (methods.length === 0) {
        shippingBody.innerHTML = '<tr><td colspan="3" class="muted">Brak metod dostawy.</td></tr>';
        return;
    }

    shippingBody.innerHTML = '';

    for (const shippingMethod of methods) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${escapeHtml(shippingMethod.name)}</td>
            <td>${formatPrice(shippingMethod.flat_rate)} zł</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openShippingModal(shippingMethod));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteShippingMethod(shippingMethod));

        shippingBody.appendChild(row);
    }
}

function openShippingModal(shippingMethod = null) {
    state.editingShippingId = shippingMethod ? shippingMethod.id : null;
    shippingModalTitle.textContent = shippingMethod ? 'Edytuj metodę dostawy' : 'Dodaj metodę dostawy';
    shippingName.value = shippingMethod ? shippingMethod.name : '';
    shippingRate.value = shippingMethod ? shippingMethod.flat_rate : '';
    shippingFormError.hidden = true;
    shippingModal.hidden = false;
    shippingName.focus();
}

function closeShippingModal() {
    shippingModal.hidden = true;
}

addShippingBtn.addEventListener('click', () => openShippingModal());
shippingCancelBtn.addEventListener('click', closeShippingModal);
shippingModal.addEventListener('click', (event) => {
    if (event.target === shippingModal) closeShippingModal();
});

shippingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    shippingFormError.hidden = true;

    const body = {
        name: shippingName.value.trim(),
        flat_rate: Number(shippingRate.value),
    };

    const isEditing = state.editingShippingId !== null;
    const path = isEditing ? `/api/admin/shipping-methods/${state.editingShippingId}` : '/api/admin/shipping-methods';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('shipping-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(path, { method, body: JSON.stringify(body) });
        closeShippingModal();
        loadShippingMethods();
    } catch (error) {
        shippingFormError.textContent = error.message;
        shippingFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteShippingMethod(shippingMethod) {
    const confirmed = await confirmDialog(`Usunąć metodę dostawy "${shippingMethod.name}"?`, { title: 'Usuń metodę dostawy' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/shipping-methods/${shippingMethod.id}`, { method: 'DELETE' });
        loadShippingMethods();
    } catch (error) {
        if (error.status === 401) return;
        shippingError.textContent = error.message;
        shippingError.hidden = false;
    }
}

// --- Metody płatności ---

async function loadPaymentMethods() {
    paymentMethodsError.hidden = true;
    paymentMethodsBody.innerHTML = '<tr><td colspan="2" class="muted">Ładowanie...</td></tr>';

    try {
        state.paymentMethods = await apiFetch('/api/admin/payment-methods');
        renderPaymentMethods();
    } catch (error) {
        if (error.status === 401) return;
        state.paymentMethods = [];
        paymentMethodsBody.innerHTML = '';
        paymentMethodsError.textContent = error.message;
        paymentMethodsError.hidden = false;
    }
}

async function ensurePaymentMethodsLoaded() {
    if (state.paymentMethods === null) {
        try {
            state.paymentMethods = await apiFetch('/api/admin/payment-methods');
        } catch {
            state.paymentMethods = [];
        }
    }

    return state.paymentMethods;
}

function renderPaymentMethods() {
    const methods = state.paymentMethods || [];

    if (methods.length === 0) {
        paymentMethodsBody.innerHTML = '<tr><td colspan="2" class="muted">Brak metod płatności.</td></tr>';
        return;
    }

    paymentMethodsBody.innerHTML = '';

    for (const paymentMethodItem of methods) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${escapeHtml(paymentMethodItem.name)}</td>
            <td class="row-actions">
                <button type="button" class="secondary" data-action="edit">Edytuj</button>
                <button type="button" class="danger" data-action="delete">Usuń</button>
            </td>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openPaymentMethodModal(paymentMethodItem));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deletePaymentMethod(paymentMethodItem));

        paymentMethodsBody.appendChild(row);
    }
}

function openPaymentMethodModal(paymentMethodItem = null) {
    state.editingPaymentMethodId = paymentMethodItem ? paymentMethodItem.id : null;
    paymentMethodModalTitle.textContent = paymentMethodItem ? 'Edytuj metodę płatności' : 'Dodaj metodę płatności';
    paymentMethodName.value = paymentMethodItem ? paymentMethodItem.name : '';
    paymentMethodFormError.hidden = true;
    paymentMethodModal.hidden = false;
    paymentMethodName.focus();
}

function closePaymentMethodModal() {
    paymentMethodModal.hidden = true;
}

addPaymentMethodBtn.addEventListener('click', () => openPaymentMethodModal());
paymentMethodCancelBtn.addEventListener('click', closePaymentMethodModal);
paymentMethodModal.addEventListener('click', (event) => {
    if (event.target === paymentMethodModal) closePaymentMethodModal();
});

paymentMethodForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    paymentMethodFormError.hidden = true;

    const body = { name: paymentMethodName.value.trim() };

    const isEditing = state.editingPaymentMethodId !== null;
    const path = isEditing ? `/api/admin/payment-methods/${state.editingPaymentMethodId}` : '/api/admin/payment-methods';
    const method = isEditing ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('payment-method-save-btn');
    submitBtn.disabled = true;

    try {
        await apiFetch(path, { method, body: JSON.stringify(body) });
        state.paymentMethods = null;
        closePaymentMethodModal();
        loadPaymentMethods();
    } catch (error) {
        paymentMethodFormError.textContent = error.message;
        paymentMethodFormError.hidden = false;
    } finally {
        submitBtn.disabled = false;
    }
});

async function deletePaymentMethod(paymentMethodItem) {
    const confirmed = await confirmDialog(`Usunąć metodę płatności "${paymentMethodItem.name}"?`, { title: 'Usuń metodę płatności' });
    if (!confirmed) return;

    try {
        await apiFetch(`/api/admin/payment-methods/${paymentMethodItem.id}`, { method: 'DELETE' });
        state.paymentMethods = null;
        loadPaymentMethods();
    } catch (error) {
        if (error.status === 401) return;
        paymentMethodsError.textContent = error.message;
        paymentMethodsError.hidden = false;
    }
}

// --- Start ---

apiBaseInput.value = getApiBase();

if (getToken()) {
    enterApp();
} else {
    showView('login');
}
