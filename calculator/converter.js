// This object will be accessible by script.js to pass values
const converter = {
    input: null,
    quantitySelect: null,
    fromUnitSelect: null,
    resultsList: null,
    currentValue: 1,

    // --- Unit Data ---
    // Base unit for each category is the one with a factor of 1
    units: {
        Length: {
            Meters: 1,
            Kilometers: 1000,
            Centimeters: 0.01,
            Millimeters: 0.001,
            Miles: 1609.34,
            Yards: 0.9144,
            Feet: 0.3048,
            Inches: 0.0254,
        },
        Mass: {
            Grams: 1,
            Kilograms: 1000,
            Milligrams: 0.001,
            Pounds: 453.592,
            Ounces: 28.3495,
        },
        Time: {
            Seconds: 1,
            Minutes: 60,
            Hours: 3600,
            Days: 86400,
        },
        Storage: {
            Bytes: 1,
            Kilobytes: 1024,
            Megabytes: 1048576,
            Gigabytes: 1073741824,
        }
    },

    /**
     * Initializes the converter, sets up DOM elements and event listeners.
     */
    init: function() {
        this.input = document.getElementById('converter-input');
        this.quantitySelect = document.getElementById('quantity-select');
        this.fromUnitSelect = document.getElementById('from-unit-select');
        this.resultsList = document.getElementById('converter-results');

        this.populateQuantitySelect();
        this.updateFromUnitSelect();
        this.recalculate();

        this.quantitySelect.addEventListener('change', () => {
            this.updateFromUnitSelect();
            this.recalculate();
        });
        this.fromUnitSelect.addEventListener('change', () => this.recalculate());
        this.input.addEventListener('input', () => this.recalculate());
    },

    /**
     * Sets the value in the converter's input field.
     * Called from script.js when switching views.
     * @param {number} value The value from the calculator.
     */
    setValue: function(value) {
        this.currentValue = parseFloat(value) || 0;
        if (this.input) {
            this.input.value = this.currentValue;
            this.recalculate();
        }
    },

    /**
     * Populates the quantity dropdown with categories from the units data.
     */
    populateQuantitySelect: function() {
        if (!this.quantitySelect) return;
        this.quantitySelect.innerHTML = '';
        for (const quantity in this.units) {
            const option = document.createElement('option');
            option.value = quantity;
            option.textContent = quantity;
            this.quantitySelect.appendChild(option);
        }
    },

    /**
     * Updates the 'from' unit dropdown based on the selected quantity.
     */
    updateFromUnitSelect: function() {
        if (!this.fromUnitSelect) return;
        this.fromUnitSelect.innerHTML = '';
        const selectedQuantity = this.quantitySelect.value;
        const units = this.units[selectedQuantity];
        for (const unit in units) {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            this.fromUnitSelect.appendChild(option);
        }
    },

    /**
     * Core function to perform the conversion and update the results list.
     */
    recalculate: function() {
        if (!this.resultsList || !this.input) return;
        this.resultsList.innerHTML = '';
        const inputValue = parseFloat(this.input.value) || 0;
        const selectedQuantity = this.quantitySelect.value;
        const fromUnit = this.fromUnitSelect.value;

        if (!selectedQuantity || !fromUnit) return;

        const allUnits = this.units[selectedQuantity];
        const fromUnitFactor = allUnits[fromUnit];
        const valueInBaseUnit = inputValue * fromUnitFactor;

        for (const unit in allUnits) {
            const toUnitFactor = allUnits[unit];
            const resultValue = valueInBaseUnit / toUnitFactor;

            const li = document.createElement('li');
            const formattedResult = parseFloat(resultValue.toPrecision(9)).toString();

            li.innerHTML = `
                <div class="result-text">
                    <span class="result-value">${formattedResult}</span>
                    <span class="result-unit">${unit}</span>
                </div>
                <button class="copy-btn" data-value="${formattedResult}">Copy</button>
            `;
            this.resultsList.appendChild(li);
        }
    }
};

// Initialize the converter when the DOM is ready.
document.addEventListener('DOMContentLoaded', () => converter.init());

// Add event delegation for copy buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
        const valueToCopy = e.target.dataset.value;
        // Use the clipboard API
        navigator.clipboard.writeText(valueToCopy).then(() => {
            e.target.textContent = 'Copied!';
            setTimeout(() => {
                e.target.textContent = 'Copy';
            }, 1000);
        });
    }
});
