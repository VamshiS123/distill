// Inject styles
const style = document.createElement('style');
style.textContent = `
  .distill-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 9999;
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    color: white;
    border: none; 
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .distill-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0,0,0,0.15);
  }
  .distill-btn:active {
    transform: translateY(0);
  }
  .distill-btn.loading {
    opacity: 0.7;
    cursor: wait;
  }
`;
document.head.appendChild(style);

// Settings
let backendUrl = 'http://localhost:8000';
let compressionRate = 0.5;
let autoCompress = false;

// Load settings
chrome.storage.sync.get(['backendUrl', 'compressionRate', 'autoCompress'], (items) => {
  if (items.backendUrl) backendUrl = items.backendUrl;
  if (items.compressionRate) compressionRate = parseFloat(items.compressionRate);
  if (items.autoCompress !== undefined) autoCompress = items.autoCompress;
});

// Helper to find the input area
function findInputArea() {
  // 1. Try generic and specific selectors
  // ChatGPT uses #prompt-textarea
  // Gemini uses contenteditable="true" and role="textbox"
  const strategies = [
    () => document.getElementById('prompt-textarea'),
    () => document.querySelector('div[contenteditable="true"]'),
    () => document.querySelector('textarea:not([style*="display: none"])'),
    () => document.querySelector('[role="textbox"]'),
    // Fallback: Check active element if the user is typing
    () => {
      const active = document.activeElement;
      if (active && (active.isContentEditable || active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
        return active;
      }
      return null;
    }
  ];

  for (const strategy of strategies) {
    const el = strategy();
    if (el && el.isConnected && el.checkVisibility && el.checkVisibility()) return el;
    if (el && el.isConnected) return el; // Fallback if checkVisibility not supported
  }

  return null;
}

// Helper to get text from input
function getInputText(element) {
  if (!element) return null;

  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return element.value;
  } else {
    // For contenteditable div, sometimes innerText is weird
    // Check for <p> tags inside
    const paragraphs = element.querySelectorAll('p');
    if (paragraphs.length > 0) {
      return Array.from(paragraphs).map(p => p.textContent).join('\n');
    }
    return element.innerText || element.textContent;
  }
}

// Helper to set text to input
function setInputText(element, text) {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    element.value = text;
  } else {
    // If it has <p> tags, try to preserve structure? 
    // Usually replacing innerText puts it in one block. LLMs handle newlines fine.
    // But for ChatGPT, if we replace innerText directly, sometimes React gets confused.
    // Let's try to clear and create a <p>
    element.innerHTML = `<p>${text}</p>`;
  }

  // Dispatch events to trigger UI updates (React/Vue/etc)
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));

  // For some specific complex editors like ProseMirror (used by some LLMs), we might need more simulated events
  // Trying a keyup event
  // const event = new KeyboardEvent('keyup', {
  //   key: ' ',
  //   code: 'Space',
  //   charCode: 32,
  //   keyCode: 32,
  //   bubbles: true
  // });
  // element.dispatchEvent(event);
}

// Helper to find Send Button
function findSendButton(inputArea) {
  // Strategy: Look for button siblings or parent's siblings
  // ChatGPT: data-testid="send-button"
  // Gemini: aria-label="Send message" or similar

  // 1. Look globally/semi-globally if input is known
  let btn = document.querySelector('button[data-testid="send-button"]');
  if (btn) return btn;

  btn = document.querySelector('button[aria-label*="Send"]');
  if (btn) return btn;

  // 2. Look relative to input area (up 2-3 levels then querySelector)
  let parent = inputArea.parentElement;
  for (let i = 0; i < 4; i++) {
    if (!parent) break;
    // Look for button with Send label or SVG icon
    const send = parent.querySelector('button[aria-label*="Send"], button svg');

    if (send) {
      // If we found an SVG, get closest button
      if (send.tagName === 'svg' || send.tagName === 'SVG') {
        return send.closest('button');
      }
      return send;
    }
    parent = parent.parentElement;
  }
  return null;
}

