document.addEventListener('DOMContentLoaded', async () => {
    const originEl = document.getElementById('origin');
    const listEl = document.getElementById('permission-list');
    const dashboardButton = document.getElementById('dashboard-button');

    // Get the current tab to find its origin
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const origin = new URL(tab.url).origin;
    originEl.textContent = origin;

    // Get all permissions from storage
    const { permissions } = await browser.storage.local.get('permissions');
    const sitePermissions = permissions?.[origin] || {};

    // Display the permissions for the current site
    if (Object.keys(sitePermissions).length > 0) {
        listEl.innerHTML = '';
        for (const [permission, level] of Object.entries(sitePermissions)) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${permission}:</strong> <span class="level-${level.split('-')[0]}">${level}</span>`;
            listEl.appendChild(li);
        }
    }

    // Open the dashboard when the button is clicked
    dashboardButton.addEventListener('click', () => {
        browser.tabs.create({ url: browser.runtime.getURL('dashboard/dashboard.html') });
        window.close();
    });
});