// math-tools.js
const mathTools = {
    // List of math tools with their properties
    tools: [
        {
            id: 'graphing',
            name: 'Graphing',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
            url: 'https://ravewyvern.me/geom/'
        },
        {
            id: 'desmos',
            name: 'Desmos',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
            url: 'https://www.desmos.com/calculator'
        },
        {
            id: 'geogebra',
            name: 'GeoGebra',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z"/></svg>',
            url: 'https://www.geogebra.org/classic'
        },
        {
            id: 'mathway',
            name: 'MathWay',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-17.93c3.94.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z"/></svg>',
            url: 'https://www.mathway.com/Algebra'
        },
        {
            id: 'draw',
            name: 'Excalidraw',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-17.93c3.94.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z"/></svg>',
            url: 'https://excalidraw.com/'
        }
    ],

    // Current active tool
    activeToolId: null,

    // DOM elements
    tabsContainer: null,
    iframe: null,

    init: function() {
        this.tabsContainer = document.querySelector('.math-tools-tabs');
        this.iframe = document.getElementById('math-tools-iframe');

        if (!this.tabsContainer || !this.iframe) return;

        // Create tabs
        this.renderTabs();

        // Set first tool as active by default
        if (this.tools.length > 0) {
            this.setActiveTool(this.tools[0].id);
        }
    },

    // Add a new math tool
    addTool: function(tool) {
        this.tools.push(tool);
        if (this.tabsContainer) {
            this.renderTabs();
        }
    },

    // Render all tabs
    renderTabs: function() {
        this.tabsContainer.innerHTML = '';

        this.tools.forEach(tool => {
            const tab = document.createElement('div');
            tab.className = 'math-tool-tab';
            tab.dataset.toolId = tool.id;

            tab.innerHTML = `
                <div class="tool-icon">${tool.icon}</div>
                <div class="tool-name">${tool.name}</div>
                <div class="tool-actions">
                    <button class="reload-btn" title="Reload">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
                    </button>
                    <button class="open-tab-btn" title="Open in new tab">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </button>
                </div>
            `;

            this.tabsContainer.appendChild(tab);
        });

        // Add event listeners
        this.addTabEventListeners();
    },

    // Add event listeners to tabs
    addTabEventListeners: function() {
        const tabs = this.tabsContainer.querySelectorAll('.math-tool-tab');

        tabs.forEach(tab => {
            // Tab click handler
            tab.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.setActiveTool(tab.dataset.toolId);
                }
            });

            // Reload button handler
            const reloadBtn = tab.querySelector('.reload-btn');
            reloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.reloadTool(tab.dataset.toolId);
            });

            // Open in new tab handler
            const openTabBtn = tab.querySelector('.open-tab-btn');
            openTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openToolInNewTab(tab.dataset.toolId);
            });
        });
    },

    // Set active tool
    setActiveTool: function(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;

        // Update active tab styling
        const tabs = this.tabsContainer.querySelectorAll('.math-tool-tab');
        tabs.forEach(tab => {
            if (tab.dataset.toolId === toolId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Load the tool URL in the iframe
        if (this.activeToolId !== toolId) {
            this.iframe.src = tool.url;
            this.activeToolId = toolId;
        }
    },

    // Reload the current tool
    reloadTool: function(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (tool) {
            this.iframe.src = tool.url;
        }
    },

    // Open tool in new tab
    openToolInNewTab: function(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (tool) {
            window.open(tool.url, '_blank');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => mathTools.init());