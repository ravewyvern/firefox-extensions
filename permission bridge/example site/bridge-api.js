// bridge-api.js
// This file is identical to the one in the extension's 'api' folder.
// For a real-world deployment, a website would typically load this script
// directly from their own server. For this example, we include it here
// to simulate a website that has the API script ready.
(() => {
    if (window.bridge) {
        return;
    }
    window.bridge = {
        requestPermission: (permission, options = {}) => {
            return new Promise((resolve) => {
                const requestId = `req-${Date.now()}-${Math.random()}`;
                const responseListener = (event) => {
                    resolve(event.detail);
                };
                window.addEventListener(`bridge-response-${requestId}`, responseListener, { once: true });
                window.dispatchEvent(new CustomEvent('bridge-request-permission', {
                    detail: { permission, options, requestId }
                }));
            });
        }
    };
})();