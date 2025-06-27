// --- PRE-BUILT WIDGETS --- //
// This is where you can add more widgets in the future.


// --- Add near the top of scripts.js ---
let config = {};
let isEditMode = false;
let currentDrag = { element: null, id: null };
let currentResize = { active: false, id: null, element: null, startX: 0, startY: 0, startW: 0, startH: 0 }; // Add this line

const GITHUB_REPO_BASE_URL = `https://raw.githubusercontent.com/ravewyvern/firefox-extensions/refs/heads/main/Home_Apps/`;

const APP_CATEGORIES = [
    { id: 'custom', name: 'Custom' },
    { id: 'social', name: 'Social', url: `${GITHUB_REPO_BASE_URL}social.json` },
    { id: 'entertainment', name: 'Entertainment', url: `${GITHUB_REPO_BASE_URL}entertainment.json` },
    { id: 'productivity', name: 'Productivity', url: `${GITHUB_REPO_BASE_URL}productivity.json` },
];


// --- CORE LOGIC --- //
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gridContainer = document.getElementById('grid-container');
    const contextMenu = document.getElementById('context-menu');
    const modals = {
        settings: document.getElementById('settings-modal'),
        wallpaper: document.getElementById('wallpaper-modal'),
        app: document.getElementById('app-modal'),
        widget: document.getElementById('widget-modal'),
        widgetConfig: document.getElementById('widget-config-modal'),
    };

    // State
    let config = {};
    let isEditMode = false;
    let currentDrag = { element: null, id: null };

    const defaultConfig = {
        grid: { cols: 12, rows: 8 },
        wallpaper: { type: 'color', value: '#1c1c1e' },
        items: [],
        // Add the new preferences object
        preferences: {
            hourFormat: '12',
            tempUnit: 'fahrenheit',
            transparentItems: false,
            showWidgetNames: false
        }
    };

    // --- Storage (using localStorage as a stand-in for browser.storage) --- //
    function loadConfig() {
        const savedConfig = localStorage.getItem('launcherConfig');
        config = savedConfig ? JSON.parse(savedConfig) : defaultConfig;
    }

    function saveConfig() {
        localStorage.setItem('launcherConfig', JSON.stringify(config));
    }

    // --- Initialization --- //
    function init() {
        loadConfig();
        applyWallpaper();
        applyGridSettings();
        renderAllItems();
        setupEventListeners();
        populateWidgetGallery();
    }

    function applyWallpaper() {
        const { type, value } = config.wallpaper;
        if (type === 'color') {
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = value;
        } else if ((type === 'url' || type === 'upload') && value) {
            document.body.style.backgroundImage = `url(${value})`;
        }
    }



// --- Replace your existing applyGridSettings function ---
    function applyGridSettings() {
        const { cols, rows } = config.grid;
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        // Set CSS variables for the visual grid background (Fix for Bug #1)
        document.documentElement.style.setProperty('--grid-cols', cols);
        document.documentElement.style.setProperty('--grid-rows', rows);
    }

// --- Add this block of code inside your init() function ---
// This ensures the grid is redrawn on window resize
    window.addEventListener('resize', applyGridSettings);

