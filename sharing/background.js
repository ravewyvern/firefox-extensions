// This script now dynamically builds the context menu.

let allServices = []; // A cache for service configurations

/**
 * Loads or re-loads all default and custom services from storage into the cache.
 */
async function loadAllServices() {
    // Define default services. In a real extension, this would be from services.js
    const defaultServices = [
        {
            "id": "facebook",
            "name": "Facebook",
            "urlTemplate": "https://www.facebook.com/sharer/sharer.php?u=%s",
            "copyOnly": false,
            "category": "Social"
        },
        {
            "id": "twitter",
            "name": "X (Twitter)",
            "urlTemplate": "https://twitter.com/intent/tweet?url=%s",
            "copyOnly": false,
            "category": "Social"
        },
        {
            "id": "whatsapp",
            "name": "WhatsApp",
            "urlTemplate": "https://api.whatsapp.com/send?text=%s",
            "copyOnly": false,
            "category": "Messaging"
        },
        {
            "id": "linkedin",
            "name": "LinkedIn",
            "urlTemplate": "https://www.linkedin.com/shareArticle?mini=true&url=%s",
            "copyOnly": false,
            "category": "Professional"
        },
        {
            "id": "reddit",
            "name": "Reddit",
            "urlTemplate": "https://www.reddit.com/submit?url=%s",
            "copyOnly": false,
            "category": "Social"
        },
        {
            "id": "telegram",
            "name": "Telegram",
            "urlTemplate": "https://t.me/share/url?url=%s",
            "copyOnly": false,
            "category": "Messaging"
        },
        {
            "id": "discord",
            "name": "Discord",
            "urlTemplate": "https://discord.com/channels/@me",
            "copyOnly": true, // Example: Copies URL, then opens Discord app/site.
            "category": "Messaging"
        },
        {
            "id": "email",
            "name": "Email",
            "urlTemplate": "mailto:?subject=Check%20out%20this%20page&body=%s",
            "copyOnly": false,
            "category": "Productivity"
        },
        {
            "id": "chatgpt",
            "name": "ChatGPT",
            "urlTemplate": "https://chatgpt.com/?hints=search&q=%s",
            "copyOnly": false,
            "category": "AI"
        },
        {
            "id": "perplexity",
            "name": "Perplexity",
            "urlTemplate": "https://www.perplexity.ai/?s=o&q=%s",
            "copyOnly": false,
            "category": "AI"
        },
        {
            "id": "google-keep",
            "name": "Google Keep",
            "urlTemplate": "https://keep.google.com/#NOTE?text=%s",
            "copyOnly": false,
            "category": "Productivity"
        },
        {
            "id": "todoist",
            "name": "Todoist",
            "urlTemplate": "https://todoist.com/add?content=%s",
            "copyOnly": false,
            "category": "Productivity"
        },
        {
            "id": "mastodon",
            "name": "Mastodon",
            "urlTemplate": "https://mastodon.social/share?text=%s",
            "copyOnly": false,
            "category": "Social"
        },
        {
            "id": "pocket",
            "name": "Pocket",
            "urlTemplate": "https://getpocket.com/save?url=%s",
            "copyOnly": false,
            "category": "Productivity"
        },
        {
            "id": "tumblr",
            "name": "Tumblr",
            "urlTemplate": "https://www.tumblr.com/widgets/share/tool?canonicalUrl=%s",
            "copyOnly": false,
            "category": "Social"
        },
        {
            "id": "google-calendar",
            "name": "Google Calendar",
            "urlTemplate": "https://calendar.google.com/calendar/render?action=TEMPLATE&details=%s",
            "copyOnly": false,
            "category": "Productivity"
        },
        {
            "id": "google-messages",
            "name": "Google Messages",
            "urlTemplate": "https://messages.google.com/web/conversations/new",
            "copyOnly": true,
            "category": "Messaging"
        },
        {
            "id": "pairdrop",
            "name": "PairDrop",
            "urlTemplate": "https://pairdrop.net/",
            "copyOnly": true,
            "category": "Messaging"
        },
        {
            "id": "blogger",
            "name": "Blogger",
            "urlTemplate": "https://www.blogger.com/blog-this.g?n=%s",
            "copyOnly": false,
            "category": "Productivity"
        },
        {
            "id": "pinterest",
            "name": "Pinterest",
            "urlTemplate": "https://www.pinterest.com/pin/create/bookmarklet/?url=%s",
            "copyOnly": false,
            "category": "Social"
        }
    ];

    const data = await browser.storage.local.get("customServices");
    allServices = [...defaultServices, ...(data.customServices || [])];
}

/**
 * Rebuilds the context menu based on the user's selected services.
 */
async function rebuildContextMenu() {
    await loadAllServices(); // Ensure our service cache is up-to-date
    await browser.contextMenus.removeAll(); // Clear old menus

    const { userServices: enabledServiceIds } = await browser.storage.local.get("userServices");

    // Only create the parent menu if there are services enabled
    if (enabledServiceIds && enabledServiceIds.length > 0) {
        const parentMenuId = "super-sharer-parent";
        browser.contextMenus.create({
            id: parentMenuId,
            title: "Share selected text",
            contexts: ["selection"]
        });

        const servicesToRender = allServices.filter(s => enabledServiceIds.includes(s.id));

        for (const service of servicesToRender) {
            browser.contextMenus.create({
                id: service.id,
                parentId: parentMenuId,
                title: service.name,
                contexts: ["selection"]
            });
        }
    }
}

// Rebuild the menu when the extension starts or is (re)installed.
browser.runtime.onInstalled.addListener(rebuildContextMenu);
browser.runtime.onStartup.addListener(rebuildContextMenu);

// Also rebuild whenever the user changes their service preferences in the popup.
browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.userServices || changes.customServices)) {
        rebuildContextMenu();
    }
});

/**
 * Handles clicks on any of our context menu items.
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const serviceId = info.menuItemId;
    const selectedText = info.selectionText;

    if (!selectedText || serviceId === "super-sharer-parent") return;

    const service = allServices.find(s => s.id === serviceId);
    if (!service) return;

    if (service.copyOnly) {
        // For 'copyOnly', we inject a script to use the page's clipboard permissions.
        try {
            await browser.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text) => navigator.clipboard.writeText(text),
                args: [selectedText]
            });
            browser.tabs.create({ url: service.urlTemplate });
        } catch (err) {
            console.error("Failed to copy text via script injection:", err);
        }
    } else {
        const shareUrl = service.urlTemplate.replace('%s', encodeURIComponent(selectedText));
        browser.tabs.create({ url: shareUrl });
    }
});
