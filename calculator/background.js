/**
 * This script runs in the background and listens for the extension icon to be clicked.
 */

// A function to handle the creation of the calculator window.
function openCalculatorWindow() {
    // Define the properties of the new window.
    const windowOptions = {
        url: "popup.html", // The HTML file to load in the new window.
        type: "popup",     // Creates a simple window without browser UI like tabs or the address bar.
        width: 340,        // Set a width for the window.
        height: 520,       // Set a height for the window.
    };

    // Create the new window with the specified options.
    browser.windows.create(windowOptions);
}

// Add a listener to the extension's action (the toolbar icon).
// When the icon is clicked, it will execute the openCalculatorWindow function.
browser.action.onClicked.addListener(openCalculatorWindow);
