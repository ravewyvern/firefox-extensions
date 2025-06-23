document.addEventListener("DOMContentLoaded", () => {
    listTabs();
    if (typeof Sortable !== 'undefined') {
        initializeDragAndDrop();
    } else {
        console.error("SortableJS library not found. Drag-and-drop will be disabled.");
    }
    setupEventListeners();
});

// Refresh the grid when tabs are created, removed, or updated.
browser.tabs.onCreated.addListener(listTabs);
browser.tabs.onRemoved.addListener(listTabs);
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status || changeInfo.url || changeInfo.title || changeInfo.favIconUrl || 'pinned' in changeInfo || 'mutedInfo' in changeInfo || 'discarded' in changeInfo) {
        listTabs();
    }
});


// Map container names to CSS classes for border colors
const CONTAINER_COLOR_MAP = {
    "Personal": "container-personal",
    "Work": "container-work",
    "Banking": "container-banking",
    "Shopping": "container-shopping",
};

/**
 * Main function to query tabs and render the grid.
 */
async function listTabs() {
    try {
        const identityPromise = browser.contextualIdentities ? browser.contextualIdentities.query({}) : Promise.resolve([]);
        const [tabs, identities] = await Promise.all([
            browser.tabs.query({ currentWindow: true, active: false }),
            identityPromise
        ]);

        const identityMap = new Map(identities.map(id => [id.cookieStoreId, id]));

        // Get all the list elements
        const pinnedList = document.getElementById('pinned-list');
        const unpinnedList = document.getElementById('list');
        const divider = document.getElementById('divider');

        // Clear previous content
        pinnedList.textContent = '';
        unpinnedList.textContent = '';

        // Separate tabs into pinned and unpinned arrays
        const pinnedTabs = tabs.filter(t => t.pinned);
        const unpinnedTabs = tabs.filter(t => !t.pinned);

        // Populate the pinned tabs list
        for (const tab of pinnedTabs) {
            pinnedList.appendChild(createTabCard(tab, identityMap));
        }

        // Populate the unpinned tabs list
        for (const tab of unpinnedTabs) {
            unpinnedList.appendChild(createTabCard(tab, identityMap));
        }

        // Show divider only if there are both pinned and unpinned tabs
        if (pinnedTabs.length > 0 && unpinnedTabs.length > 0) {
            divider.classList.remove('hidden');
        } else {
            divider.classList.add('hidden');
        }

    } catch (error) {
        console.error("Error listing tabs:", error);
    }
}

/**
 * Creates a DOM element for a single tab card.
 * @param {object} tab - The tab object from the browser API.
 * @param {Map} identityMap - A map of container identities.
 * @returns {DocumentFragment}
 */
function createTabCard(tab, identityMap) {
    const tpl = document.getElementById('tpl-tab');
    const tplClone = tpl.cloneNode(true);
    const tabCardElement = tplClone.content.querySelector('.tab-card');
    const titleElement = tplClone.content.querySelector('.title');

    // --- CORE TAB INFO ---
    tabCardElement.dataset.tabId = tab.id;
    tabCardElement.setAttribute('id', 'tab-' + tab.id);

    titleElement.textContent = tab.title || tab.url.split('/')[2] || `Tab ID: ${tab.id}`;
    titleElement.style.backgroundImage = `url(${tab.favIconUrl || '../icons/tab.svg'})`;
    titleElement.classList.add("has-favicon");

    tplClone.content.querySelectorAll('.switch-tabs').forEach(el => el.dataset.tabId = tab.id);
    tplClone.content.querySelector('.tab-url').textContent = tab.url ? new URL(tab.url).hostname : 'No URL';
    tplClone.content.querySelector('.last-seen').textContent = new Date(tab.lastAccessed).toLocaleString();

    // --- VISUAL STATUS INDICATORS ---
    updateTabVisuals(tplClone.content, tab, identityMap);

    // --- THUMBNAIL CAPTURE ---
    captureTabThumbnail(tab, tplClone.content.querySelector('.img'));

    return tplClone.content;
}


/**
 * Updates a tab card with status icons (pin, mute) and container colors.
 */
