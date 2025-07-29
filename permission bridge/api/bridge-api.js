/**
 * This is the client-side API that websites will use.
 * It provides a simple, promise-based function to request permissions.
 * This script is injected into the page by the content script.
 */
(() => {
    if (window.bridge) {
        return; // API already injected
    }

    window.bridge = {
        /**
         * Requests a permission from the extension.
         * @param {string} permission - The name of the permission (e.g., 'clipboard.read').
         * @param {object} [options] - Optional parameters for the permission (e.g., text to write).
         * @returns {Promise<{granted: boolean, data?: any, error?: string}>} A promise that resolves with the result.
         */
        requestPermission: (permission, options = {}) => {
            return new Promise((resolve) => {
                const requestId = `req-${Date.now()}-${Math.random()}`;

                // Listener for the response from the content script
                const responseListener = (event) => {
                    resolve(event.detail);
                };
                window.addEventListener(`bridge-response-${requestId}`, responseListener, { once: true });

                // Dispatch the request event to the content script
                window.dispatchEvent(new CustomEvent('bridge-request-permission', {
                    detail: { permission, options, requestId }
                }));
            });
        }
    };
})();