// Inject button
function injectButton(inputArea) {
  // Check if button already exists in parent container
  const parent = inputArea.parentElement;
  if (parent.querySelector('.distill-btn')) return;

  // Make sure parent is relative for absolute positioning
  const computedStyle = window.getComputedStyle(parent);
  if (computedStyle.position === 'static') {
    parent.style.position = 'relative';
  }

  const btn = document.createElement('button');
  btn.className = 'distill-btn';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20L14 14V20L10 22V14L4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Distill
  `;

  // Define Reset Logic
  function resetBtn() {
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20L14 14V20L10 22V14L4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Distill
      `;
    // Ensure button is still attached
    if (!parent.contains(btn)) {
      parent.appendChild(btn);
    }
  }

  // Click Handler
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent submitting form
    console.log('Distill button clicked');

    // Re-acquire input area to avoid stale reference
    let currentInput = inputArea;
    if (!currentInput.isConnected) {
      console.log('original input detached, searching for new input...');
      const potentialInput = btn.parentElement.querySelector('div[contenteditable="true"], textarea');
      if (potentialInput) {
        currentInput = potentialInput;
        console.log('Found input relative to button parent.');
      } else {
        currentInput = findInputArea();
        console.log('Fallback to global search found:', currentInput);
      }
    }

    if (!currentInput) {
      console.error('Could not find input element.');
      alert('Could not find input element. Please refresh the page.');
      return;
    }

    const text = getInputText(currentInput);
    console.log('Input text found:', text ? text.substring(0, 50) + '...' : 'None');

    if (!text || text.trim().length === 0) return;

    btn.classList.add('loading');
    btn.innerHTML = 'Compressing...';

    try {
      console.log('Sending message to background script...');
      const runtime = (typeof browser !== 'undefined') ? browser.runtime : chrome.runtime;

      runtime.sendMessage({
        action: 'compress_prompt',
        backendUrl: backendUrl,
        context: text,
        rate: compressionRate
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime Error:', chrome.runtime.lastError);
          alert('Error communicating with extension background script.');
          btn.classList.remove('loading');
          resetBtn();
          return;
        }

        if (response && response.success) {
          const compressedText = response.data.compressed_prompt;
          console.log('Compression successful, setting text...');
          setInputText(currentInput, compressedText);
        } else {
          console.error('Distill API Error:', response ? response.error : 'Unknown error');
          alert('Failed to compress prompt. Is the backend running?');
        }

        btn.classList.remove('loading');
        resetBtn();
      });

    } catch (err) {
      console.error('Distill Error:', err);
      alert('Unexpected error in content script.');
      btn.classList.remove('loading');
      resetBtn();
    }
  });

  // Append NOW
  parent.appendChild(btn);

  // Auto-compress Logic: Listen for Enter key AND Send Button Click
  if (autoCompress) {
    let isProcessing = false;

    const handleAutoCompress = async (e, triggerType) => {
      if (isProcessing) return; // Allow re-triggered events through

      const text = getInputText(inputArea);
      if (text && text.trim().length > 10) {
        console.log(`Auto-compress triggered via ${triggerType}`);

        // Stop the site from seeing the event
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        btn.classList.add('loading');
        btn.innerHTML = 'Compressing...';

        isProcessing = true; // Set flag to allow re-trigger

        try {
          const runtime = (typeof browser !== 'undefined') ? browser.runtime : chrome.runtime;
          const response = await new Promise((resolve, reject) => {
            runtime.sendMessage({
              action: 'compress_prompt',
              backendUrl: backendUrl,
              context: text,
              rate: compressionRate
            }, (resp) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(resp);
            });
          });

          if (response && response.success) {
            const compressedText = response.data.compressed_prompt;
            setInputText(inputArea, compressedText);

            console.log('Auto-compression done. Dispatching original event...');
            btn.innerHTML = 'Compressed! Sending...';

            // Wait a tick for UI update
            setTimeout(() => {
              if (triggerType === 'Enter') {
                // Dispatch a new Enter key event
                const enterEvent = new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  charCode: 13,
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
                inputArea.dispatchEvent(enterEvent);
              } else if (triggerType === 'Click') {
                // Re-find button to be safe or use what triggered it if possible
                // But e.target might be stale if DOM changed? 
                // Best to re-find.
                const sendBtn = findSendButton(inputArea);
                if (sendBtn) sendBtn.click();
              }

              // Reset flag after dispatch
              setTimeout(() => {
                isProcessing = false;
                resetBtn();
              }, 500);
            }, 100);

          } else {
            console.error('Auto-compress failed:', response.error);
            isProcessing = false;
            resetBtn();
          }
        } catch (err) {
          console.error('Auto-compress error:', err);
          isProcessing = false;
          resetBtn();
        } finally {
          btn.classList.remove('loading');
        }
      }
    };

    // 1. Enter Key Listener (Capture Phase)
    if (!inputArea.dataset.distillEnterListener) {
      inputArea.dataset.distillEnterListener = 'true';
      inputArea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          await handleAutoCompress(e, 'Enter');
        }
      }, true);
    }

    // 2. Send Button Listener (Capture Phase)
    const sendBtn = findSendButton(inputArea);
    if (sendBtn) {
      console.log('Found Send Button:', sendBtn);
      if (!sendBtn.dataset.distillListener) {
        sendBtn.dataset.distillListener = 'true';
        sendBtn.addEventListener('click', async (e) => {
          await handleAutoCompress(e, 'Click');
        }, true);
      }
    } else {
      console.log('Could not find Send Button (yet). check MutationObserver.');
    }
  }
}

// Watch for changes
const observer = new MutationObserver((mutations) => {
  const inputArea = findInputArea();
  if (inputArea) {
    injectButton(inputArea);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial check
setTimeout(() => {
  const inputArea = findInputArea();
  if (inputArea) {
    injectButton(inputArea);
  }
}, 1000);
