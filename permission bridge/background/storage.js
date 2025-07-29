/**
 * A module for managing all interactions with browser.storage.local.
 * This centralizes storage logic and makes it easier to manage the data structure.
 */

// Initialize storage with default values if they don't exist.
browser.runtime.onInstalled.addListener(() => {
    browser.storage.local.get(['permissions', 'auditLog', 'settings']).then(data => {
        if (!data.permissions) {
            browser.storage.local.set({ permissions: {} });
        }
        if (!data.auditLog) {
            browser.storage.local.set({ auditLog: [] });
        }
        if (!data.settings) {
            browser.storage.local.set({ settings: { customCSS: '', devMode: false } });
        }
    });
});

/**
 * Gets the permission level for a specific origin and permission.
 * @param {string} origin - The website origin.
 * @param {string} permission - The permission name.
 * @returns {Promise<string>} The permission level (e.g., 'allow', 'block', 'ask').
 */
export async function getPermission(origin, permission) {
    const { permissions } = await browser.storage.local.get('permissions');
    return permissions[origin]?.[permission] || 'ask';
}

/**
 * Sets the permission level for a specific origin and permission.
 * @param {string} origin - The website origin.
 * @param {string} permission - The permission name.
 * @param {string} level - The permission level to set.
 */
export async function setPermission(origin, permission, level) {
    const { permissions } = await browser.storage.local.get('permissions');
    if (!permissions[origin]) {
        permissions[origin] = {};
    }
    permissions[origin][permission] = level;
    await browser.storage.local.set({ permissions });
}

/**
 * Removes a permission setting for a specific origin and permission.
 * @param {string} origin - The website origin.
 * @param {string} permission - The permission name.
 */
export async function removePermission(origin, permission) {
    const { permissions } = await browser.storage.local.get('permissions');
    if (permissions[origin]?.[permission]) {
        delete permissions[origin][permission];
        if (Object.keys(permissions[origin]).length === 0) {
            delete permissions[origin];
        }
    }
    await browser.storage.local.set({ permissions });
}


/**
 * Retrieves all stored permissions.
 * @returns {Promise<object>} The entire permissions object.
 */
export async function getAllPermissions() {
    const { permissions } = await browser.storage.local.get('permissions');
    return permissions || {};
}

/**
 * Adds an entry to the audit log.
 * @param {string} origin - The website origin.
 * @param {string} permission - The permission name.
 * @param {string} action - The action taken (e.g., 'requested', 'granted').
 */
export async function addAuditLogEntry(origin, permission, action) {
    const { auditLog } = await browser.storage.local.get('auditLog');
    const MAX_LOG_SIZE = 500;

    auditLog.unshift({
        timestamp: new Date().toISOString(),
        origin,
        permission,
        action
    });

    // Keep the log from growing indefinitely
    if (auditLog.length > MAX_LOG_SIZE) {
        auditLog.pop();
    }

    await browser.storage.local.set({ auditLog });
}

/**
 * Retrieves the entire audit log.
 * @returns {Promise<Array>} The audit log array.
 */
export async function getAuditLog() {
    const { auditLog } = await browser.storage.local.get('auditLog');
    return auditLog || [];
}

/**
 * Retrieves the user settings.
 * @returns {Promise<object>} The settings object.
 */
export async function getSettings() {
    const { settings } = await browser.storage.local.get('settings');
    return settings || { customCSS: '', devMode: false };
}

/**
 * Saves the user settings.
 * @param {object} newSettings - The new settings object to save.
 */
export async function setSettings(newSettings) {
    await browser.storage.local.set({ settings: newSettings });
}