// Global variables for charts to be able to destroy them on redraw
let dailyChart = null;
let weeklyChart = null;

// --- NEW: Helper function to get a YYYY-MM-DD key for the LOCAL date ---
function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to format seconds into H/M/S string
function formatTime(seconds, format = 'auto') {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (format === 'hm') {
        const hours = (seconds / 3600).toFixed(1);
        if (h < 1) return `${m}m`;
        return `${hours}h`;
    }
    const hStr = h > 0 ? `${h}h ` : '';
    const mStr = m > 0 ? `${m}m` : '';
    return hStr + mStr || '0m';
}

function getWeekDays(date) {
    const week = [];
    // Start week on Sunday
    const firstDayOfWeek = new Date(date);
    firstDayOfWeek.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
        const weekDay = new Date(firstDayOfWeek);
        weekDay.setDate(firstDayOfWeek.getDate() + i);
        week.push(weekDay);
    }
    return week;
}


document.addEventListener('DOMContentLoaded', async () => {
    const { customCSS } = await browser.storage.local.get('customCSS');
    if (customCSS) {
        const styleSheet = document.createElement("style");
        styleSheet.id = "custom-styles-sheet";
        styleSheet.innerText = customCSS;
        document.head.appendChild(styleSheet);
    }
    const storageData = await browser.storage.local.get(['timeData', 'colorPreferences']);
    const timeData = storageData.timeData || {};
    const colorPreferences = storageData.colorPreferences || {};
    let selectedDate = new Date();
    let calendarDate = new Date(); // NEW: State for the calendar's current month view

    // --- MAIN RENDER FUNCTION ---
    function renderDashboard() {
        renderDateNavigation();
        renderDailyPanel();
        renderWeeklyPanel();
        renderCalendarPanel(); // NEW
    }

    // --- DATE NAVIGATION ---
    function renderDateNavigation() {
        const navContainer = document.getElementById('date-navigation');
        navContainer.innerHTML = '';
        const weekDays = getWeekDays(selectedDate); // UPDATED: Use selectedDate

        weekDays.forEach(day => {
            const button = document.createElement('button');
            button.textContent = day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
            button.dataset.date = getLocalDateKey(day);
            if (getLocalDateKey(day) === getLocalDateKey(selectedDate)) {
                button.className = 'active';
            }
            button.addEventListener('click', () => {
                selectedDate = day;
                renderDashboard();
            });
            navContainer.appendChild(button);
        });
    }

    function renderDailyPanel() {
        // FIXED: Use local date key
        const dateKey = getLocalDateKey(selectedDate);
        const dailyData = timeData[dateKey] || {};
        
        renderWebsiteList(dailyData);
        renderDailyChart(dailyData);
    }
    
    function renderWebsiteList(dailyData) {
        const websiteList = document.getElementById('website-list');
        websiteList.innerHTML = '';

        const filteredWebsites = Object.entries(dailyData)
            .filter(([, time]) => time >= 60)
            .sort(([, timeA], [, timeB]) => timeB - timeA);

        if (filteredWebsites.length === 0) {
            websiteList.innerHTML = '<p>No websites tracked for over a minute on this day.</p>';
            return;
        }

        filteredWebsites.forEach(([domain, time]) => {
            const color = getWebsiteColor(domain);
            const item = document.createElement('div');
            const saveLimitBtn = document.getElementById('save-limit-button');
const blockUntilBtn = document.getElementById('block-until-button');
const timeLimitInput = document.getElementById('time-limit-input');
const blockDurationInput = document.getElementById('block-duration-input');
            item.className = 'website-item';
            item.dataset.domain = domain; // For the modal
            item.innerHTML = `
                <div class="website-info">
                    <div class="color-circle" style="background-color: ${color};"></div>
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" alt="" style="width:16px; height: 16px; margin-right: 5px;" />
                    <span class="website-name">${domain}</span>
                </div>
                <span class="website-time">${formatTime(time, 'hm')}</span>
            `;
            // Add click listener for the modal
            item.addEventListener('click', () => openColorModal(domain));
            websiteList.appendChild(item);
            
            
        });
        
    }

// Add these variables at the top of the modal logic section
const saveLimitBtn = document.getElementById('save-limit-button');
const blockUntilBtn = document.getElementById('block-until-button');
const timeLimitInput = document.getElementById('time-limit-input');
const blockDurationInput = document.getElementById('block-duration-input');

saveLimitBtn.onclick = async () => {
    const limitInMinutes = parseInt(timeLimitInput.value);
    if (!currentDomain || isNaN(limitInMinutes) || limitInMinutes <= 0) {
        return; // Do nothing if input is invalid
    }
    
    // Send a message to the background script to set the limit
    await browser.runtime.sendMessage({
        type: "SET_SITE_CONTROLS",
        domain: currentDomain,
        controls: { timeLimit: limitInMinutes * 60 } // Store in seconds
    });

    alert(`Time limit of ${limitInMinutes} minutes set for ${currentDomain}.`);
    timeLimitInput.value = ''; // Clear input
};

blockUntilBtn.onclick = async () => {
    const durationInHours = parseInt(blockDurationInput.value);
    if (!currentDomain || isNaN(durationInHours) || durationInHours <= 0 || durationInHours > 24) {
        return;
    }

    const blockUntilTimestamp = Date.now() + (durationInHours * 60 * 60 * 1000);

    // Send a message to the background script to set the block
    await browser.runtime.sendMessage({
        type: "SET_SITE_CONTROLS",
        domain: currentDomain,
        controls: { blockUntil: blockUntilTimestamp }
    });

    alert(`${currentDomain} is now blocked for ${durationInHours} hour(s).`);
    blockDurationInput.value = '';
    modal.className = 'modal-hidden'; // Close modal after blocking
};

Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

// --- (keep the existing saveColorBtn.onclick function) ---

    function renderDailyChart(dailyData) {
        const ctx = document.getElementById('dailyActivityChart').getContext('2d');
        const sortedData = Object.entries(dailyData)
            .filter(([, time]) => time >= 60)
            .sort(([, timeA], [, timeB]) => timeB - timeA)
            .slice(0, 10); // Show top 10 for cleaner chart

        const labels = sortedData.map(([domain]) => domain);
        const data = sortedData.map(([, time]) => (time / 60).toFixed(2)); // in minutes
        const backgroundColors = sortedData.map(([domain]) => getWebsiteColor(domain));
        
        if (dailyChart) dailyChart.destroy(); // Clear old chart
        dailyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Time Spent (minutes)',
                    data: data,
                    backgroundColor: backgroundColors,
                }]
            },
            options: {
                // indexAxis: 'y', // <-- REMOVE OR COMMENT OUT THIS LINE
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { // <-- CHANGE 'x' TO 'y' HERE
                        beginAtZero: true,
                        title: { display: true, text: 'Minutes' } // <-- MOVE THE TITLE HERE
                    }
                }
            }
        });
    }


    function renderWeeklyPanel() {
        const weekDays = getWeekDays(selectedDate);
        let totalWeekSeconds = 0;
        let daysWithData = 0;
        const weeklyTotals = weekDays.map(day => {
            const dayData = timeData[getLocalDateKey(day)] || {};
            const dayTotal = Object.values(dayData).reduce((sum, time) => sum + time, 0);
            if (dayTotal > 0) daysWithData++;
            totalWeekSeconds += dayTotal;
            return dayTotal;
        });
        const todayKey = getLocalDateKey(new Date());
        const todayTotal = Object.values(timeData[todayKey] || {}).reduce((sum, time) => sum + time, 0);
        document.getElementById('total-today').textContent = formatTime(todayTotal);
        document.getElementById('total-this-week').textContent = formatTime(totalWeekSeconds);
        document.getElementById('average-this-week').textContent = daysWithData > 0 ? formatTime(Math.round(totalWeekSeconds / daysWithData)) : '0m';
        renderWeeklyChart(weekDays, weeklyTotals);
    }
    
    function renderWeeklyChart(weekDays, weeklyTotals) {
        const ctx = document.getElementById('weeklyActivityChart').getContext('2d');
        const labels = weekDays.map(day => day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }));
        const data = weeklyTotals.map(seconds => (seconds / 3600).toFixed(2)); // in hours
        
        if (weeklyChart) weeklyChart.destroy();
        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Hours',
                    data: data,
                    backgroundColor: '#6c33dd',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Hours' }
                    }
                }
            }
        });
    }

    // --- NEW: RENDER PANEL 3: CALENDAR ---
    function renderCalendarPanel() {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearEl = document.getElementById('calendar-month-year');
        calendarGrid.innerHTML = '';

        // Use calendarDate instead of creating a new Date
        const todayKey = getLocalDateKey(new Date()); // For highlighting today

        // Display the month/year from calendarDate
        monthYearEl.textContent = calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

        // Use calendarDate to determine the days in the month
        const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
        const lastDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
        const startingDay = firstDayOfMonth.getDay();

        // Add day headers (Sun, Mon, etc.)
        ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
            calendarGrid.innerHTML += `<div class="calendar-day-header">${day}</div>`;
        });

        // Add blank days for the start of the month
        for (let i = 0; i < startingDay; i++) {
            calendarGrid.innerHTML += `<div class="calendar-day other-month"></div>`;
        }

        // Add days of the month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i);
            const dateKey = getLocalDateKey(date);
            const dayData = timeData[dateKey] || {};
            const totalSeconds = Object.values(dayData).reduce((sum, time) => sum + time, 0);

            const isToday = dateKey === todayKey ? 'current-day' : '';
            calendarGrid.innerHTML += `
            <div class="calendar-day ${isToday}" data-date="${dateKey}">
                <span class="day-number">${i}</span>
                <span class="day-total">${totalSeconds > 0 ? formatTime(totalSeconds, 'hm') : ''}</span>
            </div>
        `;
        }
    }

    // --- EVENT LISTENERS (Navigation & Deletion) ---
    document.getElementById('prev-week').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() - 7);
        renderDashboard();
    });

    document.getElementById('next-week').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() + 7);
        renderDashboard();
    });

    document.getElementById('prev-month').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendarPanel();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendarPanel();
    });

    // NEW: Feature #3: Click listener for calendar days
    document.getElementById('calendar-grid').addEventListener('click', (e) => {
        const dayElement = e.target.closest('.calendar-day');
        if (dayElement && dayElement.dataset.date) {
            // The date string includes a time zone offset, so we add 'T00:00:00' to parse it as local time
            selectedDate = new Date(dayElement.dataset.date + 'T00:00:00');
            renderDashboard();
        }
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', async (e) => {
            const period = e.target.dataset.period;
            const confirmation = confirm(`Are you sure you want to permanently delete this data? This cannot be undone.`);
            if (confirmation) {
                await browser.runtime.sendMessage({ type: "CLEAR_DATA", period: period });
                window.location.reload();
            }
        });
    });

    // --- COLOR ASSIGNMENT ---
    function getWebsiteColor(domain) {
        if (colorPreferences[domain]) return colorPreferences[domain];
        let hash = 0;
        for (let i = 0; i < domain.length; i++) {
            hash = domain.charCodeAt(i) + ((hash << 5) - hash);
        }
        return PREDEFINED_COLORS[Math.abs(hash % PREDEFINED_COLORS.length)];
    }

    // --- MODAL LOGIC ---
    const modal = document.getElementById('color-modal');
    const closeBtn = document.querySelector('.close-button');
    const saveColorBtn = document.getElementById('save-color-button');
    let currentDomain = null;

    function openColorModal(domain) {
        currentDomain = domain;

        const weekDays = getWeekDays(selectedDate);
        let domainWeeklyTotal = 0;
        weekDays.forEach(day => {
            const dateKey = getLocalDateKey(day);
            if(timeData[dateKey] && timeData[dateKey][domain]) {
                domainWeeklyTotal += timeData[dateKey][domain];
            }
        });

        let domainAllTimeTotal = 0;
        for (const dateKey in timeData) {
            if (timeData[dateKey][domain]) {
                domainAllTimeTotal += timeData[dateKey][domain];
            }
        }

        document.getElementById('modal-website-name').textContent = domain;
        document.getElementById('modal-favicon').src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        // Update the existing weekly total element
        document.getElementById('modal-weekly-total').textContent = formatTime(domainWeeklyTotal);
        // Update the new all-time total element
        document.getElementById('modal-all-time-total').textContent = formatTime(domainAllTimeTotal);
        document.getElementById('colorPicker').value = getWebsiteColor(domain);
        modal.className = 'modal-visible';
    }

    closeBtn.onclick = () => { modal.className = 'modal-hidden'; };
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.className = 'modal-hidden';
        }
    };

    saveColorBtn.onclick = async () => {
        const newColor = document.getElementById('colorPicker').value;
        colorPreferences[currentDomain] = newColor;
        await browser.storage.local.set({ colorPreferences });
        
        modal.className = 'modal-hidden';
        renderDashboard(); // Re-render to show the new color immediately
    };

    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-button');
    const settingsCloseBtn = document.getElementById('settings-close-button');

    const exportCopyBtn = document.getElementById('export-copy-button');
    const exportDownloadBtn = document.getElementById('export-download-button');
    const importDataBtn = document.getElementById('import-data-button');
    const importTextarea = document.getElementById('import-textarea');
    const importFileInput = document.getElementById('import-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    settingsBtn.onclick = () => { settingsModal.className = 'modal-visible'; };
    settingsCloseBtn.onclick = () => { settingsModal.className = 'modal-hidden'; };
    window.addEventListener('click', (event) => {
        if (event.target == settingsModal) {
            settingsModal.className = 'modal-hidden';
        }
    });

    exportCopyBtn.onclick = async () => {
        const { timeData } = await browser.storage.local.get('timeData');
        if (!timeData) {
            alert("No data to export.");
            return;
        }
        try {
            const dataString = JSON.stringify(timeData, null, 2); // Pretty print JSON
            await navigator.clipboard.writeText(dataString);
            alert("All tracking data has been copied to your clipboard.");
        } catch (err) {
            alert("Failed to copy data. See console for details.");
            console.error("Clipboard write failed: ", err);
        }
    };

    exportDownloadBtn.onclick = async () => {
        const { timeData } = await browser.storage.local.get('timeData');
        if (!timeData) {
            alert("No data to export.");
            return;
        }
        const dataString = JSON.stringify(timeData, null, 2);
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `webtimetracker_export_${getLocalDateKey(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Import Logic
    importFileInput.onchange = () => {
        if (importFileInput.files.length > 0) {
            fileNameDisplay.textContent = importFileInput.files[0].name;
            importTextarea.value = ''; // Clear textarea if a file is chosen
        }
    };

    importDataBtn.onclick = async () => {
        const file = importFileInput.files[0];
        let rawData = importTextarea.value;

        if (file) {
            rawData = await file.text();
        }

        if (!rawData) {
            alert("No data to import. Paste data or choose a file.");
            return;
        }

        if (!confirm("This will merge the imported data with your existing data. Are you sure you want to continue?")) {
            return;
        }

        try {
            const importedData = JSON.parse(rawData);
            const { timeData: existingData = {} } = await browser.storage.local.get('timeData');

            // Deep merge the data
            for (const dateKey in importedData) {
                if (!existingData[dateKey]) {
                    existingData[dateKey] = {};
                }
                for (const domain in importedData[dateKey]) {
                    existingData[dateKey][domain] = (existingData[dateKey][domain] || 0) + importedData[dateKey][domain];
                }
            }

            await browser.storage.local.set({ timeData: existingData });
            alert("Data successfully imported and merged! The page will now reload.");
            window.location.reload();

        } catch (e) {
            alert("Import failed! The data was not valid JSON. Please check the format.");
            console.error("Import error: ", e);
        }
    };

    const saveCssBtn = document.getElementById('save-css-button');
    const customCssTextarea = document.getElementById('custom-css-textarea');

    customCssTextarea.value = customCSS || '';

    saveCssBtn.onclick = async () => {
        const cssToSave = customCssTextarea.value;
        await browser.storage.local.set({ customCSS: cssToSave });

        let styleSheet = document.getElementById('custom-styles-sheet');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'custom-styles-sheet';
            document.head.appendChild(styleSheet);
        }
        styleSheet.innerText = cssToSave;
        alert("Custom styles applied and saved!");
    };

    // --- INITIAL RENDER ---
    renderDashboard();
});

