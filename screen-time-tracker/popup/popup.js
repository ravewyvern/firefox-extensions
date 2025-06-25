document.addEventListener('DOMContentLoaded', async () => {
    // --- NEW: Helper function to get a YYYY-MM-DD key for the LOCAL date ---
    function getLocalDateKey(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    const listElement = document.getElementById('top-sites-list');
    let selectedDate = new Date();
    const today = getLocalDateKey(selectedDate);
    const storage = await browser.storage.local.get(['timeData', 'colorPreferences']);
    const timeData = storage.timeData || {};
    const colorPreferences = storage.colorPreferences || {};
    const dailyData = timeData[today] || {};

    const sortedWebsites = Object.entries(dailyData)
        .sort(([, timeA], [, timeB]) => timeB - timeA);

    const top3 = sortedWebsites.slice(0, 3);

    listElement.innerHTML = ''; // Clear "Tracking data..."

    if (top3.length === 0) {
        listElement.innerHTML = '<p>No sites tracked yet today.</p>';
    } else {
        top3.forEach(([domain, time]) => {
            const item = document.createElement('div');
            item.className = 'site-item';

            let hash = 0;
            for (let i = 0; i < domain.length; i++) {
                hash = domain.charCodeAt(i) + ((hash << 5) - hash);
            }
            const color = colorPreferences[domain] || PREDEFINED_COLORS[Math.abs(hash % PREDEFINED_COLORS.length)];
            
            const minutes = Math.floor(time / 60);
            const hours = (time / 3600).toFixed(1);
            const formattedTime = time < 3600 ? `${minutes}m` : `${hours}h`;

            item.innerHTML = `
                <div class="site-info">
                    <div class="color-circle" style="background-color: ${color}"></div>
                    <span>${domain}</span>
                </div>
                <span class="site-time">${formattedTime}</span>
            `;
            listElement.appendChild(item);
        });
    }

    // Make the button open the full dashboard
    document.getElementById('dashboard-button').addEventListener('click', () => {
        browser.tabs.create({
            url: '../dashboard/tracker.html'
        });
    });
});
