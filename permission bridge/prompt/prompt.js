document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get('requestId');
    const origin = params.get('origin');
    const permission = params.get('permission');
    const description = params.get('description');

    document.getElementById('origin').textContent = origin;
    document.getElementById('description').textContent = description;

    const buttons = document.querySelectorAll('.actions button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const decision = button.id;
            browser.runtime.sendMessage({
                type: 'promptDecision',
                payload: { requestId, decision, origin, permission }
            });
            window.close();
        });
    });
});