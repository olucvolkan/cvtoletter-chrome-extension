// Handle authentication events and token management in the background

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    // First install
    console.log('Extension installed');
    // Open onboarding page
    chrome.tabs.create({
      url: 'https://cvtoletter.com/extension-welcome'
    });
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated from version ' + details.previousVersion);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle auth requests from popup
  if (message.action === 'getAuthToken') {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, token });
      }
    });
    return true; // Keep the message channel open for async response
  }
  
  // Handle logout requests from popup
  else if (message.action === 'logout') {
    chrome.identity.getAuthToken({ interactive: false }, token => {
      if (token) {
        // Revoke token
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .then(() => {
            // Clear token
            chrome.identity.removeCachedAuthToken({ token }, () => {
              sendResponse({ success: true });
            });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // Keep the message channel open for async response
  }
  
  // Handle job description extraction requests
  else if (message.action === 'extractJobDescription') {
    // This will be handled by the content script
    chrome.tabs.sendMessage(sender.tab.id, { action: 'extractJobDescription' }, response => {
      sendResponse(response);
    });
    return true; // Keep the message channel open for async response
  }
});