// This ensures the grid is redrawn on window resize
    window.addEventListener('resize', applyGridSettings);

    function renderAllItems() {
        gridContainer.innerHTML = '';
        config.items.forEach(item => {
            const itemEl = createItemElement(item);
            gridContainer.appendChild(itemEl);
        });
    }

    // --- Item Creation --- //
    function createItemElement(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'grid-item';
        itemEl.id = item.id;
        itemEl.dataset.itemId = item.id;
        itemEl.style.gridColumn = `${item.pos.x} / span ${item.size.w}`;
        itemEl.style.gridRow = `${item.pos.y} / span ${item.size.h}`;
        itemEl.draggable = false; // Controlled by edit mode

        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeItem(item.id);
        });
        itemEl.appendChild(removeBtn);

        if (item.type === 'app') {
            itemEl.classList.add('app');
            itemEl.href = item.url;
            itemEl.target = "_blank";
            if (item.type === 'app') {
                itemEl.classList.add('app');
                // The main element is no longer a link. The click is handled by JS.
                itemEl.innerHTML += `
        <div class="app-content">
            <img src="${item.icon}" class="app-icon" onerror="this.src='https://placehold.co/64x64/3a3a3c/ffffff?text=X'">
            <span class="app-name">${item.name}</span>
        </div>
    `;
                itemEl.appendChild(removeBtn); // Re-append remove button
                itemEl.addEventListener('click', (e) => {
                    if(!isEditMode) window.open(item.url, '_blank');
                });
            }
            // Re-append the remove button because innerHTML overwrites it
            itemEl.appendChild(removeBtn);
            itemEl.addEventListener('click', (e) => {
                if(!isEditMode) window.open(item.url, '_blank');
            });
        } else if (item.type === 'widget') {
            itemEl.classList.add('widget');
            const widgetDef = WIDGET_DEFINITIONS.find(w => w.id === item.widgetId);
            if (widgetDef) {
                const content = document.createElement('div');
                content.className = 'widget-content';

                // Start with the base HTML
                let html = widgetDef.htmlcode;

                // Replace the unique ID placeholder
                html = html.replace(new RegExp(`{{id}}`, 'g'), item.id);

                // Replace config placeholders, e.g., {{greetingMessage}}
                if(item.config) {
                    for(const key in item.config) {
                        html = html.replace(new RegExp(`{{${key}}}`, 'g'), item.config[key]);
                    }
                }
                content.innerHTML = html;

                itemEl.appendChild(content);

                // Execute scripts within the widget AFTER it's in the DOM
                setTimeout(() => {
                    content.querySelectorAll('script').forEach(originalScript => {
                        const newScript = document.createElement('script');
                        newScript.textContent = originalScript.textContent;
                        // Append to the item element itself to ensure proper execution context
                        itemEl.appendChild(newScript).remove();
                    });
                }, 0);

                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                resizeHandle.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    handleResizeMouseDown(e, item.id);
                });
                itemEl.appendChild(resizeHandle);
            }
        }

        return itemEl;
    }

    // --- Event Listeners --- //
    function setupEventListeners() {
        // Context Menu

        document.getElementById('widget-search').addEventListener('input', (e) => {
            populateWidgetGallery(e.target.value);
        });

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e);
        });
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if(e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Forms
        document.getElementById('settings-form').addEventListener('submit', handleSettingsSave);
        document.getElementById('save-wallpaper-btn').addEventListener('click', handleWallpaperSave);
        document.getElementById('wallpaper-type').addEventListener('change', handleWallpaperTypeChange);
        document.getElementById('app-form').addEventListener('submit', handleAppSave);
        document.getElementById('app-icon-type').addEventListener('change', handleAppIconTypeChange);
        document.getElementById('remove-app-btn').addEventListener('click', handleAppRemove);


        // Drag and Drop for Edit Mode
        gridContainer.addEventListener('dragstart', handleDragStart);
        gridContainer.addEventListener('dragover', handleDragOver);
        gridContainer.addEventListener('drop', handleDrop);
    }

    // --- Context Menu Logic --- //
    function showContextMenu(e) {
        const targetItem = e.target.closest('.grid-item');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;

        let menuItems = '';
        if (targetItem) {
            const itemId = targetItem.dataset.itemId;
            const item = config.items.find(i => i.id === itemId);
            if (item.type === 'app') {
                menuItems += `<div class="context-menu-item" data-action="edit-app" data-id="${itemId}">Edit App</div>`;
            } else if (item.type === 'widget') {
                menuItems += `<div class="context-menu-item" data-action="edit-widget" data-id="${itemId}">Edit Widget</div>`;
            }
        } else {
            menuItems += `
                        <div class="context-menu-item" data-action="add-app">Add App</div>
                        <div class="context-menu-item" data-action="add-widget">Add Widget</div>
                        <div class="context-menu-separator"></div>
                    `;
        }

        menuItems += `
                    <div class="context-menu-item" data-action="edit-layout">${isEditMode ? 'Save Layout' : 'Edit Layout'}</div>
                    <div class="context-menu-separator"></div>
                    <div class="context-menu-item" data-action="wallpaper">Wallpaper</div>
                    <div class="context-menu-item" data-action="settings">Settings</div>
                `;

        contextMenu.innerHTML = menuItems;
    }

    contextMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;

        const id = e.target.dataset.id;

        switch(action) {
            case 'add-app': openAppModal(); break;
            case 'add-widget': openWidgetModal(); break;
            case 'edit-layout': toggleEditMode(); break;
            case 'wallpaper': openWallpaperModal(); break;
            case 'settings': openSettingsModal(); break;
            case 'edit-app': openAppModal(id); break;
            case 'edit-widget': openWidgetConfigModal(id); break;
        }

        contextMenu.style.display = 'none';
    });

    // --- Modal Openers --- //
    function openModal(modal) {
        modal.style.display = 'flex';
    }

    function openSettingsModal() {
        document.getElementById('grid-cols').value = config.grid.cols;
        document.getElementById('grid-rows').value = config.grid.rows;
        openModal(modals.settings);
    }

    function openWallpaperModal() {
        const { type, value } = config.wallpaper;
        document.getElementById('wallpaper-type').value = type;
        if (type === 'color') document.getElementById('wallpaper-color').value = value;
        if (type === 'url') document.getElementById('wallpaper-url').value = value;
        handleWallpaperTypeChange(); // To show correct input
        openModal(modals.wallpaper);
    }

    function openAppModal(id = null) {
        const form = document.getElementById('app-form');
        form.reset();
        document.getElementById('app-icon-url-group').style.display = 'none';
        document.getElementById('app-icon-upload-group').style.display = 'none';

        const removeBtn = document.getElementById('remove-app-btn');

        if (id) {
            // If editing, force open the custom view
            switchAppCategory(APP_CATEGORIES[0]);
            const item = config.items.find(i => i.id === id);
            document.getElementById('app-id').value = id;
            document.getElementById('app-name').value = item.name;
            document.getElementById('app-url').value = item.url;
            document.getElementById('remove-app-btn').style.display = 'inline-block';
        } else {
            // If adding, setup the full category view
            setupAppModal();
            document.getElementById('app-form').reset();
            document.getElementById('app-id').value = '';
            document.getElementById('remove-app-btn').style.display = 'none';
        }
        openModal(modals.app);
    }

    function openWidgetModal() {
        openModal(modals.widget);
    }

