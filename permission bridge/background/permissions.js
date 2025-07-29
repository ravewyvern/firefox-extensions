/**
 * Defines the permissions that the extension can manage.
 * This makes it easy to add new permissions in the future.
 * Each permission has a name, a user-friendly description, and a risk level.
 */
const PERMISSIONS = {
    'clipboard.read': {
        name: 'Read from Clipboard',
        description: 'Allow this site to read the contents of your clipboard.',
        risk: 'medium'
    },
    'clipboard.write': {
        name: 'Write to Clipboard',
        description: 'Allow this site to write text to your clipboard.',
        risk: 'low'
    }
    // Future permissions like 'fs.read' or 'network.local' would be added here.
};

export function getPermissionInfo(permissionName) {
    return PERMISSIONS[permissionName];
}

export function getAllPermissionInfo() {
    return PERMISSIONS;
}