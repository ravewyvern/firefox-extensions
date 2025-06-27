const WIDGET_DEFINITIONS = [
    {
        name: 'Digital Clock',
        id: 'digital-clock',
        type: 'html',
        htmlcode: `
                    <style>
                        .clock-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            width: 100%;
                            height: 100%;
                            padding: 10px;
                            box-sizing: border-box;
                            font-family: 'Inter', sans-serif;
                            color: white;
                            text-shadow: 0 0 5px rgba(0,0,0,0.5);
                        }
                        .clock-time {
                            font-size: clamp(2rem, 10vw, 3rem);
                            font-weight: 600;
                        }
                        .clock-date {
                            font-size: clamp(0.8rem, 4vw, 1rem);
                            opacity: 0.8;
                        }
                    </style>
                    <div class="clock-container">
                        <div class="clock-time" id="clock-time-el"></div>
                        <div class="clock-date" id="clock-date-el"></div>
                    </div>
                `,
        config: [],
        defaultSize: { w: 2, h: 1 },
        category: 'Utility',
        javascript: function(widgetElement, itemConfig, globalConfig) {
            requestAnimationFrame(() => {
                const timeEl = widgetElement.querySelector('.clock-time');
                const dateEl = widgetElement.querySelector('.clock-date');
                if (!timeEl || !dateEl) return; // Exit gracefully

                function updateClock() {
                    const now = new Date();
                    // Use the PASSED-IN globalConfig, not the global variable
                    const hourFormat = globalConfig.preferences.hourFormat === '24'
                        ? { hour12: false }
                        : { hour12: true };
                    timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', ...hourFormat });
                    dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
                }

                // Clear any previous interval to prevent memory leaks on re-render
                if (widgetElement.dataset.intervalId) {
                    clearInterval(parseInt(widgetElement.dataset.intervalId));
                }

                const intervalId = setInterval(updateClock, 1000);
                widgetElement.dataset.intervalId = intervalId;
                updateClock();
            });
        }
    },
    {
        name: 'Greeting',
        id: 'greeting-widget',
        type: 'html',
        htmlcode: `
            <style>
                .greeting-container {
                    display: flex;
                    flex-direction: column;
                    align-items: {{textAlign}};
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    padding: 15px;
                    box-sizing: border-box;
                    font-family: 'Inter', sans-serif;
                    color: white;
                }
                .greeting-message {
                    font-size: 1.5em;
                    font-weight: 600;
                }
                .greeting-name {
                    font-size: 1.1em;
                    opacity: 0.8;
                    margin-top: 5px;
                }
            </style>
            <div class="greeting-container" id="container">
                <div class="greeting-message">{{greetingMessage}}</div>
                <div class="greeting-name"></div>
            </div>
        `,
        config: [
            {
                name: 'greetingMessage',
                type: 'text',
                label: 'Greeting Message',
                default: 'Hello There'
            },
            {
                name: 'showName',
                type: 'checkbox',
                label: 'Show welcome name?',
                default: true
            },
            {
                name: 'textAlign',
                type: 'dropdown',
                label: 'Text Alignment',
                default: 'center',
                options: [
                    { value: 'flex-start', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'flex-end', label: 'Right' }
                ]
            }
        ],
        defaultSize: { w: 2, h: 1 },
        category: 'Utility',
        javascript: function(widgetElement, itemConfig, globalConfig) {
            requestAnimationFrame(() => {
                const nameEl = widgetElement.querySelector('.greeting-name');
                if (!nameEl) return; // Exit gracefully if element not found

                const showName = itemConfig.config.showName;
                if (showName) {
                    nameEl.textContent = 'Welcome, User!';
                } else {
                    nameEl.style.display = 'none';
                }
            });
        }
    },
    {
        name: 'Debug Info',
        id: 'debug-info',
        type: 'html',
        htmlcode: `
        <style>
            .debug-container { 
                font-family: monospace; 
                font-size: 11px; 
                padding: 10px; 
                white-space: pre; 
                overflow: auto;
                height: 100%;
                width: 100%;
                box-sizing: border-box;
                background-color: rgba(0,0,0,0.3);
                border-radius: 12px;
            }
        </style>
        <div class="debug-container"></div>
    `,
        config: [],
        defaultSize: { w: 2, h: 1 },
        category: 'Utility',
        javascript: function(widgetElement, itemConfig, globalConfig) {
            requestAnimationFrame(() => {
                const container = widgetElement.querySelector('.debug-container');
                if (!container) return;

                // Create a temporary version of the config without the bulky item list
                const configCopy = { ...globalConfig, items: `[${globalConfig.items.length} items]` };

                // Use JSON.stringify for nice formatting
                container.textContent = JSON.stringify(configCopy, null, 2);
            });
        }
    },
    {
        name: 'Iframe Widget',
        id: 'iframe-widget',
        type: 'html',
        // The HTML code is just a simple iframe that fills the widget space
        htmlcode: `
        <iframe src="{{iframe_url}}" style="width:100%; height:100%; border:0; border-radius:16px;"></iframe>
    `,
        // It has one config option: the URL for the iframe
        config: [
            {
                name: 'iframe_url',
                type: 'text',
                label: 'Iframe URL',
                default: 'https://supermario-game.com/mario-game/mario.html'
            }
        ],
        defaultSize: { w: 2, h: 1 },
        category: 'Fun',
        // This widget has no custom javascript logic needed
        javascript: null
    }
];