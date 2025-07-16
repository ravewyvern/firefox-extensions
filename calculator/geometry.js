const geometry = {
    // --- DOM Elements ---
    inputs: {},
    outputs: {},

    /**
     * Finds and stores all necessary DOM elements and attaches event listeners.
     */
    init: function() {
        this.inputs.x1 = document.getElementById('x1');
        this.inputs.y1 = document.getElementById('y1');
        this.inputs.x2 = document.getElementById('x2');
        this.inputs.y2 = document.getElementById('y2');

        this.outputs.distance = document.getElementById('geo-distance');
        this.outputs.midpoint = document.getElementById('geo-midpoint');
        this.outputs.equation = document.getElementById('geo-equation');

        // Attach a single listener to all inputs
        for (const key in this.inputs) {
            if (this.inputs[key]) {
                this.inputs[key].addEventListener('input', () => this.updateCalculations());
            }
        }

        // Initial calculation
        this.updateCalculations();
    },

    /**
     * Reads values, performs all calculations, and updates the display.
     */
    updateCalculations: function() {
        const p1 = { x: parseFloat(this.inputs.x1.value), y: parseFloat(this.inputs.y1.value) };
        const p2 = { x: parseFloat(this.inputs.x2.value), y: parseFloat(this.inputs.y2.value) };

        // Ensure we have valid numbers before calculating
        if (Object.values(p1).some(isNaN) || Object.values(p2).some(isNaN)) {
            this.clearOutputs();
            return;
        }

        this.calculateDistance(p1, p2);
        this.calculateMidpoint(p1, p2);
        this.calculateEquation(p1, p2);
    },

    clearOutputs: function() {
        for (const key in this.outputs) {
            if (this.outputs[key]) this.outputs[key].textContent = '...';
        }
    },

    calculateDistance: function(p1, p2) {
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        this.outputs.distance.textContent = dist.toLocaleString(undefined, { maximumFractionDigits: 4 });
    },

    calculateMidpoint: function(p1, p2) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        this.outputs.midpoint.textContent = `(${midX.toLocaleString()}, ${midY.toLocaleString()})`;
    },

    calculateEquation: function(p1, p2) {
        if (p1.x === p2.x) { // Vertical line
            this.outputs.equation.textContent = `x = ${p1.x}`;
            return;
        }
        if (p1.y === p2.y) { // Horizontal line
            this.outputs.equation.textContent = `y = ${p1.y}`;
            return;
        }

        const slope = (p2.y - p1.y) / (p2.x - p1.x);
        const yIntercept = p1.y - slope * p1.x;

        const slopeStr = slope.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const yIntStr = yIntercept.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const operator = yIntercept >= 0 ? '+' : '-';
        const absYIntStr = Math.abs(yIntercept).toLocaleString(undefined, { maximumFractionDigits: 2 });

        this.outputs.equation.textContent = `y = ${slopeStr}x ${operator} ${absYIntStr}`;
    }
};

document.addEventListener('DOMContentLoaded', () => geometry.init());