// --- Replace the entire openWidgetConfigModal function in scripts.js ---

    function openWidgetConfigModal(instanceId, widgetIdToAdd = null) {
        const item = config.items.find(i => i.id === instanceId);
        const widgetDef = WIDGET_DEFINITIONS.find(w => w.id === (item ? item.widgetId : widgetIdToAdd));

        if (!widgetDef) return;

        // If editing a widget that has no config options, do nothing.
        if (item && widgetDef.config.length === 0) {
            alert("This widget has no options to configure.");
            return;
        }

        // If adding a new widget that has no config options, just add it directly.
        if (!item && widgetDef.config.length === 0) {
            addItem('widget', { widgetId: widgetDef.id, size: widgetDef.defaultSize, config: {} });
            return;
        }

        const form = document.getElementById('widget-config-form');
        form.innerHTML = '';

        document.getElementById('widget-config-title').textContent = `Configure ${widgetDef.name}`;

        let fieldsHTML = '';
        widgetDef.config.forEach(field => {
            const savedValue = item?.config?.[field.name] ?? field.default;
            fieldsHTML += `<div class="form-group">`;

            if (field.type !== 'checkbox') {
                fieldsHTML += `<label for="config-${field.name}">${field.label}</label>`;
            }

            switch(field.type) {
                case 'text':
                    fieldsHTML += `<input type="text" id="config-${field.name}" name="${field.name}" value="${savedValue}">`;
                    break;
                case 'checkbox':
                    fieldsHTML += `
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="config-${field.name}" name="${field.name}" ${savedValue ? 'checked' : ''} style="width: auto; margin-right: 10px;">
                        ${field.label}
                    </label>
                `;
                    break;
                case 'dropdown':
                    fieldsHTML += `<select id="config-${field.name}" name="${field.name}">`;
                    field.options.forEach(opt => {
                        fieldsHTML += `<option value="${opt.value}" ${savedValue === opt.value ? 'selected' : ''}>${opt.label}</option>`;
                    });
                    fieldsHTML += `</select>`;
                    break;
            }
            fieldsHTML += `</div>`;
        });

        fieldsHTML += `<input type="hidden" name="instanceId" value="${instanceId || ''}">`;
        fieldsHTML += `<input type="hidden" name="widgetId" value="${widgetDef.id}">`;

        fieldsHTML += `<div style="display:flex; justify-content: space-between; margin-top: 20px;">`;
        fieldsHTML += `<button type="submit" class="btn btn-primary">Save Widget</button>`;
        if (item) { // Only show remove button if editing an existing widget
            fieldsHTML += `<button type="button" id="remove-widget-btn" class="btn" style="background-color:#ff3b30; color:white;">Remove Widget</button>`;
        }
        fieldsHTML += `</div>`;

        form.innerHTML = fieldsHTML;

        form.onsubmit = handleWidgetConfigSave;

        if (item) {
            document.getElementById('remove-widget-btn').onclick = () => {
                if (confirm('Are you sure you want to remove this widget?')) {
                    removeItem(instanceId);
                    modals.widgetConfig.style.display = 'none';
                }
            };
        }

        openModal(modals.widgetConfig);
    }


    // --- Form Handlers --- //
    function handleSettingsSave(e) {
        e.preventDefault();
        config.grid.cols = document.getElementById('grid-cols').value;
        config.grid.rows = document.getElementById('grid-rows').value;
        saveConfig();
        applyGridSettings();
        renderAllItems();
        modals.settings.style.display = 'none';
    }

    function handleWallpaperTypeChange() {
        document.getElementById('wallpaper-input-color').style.display = 'none';
        document.getElementById('wallpaper-input-url').style.display = 'none';
        document.getElementById('wallpaper-input-upload').style.display = 'none';
        const type = document.getElementById('wallpaper-type').value;
        document.getElementById(`wallpaper-input-${type}`).style.display = 'block';
    }

    function handleWallpaperSave() {
        const type = document.getElementById('wallpaper-type').value;
        config.wallpaper.type = type;

        if (type === 'color') {
            config.wallpaper.value = document.getElementById('wallpaper-color').value;
            applyWallpaper();
            saveConfig();
        } else if (type === 'url') {
            config.wallpaper.value = document.getElementById('wallpaper-url').value;
            applyWallpaper();
            saveConfig();
        } else if (type === 'upload') {
            const file = document.getElementById('wallpaper-upload').files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    config.wallpaper.value = e.target.result;
                    applyWallpaper();
                    saveConfig();
                };
                reader.readAsDataURL(file);
            }
        }
        modals.wallpaper.style.display = 'none';
    }

    function handleAppIconTypeChange() {
        document.getElementById('app-icon-url-group').style.display = 'none';
        document.getElementById('app-icon-upload-group').style.display = 'none';
        const type = document.getElementById('app-icon-type').value;
        if(type === 'url') document.getElementById('app-icon-url-group').style.display = 'block';
        if(type === 'upload') document.getElementById('app-icon-upload-group').style.display = 'block';
    }

    function handleAppSave(e) {
        e.preventDefault();
        const id = document.getElementById('app-id').value;
        const name = document.getElementById('app-name').value;
        const url = document.getElementById('app-url').value;
        const iconType = document.getElementById('app-icon-type').value;

        const processAndSave = (iconUrl) => {
            const appData = { name, url, icon: iconUrl };
            if (id) {
                updateItem(id, appData);
            } else {
                addItem('app', appData);
            }
            modals.app.style.display = 'none';
        };

        if (iconType === 'favicon') {
            // Use a proxy for favicons to avoid CORS issues if possible, or just use Google's.
            const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
            processAndSave(faviconUrl);
        } else if (iconType === 'url') {
            const iconUrl = document.getElementById('app-icon-url').value;
            processAndSave(iconUrl);
        } else if (iconType === 'upload') {
            const file = document.getElementById('app-icon-upload').files[0];
            if(file){
                const reader = new FileReader();
                reader.onload = (e) => processAndSave(e.target.result);
                reader.readAsDataURL(file);
            } else if (id) { // Editing but not changing the icon
                const existingItem = config.items.find(i => i.id === id);
                processAndSave(existingItem.icon);
            }
        }
    }

    function handleAppRemove() {
        const id = document.getElementById('app-id').value;
        if(id && confirm('Are you sure you want to remove this app?')) {
            removeItem(id);
            modals.app.style.display = 'none';
        }
    }

