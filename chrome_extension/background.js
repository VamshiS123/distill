// Background script to handle API requests (bypassing some CSP restrictions)

// Listen for messages from content script
try {
    // Check for chrome vs browser namespace (Firefox uses browser, Chrome uses chrome)
    const runtime = (typeof browser !== 'undefined') ? browser.runtime : chrome.runtime;

    runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'compress_prompt') {
            const { backendUrl, context, rate } = request;
            console.log(`[Background] Received compression request. URL: ${backendUrl}, Rate: ${rate}`);

            // Perform fetch in background context
            fetch(`${backendUrl}/compress_prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    context: [context],
                    rate: rate
                })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            throw new Error(`API Error: ${response.status} - ${text}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('[Background] Compression successful.');
                    sendResponse({ success: true, data: data });
                })
                .catch(error => {
                    console.error('[Background] Fetch Error:', error);
                    sendResponse({ success: false, error: error.message });
                });

            return true; // Indicates we will send a response asynchronously
        }
    });

    console.log('Distill background script loaded.');
} catch (e) {
    console.error('Error initializing background script:', e);
}
