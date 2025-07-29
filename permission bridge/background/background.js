/**
 * The main service worker for the extension.
 * It acts as the central hub for all logic, including:
 * - Listening for permission requests from content scripts.
 * - Checking stored permissions.
 * - Opening the permission prompt UI when necessary.
 * - Executing permissions when granted.
 * - Managing communication between all parts of the extension.
 */
import * as storage from './storage.js';
import * as permissions from './permissions.js';

// A map to hold the resolve/reject functions for pending permission requests.
const pendingRequests = new Map();

// Listen for messages from content scripts or other extension pages.
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'requestPermission') {
        handlePermissionRequest(message.payload, sender)
            .then(sendResponse)
            .catch(error => sendResponse({ granted: false, error: error.message }));
        return true; // Indicates that the response will be sent asynchronously.
    } else if (message.type === 'promptDecision') {
        handlePromptDecision(message.payload);
    } else if (message.type === 'getDashboardData') {
        // Provide all necessary data for the dashboard
        Promise.all([
            storage.getAuditLog(),
            storage.getAllPermissions(),
            storage.getSettings()
        ]).then(([auditLog, allPermissions, settings]) => {
            sendResponse({ auditLog, allPermissions, settings });
        });
        return true;
    } else if (message.type === 'updatePermission') {
        storage.setPermission(message.payload.origin, message.payload.permission, message.payload.level)
            .then(() => sendResponse({success: true}));
        return true;
    } else if (message.type === 'removePermission') {
        storage.removePermission(message.payload.origin, message.payload.permission)
            .then(() => sendResponse({success: true}));
        return true;
    } else if (message.type === 'updateSettings') {
        storage.setSettings(message.payload).then(() => sendResponse({success: true}));
        return true;
    }
});

/**
 * Handles an incoming permission request from a content script.
 * @param {object} payload - The request details { permission, options }.
 * @param {object} sender - The sender of the message, contains tab info.
 */
async function handlePermissionRequest(payload, sender) {
    const { permission, options } = payload;
    const origin = new URL(sender.tab.url).origin;
    const permissionInfo = permissions.getPermissionInfo(permission);

    if (!permissionInfo) {
        throw new Error(`Permission '${permission}' is not defined.`);
    }

    const currentLevel = await storage.getPermission(origin, permission);
    await storage.addAuditLogEntry(origin, permission, 'requested');

    switch (currentLevel) {
        case 'allow':
            await storage.addAuditLogEntry(origin, permission, 'granted (automatic)');
            return executePermission(permission, options);
        case 'block':
            await storage.addAuditLogEntry(origin, permission, 'denied (blocked)');
            return { granted: false, error: 'Permission blocked by user settings.' };
        case 'block-silently':
            await storage.addAuditLogEntry(origin, permission, 'denied (silently blocked)');
            // Pretend to the site that it worked, but do nothing. Return a fake error.
            return { granted: false, error: 'Simulated failure: The operation could not be completed.' };
        case 'allow-until-reload':
            await storage.addAuditLogEntry(origin, permission, 'granted (session)');
            return executePermission(permission, options);
        case 'ask':
        default:
            // No decision has been made, so we must ask the user.
            return promptUser(origin, permission, options);
    }
}

/**
 * Executes the requested permission's action.
 * @param {string} permission - The name of the permission to execute.
 * @param {object} options - The options for the permission.
 */
async function executePermission(permission, options) {
    try {
        switch (permission) {
            case 'clipboard.read':
                const text = await navigator.clipboard.readText();
                return { granted: true, data: text };
            case 'clipboard.write':
                await navigator.clipboard.writeText(options.text);
                return { granted: true };
            default:
                throw new Error('Unknown permission for execution.');
        }
    } catch (e) {
        console.error("Permission execution error:", e);
        return { granted: false, error: `Failed to execute permission: ${e.message}` };
    }
}

/**
 * Creates a popup window to ask the user for a permission decision.
 * @param {string} origin - The origin of the requesting website.
 * @param {string} permission - The permission being requested.
 * @param {object} options - The options for the permission.
 */
function promptUser(origin, permission, options) {
    return new Promise(async (resolve, reject) => {
        const requestId = `${origin}-${permission}-${Date.now()}`;
        pendingRequests.set(requestId, { resolve, reject, permission, options });

        const permissionInfo = permissions.getPermissionInfo(permission);

        const promptUrl = new URL(browser.runtime.getURL('prompt/prompt.html'));
        promptUrl.searchParams.set('requestId', requestId);
        promptUrl.searchParams.set('origin', origin);
        promptUrl.searchParams.set('permission', permission);
        promptUrl.searchParams.set('description', permissionInfo.description);

        await browser.windows.create({
            url: promptUrl.href,
            type: 'popup',
            width: 400,
            height: 250,
        });
    });
}

/**
 * Handles the decision received from the permission prompt UI.
 * @param {object} payload - The decision details from the prompt.
 */
async function handlePromptDecision(payload) {
    const { requestId, decision, origin, permission } = payload;
    const request = pendingRequests.get(requestId);

    if (!request) {
        console.error('Received decision for an unknown request:', requestId);
        return;
    }

    // Store the user's permanent choice, unless it's a temporary one.
    if (decision !== 'allow-this-time') {
        await storage.setPermission(origin, permission, decision);
    }

    // Decide whether to grant the permission for the current request.
    const isGranted = (decision === 'allow' || decision === 'allow-until-reload' || decision === 'allow-this-time');

    if (isGranted) {
        await storage.addAuditLogEntry(origin, permission, `granted (${decision})`);
        const result = await executePermission(request.permission, request.options);
        request.resolve(result);
    } else {
        await storage.addAuditLogEntry(origin, permission, `denied (${decision})`);
        request.resolve({ granted: false, error: 'Permission denied by user.' });
    }

    pendingRequests.delete(requestId);
}