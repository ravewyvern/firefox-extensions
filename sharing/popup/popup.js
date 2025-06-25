// DOM Elements
const mainView = document.getElementById('main-view');
const editView = document.getElementById('edit-view');
const servicesGrid = document.getElementById('services-grid');
const availableServicesList = document.getElementById('available-services-list');
const pageTitleEl = document.getElementById('page-title');
const pageUrlEl = document.getElementById('page-url');
const faviconEl = document.getElementById('favicon');
const clipboardHelper = document.getElementById('clipboard-helper');

// Buttons
const editButton = document.getElementById('edit-button');
const doneButton = document.getElementById('done-button');
const copyButton = document.getElementById('copy-button');
const qrCodeButton = document.getElementById('qr-code-button');
const addCustomServiceButton = document.getElementById('add-custom-service');

// Edit View Inputs
const searchInput = document.getElementById('search-services');
const customNameInput = document.getElementById('custom-name');
const customUrlInput = document.getElementById('custom-url');
const customIconInput = document.getElementById('custom-icon');
const customColorInput = document.getElementById('custom-color');
const customCopyOnlyInput = document.getElementById('custom-copy-only');

// QR Modal Elements
const qrModal = document.getElementById('qr-modal');
const modalCloseButton = document.getElementById('modal-close-button');
const qrCodeContainer = document.getElementById('qr-code-container');
const qrUrlDisplay = document.getElementById('qr-url-display');
const qrDownloadLink = document.getElementById('qr-download-link');

// State
let currentTab;
let allServices = [];
let userServices = [];

/**
 * Copies text to the clipboard and provides user feedback.
 */
function copyToClipboard(text, feedbackElement) {
    clipboardHelper.value = text;
    clipboardHelper.style.display = 'block';
    clipboardHelper.select();
    document.execCommand('copy');
    clipboardHelper.style.display = 'none';

    if (feedbackElement) {
        const originalText = feedbackElement.textContent.trim();
        feedbackElement.innerHTML = `<img src="../icons/copy.svg" alt="Copy Icon"> Copied!`;
        setTimeout(() => {
            feedbackElement.innerHTML = `<img src="../icons/copy.svg" alt="Copy Icon"> ${originalText}`;
        }, 1500);
    }
}

/**
 * Initializes the popup by fetching tab info and loading services.
 */
async function init() {
    try {
        // Restore custom form state from session storage to prevent data loss on popup close
        customNameInput.value = sessionStorage.getItem('custom_form_custom-name') || '';
        customUrlInput.value = sessionStorage.getItem('custom_form_custom-url') || '';
        customIconInput.value = sessionStorage.getItem('custom_form_custom-icon') || '';
        customColorInput.value = sessionStorage.getItem('custom_form_custom-color') || '#4A90E2';
        customCopyOnlyInput.checked = (sessionStorage.getItem('custom_form_custom-copy-only') === 'true');

        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        currentTab = tabs[0];

        pageTitleEl.textContent = currentTab.title;
        pageUrlEl.textContent = currentTab.url;
        faviconEl.src = currentTab.favIconUrl || '../icons/icon48.png';

        await loadServices();
        renderServicesGrid();
        renderAvailableServicesList();
        setupEventListeners();
    } catch (error) {
        console.error("Super Sharer Error:", error);
        document.body.innerHTML = "Error initializing extension. See console for details.";
    }
}

/**
 * Loads service configurations from storage, or initializes with defaults.
 */
async function loadServices() {
    allServices = [...defaultServices];
    const customData = await browser.storage.local.get('customServices');
    if (customData.customServices) {
        allServices.push(...customData.customServices);
    }

    const userData = await browser.storage.local.get('userServices');
    userServices = userData.userServices || defaultServices.slice(0, 7).map(s => s.id);
}

/**
 * Renders the grid of shareable services on the main view.
 */
function renderServicesGrid() {
    servicesGrid.innerHTML = '';
    const servicesToRender = allServices.filter(s => userServices.includes(s.id));

    for (const service of servicesToRender) {
        const serviceItem = document.createElement('a');
        serviceItem.className = 'service-item';
        serviceItem.title = `Share to ${service.name}`;

        serviceItem.innerHTML = `
            <div class="service-icon-wrapper" style="background-color: ${service.color};">
                <img src="${service.icon}" class="service-icon" alt="${service.name} icon">
            </div>
            <span class="service-name">${service.name}</span>
        `;

        if (service.copyOnly) {
            serviceItem.href = service.urlTemplate;
            serviceItem.target = '_blank';
            serviceItem.addEventListener('click', (e) => {
                e.preventDefault();
                copyToClipboard(currentTab.url);
                browser.tabs.create({ url: service.urlTemplate });
            });
        } else {
            serviceItem.href = service.urlTemplate.replace('%s', encodeURIComponent(currentTab.url));
            serviceItem.target = '_blank';
        }

        servicesGrid.appendChild(serviceItem);
    }
}

/**
 * Renders the list of all available services in the edit view.
 */
