let popup = null;
let activeModal = null; // Generic variable for any active modal
let isExpanded = false;
let ignoreNextMouseUp = false;

// --- Draggable Popup State ---
let isDragging = false;
let offsetX, offsetY;

// --- Main Event Listeners ---

document.addEventListener('mouseup', (e) => {
    // Stop dragging on any mouseup event
    if (isDragging) {
        isDragging = false;
        popup.classList.remove('dragging');
    }

    if (ignoreNextMouseUp) {
        ignoreNextMouseUp = false;
        return;
    }

    // Don't hide if clicking inside the popup or an active modal
    if ((popup && popup.contains(e.target)) || (activeModal && activeModal.contains(e.target))) {
        return;
    }

    // Use a timeout to allow for click events on buttons to fire
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const popupTop = Math.max(10, rect.top + window.scrollY - 45);
            const popupLeft = Math.max(10, rect.left + window.scrollX);
            showPopup(popupLeft, popupTop, selection);
        } else {
            hidePopup();
        }
    }, 10);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging && popup) {
        // Prevent default browser actions during drag
        e.preventDefault();
        popup.style.left = `${e.pageX - offsetX}px`;
        popup.style.top = `${e.pageY - offsetY}px`;
    }
});


// --- Popup Rendering and Management ---

function showPopup(x, y, selection) {
    isExpanded = false; // Reset expansion state on new selection
    renderPopup(x, y, selection);
}

function renderPopup(x, y, selection) {
    hidePopup(); // Clear any existing popup

    popup = document.createElement('div');
    popup.id = 'context-menu-popup';
    document.body.appendChild(popup);

    // Add drag functionality
    addDragHandlers(popup);

    const buttons = getButtonsForSelection(selection);

    let buttonsToShow = buttons;
    if (buttons.length > 5 && !isExpanded) {
        buttonsToShow = buttons.slice(0, 4);
        const expandButton = {
            label: '→',
            className: 'expand-btn',
            keepOpen: true,
            action: () => {
                isExpanded = true;
                ignoreNextMouseUp = true; // Prevent closing
                renderPopup(parseInt(popup.style.left), parseInt(popup.style.top), selection);
            }
        };
        buttonsToShow.push(expandButton);
    } else if (buttons.length > 5 && isExpanded) {
        const collapseButton = {
            label: '←',
            className: 'expand-btn',
            keepOpen: true,
            action: () => {
                isExpanded = false;
                ignoreNextMouseUp = true; // Prevent closing
                renderPopup(parseInt(popup.style.left), parseInt(popup.style.top), selection);
            }
        };
        buttonsToShow.push(collapseButton);
    }

    buttonsToShow.forEach(buttonConfig => {
        const button = document.createElement('button');
        button.textContent = buttonConfig.label;
        if (buttonConfig.className) button.classList.add(buttonConfig.className);

        button.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Stop the event from bubbling to the drag handler
            buttonConfig.action(selection);
            if (!buttonConfig.keepOpen) hidePopup();
        });
        popup.appendChild(button);
    });

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.display = 'flex';
}

function hidePopup() {
    if (popup) {
        popup.remove();
        popup = null;
    }
}

// --- Draggable Functionality ---

function addDragHandlers(element) {
    element.addEventListener('mousedown', (e) => {
        // Only start dragging if the mousedown is on the popup background, not a button
        if (e.target.id === 'context-menu-popup') {
            isDragging = true;
            element.classList.add('dragging');
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
        }
    });
}


// --- Button Definitions ---