function updateTabVisuals(content, tab, identityMap) {
    const tabCardElement = content.querySelector('.tab-card');
    const statusIconsContainer = content.querySelector('.status-icons');

    // Icon map for containers
    const containerIconMap = {
        Personal: 'fingerprint',
        Work: 'trip',
        Shopping: 'shopping_cart',
        Banking: 'attach_money',
    };

    // 1. Container Visuals (Color and Icon)
    if (identityMap.has(tab.cookieStoreId)) {
        const identity = identityMap.get(tab.cookieStoreId);
        const colorClass = CONTAINER_COLOR_MAP[identity.name] || 'container-default';
        tabCardElement.classList.add(colorClass);

        const iconName = containerIconMap[identity.name] || 'label'; // 'label' as a generic icon
        const containerIcon = document.createElement('span');
        containerIcon.className = 'material-symbols-outlined';
        containerIcon.textContent = iconName;
        statusIconsContainer.appendChild(containerIcon);
    }

    // Pinned Status
    if (tab.pinned) {
        tabCardElement.classList.add('pinned-tab');
        // This part was missing: Create and add the icon element
        const pinIcon = document.createElement('span');
        pinIcon.className = 'material-symbols-outlined';
        pinIcon.textContent = 'push_pin';
        statusIconsContainer.appendChild(pinIcon);
    }

    // --- NEW AUDIO ICON LOGIC ---
    // This if/else-if block ensures only one audio-related icon is shown,
    // with the mute icon taking precedence.

    if (tab.mutedInfo && tab.mutedInfo.muted) {
        // If tab is muted, always show the 'volume_off' icon.
        const muteIcon = document.createElement('span');
        muteIcon.className = 'material-symbols-outlined';
        muteIcon.textContent = 'volume_off';
        statusIconsContainer.appendChild(muteIcon);
    } else if (tab.audible) {
        // If not muted BUT it is audible, show the 'volume_up' icon.
        const audibleIcon = document.createElement('span');
        audibleIcon.className = 'material-symbols-outlined';
        audibleIcon.textContent = 'volume_up';
        statusIconsContainer.appendChild(audibleIcon);
    }

    // Unloaded/Discarded Status
    if (tab.discarded) {
        tabCardElement.classList.add('unloaded-tab');
    }
}


/**
 * Captures a tab thumbnail or applies a fallback color.
 */
function captureTabThumbnail(tab, imgElement) {
    if (tab.discarded || !tab.url || tab.url.startsWith('about:')) {
        imgElement.style.backgroundColor = '#222226';
        imgElement.style.backgroundImage = "none";
        return;
    }
    browser.tabs.captureTab(tab.id, { scale: 0.5 })
        .then(imgUri => {
            imgElement.style.backgroundImage = `url(${imgUri})`;
            imgElement.style.backgroundSize = "cover";
        })
        .catch(error => {
            console.warn(`Failed to capture tab ${tab.id}:`, error);
            imgElement.style.backgroundColor = '#222226';
            imgElement.style.backgroundImage = "none";
        });
}


/**
 * Initializes SortableJS for drag-and-drop reordering between lists.
 */
function initializeDragAndDrop() {
    const pinnedList = document.getElementById('pinned-list');
    const unpinnedList = document.getElementById('list');

    const sharedOptions = {
        group: 'shared-tabs', // A group name that allows dragging between lists
        animation: 150,
        ghostClass: 'sortable-ghost',
        // THIS IS THE CORRECTED LOGIC
        onEnd: async function(evt) {
            const movedTabId = parseInt(evt.item.dataset.tabId, 10);
            if (isNaN(movedTabId)) return;

            // Get the complete and up-to-date list of all tabs in the window
            const allWindowTabs = await browser.tabs.query({ currentWindow: true });
            const movedTabOriginal = allWindowTabs.find(t => t.id === movedTabId);
            if (!movedTabOriginal) return;

            // Find the element the tab was dropped next to, which will be our anchor
            const nextElement = evt.item.nextElementSibling;
            const insertBeforeTabId = nextElement ? parseInt(nextElement.dataset.tabId, 10) : null;

            let targetIndex;

            if (insertBeforeTabId) {
                // If we have an anchor tab, find its real index in the full tab list
                const insertBeforeTab = allWindowTabs.find(t => t.id === insertBeforeTabId);
                targetIndex = insertBeforeTab ? insertBeforeTab.index : -1;
            } else {
                // If there's no next element, the tab was dropped at the end of a list
                if (evt.to === pinnedList) {
                    // Dropped at the end of the pinned list. Target index is the count of pinned tabs.
                    targetIndex = allWindowTabs.filter(t => t.pinned && t.id !== movedTabId).length;
                } else {
                    // Dropped at the end of the unpinned list, so move to the end of the window.
                    targetIndex = -1; // The API interprets -1 as the end
                }
            }
            
            // The `move` API's target index is based on the list *after* the tab is removed.
            // If we move a tab from a low index to a high index, we need to decrement the target
            // to account for the shift.
            if (movedTabOriginal.index < targetIndex) {
                targetIndex--;
            }

            browser.tabs.move(movedTabId, { index: targetIndex });
        },
    };

    // Initialize Sortable for the unpinned list
    new Sortable(unpinnedList, {
        ...sharedOptions,
        onAdd: function (evt) {
            const tabId = parseInt(evt.item.dataset.tabId, 10);
            browser.tabs.update(tabId, { pinned: false });
        },
    });

    // Initialize Sortable for the pinned list
    new Sortable(pinnedList, {
        ...sharedOptions,
        onAdd: function(evt) {
            const tabId = parseInt(evt.item.dataset.tabId, 10);
            browser.tabs.update(tabId, { pinned: true });
        },
    });
}/**
 * Initializes SortableJS for drag-and-drop reordering between lists.
 */