function renderAvailableServicesList() {
    availableServicesList.innerHTML = '';
    for (const service of allServices) {
        const item = document.createElement('div');
        item.className = 'service-list-item';
        item.dataset.serviceName = service.name.toLowerCase();
        const isEnabled = userServices.includes(service.id);

        const isCustom = service.id.startsWith('custom_');
        const deleteButtonHTML = isCustom
            ? `<button class="delete-service-btn" data-service-id="${service.id}" title="Delete Service">🗑️</button>`
            : '';

        item.innerHTML = `
            <img class="svg-invert" src="${service.icon}" alt="${service.name} icon">
            <span>${service.name}</span>
            ${deleteButtonHTML}
            <label class="switch">
                <input type="checkbox" data-service-id="${service.id}" ${isEnabled ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        `;
        availableServicesList.appendChild(item);
    }
}

/**
 * Deletes a custom service from the extension.
 * @param {string} serviceIdToDelete The ID of the service to delete.
 */
async function deleteService(serviceIdToDelete) {
    allServices = allServices.filter(s => s.id !== serviceIdToDelete);
    userServices = userServices.filter(id => id !== serviceIdToDelete);

    const { customServices = [] } = await browser.storage.local.get('customServices');
    const updatedCustomServices = customServices.filter(s => s.id !== serviceIdToDelete);

    await browser.storage.local.set({
        customServices: updatedCustomServices,
        userServices: userServices
    });

    renderAvailableServicesList();
}


/**
 * Sets up all necessary event listeners for the popup.
 */
function setupEventListeners() {
    // View toggling
    editButton.addEventListener('click', () => toggleView(true));
    doneButton.addEventListener('click', async () => {
        // Save changes before closing the edit view
        await browser.storage.local.set({ userServices });
        toggleView(false);
        renderServicesGrid();
    });

    // Main actions
    copyButton.addEventListener('click', () => copyToClipboard(currentTab.url, copyButton));
    qrCodeButton.addEventListener('click', showQrCodeModal);

    // QR Modal closing
    modalCloseButton.addEventListener('click', () => qrModal.classList.add('hidden'));
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) qrModal.classList.add('hidden');
    });

    // Service list management (enable/disable and delete)
    availableServicesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-service-btn')) {
            const serviceId = e.target.dataset.serviceId;
            deleteService(serviceId);
        }
    });

    availableServicesList.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const serviceId = e.target.dataset.serviceId;
            if (e.target.checked) {
                if (!userServices.includes(serviceId)) userServices.push(serviceId);
            } else {
                userServices = userServices.filter(id => id !== serviceId);
            }
        }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        availableServicesList.querySelectorAll('.service-list-item').forEach(item => {
            item.classList.toggle('hidden', !item.dataset.serviceName.includes(searchTerm));
        });
    });

    // Persist custom form state on input to prevent data loss from color picker
    const customFormInputs = [customNameInput, customUrlInput, customIconInput];
    customFormInputs.forEach(input => {
        input.addEventListener('input', () => {
            sessionStorage.setItem(`custom_form_${input.id}`, input.value);
        });
    });
    customColorInput.addEventListener('input', () => {
        sessionStorage.setItem('custom_form_custom-color', customColorInput.value);
    });
    customCopyOnlyInput.addEventListener('change', () => {
        sessionStorage.setItem('custom_form_custom-copy-only', customCopyOnlyInput.checked);
    });


    // Add custom service
    addCustomServiceButton.addEventListener('click', async () => {
        const name = customNameInput.value.trim();
        const urlTemplate = customUrlInput.value.trim();
        if (!name || !urlTemplate) {
            alert('Service Name and URL Template are required.');
            return;
        }

        const newService = {
            id: `custom_${Date.now()}`,
            name,
            urlTemplate,
            icon: customIconInput.value.trim() || '../icons/default.svg',
            color: customColorInput.value,
            copyOnly: customCopyOnlyInput.checked,
            category: 'Custom'
        };

        allServices.push(newService);
        userServices.push(newService.id);

        const { customServices = [] } = await browser.storage.local.get('customServices');
        customServices.push(newService);

        await browser.storage.local.set({ customServices, userServices });

        // Clear form fields and session storage
        [customNameInput, customUrlInput, customIconInput].forEach(i => i.value = '');
        customCopyOnlyInput.checked = false;
        customColorInput.value = '#4A90E2';
        const inputsToClear = ['custom-name', 'custom-url', 'custom-icon', 'custom-color', 'custom-copy-only'];
        inputsToClear.forEach(id => sessionStorage.removeItem(`custom_form_${id}`));

        renderAvailableServicesList();
    });
}

/**
 * Generates and displays the QR code modal.
 */
function showQrCodeModal() {
    if (typeof QRCode === 'undefined') {
        qrCodeContainer.innerHTML = "Error: QR Code library not found.";
        qrModal.classList.remove('hidden');
        return;
    }

    qrCodeContainer.innerHTML = ''; // Clear previous QR code
    const textToEncode = currentTab.url;

    new QRCode(qrCodeContainer, {
        text: textToEncode,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        const canvas = qrCodeContainer.querySelector('canvas');
        if (canvas) {
            qrDownloadLink.href = canvas.toDataURL('image/png');
        } else {
            const img = qrCodeContainer.querySelector('img');
            if (img) qrDownloadLink.href = img.src;
        }
    }, 100);

    qrUrlDisplay.textContent = textToEncode;
    qrModal.classList.remove('hidden');
}


/**
 * Toggles the visibility of the main and edit views.
 */
function toggleView(showEdit) {
    mainView.classList.toggle('hidden', showEdit);
    editView.classList.toggle('hidden', !showEdit);
}

document.addEventListener('DOMContentLoaded', init);
