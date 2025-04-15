// Content script for job description popup detection
function extractJobDescription() {
  // Common selectors for job descriptions on popular job sites
  const selectors = [
    // LinkedIn
    '.description__text',
    '.show-more-less-html__markup',
    
    // Indeed
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    
    // Glassdoor
    '.jobDescriptionContent',
    '.desc',
    
    // Monster
    '.job-description',
    
    // ZipRecruiter
    '.job_description',
    
    // Generic fallbacks
    '[data-testid="job-description"]',
    '[data-automation="jobDescription"]',
    '[class*="job-description"]',
    '[class*="jobDescription"]'
  ];

  // Try each selector
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        // Combine text from all matching elements
        let text = '';
        elements.forEach(el => {
          text += el.textContent + '\n';
        });
        return text.trim();
      }
    } catch (e) {
      // Ignore errors with individual selectors
    }
  }

  return null;
}

function createJobDescriptionPopup(jobDescription) {
  // Remove any existing popup
  const existingPopup = document.getElementById('cvtoletter-job-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'cvtoletter-job-popup';
  popup.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `;

  // Popup content
  popup.innerHTML = `
    <div style="padding: 12px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; color: #0070f3; font-size: 16px;">CvToLetter</h3>
      <button id="close-popup" style="background: none; border: none; color: #666; font-size: 20px; cursor: pointer;">&times;</button>
    </div>
    <div style="padding: 12px;">
      <button id="generate-cover-letter" style="
        width: 100%; 
        background-color: #0070f3; 
        color: white; 
        border: none; 
        padding: 10px; 
        border-radius: 4px; 
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        Generate Cover Letter
      </button>
    </div>
  `;

  // Add to body
  document.body.appendChild(popup);

  // Close button functionality
  const closeButton = popup.querySelector('#close-popup');
  closeButton.addEventListener('click', () => {
    popup.remove();
  });

  // Generate Cover Letter button functionality
  const generateButton = popup.querySelector('#generate-cover-letter');
  generateButton.addEventListener('click', () => {
    // Send message to background script to generate cover letter
    chrome.runtime.sendMessage({
      action: 'generateCoverLetter',
      jobDescription: jobDescription
    }, response => {
      // Handle response (show loading, success, etc.)
      if (response.success) {
        // Update button to show copied state
        generateButton.textContent = 'Copied!';
        generateButton.style.backgroundColor = '#48bb78';
        
        // Copy to clipboard
        navigator.clipboard.writeText(response.coverLetter);
        
        // Revert back after 2 seconds
        setTimeout(() => {
          generateButton.textContent = 'Generate Cover Letter';
          generateButton.style.backgroundColor = '#0070f3';
        }, 2000);
      } else {
        // Show error
        generateButton.textContent = 'Error Generating';
        generateButton.style.backgroundColor = '#e53e3e';
      }
    });
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'detectJobDescription') {
    const jobDescription = extractJobDescription();
    if (jobDescription) {
      createJobDescriptionPopup(jobDescription);
      sendResponse({ found: true });
    } else {
      sendResponse({ found: false });
    }
    return true; // Important for async response
  }
});