// --- Replace the entire handleWidgetConfigSave function in scripts.js ---

    function handleWidgetConfigSave(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const widgetId = formData.get('widgetId');
        const instanceId = formData.get('instanceId');

        const widgetDef = WIDGET_DEFINITIONS.find(w => w.id === widgetId);
        if (!widgetDef) return;

        const newConfig = {};
        // Process form data, handling checkboxes correctly
        widgetDef.config.forEach(field => {
            if (field.type === 'checkbox') {
                newConfig[field.name] = formData.has(field.name);
            } else {
                newConfig[field.name] = formData.get(field.name);
            }
        });

        if (instanceId) { // Editing existing widget
            updateItem(instanceId, { config: newConfig });
        } else { // Adding new widget
            addItem('widget', {
                widgetId: widgetId,
                config: newConfig,
                size: widgetDef.defaultSize
            });
        }
        modals.widgetConfig.style.display = 'none';
    }

    // --- Item Management --- //
    function findNextAvailablePosition(itemWidth = 1, itemHeight = 1) {
        const grid = Array(config.grid.rows).fill(null).map(() => Array(config.grid.cols).fill(false));

        config.items.forEach(item => {
            for (let y = item.pos.y - 1; y < item.pos.y - 1 + item.size.h; y++) {
                for (let x = item.pos.x - 1; x < item.pos.x - 1 + item.size.w; x++) {
                    if (grid[y] && grid[y][x] !== undefined) {
                        grid[y][x] = true;
                    }
                }
            }
        });

        for (let r = 0; r <= config.grid.rows - itemHeight; r++) {
            for (let c = 0; c <= config.grid.cols - itemWidth; c++) {
                let isFree = true;
                for (let h = 0; h < itemHeight; h++) {
                    for (let w = 0; w < itemWidth; w++) {
                        if (grid[r+h][c+w]) {
                            isFree = false;
                            break;
                        }
                    }
                    if(!isFree) break;
                }
                if(isFree) return { x: c + 1, y: r + 1 };
            }
        }
        return null; // No space found
    }

    function addItem(type, data) {
        const newItem = {
            id: `item-${Date.now()}`,
            type,
            pos: {},
            size: type === 'app' ? { w: 1, h: 1 } : data.size,
            ...data
        };

        const position = findNextAvailablePosition(newItem.size.w, newItem.size.h);
        if(!position) {
            alert('No available space on the grid!');
            return;
        }
        newItem.pos = position;

        config.items.push(newItem);
        saveConfig();
        renderAllItems();
        if(isEditMode) toggleEditMode(true); // Re-apply edit mode
    }

    function updateItem(id, data) {
        const itemIndex = config.items.findIndex(i => i.id === id);
        if (itemIndex > -1) {
            config.items[itemIndex] = { ...config.items[itemIndex], ...data };
            saveConfig();
            renderAllItems();
            if(isEditMode) toggleEditMode(true);
        }
    }

    function removeItem(id) {
        config.items = config.items.filter(item => item.id !== id);
        saveConfig();
        renderAllItems();
        if(isEditMode) toggleEditMode(true);
    }

    // --- Edit Mode & Drag/Drop --- //
    function toggleEditMode(forceState) {
        isEditMode = forceState !== undefined ? forceState : !isEditMode;
        gridContainer.classList.toggle('edit-mode', isEditMode);
        document.querySelectorAll('.grid-item').forEach(item => {
            item.draggable = isEditMode;
            item.classList.toggle('edit-mode-item', isEditMode);
        });
    }

    function handleDragStart(e) {
        if (!isEditMode) return;
        const target = e.target.closest('.grid-item');
        if (!target) return;

        e.dataTransfer.effectAllowed = 'move';
        target.classList.add('dragging');
        currentDrag.element = target;
        currentDrag.id = target.dataset.itemId;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        if (!currentDrag.element) return;

        currentDrag.element.classList.remove('dragging');

        const targetCell = e.target.closest('.grid-item');
        if (targetCell && targetCell !== currentDrag.element) {
            // Simple swap logic
            const dragId = currentDrag.id;
            const dropId = targetCell.dataset.itemId;
            const dragItem = config.items.find(i => i.id === dragId);
            const dropItem = config.items.find(i => i.id === dropId);

            if (dragItem.size.w === dropItem.size.w && dragItem.size.h === dropItem.size.h) {
                const tempPos = { ...dragItem.pos };
                dragItem.pos = { ...dropItem.pos };
                dropItem.pos = tempPos;
            } else {
                // More complex logic needed for non-uniform swaps, for now just drop it
                console.warn("Swapping items of different sizes is not yet supported.");
            }

        } else {
            // Drop on empty space
            const rect = gridContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const colWidth = gridContainer.clientWidth / config.grid.cols;
            const rowHeight = gridContainer.clientHeight / config.grid.rows;

            const newCol = Math.floor(x / colWidth) + 1;
            const newRow = Math.floor(y / rowHeight) + 1;

            const item = config.items.find(i => i.id === currentDrag.id);
            // Boundary checks
            if (item) {
                item.pos.x = Math.max(1, Math.min(newCol, config.grid.cols - item.size.w + 1));
                item.pos.y = Math.max(1, Math.min(newRow, config.grid.rows - item.size.h + 1));
            }
        }

        saveConfig();
        renderAllItems();
        toggleEditMode(true); // Keep edit mode on
        currentDrag = { element: null, id: null };
    }

    // --- Widget Gallery --- //
    function populateWidgetGallery(filter = '') {
        const gallery = document.getElementById('widget-gallery');
        gallery.innerHTML = '';
        const filterText = filter.toLowerCase();

        const filteredWidgets = WIDGET_DEFINITIONS.filter(widget =>
            widget.name.toLowerCase().includes(filterText) ||
            widget.category.toLowerCase().includes(filterText)
        );

        filteredWidgets.forEach(widget => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<span>${widget.name}</span>`;
            item.addEventListener('click', () => {
                modals.widget.style.display = 'none';
                openWidgetConfigModal(null, widget.id);
            });
            gallery.appendChild(item);
        });
    }

    function setupAppModal() {
        const categoriesList = document.getElementById('app-categories-list');
        categoriesList.innerHTML = '';
        APP_CATEGORIES.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat.name;
            li.dataset.categoryId = cat.id;
            li.addEventListener('click', () => switchAppCategory(cat));
            categoriesList.appendChild(li);
        });

        // Open "Custom" by default
        switchAppCategory(APP_CATEGORIES[0]);
    }

    function switchAppCategory(category) {
        // Highlight active category in sidebar
        document.querySelectorAll('#app-categories-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.categoryId === category.id);
        });

        const customView = document.getElementById('app-custom-view');
        const galleryView = document.getElementById('app-gallery-view');

        if (category.id === 'custom') {
            customView.style.display = 'block';
            galleryView.style.display = 'none';
        } else {
            customView.style.display = 'none';
            galleryView.style.display = 'block';
            fetchAndDisplayApps(category);
        }
    }

    async function fetchAndDisplayApps(category) {
        const gallery = document.getElementById('app-gallery');
        document.getElementById('app-gallery-title').textContent = category.name;
        gallery.innerHTML = '<em>Loading...</em>';

        try {
            const response = await fetch(category.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apps = await response.json();

            gallery.innerHTML = '';
            apps.forEach(app => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.innerHTML = `<img src="${app.icon}" class="app-icon" style="margin-bottom: 5px;"><span>${app.name}</span>`;
                item.title = app.url;
                item.addEventListener('click', () => {
                    addItem('app', { name: app.name, url: app.url, icon: app.icon });
                    modals.app.style.display = 'none'; // Close modal on add
                });
                gallery.appendChild(item);
            });
        } catch (error) {
            gallery.innerHTML = `<em style="color:#ff3b30;">Failed to load apps. Check repository setup and file paths.</em>`;
            console.error("Error fetching app list:", error);
        }
    }
    // --- Add these three new functions to the end of scripts.js ---

    function handleResizeMouseDown(e, itemId) {
        if (!isEditMode) return;

        e.preventDefault();

        const item = config.items.find(i => i.id === itemId);
        const element = document.getElementById(itemId);

        currentResize = {
            active: true,
            id: itemId,
            element: element,
            startX: e.clientX,
            startY: e.clientY,
            startW: item.size.w,
            startH: item.size.h,
        };

        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp, { once: true });
    }

    function handleResizeMouseMove(e) {
        if (!currentResize.active) return;

        // Calculate grid cell dimensions
        const colWidth = gridContainer.clientWidth / config.grid.cols;
        const rowHeight = gridContainer.clientHeight / config.grid.rows;

        // Calculate mouse delta
        const deltaX = e.clientX - currentResize.startX;
        const deltaY = e.clientY - currentResize.startY;

        // Calculate how many grid units the delta represents
        const colsToAdd = Math.round(deltaX / colWidth);
        const rowsToAdd = Math.round(deltaY / rowHeight);

        let newWidth = currentResize.startW + colsToAdd;
        let newHeight = currentResize.startH + rowsToAdd;

        // Ensure minimum size is 1x1
        if (newWidth < 1) newWidth = 1;
        if (newHeight < 1) newHeight = 1;

        // Apply visual update in real-time
        currentResize.element.style.gridColumnEnd = `span ${newWidth}`;
        currentResize.element.style.gridRowEnd = `span ${newHeight}`;
    }

    function handleResizeMouseUp(e) {
        if (!currentResize.active) return;

        // Same calculation as in mousemove to get the final size
        const colWidth = gridContainer.clientWidth / config.grid.cols;
        const rowHeight = gridContainer.clientHeight / config.grid.rows;
        const deltaX = e.clientX - currentResize.startX;
        const deltaY = e.clientY - currentResize.startY;
        const colsToAdd = Math.round(deltaX / colWidth);
        const rowsToAdd = Math.round(deltaY / rowHeight);

        let newWidth = currentResize.startW + colsToAdd;
        let newHeight = currentResize.startH + rowsToAdd;

        if (newWidth < 1) newWidth = 1;
        if (newHeight < 1) newHeight = 1;

        // Update the config object
        const itemIndex = config.items.findIndex(i => i.id === currentResize.id);
        if(itemIndex > -1) {
            config.items[itemIndex].size.w = newWidth;
            config.items[itemIndex].size.h = newHeight;
            saveConfig();
        }

        // Clean up
        document.removeEventListener('mousemove', handleResizeMouseMove);
        currentResize = { active: false, id: null, element: null };

        // Re-render the grid to make the change permanent
        renderAllItems();
        toggleEditMode(true); // Keep edit mode on
    }

    // --- START THE APP --- //
    init();
});