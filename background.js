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

// Simulate generate cover letter (replace with actual API call)
async function generateCoverLetter(jobDescription) {
  try {
    // Placeholder logic - in real implementation, this would call your backend API
    const response = await fetch('https://cvtoletter.com/api/generate-cover-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ job_description: jobDescription })
    });

    if (!response.ok) {
      throw new Error('Failed to generate cover letter');
    }

    const data = await response.json();
    return data.cover_letter;
  } catch (error) {
    console.error('Cover letter generation error:', error);
    throw error;
  }
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Existing auth and logout handlers remain the same

  // Add new handler for cover letter generation
  if (message.action === 'generateCoverLetter') {
    // Check if job description is provided
    if (!message.jobDescription) {
      sendResponse({ success: false, error: 'No job description provided' });
      return true;
    }

    // Generate cover letter
    generateCoverLetter(message.jobDescription)
      .then(coverLetter => {
        sendResponse({ 
          success: true, 
          coverLetter: coverLetter 
        });
      })
      .catch(error => {
        console.error('Cover letter generation failed:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to generate cover letter' 
        });
      });

    // Return true to indicate async response
    return true;
  }
});
