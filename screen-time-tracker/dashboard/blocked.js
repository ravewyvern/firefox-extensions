document.addEventListener('DOMContentLoaded', () => {
    // URL parameters provide the info we need, e.g., ?url=youtube.com&reason=limit
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    const reason = params.get('reason');
    const blockEnds = params.get('blockEnds');
    
    // Update the page title and favicon
    document.title = `Blocked: ${url}`;
    document.getElementById('favicon').src = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;
    
    const messageEl = document.getElementById('block-message');
    const subtextEl = document.getElementById('block-subtext');

    if (reason === 'limit') {
        messageEl.textContent = `You've reached your time limit on ${url}.`;
        subtextEl.textContent = "This site will be available again tomorrow. Great job focusing!";
    } else if (reason === 'manual') {
        messageEl.textContent = `${url} is currently blocked.`;
        const time = new Date(parseInt(blockEnds)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        subtextEl.textContent = `It will be available again after ${time}.`;
    }

    document.getElementById('dashboard-button').addEventListener('click', () => {
        // We can't use relative paths here, so we get the full URL
        window.location.href = browser.runtime.getURL("dashboard/tracker.html");
    });
});
