document.addEventListener('DOMContentLoaded', () => {
    const backendUrlInput = document.getElementById('backendUrl');
    const compressionRateInput = document.getElementById('compressionRate');
    const autoCompressInput = document.getElementById('autoCompress');
    const saveButton = document.getElementById('save');
    const statusEl = document.getElementById('status');

    // Load saved settings
    chrome.storage.sync.get(['backendUrl', 'compressionRate', 'autoCompress'], (items) => {
        backendUrlInput.value = items.backendUrl || 'http://localhost:8000';
        compressionRateInput.value = items.compressionRate || '0.5';
        autoCompressInput.checked = items.autoCompress || false;
    });

    // Save settings
    saveButton.addEventListener('click', () => {
        const backendUrl = backendUrlInput.value;
        const compressionRate = compressionRateInput.value;
        const autoCompress = autoCompressInput.checked;

        chrome.storage.sync.set({
            backendUrl: backendUrl,
            compressionRate: compressionRate,
            autoCompress: autoCompress
        }, () => {
            // Update status to let user know options were saved.
            statusEl.style.display = 'block';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 2000);
        });
    });
});
