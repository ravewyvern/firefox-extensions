/**
 * This file handles the logic for the scientific calculator mode.
 * It is designed to work with the main script.js file.
 */
const scientific = {
    /**
     * An object containing the scientific functions.
     * The key is the function name (as used in the expression)
     * and the value is the corresponding Math object method.
     */
    functions: {
        'sin': Math.sin,
        'cos': Math.cos,
        'tan': Math.tan,
        'log': Math.log10, // Base-10 logarithm
        'ln': Math.log,    // Natural logarithm
    },

    /**
     * An object for constants.
     */
    constants: {
        'e': Math.E,
        'π': Math.PI,
    },

    /**
     * Initializes the scientific calculator buttons.
     * It adds a click listener to the container, delegating to the buttons.
     * @param {function} handleInput - The main input handler from script.js
     */
    init: function(handleInput) {
        const container = document.getElementById('scientific-buttons');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button) {
                const value = button.dataset.value;

                // For functions, append with an opening parenthesis
                if (this.functions[value]) {
                    handleInput(value + '(');
                }
                // For constants, just pass the value
                else if (this.constants[value]) {
                    handleInput(value);
                }
            }
        });
    }
};
