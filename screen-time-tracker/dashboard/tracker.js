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
    // Get all necessary data from storage
    const storageData = await browser.storage.local.get(['timeData', 'colorPreferences']);
    const timeData = storageData.timeData || {};
    const colorPreferences = storageData.colorPreferences || {};
    let selectedDate = new Date();

    // --- MAIN RENDER FUNCTION ---
    function renderDashboard() {
        renderDateNavigation();
        renderDailyPanel();
        renderWeeklyPanel();
    }

    // --- DATE NAVIGATION ---
    function renderDateNavigation() {
        const navContainer = document.getElementById('date-navigation');
        navContainer.innerHTML = '';
        const weekDays = getWeekDays(new Date());
        
        weekDays.forEach(day => {
            const button = document.createElement('button');
            button.textContent = day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
            button.dataset.date = day.toISOString().split('T')[0];
            
            if (day.toDateString() === selectedDate.toDateString()) {
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
    // In tracker.js, inside the `DOMContentLoaded` listener, find the MODAL LOGIC section
// ... (keep all the existing modal code) ...

// Add these variables at the top of the modal logic section
const saveLimitBtn = document.getElementById('save-limit-button');
const blockUntilBtn = document.getElementById('block-until-button');
const timeLimitInput = document.getElementById('time-limit-input');
const blockDurationInput = document.getElementById('block-duration-input');

// --- (keep the existing openColorModal, closeBtn, and window.onclick functions) ---

// Add these new click handlers
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
// ... inside renderDailyChart ...
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
        const weekDays = getWeekDays(new Date());
        let totalWeekSeconds = 0;
        let daysWithData = 0;
        
        const weeklyTotals = weekDays.map(day => {
            const dateKey = getLocalDateKey(day); // FIXED: Use local date key
            const dayData = timeData[dateKey] || {};
            const dayTotal = Object.values(dayData).reduce((sum, time) => sum + time, 0);
            if (dayTotal > 0) daysWithData++;
            totalWeekSeconds += dayTotal;
            return dayTotal;
        });
        
        // FIXED: Use local date key
        const todayKey = getLocalDateKey(new Date());
        const todayTotal = Object.values(timeData[todayKey] || {}).reduce((sum, time) => sum + time, 0);

        document.getElementById('total-today').textContent = formatTime(todayTotal);
        document.getElementById('total-this-week').textContent = formatTime(totalWeekSeconds);
        document.getElementById('average-this-week').textContent = daysWithData > 0 ? formatTime(Math.round(totalWeekSeconds / daysWithData)) : '0m';
        
        renderWeeklyChart(weekDays, weeklyTotals);
    }
    
    function renderWeeklyChart(weekDays, weeklyTotals) {
        const ctx = document.getElementById('weeklyActivityChart').getContext('2d');
        const labels = weekDays.map(day => day.toLocaleDateString(undefined, { weekday: 'short' }));
        const data = weeklyTotals.map(seconds => (seconds / 3600).toFixed(2)); // in hours
        
        if (weeklyChart) weeklyChart.destroy();
        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Hours',
                    data: data,
                    backgroundColor: '#1877f2',
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
        
        // Calculate weekly total for this domain
        const weekDays = getWeekDays(new Date());
        let domainWeeklyTotal = 0;
        weekDays.forEach(day => {
            const dateKey = day.toISOString().split('T')[0];
            if(timeData[dateKey] && timeData[dateKey][domain]) {
                domainWeeklyTotal += timeData[dateKey][domain];
            }
        });

        document.getElementById('modal-website-name').textContent = domain;
        document.getElementById('modal-favicon').src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        document.getElementById('modal-weekly-total').textContent = formatTime(domainWeeklyTotal);
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

    // --- INITIAL RENDER ---
    renderDashboard();
});

