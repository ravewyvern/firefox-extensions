// --- PRE-BUILT WIDGETS --- //
// This is where you can add more widgets in the future.
const WIDGET_DEFINITIONS = [
    {
        name: 'Digital Clock',
        id: 'digital-clock',
        type: 'html',
        htmlcode: `
                    <style>
                        .clock-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            width: 100%;
                            height: 100%;
                            padding: 10px;
                            box-sizing: border-box;
                            font-family: 'Inter', sans-serif;
                            color: white;
                            text-shadow: 0 0 5px rgba(0,0,0,0.5);
                        }
                        .clock-time {
                            font-size: clamp(2rem, 10vw, 3rem);
                            font-weight: 600;
                        }
                        .clock-date {
                            font-size: clamp(0.8rem, 4vw, 1rem);
                            opacity: 0.8;
                        }
                    </style>
                    <div class="clock-container">
                        <div class="clock-time" id="clock-time-el"></div>
                        <div class="clock-date" id="clock-date-el"></div>
                    </div>
                    <script>
                        (function() {
                            // Use a unique ID based on the container to avoid conflicts
                            const containerId = document.currentScript.parentElement.id;
                            const timeEl = document.querySelector('#' + containerId + ' .clock-time');
                            const dateEl = document.querySelector('#' + containerId + ' .clock-date');

                            if (!timeEl || !dateEl) return;

                            function updateClock() {
                                const now = new Date();
                                timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
                            }

                            const intervalId = setInterval(updateClock, 1000);
                            // Store interval to clear it later if the widget is removed
                            timeEl.closest('.grid-item').dataset.intervalId = intervalId;

                            updateClock();
                        })();
                    <\/script>
                `,
        config: [],
        defaultSize: { w: 2, h: 1 },
        category: 'Utility'
    }
    // Add more widgets here, e.g., weather, notes, etc.
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
        items: []
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

    function applyGridSettings() {
        gridContainer.style.gridTemplateColumns = `repeat(${config.grid.cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${config.grid.rows}, 1fr)`;
        const itemSize = `calc((100vh - 40px - ${(config.grid.rows -1) * 10}px) / ${config.grid.rows})`;
        document.documentElement.style.setProperty('--grid-item-size', itemSize);
    }

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
            itemEl.innerHTML += `
                        <div class="app-content">
                            <img src="${item.icon}" class="app-icon" onerror="this.src='https://placehold.co/64x64/3a3a3c/ffffff?text=X'">
                            <span class="app-name">${item.name}</span>
                        </div>
                    `;
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

                let html = widgetDef.htmlcode;
                // Replace config placeholders, e.g., {{location}}
                if(item.config) {
                    for(const key in item.config) {
                        html = html.replace(new RegExp(`{{${key}}}`, 'g'), item.config[key]);
                    }
                }
                content.innerHTML = html;

                // Execute scripts within the widget
                setTimeout(() => {
                    content.querySelectorAll('script').forEach(script => {
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        itemEl.appendChild(newScript);
                    });
                }, 0);

                itemEl.appendChild(content);

                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                itemEl.appendChild(resizeHandle);
            }
        }

        return itemEl;
    }

    // --- Event Listeners --- //
    function setupEventListeners() {
        // Context Menu
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

        if (id) { // Editing existing app
            const item = config.items.find(i => i.id === id);
            document.getElementById('app-id').value = id;
            document.getElementById('app-name').value = item.name;
            document.getElementById('app-url').value = item.url;
            // Icon logic is complex, simplify for now
            removeBtn.style.display = 'inline-block';
        } else { // Adding new app
            document.getElementById('app-id').value = '';
            removeBtn.style.display = 'none';
        }
        openModal(modals.app);
    }

    function openWidgetModal() {
        openModal(modals.widget);
    }

    function openWidgetConfigModal(instanceId, widgetId) {
        const item = config.items.find(i => i.id === instanceId);
        const widgetDef = WIDGET_DEFINITIONS.find(w => w.id === (item ? item.widgetId : widgetId));

        if (!widgetDef) return;

        const form = document.getElementById('widget-config-form');
        form.innerHTML = '';

        document.getElementById('widget-config-title').textContent = `Configure ${widgetDef.name}`;

        if (widgetDef.config.length === 0) {
            addItem('widget', { widgetId: widgetDef.id, size: widgetDef.defaultSize });
            return; // No config needed, just add it.
        }

        let fields = '';
        widgetDef.config.forEach(field => {
            fields += `<div class="form-group">
                        <label for="config-${field.name}">${field.label}</label>
                        <input type="text" id="config-${field.name}" name="${field.name}" value="${item?.config?.[field.name] || ''}" required>
                    </div>`;
        });

        fields += `<input type="hidden" name="instanceId" value="${instanceId || ''}">`;
        fields += `<input type="hidden" name="widgetId" value="${widgetDef.id}">`;
        fields += `<button type="submit" class="btn btn-primary">Save Widget</button>`;

        form.innerHTML = fields;

        form.onsubmit = handleWidgetConfigSave;
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

    function handleWidgetConfigSave(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const { instanceId, widgetId, ...widgetConfig } = data;

        const widgetDef = WIDGET_DEFINITIONS.find(w => w.id === widgetId);

        if(instanceId) { // Editing
            updateItem(instanceId, { config: widgetConfig });
        } else { // Adding
            addItem('widget', {
                widgetId: widgetId,
                config: widgetConfig,
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
    function populateWidgetGallery() {
        const gallery = document.getElementById('widget-gallery');
        gallery.innerHTML = '';
        WIDGET_DEFINITIONS.forEach(widget => {
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

    // --- START THE APP --- //
    init();
});