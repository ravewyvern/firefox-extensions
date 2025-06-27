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
                    <script>
                        (function() {
                            // Use a unique ID based on the container to avoid conflicts
                            const containerId = document.currentScript.parentElement.id;
                            const timeEl = document.querySelector('#' + containerId + ' .clock-time');
                            const dateEl = document.querySelector('#' + containerId + ' .clock-date');

                            if (!timeEl || !dateEl) return;

                            function updateClock() {
                                const now = new Date();
                                timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
                            }

                            const intervalId = setInterval(updateClock, 1000);
                            // Store interval to clear it later if the widget is removed
                            timeEl.closest('.grid-item').dataset.intervalId = intervalId;

                            updateClock();
                        })();
                    <\/script>
                `,
        config: [],
        defaultSize: { w: 2, h: 1 },
        category: 'Utility'
    },
    {
        name: 'Greeting',
        id: 'greeting-widget',
        type: 'html',
        htmlcode: `
            <style>
                .greeting-container-{{id}} {
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
                .greeting-message-{{id}} {
                    font-size: 1.5em;
                    font-weight: 600;
                }
                .greeting-name-{{id}} {
                    font-size: 1.1em;
                    opacity: 0.8;
                    margin-top: 5px;
                }
            </style>
            <div class="greeting-container-{{id}}" id="container-{{id}}">
                <div class="greeting-message-{{id}}">{{greetingMessage}}</div>
                <div class="greeting-name-{{id}}"></div>
            </div>
            <script>
                (function() {
                    const container = document.getElementById('container-{{id}}');
                    const nameEl = container.querySelector('.greeting-name-{{id}}');
                    const showName = '{{showName}}' === 'true';
                    
                    if (showName) {
                        // In a real app, you'd fetch the user's name. We'll use a placeholder.
                        nameEl.textContent = 'Welcome, User!';
                    } else {
                        nameEl.style.display = 'none';
                    }
                })();
            <\/script>
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
        category: 'Utility'
    },
];