let versionClicks = 0;
let devMode = false;

document.addEventListener('DOMContentLoaded', () => {
    // Initial data load
    loadDashboardData();

    // Setup navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');

            // Update nav active state
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update content active state
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Setup permission manager view toggle
    document.getElementById('view-toggle').addEventListener('change', (e) => {
        renderPermissionManager(e.target.value);
    });

    // Setup settings save button
    document.getElementById('save-settings').addEventListener('click', saveSettings);

    // Setup about page version click listener
    document.getElementById('version-number').addEventListener('click', handleVersionClick);
});

async function loadDashboardData() {
    const data = await browser.runtime.sendMessage({ type: 'getDashboardData' });

    window.dashboardData = data; // Store data globally for easy access
    devMode = data.settings.devMode;

    renderAuditLog();
    renderPermissionManager('permission'); // Default view
    renderSettings();
    checkDevMode();
}

function renderAuditLog() {
    const logBody = document.getElementById('audit-log-body');
    const log = window.dashboardData.auditLog;
    if (!log || log.length === 0) {
        logBody.innerHTML = '<tr><td colspan="4">No audit log entries found.</td></tr>';
        return;
    }
    logBody.innerHTML = log.map(entry => `
        <tr>
            <td>${new Date(entry.timestamp).toLocaleString()}</td>
            <td>${entry.origin}</td>
            <td>${entry.permission}</td>
            <td>${entry.action}</td>
        </tr>
    `).join('');
}

function renderPermissionManager(view) {
    const contentEl = document.getElementById('permission-manager-content');
    const permissions = window.dashboardData.allPermissions;
    if (!permissions || Object.keys(permissions).length === 0) {
        contentEl.innerHTML = '<p>No permissions have been set for any site.</p>';
        return;
    }

    let html = '';
    if (view === 'permission') {
        const byPermission = {};
        for (const origin in permissions) {
            for (const perm in permissions[origin]) {
                if (!byPermission[perm]) byPermission[perm] = [];
                byPermission[perm].push({ origin, level: permissions[origin][perm] });
            }
        }
        for (const perm in byPermission) {
            html += `<div class="permission-group">
                        <div class="permission-group-header">${perm}</div>
                        ${byPermission[perm].map(p => createPermissionItem(p.origin, perm, p.level)).join('')}
                     </div>`;
        }
    } else { // view by site
        for (const origin in permissions) {
            html += `<div class="permission-group">
                        <div class="permission-group-header">${origin}</div>
                        ${Object.entries(permissions[origin]).map(([perm, level]) => createPermissionItem(origin, perm, level)).join('')}
                     </div>`;
        }
    }
    contentEl.innerHTML = html;
    attachPermissionManagerListeners();
}

function createPermissionItem(origin, permission, level) {
    const levels = ['allow', 'block', 'ask', 'allow-until-reload', 'block-silently'];
    return `
        <div class="permission-item" data-origin="${origin}" data-permission="${permission}">
            <span class="permission-name">${origin} / ${permission}</span>
            <div class="permission-controls">
                <select class="level-select">
                    ${levels.map(l => `<option value="${l}" ${l === level ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
                <button class="remove-btn">Remove</button>
            </div>
        </div>
    `;
}

function attachPermissionManagerListeners() {
    document.querySelectorAll('.level-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const item = e.target.closest('.permission-item');
            const origin = item.dataset.origin;
            const permission = item.dataset.permission;
            const level = e.target.value;
            await browser.runtime.sendMessage({ type: 'updatePermission', payload: { origin, permission, level }});
            loadDashboardData(); // Reload all data to reflect change
        });
    });

    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const item = e.target.closest('.permission-item');
            const origin = item.dataset.origin;
            const permission = item.dataset.permission;
            await browser.runtime.sendMessage({ type: 'removePermission', payload: { origin, permission }});
            loadDashboardData(); // Reload all data to reflect change
        });
    });
}

function renderSettings() {
    const settings = window.dashboardData.settings;
    const cssTextarea = document.getElementById('custom-css');
    cssTextarea.value = settings.customCSS || '';

    // Apply custom CSS if it exists
    if (settings.customCSS) {
        const style = document.createElement('style');
        style.textContent = settings.customCSS;
        document.head.appendChild(style);
    }
}

async function saveSettings() {
    const customCSS = document.getElementById('custom-css').value;
    const newSettings = { ...window.dashboardData.settings, customCSS };

    await browser.runtime.sendMessage({ type: 'updateSettings', payload: newSettings });

    const msg = document.getElementById('settings-saved-msg');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);

    loadDashboardData(); // Reload to apply changes
}

function handleVersionClick() {
    versionClicks++;
    if (versionClicks >= 10) {
        devMode = true;
        checkDevMode();
        // Persist devMode setting
        const newSettings = { ...window.dashboardData.settings, devMode: true };
        browser.runtime.sendMessage({ type: 'updateSettings', payload: newSettings });
        alert('Developer mode unlocked!');
    }
}

function checkDevMode() {
    if (devMode) {
        document.getElementById('dev-options').classList.remove('hidden');
    }
}