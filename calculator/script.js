document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    const equationDisplay = document.getElementById('equation-display');
    const resultDisplay = document.getElementById('result-display');
    const buttonsContainer = document.querySelector('.calculator-body');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyList = document.getElementById('history-list');
    const viewSwitcher = document.querySelector('.view-switcher');
    const settingsToggles = document.querySelectorAll('.toggle-switch input');

    // --- State Variables ---
    let currentEquation = '';
    let history = [];
    let parenthesesOpen = 0;

    // --- Calculation Engine ---

    const factorial = (n) => {
        if (n < 0 || n % 1 !== 0) return NaN;
        if (n === 0) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    };

    /**
     * A more robust implementation of the Shunting-yard algorithm and RPN evaluation.
     * This version correctly handles operator precedence, associativity, and functions.
     * @param {string} infix The mathematical expression to evaluate.
     * @returns {number} The result of the calculation.
     */
    const evaluateExpression = (infix) => {
        const precedence = { '+': 1, '-': 1, '×': 2, '÷': 2, '^': 3 };
        const associativity = { '^': 'Right' }; // All others are Left by default
        const output = [];
        const operators = [];

        // Improved tokenizer to correctly identify all parts of the expression
        const tokens = infix.match(/sin|cos|tan|log|ln|√|π|!|%|e|\d+(\.\d+)?|[+\-×÷\^\(\)]/g) || [];

        tokens.forEach(token => {
            if (!isNaN(parseFloat(token))) { // is a number
                output.push(parseFloat(token));
            } else if (scientific.constants[token]) { // is a constant like π or e
                output.push(scientific.constants[token]);
            } else if (scientific.functions[token] || token === '√') { // is a function
                operators.push(token);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                if (operators[operators.length - 1] === '(') operators.pop(); // Pop the '('

                const lastOp = operators[operators.length - 1];
                if (scientific.functions[lastOp] || lastOp === '√') {
                    output.push(operators.pop());
                }
            } else { // is an operator
                const op1 = token;
                while (
                    operators.length && operators[operators.length - 1] !== '('
                    ) {
                    const op2 = operators[operators.length - 1];
                    if (
                        (associativity[op1] !== 'Right' && precedence[op1] <= precedence[op2]) ||
                        (associativity[op1] === 'Right' && precedence[op1] < precedence[op2])
                    ) {
                        output.push(operators.pop());
                    } else {
                        break;
                    }
                }
                operators.push(op1);
            }
        });

        while (operators.length) {
            output.push(operators.pop());
        }

        // --- RPN Evaluation ---
        const stack = [];
        output.forEach(token => {
            if (typeof token === 'number') {
                stack.push(token);
            } else if (scientific.functions[token] || token === '√' || token === '!' || token === '%') {
                if (stack.length < 1) throw new Error("Syntax Error");
                const a = stack.pop();
                if (scientific.functions[token]) stack.push(scientific.functions[token](a));
                else if (token === '√') stack.push(Math.sqrt(a));
                else if (token === '!') stack.push(factorial(a));
                else if (token === '%') stack.push(a / 100);
            } else {
                if (stack.length < 2) throw new Error("Syntax Error");
                const b = stack.pop();
                const a = stack.pop();
                switch (token) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '×': stack.push(a * b); break;
                    case '÷': stack.push(a / b); break;
                    case '^': stack.push(Math.pow(a, b)); break;
                }
            }
        });

        if (stack.length !== 1) throw new Error("Syntax Error");
        return stack[0];
    };

    // --- Display and Input Functions ---

    const formatResult = (num) => parseFloat(num.toPrecision(12)).toString();

    const updateLiveResult = () => {
        if (!currentEquation) {
            resultDisplay.textContent = '';
            return;
        }
        try {
            const lastChar = currentEquation.slice(-1);
            if (/[+\-×÷\^\(]$/.test(lastChar)) {
                resultDisplay.textContent = '';
                return;
            }
            const result = evaluateExpression(currentEquation);
            if (!isNaN(result) && isFinite(result)) {
                resultDisplay.textContent = result.toLocaleString('en-US', { maximumFractionDigits: 10 });
            } else {
                resultDisplay.textContent = '';
            }
        } catch (e) {
            resultDisplay.textContent = '';
        }
    };

    const calculateFinalResult = () => {
        if (!currentEquation) return;
        try {
            const result = evaluateExpression(currentEquation);
            if (isNaN(result) || !isFinite(result)) throw new Error("Invalid");
            const formattedResult = formatResult(result);
            addToHistory(currentEquation, formattedResult);
            currentEquation = formattedResult;
            equationDisplay.value = currentEquation;
            resultDisplay.textContent = '';
            parenthesesOpen = 0;
        } catch (error) {
            equationDisplay.value = 'Error';
            currentEquation = '';
            parenthesesOpen = 0;
        }
    };

    const handleInput = (value) => {
        if (equationDisplay.value === 'Error') currentEquation = '';

        if (value.endsWith('(')) {
            currentEquation += value;
            parenthesesOpen++;
        } else {
            switch (value) {
                case 'C': currentEquation = ''; parenthesesOpen = 0; break;
                case '=': case 'Enter': calculateFinalResult(); return;
                case 'Backspace':
                    if (currentEquation.slice(-1) === '(') parenthesesOpen--;
                    if (currentEquation.slice(-1) === ')') parenthesesOpen++;
                    currentEquation = currentEquation.slice(0, -1);
                    break;
                case '()':
                    const lastChar = currentEquation.slice(-1);
                    if (parenthesesOpen > 0 && (lastChar === '(' || !isNaN(parseInt(lastChar)))) {
                        currentEquation += ')';
                        parenthesesOpen--;
                    } else {
                        currentEquation += '(';
                        parenthesesOpen++;
                    }
                    break;
                case 'sqrt': currentEquation += '√('; parenthesesOpen++; break;
                default: currentEquation += value.replace('*', '×').replace('/', '÷');
            }
        }
        equationDisplay.value = currentEquation;
        updateLiveResult();
    };

    // --- View & Settings Management ---
    const applySettings = (settings) => {
        settingsToggles.forEach(toggle => {
            const viewName = toggle.dataset.view;
            const isVisible = settings[viewName] !== false; // default to true
            toggle.checked = isVisible;
            document.querySelector(`.nav-btn[data-view="${viewName}"]`).style.display = isVisible ? 'flex' : 'none';
        });
    };


    // Corrected settings listener
    settingsToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const currentSettings = {};
            settingsToggles.forEach(t => {
                currentSettings[t.dataset.view] = t.checked;
            });

            browser.storage.local.set({ calculatorSettings: currentSettings });
            applySettings(currentSettings);

            const activeNav = document.querySelector('.nav-btn.active');
            if (activeNav && activeNav.style.display === 'none') {
                viewSwitcher.querySelector('[data-view="calculator"]').click();
            }
        });
    });

    viewSwitcher.addEventListener('click', (e) => {
        const button = e.target.closest('.nav-btn');
        if (!button) return;
        const viewToShow = button.dataset.view;

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${viewToShow}-view`).classList.add('active');

        if (viewToShow === 'converter') {
            const valueToPass = resultDisplay.textContent.replace(/,/g, '') || equationDisplay.value || 1;
            converter.setValue(valueToPass);
        }
    });

    // --- History Management ---
    const renderHistory = () => {
        if (!historyList) return;
        historyList.innerHTML = '';
        history.slice().reverse().forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="history-equation">${item.equation}</span><span class="history-result">${item.result}</span>`;
            li.addEventListener('click', () => {
                currentEquation = item.result;
                equationDisplay.value = currentEquation;
                updateLiveResult();
                viewSwitcher.querySelector('[data-view="calculator"]').click();
            });
            historyList.appendChild(li);
        });
    };
    const addToHistory = (equation, result) => {
        history.push({ equation, result });
        if (history.length > 50) history.shift();
        saveHistory();
        renderHistory();
    };
    const saveHistory = () => browser.storage.local.set({ calculatorHistory: history });
    const loadHistory = () => {
        browser.storage.local.get('calculatorHistory').then(data => {
            if (data.calculatorHistory) {
                history = data.calculatorHistory;
                renderHistory();
            }
        });
    };
    const clearHistory = () => {
        history = [];
        saveHistory();
        renderHistory();
    };

    // --- Event Listeners ---
    buttonsContainer.addEventListener('click', (e) => {
        if (e.target.closest('button')) handleInput(e.target.closest('button').dataset.value);
    });
    document.addEventListener('keydown', (e) => {
        e.preventDefault();
        const key = e.key;
        if ('0123456789./*-+^%'.includes(key)) handleInput(key);
        else if (key === 'Enter' || key === '=') handleInput('Enter');
        else if (key === 'Backspace') handleInput('Backspace');
        else if (key.toLowerCase() === 'c') handleInput('C');
        else if (key === '(' || key === ')') handleInput('()');
    });
    if(clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

    // --- Theme Color Management ---
    const themeColorPicker = document.getElementById('theme-color-picker');

// Convert hex to HSL
    const hexToHSL = (hex) => {
        // Remove the # if present
        hex = hex.replace(/^#/, '');

        // Parse the hex values
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    };

// Convert HSL to hex
    const hslToHex = (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

// Generate a Material You palette from a base color
    const generateMaterialPalette = (baseColor) => {
        const hsl = hexToHSL(baseColor);

        return {
            primary: hslToHex(hsl.h, hsl.s, 80), // Light primary for accents
            secondary: hslToHex((hsl.h + 60) % 360, hsl.s - 10, 75), // Complementary hue
            action: hslToHex((hsl.h + 180) % 360, hsl.s, 75), // Opposite hue
            surface: hslToHex(hsl.h, hsl.s * 0.2, 15), // Dark surface with a hint of color
            btnNumber: hslToHex(hsl.h, hsl.s * 0.3, 23), // Slightly lighter than surface
            btnOperator: hslToHex(hsl.h, hsl.s * 0.25, 18) // Between surface and btnNumber
        };
    };

// Apply the generated palette to CSS variables
    const applyColorTheme = (colorHex) => {
        const palette = generateMaterialPalette(colorHex);

        document.documentElement.style.setProperty('--primary-accent', palette.primary);
        document.documentElement.style.setProperty('--secondary-accent', palette.secondary);
        document.documentElement.style.setProperty('--action-accent', palette.action);
        document.documentElement.style.setProperty('--surface-color', palette.surface);
        document.documentElement.style.setProperty('--btn-bg-number', palette.btnNumber);
        document.documentElement.style.setProperty('--btn-bg-operator', palette.btnOperator);
    };

// Save the selected color to storage
    const saveColorTheme = (color) => {
        browser.storage.local.get('calculatorSettings').then(data => {
            const settings = data.calculatorSettings || {};
            settings.themeColor = color;
            browser.storage.local.set({ calculatorSettings: settings });
        });
    };

// Update the loadSettings function to handle the theme color
    const loadSettings = () => {
        browser.storage.local.get('calculatorSettings').then(data => {
            const settings = data.calculatorSettings || {};
            applySettings(settings);

            // Apply saved theme color if available
            if (settings.themeColor) {
                themeColorPicker.value = settings.themeColor;
                applyColorTheme(settings.themeColor);
            }
        });
    };

// Add event listener for color picker
    if (themeColorPicker) {
        themeColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            applyColorTheme(color);
        });

        themeColorPicker.addEventListener('change', (e) => {
            const color = e.target.value;
            saveColorTheme(color);
        });
    }

    // --- Initialization ---
    loadHistory();
    loadSettings();
    scientific.init(handleInput);
});

