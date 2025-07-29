
/**
 * This script is injected into every webpage.
 * Its primary jobs are:
 * 1. Inject the website-facing API (`bridge-api.js`) into the page&#39;s context.
 * 2. Listen for custom events dispatched by the API.
 * 3. Forward those requests to the background script.
 * 4. Listen for responses from the background script.
 * 5. Dispatch a custom event back to the page with the result.
 */

// Inject the API script into the page's context so website's JS can use it.
const script = document.createElement('script');
script.src = browser.runtime.getURL('api/bridge-api.js');
(document.head || document.documentElement).appendChild(script);

// Listen for requests from the webpage
window.addEventListener('bridge-request-permission', async (event) => {
const { permission, options, requestId } = event.detail;

try {
// Forward the request to the background script
    const response = await browser.runtime.sendMessage({
        type: 'requestPermission',
        payload: { permission, options }
    });
// --- THE FIX IS HERE ---
// Use cloneInto to safely pass the response object to the page's scope.
// This creates a "clean" version of the object that the webpage can access
// without security restrictions from Xray Vision.
window.dispatchEvent(new CustomEvent(`bridge-response-${requestId}`, {
    detail: cloneInto(response, window, { cloneFunctions: true })
}));

} catch (error) {
    console.error('Web Bridge Error:', error);
    const errorResponse = { granted: false, error: error.message };
// Also apply cloneInto for error responses for consistency
window.dispatchEvent(new CustomEvent(`bridge-response-${requestId}`, {
    detail: cloneInto(errorResponse, window, { cloneFunctions: true })
}));
}
});