function initializeDragAndDrop() {
    const pinnedList = document.getElementById('pinned-list');
    const unpinnedList = document.getElementById('list');

    const sharedOptions = {
        group: 'shared-tabs', // A group name that allows dragging between lists
        animation: 150,
        ghostClass: 'sortable-ghost',
        // THIS IS THE CORRECTED LOGIC
        onEnd: async function(evt) {
            const movedTabId = parseInt(evt.item.dataset.tabId, 10);
            if (isNaN(movedTabId)) return;

            // Get the complete and up-to-date list of all tabs in the window
            const allWindowTabs = await browser.tabs.query({ currentWindow: true });
            const movedTabOriginal = allWindowTabs.find(t => t.id === movedTabId);
            if (!movedTabOriginal) return;

            // Find the element the tab was dropped next to, which will be our anchor
            const nextElement = evt.item.nextElementSibling;
            const insertBeforeTabId = nextElement ? parseInt(nextElement.dataset.tabId, 10) : null;

            let targetIndex;

            if (insertBeforeTabId) {
                // If we have an anchor tab, find its real index in the full tab list
                const insertBeforeTab = allWindowTabs.find(t => t.id === insertBeforeTabId);
                targetIndex = insertBeforeTab ? insertBeforeTab.index : -1;
            } else {
                // If there's no next element, the tab was dropped at the end of a list
                if (evt.to === pinnedList) {
                    // Dropped at the end of the pinned list. Target index is the count of pinned tabs.
                    targetIndex = allWindowTabs.filter(t => t.pinned && t.id !== movedTabId).length;
                } else {
                    // Dropped at the end of the unpinned list, so move to the end of the window.
                    targetIndex = -1; // The API interprets -1 as the end
                }
            }
            
            // The `move` API's target index is based on the list *after* the tab is removed.
            // If we move a tab from a low index to a high index, we need to decrement the target
            // to account for the shift.
            if (movedTabOriginal.index < targetIndex) {
                targetIndex--;
            }

            browser.tabs.move(movedTabId, { index: targetIndex });
        },
    };

    // Initialize Sortable for the unpinned list
    new Sortable(unpinnedList, {
        ...sharedOptions,
        onAdd: function (evt) {
            const tabId = parseInt(evt.item.dataset.tabId, 10);
            browser.tabs.update(tabId, { pinned: false });
        },
    });

    // Initialize Sortable for the pinned list
    new Sortable(pinnedList, {
        ...sharedOptions,
        onAdd: function(evt) {
            const tabId = parseInt(evt.item.dataset.tabId, 10);
            browser.tabs.update(tabId, { pinned: true });
        },
    });
}

/**
 * Sets up all event listeners for buttons and context menus.
 */
function setupEventListeners() {
    // New Tab button
    document.getElementById('new-tab-btn').addEventListener('click', () => {
        browser.tabs.create({ active: true });
        window.close();
    });

    // Central click handler for tab cards and close buttons
    document.body.addEventListener('click', (e) => {
        const switchLink = e.target.closest('.switch-tabs');
        if (switchLink) {
            e.preventDefault();
            const tabId = parseInt(switchLink.dataset.tabId, 10);
            if (isNaN(tabId)) return;
            handleTabSwitchAnimation(tabId, switchLink);
            return;
        }

        const closeButton = e.target.closest('.close-btn');
        if (closeButton) {
            e.preventDefault();
            const tabCard = closeButton.closest('.tab-card');
            const tabId = parseInt(tabCard.dataset.tabId, 10);
            if (!isNaN(tabId)) {
                browser.tabs.remove(tabId);
            }
        }
    });

    // --- CONTEXT MENU LOGIC ---
    const contextMenu = document.getElementById('context-menu');
    const tabGridContainer = document.querySelector('.container');

    tabGridContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const tabCard = e.target.closest('.tab-card');
        if (!tabCard) return;

        const tabId = parseInt(tabCard.dataset.tabId, 10);
        contextMenu.dataset.activeTabId = tabId;

        browser.tabs.get(tabId).then(tab => {
            // Show/hide based on pinned state
            contextMenu.querySelector('[data-action="pin"]').style.display = tab.pinned ? 'none' : 'flex';
            contextMenu.querySelector('[data-action="unpin"]').style.display = tab.pinned ? 'flex' : 'none';
            // Show/hide based on muted state
            contextMenu.querySelector('[data-action="mute"]').style.display = tab.mutedInfo.muted ? 'none' : 'flex';
            contextMenu.querySelector('[data-action="unmute"]').style.display = tab.mutedInfo.muted ? 'flex' : 'none';
            // Show/hide based on unloaded (discarded) state
            contextMenu.querySelector('[data-action="unload"]').style.display = tab.discarded ? 'none' : 'flex';
        });

        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
    });

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    contextMenu.addEventListener('click', (e) => {
        const action = e.target.closest('.context-menu-item')?.dataset.action;
        if (!action) return;

        const tabId = parseInt(contextMenu.dataset.activeTabId, 10);
        handleContextMenuAction(action, tabId);
    });
}