function getButtonsForSelection(selection) {
    const selectedText = selection.toString();
    const isSingleWord = selectedText.trim().split(/\s+/).length === 1;
    const isLink = isValidUrl(selectedText.trim());

    const anchorNode = selection.anchorNode;
    const parentElement = anchorNode.nodeType === 3 ? anchorNode.parentNode : anchorNode;
    const isEditable = parentElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(parentElement.tagName);

    const allButtons = [
        { label: 'Copy', action: () => navigator.clipboard.writeText(selectedText) },
        { label: 'Search', action: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_blank') },
        { label: 'Translate', keepOpen: true, action: () => showTranslation(selectedText) },
        { label: 'Share', action: () => console.log('Share action triggered for:', selectedText) },
        {
            label: 'Select All',
            keepOpen: true,
            action: (sel) => {
                const elementToSelect = sel.getRangeAt(0).commonAncestorContainer.parentElement;
                if (elementToSelect) {
                    sel.selectAllChildren(elementToSelect);
                    ignoreNextMouseUp = true;
                }
            }
        },
        { label: 'Open Link', condition: isLink, action: () => window.open(selectedText.trim(), '_blank') },
        { label: 'Define', condition: isSingleWord && !isLink, keepOpen: true, action: () => showDefinition(selectedText.trim()) },
        { label: 'Cut', condition: isEditable, action: () => document.execCommand('cut') },
        { label: 'Paste', condition: isEditable, action: async () => { try { const text = await navigator.clipboard.readText(); document.execCommand('insertText', false, text); } catch (e) { console.error('Paste failed', e); } } },
        { label: 'Undo', condition: isEditable, action: () => document.execCommand('undo') },
        { label: 'Redo', condition: isEditable, action: () => document.execCommand('redo') },
    ];

    return allButtons.filter(btn => btn.condition !== false);
}

function isValidUrl(string) {
    try {
        new URL(string);
        return string.includes('.');
    } catch (_) {
        return false;
    }
}

// --- Modal Management ---

function hideActiveModal() {
    if (activeModal) {
        activeModal.remove();
        activeModal = null;
    }
}

function createModal(id, contentId) {
    hideActiveModal();
    activeModal = document.createElement('div');
    activeModal.id = id;
    activeModal.className = 'context-extension-modal-overlay';
    activeModal.addEventListener('click', (e) => {
        if (e.target.id === id) hideActiveModal();
    });

    const content = document.createElement('div');
    content.id = contentId;
    content.className = 'context-extension-modal-content';
    activeModal.appendChild(content);
    document.body.appendChild(activeModal);
    return content;
}

// --- Definition Modal ---

function showDefinition(word) {
    const content = createModal('definition-modal-overlay', 'definition-modal-content');
    content.innerHTML = `<div class="loading">Fetching definition...</div>`;

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(response => response.json())
        .then(data => {
            if (data.title === "No Definitions Found") {
                content.innerHTML = `<div class="error">${data.message}</div>`;
            } else {
                let html = `<h2>${word}</h2>`;
                data.forEach(entry => {
                    html += `<p><strong>Phonetic:</strong> ${entry.phonetic || 'N/A'}</p>`;
                    entry.meanings.forEach(meaning => {
                        html += `<h3><em>${meaning.partOfSpeech}</em></h3><ul>`;
                        meaning.definitions.forEach(def => {
                            html += `<li><strong>Definition:</strong> ${def.definition}<br/>${def.example ? `<em>Example: "${def.example}"</em>` : ''}</li>`;
                        });
                        html += '</ul>';
                    });
                });
                content.innerHTML = html;
            }
        })
        .catch(error => {
            console.error('Definition fetch error:', error);
            content.innerHTML = `<div class="error">Could not fetch definition.</div>`;
        });
}

// --- Translation Modal ---

function showTranslation(text) {
    const content = createModal('translation-modal-overlay', 'translation-modal-content');
    content.innerHTML = `<div class="loading">Translating...</div>`;

    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`) // Example: English to Spanish
        .then(response => response.json())
        .then(data => {
            if (data.responseData) {
                let html = `<h2>Translate</h2>`;
                html += `<p><strong>Original:</strong> ${text}</p>`;
                html += `<div class="translated-text">${data.responseData.translatedText}</div>`;
                html += `<p><small>Translated from English to Spanish. (Example)</small></p>`;
                content.innerHTML = html;
            } else {
                content.innerHTML = `<div class="error">Translation not available.</div>`;
            }
        })
        .catch(error => {
            console.error('Translation fetch error:', error);
            content.innerHTML = `<div class="error">Could not fetch translation.</div>`;
        });
}
