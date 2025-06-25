// This file defines the default services available in the extension.
// It creates a global variable `defaultServices` that popup.js can use.
// "copyOnly": if true, it copies the URL and opens the urlTemplate directly.

const defaultServices = [
    {
        "id": "facebook",
        "name": "Facebook",
        "urlTemplate": "https://www.facebook.com/sharer/sharer.php?u=%s",
        "icon": "../icons/facebook.svg",
        "color": "#1877F2",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "twitter",
        "name": "X (Twitter)",
        "urlTemplate": "https://twitter.com/intent/tweet?url=%s",
        "icon": "../icons/twitter.svg",
        "color": "#1DA1F2",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "whatsapp",
        "name": "WhatsApp",
        "urlTemplate": "https://api.whatsapp.com/send?text=%s",
        "icon": "../icons/whatsapp.svg",
        "color": "#25D366",
        "copyOnly": false,
        "category": "Messaging"
    },
    {
        "id": "linkedin",
        "name": "LinkedIn",
        "urlTemplate": "https://www.linkedin.com/shareArticle?mini=true&url=%s",
        "icon": "../icons/linkedin.svg",
        "color": "#0A66C2",
        "copyOnly": false,
        "category": "Professional"
    },
    {
        "id": "reddit",
        "name": "Reddit",
        "urlTemplate": "https://www.reddit.com/submit?url=%s",
        "icon": "../icons/reddit.svg",
        "color": "#FF4500",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "telegram",
        "name": "Telegram",
        "urlTemplate": "https://t.me/share/url?url=%s",
        "icon": "../icons/telegram.svg",
        "color": "#24A1DE",
        "copyOnly": false,
        "category": "Messaging"
    },
    {
        "id": "discord",
        "name": "Discord",
        "urlTemplate": "https://discord.com/channels/@me",
        "icon": "../icons/discord.svg",
        "color": "#5865F2",
        "copyOnly": true, // Example: Copies URL, then opens Discord app/site.
        "category": "Messaging"
    },
    {
        "id": "email",
        "name": "Email",
        "urlTemplate": "mailto:?subject=Check%20out%20this%20page&body=%s",
        "icon": "../icons/email.svg",
        "color": "#7D7D7D",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "chatgpt",
        "name": "ChatGPT",
        "urlTemplate": "https://chatgpt.com/?hints=search&q=%s",
        "icon": "../icons/chatgpt.svg",
        "color": "#10A37F",
        "copyOnly": false,
        "category": "AI"
    },
    {
        "id": "perplexity",
        "name": "Perplexity",
        "urlTemplate": "https://www.perplexity.ai/?s=o&q=%s",
        "icon": "../icons/perplexity.png",
        "color": "#111827",
        "copyOnly": false,
        "category": "AI"
    },
    {
        "id": "google-keep",
        "name": "Google Keep",
        "urlTemplate": "https://keep.google.com/#NOTE?text=%s",
        "icon": "../icons/google-keep.svg",
        "color": "#FBBC04",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "todoist",
        "name": "Todoist",
        "urlTemplate": "https://todoist.com/add?content=%s",
        "icon": "../icons/todoist.svg",
        "color": "#DB4C3F",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "mastodon",
        "name": "Mastodon",
        "urlTemplate": "https://mastodon.social/share?text=%s",
        "icon": "../icons/mastodon.svg",
        "color": "#6364FF",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "pocket",
        "name": "Pocket",
        "urlTemplate": "https://getpocket.com/save?url=%s",
        "icon": "../icons/pocket.svg",
        "color": "#EE4056",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "tumblr",
        "name": "Tumblr",
        "urlTemplate": "https://www.tumblr.com/widgets/share/tool?canonicalUrl=%s",
        "icon": "../icons/tumblr.svg",
        "color": "#35465C",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "google-calendar",
        "name": "Google Calendar",
        "urlTemplate": "https://calendar.google.com/calendar/render?action=TEMPLATE&details=%s",
        "icon": "../icons/google-calendar.svg",
        "color": "#4285F4",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "google-messages",
        "name": "Google Messages",
        "urlTemplate": "https://messages.google.com/web/conversations/new",
        "icon": "../icons/google-messages.svg",
        "color": "#1A73E8",
        "copyOnly": true,
        "category": "Messaging"
    },
    {
        "id": "pairdrop",
        "name": "PairDrop",
        "urlTemplate": "https://pairdrop.net/",
        "icon": "../icons/pairdrop.svg",
        "color": "#3f7ee9",
        "copyOnly": true,
        "category": "Messaging"
    },
    {
        "id": "blogger",
        "name": "Blogger",
        "urlTemplate": "https://www.blogger.com/blog-this.g?n=%s",
        "icon": "../icons/blogger.svg",
        "color": "#f57c00",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "pinterest",
        "name": "Pinterest",
        "urlTemplate": "https://www.pinterest.com/pin/create/bookmarklet/?url=%s",
        "icon": "../icons/pinterest.svg",
        "color": "#bd081c",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "bluesky",
        "name": "Bluesky",
        "urlTemplate": "https://bsky.app/intent/compose?text=%s",
        "icon": "../icons/bluesky.svg",
        "color": "#1285fe",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "instapaper",
        "name": "Instapaper",
        "urlTemplate": "https://www.instapaper.com/edit?url=%s",
        "icon": "../icons/instapaper.svg",
        "color": "#1A1A1A",
        "copyOnly": false,
        "category": "Social"
    },
    {
        "id": "gmail",
        "name": "Gmail",
        "urlTemplate": "https://mail.google.com/mail/?ui=2&view=cm&fs=1&tf=1&su=Check%20out%20this%20page&body=%s",
        "icon": "../icons/gmail.svg",
        "color": "#EA4335",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "teams",
        "name": "Teams",
        "urlTemplate": "https://teams.microsoft.com/share?href=%s",
        "icon": "../icons/microsoft_teams.svg",
        "color": "#5059C9",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "translate",
        "name": "Translate",
        "urlTemplate": "https://translate.google.com/translate?u=%s",
        "icon": "../icons/google_translate.svg",
        "color": "#528ff5",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "evernote",
        "name": "Evernote",
        "urlTemplate": "https://www.evernote.com/clip.action?url=%s&title=webclip",
        "icon": "../icons/evernote.svg",
        "color": "#00A82D",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "threads",
        "name": "Threads",
        "urlTemplate": "https://www.threads.net/intent/post?text=%s",
        "icon": "../icons/threads.svg",
        "color": "#1A1A1A",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "sms",
        "name": "SMS",
        "urlTemplate": "sms:?&body=%s",
        "icon": "../icons/sms.svg",
        "color": "#6CBE45",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "outlook",
        "name": "Outlook",
        "urlTemplate": "https://outlook.live.com/mail/deeplink/compose?path=%2Fmail%2Finbox&subject=Check%20out%20this%20page&body=%s",
        "icon": "../icons/outlook_com.svg",
        "color": "#0072C6",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "classroom",
        "name": "Google Classroom",
        "urlTemplate": "https://classroom.google.com/share?url=%s",
        "icon": "../icons/google_classroom.svg",
        "color": "#FFC112",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "messenger",
        "name": "Facebook Messenger",
        "urlTemplate": "https://www.facebook.com/dialog/send?app_id=5303202981&display=popup&link=%s&redirect_uri=https%3a%2f%2fstatic.addtoany.com%2fmenu%2fthanks.html%23url%3d%s",
        "icon": "../icons/facebook_messenger.svg",
        "color": "#0084FF",
        "copyOnly": false,
        "category": "Productivity"
    },
    {
        "id": "flipboard",
        "name": "Flipboard",
        "urlTemplate": "https://share.flipboard.com/bookmarklet/popout?v=2&url=%s",
        "icon": "../icons/flipboard.svg",
        "color": "#C00",
        "copyOnly": false,
        "category": "Productivity"
    }
];