function handleTabSwitchAnimation(tabId, switchLink) {
    const tabCard = switchLink.closest('.tab-card');
    const thumbnailElement = tabCard ? tabCard.querySelector('.img') : null;
    if (!thumbnailElement) {
        browser.tabs.update(tabId, { active: true }).then(() => window.close());
        return;
    }
    const rect = thumbnailElement.getBoundingClientRect();
    const anim = document.createElement('div');
    anim.className = 'tab-animating';
    document.body.appendChild(anim);
    Object.assign(anim.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: 'transparent'
    });
    const finalizeAnimationSetupAndRun = () => {
        requestAnimationFrame(() => {
            void anim.offsetWidth; // Force reflow
            anim.classList.add('expand-animation');
            anim.addEventListener('transitionend', () => {
                browser.tabs.update(tabId, { active: true });
                anim.remove();
                window.close();
            }, { once: true });
        });
    };
    browser.tabs.get(tabId).then(tabInfo => {
        if (tabInfo.discarded || !tabInfo.url || tabInfo.url.startsWith("about:")) {
            anim.style.backgroundColor = '#222226';
            finalizeAnimationSetupAndRun();
        } else {
            browser.tabs.captureTab(tabId, { scale: 0.5 }).then((imgUri) => {
                if (imgUri) {
                    anim.style.backgroundImage = `url(${imgUri})`;
                    anim.style.backgroundSize = 'cover';
                    anim.style.backgroundPosition = 'center';
                } else {
                    anim.style.backgroundColor = '#222226';
                }
                finalizeAnimationSetupAndRun();
            }).catch(() => {
                anim.style.backgroundColor = '#222226';
                finalizeAnimationSetupAndRun();
            });
        }
    }).catch(() => {
        anim.style.backgroundColor = '#222226';
        finalizeAnimationSetupAndRun();
    });
}

/**
 * Executes the appropriate action from the context menu.
 */
async function handleContextMenuAction(action, tabId) {
    const tab = tabId ? await browser.tabs.get(tabId).catch(() => null) : null;

    switch (action) {
        case 'reload':
            if (tab) browser.tabs.reload(tabId);
            break;
        case 'duplicate':
            if (tab) browser.tabs.duplicate(tabId);
            window.close();
            break;
        case 'new-tab-below':
            if (tab) {
                browser.tabs.create({ index: tab.index + 1 });
                // Close the grid view after creating the tab
                window.close();
            }
            break;
        case 'pin':
            if (tab) browser.tabs.update(tabId, { pinned: true });
            break;
        case 'unpin':
            if (tab) browser.tabs.update(tabId, { pinned: false });
            break;
        case 'mute':
            if (tab) browser.tabs.update(tabId, { muted: true });
            break;
        case 'unmute':
            if (tab) browser.tabs.update(tabId, { muted: false });
            break;
        case 'bookmark':
             if (tab) browser.bookmarks.create({ title: tab.title, url: tab.url });
            break;
        case 'unload':
            if (tab) browser.tabs.discard(tabId);
            break;
        case 'close':
            if (tab) browser.tabs.remove(tabId);
            break;
        case 'close-other':
            const allTabs = await browser.tabs.query({ currentWindow: true });
            // Create a list of tabs to close, excluding the current tab and any pinned tabs.
            const tabsToClose = allTabs.filter(t => t.id !== tabId && !t.pinned).map(t => t.id);
            if (tabsToClose.length > 0) {
                browser.tabs.remove(tabsToClose);
            }
            break;
        case 'close-unused':
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const unusedTabs = await browser.tabs.query({ currentWindow: true, active: false });
            const toClose = unusedTabs.filter(t => t.lastAccessed < thirtyDaysAgo);
            if (toClose.length > 0) {
                browser.tabs.remove(toClose.map(t => t.id));
            } else {
                alert("No inactive tabs older than 30 days found.");
            }
            break;
    }
}

