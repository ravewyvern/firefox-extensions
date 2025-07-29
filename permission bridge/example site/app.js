document.addEventListener('DOMContentLoaded', () => {
    const writeBtn = document.getElementById('write-clipboard-btn');
    const readBtn = document.getElementById('read-clipboard-btn');
    const writeText = document.getElementById('clipboard-write-text');
    const readResult = document.getElementById('clipboard-read-result');
    const actionLog = document.getElementById('action-log');

    function log(message) {
        const timestamp = new Date().toLocaleTimeString();
        actionLog.textContent = `[${timestamp}] ${message}\n` + actionLog.textContent;
    }

    // Check if the bridge API is available
    if (!window.bridge) {
        log('Error: Web Bridge extension not detected or not active.');
        writeBtn.disabled = true;
        readBtn.disabled = true;
        writeBtn.title = "Extension not found";
        readBtn.title = "Extension not found";
        return;
    }

    writeBtn.addEventListener('click', async () => {
        const textToCopy = writeText.value;
        log(`Requesting 'clipboard.write' permission...`);
        try {
            const result = await window.bridge.requestPermission('clipboard.write', { text: textToCopy });
            if (result.granted) {
                log("Success: Permission granted and text copied to clipboard.");
            } else {
                log(`Failure: Permission denied. Reason: ${result.error}`);
            }
        } catch (error) {
            log(`Error: An exception occurred: ${error.message}`);
        }
    });

    readBtn.addEventListener('click', async () => {
        log(`Requesting 'clipboard.read' permission...`);
        try {
            const result = await window.bridge.requestPermission('clipboard.read');
            if (result.granted) {
                log("Success: Permission granted. Reading clipboard...");
                readResult.textContent = result.data;
            } else {
                log(`Failure: Permission denied. Reason: ${result.error}`);
                readResult.textContent = 'Permission was not granted.';
            }
        } catch (error) {
            log(`Error: An exception occurred: ${error.message}`);
        }
    });
});
