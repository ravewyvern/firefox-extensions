// --- STATE & CORE FUNCTIONS ---
let trackingState = {
    activeDomain: null,
    startTime: null
};

// --- NEW: Helper function to get a YYYY-MM-DD key for the LOCAL date ---
function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function saveTrackedTime() {
    if (!trackingState.startTime || !trackingState.activeDomain) return;

    const endTime = Date.now();
    const timeSpentInSeconds = Math.round((endTime - trackingState.startTime) / 1000);
    const domain = trackingState.activeDomain;

    if (timeSpentInSeconds > 0) {
        console.log(`Saving ${timeSpentInSeconds}s for ${domain}`);
        // FIXED: Use the local date key
        const todayKey = getLocalDateKey(new Date()); 
        const data = await browser.storage.local.get(['timeData', 'siteControls']);
        const timeData = data.timeData || {};
        const siteControls = data.siteControls || {};

        if (!timeData[todayKey]) timeData[todayKey] = {};
        timeData[todayKey][domain] = (timeData[todayKey][domain] || 0) + timeSpentInSeconds;

        await browser.storage.local.set({ timeData });

        const controls = siteControls[domain];
        if (controls && controls.timeLimit && timeData[todayKey][domain] >= controls.timeLimit) {
            await updateBlockingRules();
        }
    }
    trackingState.startTime = null;
}

function startTracking(domain) {
    if (domain) {
        trackingState.activeDomain = domain;
        trackingState.startTime = Date.now();
    }
}

async function handleStateChange(newDomain) {
    if (newDomain !== trackingState.activeDomain) {
        await saveTrackedTime();
        startTracking(newDomain);
    }
}

// --- BLOCKING ENGINE (declarativeNetRequest) ---

const RULE_ID_START = 1000;

async function updateBlockingRules() {
    console.log("Updating blocking rules...");
    const { siteControls, timeData } = await browser.storage.local.get(['siteControls', 'timeData']);
    if (!siteControls) return;

    const rulesToAdd = [];
    const todayKey = getLocalDateKey(new Date());
    const todayData = timeData ? timeData[todayKey] : {};

    for (const domain in siteControls) {
        const controls = siteControls[domain];
        let block = false;
        let reason = '';
        let blockEnds = 0;

        if (controls.blockUntil && controls.blockUntil > Date.now()) {
            block = true;
            reason = 'manual';
            blockEnds = controls.blockUntil;
        } else if (controls.timeLimit && todayData && todayData[domain] && todayData[domain] >= controls.timeLimit) {
            block = true;
            reason = 'limit';
        }

        if (block) {
            const redirectUrl = browser.runtime.getURL(`dashboard/blocked.html?url=${domain}&reason=${reason}&blockEnds=${blockEnds}`);
            rulesToAdd.push({
                id: RULE_ID_START + rulesToAdd.length,
                priority: 1,
                action: {
                    type: 'redirect',
                    redirect: { url: redirectUrl }
                },
                // --- THIS IS THE FIX ---
                // We now use requestDomains which blocks the domain and all its subdomains (e.g. www, m, etc.)
                condition: {
                    requestDomains: [domain],
                    resourceTypes: ['main_frame']
                }
            });
        }
    }

    const existingRules = await browser.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: rulesToAdd
    });

    console.log(`Updated blocking rules. Now blocking ${rulesToAdd.length} domain(s).`);
}


// --- EVENT LISTENERS ---

browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === "SET_SITE_CONTROLS") {
        const { siteControls } = await browser.storage.local.get('siteControls');
        const newControls = siteControls || {};
        if (!newControls[message.domain]) newControls[message.domain] = {};
        newControls[message.domain] = { ...newControls[message.domain], ...message.controls };
        await browser.storage.local.set({ siteControls: newControls });
        await updateBlockingRules();
    }
    else if (message.type === "CLEAR_DATA") {
        const cutoffDate = new Date();
        const { timeData } = await browser.storage.local.get('timeData');
        if (!timeData) return;

        switch (message.period) {
            case "all":
                await browser.storage.local.remove('timeData');
                break;
            case "1_week":
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                break;
            case "1_month":
                cutoffDate.setMonth(cutoffDate.getMonth() - 1);
                break;
            case "1_year":
                cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
                break;
        }

        if (message.period !== "all") {
            for (const dateKey in timeData) {
                if (new Date(dateKey) < cutoffDate) {
                    delete timeData[dateKey];
                }
            }
            await browser.storage.local.set({ timeData });
        }
        console.log(`Data cleared for period: ${message.period}`);
    }
});


browser.tabs.onActivated.addListener(async (activeInfo) => {
    // REMOVED: Focus check
    try {
        const tab = await browser.tabs.get(activeInfo.tabId);
        const url = new URL(tab.url);
        handleStateChange(url.protocol.startsWith('http') ? url.hostname : null);
    } catch (e) {
        handleStateChange(null);
    }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabId === activeTabs[0]?.id && changeInfo.url) {
        // REMOVED: Focus check
        try {
            const url = new URL(changeInfo.url);
            handleStateChange(url.protocol.startsWith('http') ? url.hostname : null);
        } catch (e) {
            handleStateChange(null);
        }
    }
});

// (Keep the alarms and weekly reset logic as is)
browser.runtime.onStartup.addListener(() => {
    browser.alarms.create('periodic_save', { periodInMinutes: 1 });
    updateBlockingRules();
});
browser.alarms.create('periodic_save', { periodInMinutes: 1 }); browser.alarms.create('weekly_reset_check', { periodInMinutes: 60 });

browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'periodic_save') {
        // REMOVED: Focus check. This will now save periodically no matter what.
        await saveTrackedTime();
        startTracking(trackingState.activeDomain);
    } else if (alarm.name === 'weekly_reset_check') {
        await weeklyReset();
        updateBlockingRules();
    }
});

// Initial checks on load
// Initial check on load
(async () => {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
        try {
            const url = new URL(activeTab.url);
            handleStateChange(url.protocol.startsWith('http') ? url.hostname : null);
        } catch (e) {
            handleStateChange(null);
        }
    }
    updateBlockingRules();
})();

