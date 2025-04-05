document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const loginState = document.getElementById('login-state');
  const userProfile = document.getElementById('user-profile');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const userAvatar = document.getElementById('user-avatar');
  const userCredits = document.getElementById('user-credits');
  const jobDescription = document.getElementById('job-description');
  const detectionStatus = document.getElementById('detection-status');
  const generateButton = document.getElementById('generate-button');
  const resultSection = document.getElementById('result-section');
  const coverLetterText = document.getElementById('cover-letter-text');
  const copyButton = document.getElementById('copy-button');
  const newButton = document.getElementById('new-button');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const errorMessage = document.getElementById('error-message');
  const errorDismiss = document.getElementById('error-dismiss');

  // Initialize auth state
  initializeAuthState();

  // Event Listeners
  loginButton.addEventListener('click', handleLogin);
  logoutButton.addEventListener('click', handleLogout);
  generateButton.addEventListener('click', handleGenerateCoverLetter);
  copyButton.addEventListener('click', handleCopyToClipboard);
  newButton.addEventListener('click', handleCreateNew);
  errorDismiss.addEventListener('click', () => {
    errorState.classList.add('hidden');
  });

  // Check for job description on the current page
  await detectJobDescription();

  // Listen for changes in the job description textarea
  jobDescription.addEventListener('input', () => {
    generateButton.disabled = !jobDescription.value.trim() || !isLoggedIn() || getUserCredits() <= 0;
  });

  // Initialize authentication state
  async function initializeAuthState() {
    const user = await getCurrentUser();
    
    if (user) {
      // User is logged in
      showUserProfile(user);
      // Fetch user credits
      try {
        const credits = await getUserCreditsFromAPI(user.id);
        updateUserCredits(credits);
      } catch (error) {
        console.error('Error fetching user credits:', error);
      }
    } else {
      // User is not logged in
      showLoginState();
    }

    // Update generate button state
    updateGenerateButton();
  }

  // Show login state
  function showLoginState() {
    loginState.classList.remove('hidden');
    userProfile.classList.add('hidden');
  }

  // Show user profile
  function showUserProfile(user) {
    loginState.classList.add('hidden');
    userProfile.classList.remove('hidden');
    
    // Update user info
    userName.textContent = user.name || 'User';
    userEmail.textContent = user.email || '';
    if (user.picture) {
      userAvatar.src = user.picture;
    } else {
      // Default avatar based on initials
      userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0D8ABC&color=fff`;
    }
  }

  // Handle login
  async function handleLogin() {
    try {
      const user = await signInWithGoogle();
      if (user) {
        showUserProfile(user);
        // Fetch user credits
        const credits = await getUserCreditsFromAPI(user.id);
        updateUserCredits(credits);
        updateGenerateButton();
      }
    } catch (error) {
      showError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  }

  // Handle logout
  async function handleLogout() {
    try {
      await signOut();
      showLoginState();
      updateUserCredits(0);
      updateGenerateButton();
    } catch (error) {
      showError('Logout failed. Please try again.');
      console.error('Logout error:', error);
    }
  }

  // Update user credits display
  function updateUserCredits(credits) {
    userCredits.textContent = credits;
    // Store credits in local storage
    chrome.storage.local.set({ 'userCredits': credits });
    // Update generate button state
    updateGenerateButton();
  }

  // Get user credits from local storage
  function getUserCredits() {
    return parseInt(userCredits.textContent) || 0;
  }

  // Update generate button state
  function updateGenerateButton() {
    const hasJobDescription = jobDescription.value.trim().length > 0;
    const hasCredits = getUserCredits() > 0;
    const isUserLoggedIn = isLoggedIn();
    
    generateButton.disabled = !hasJobDescription || !isUserLoggedIn || !hasCredits;
    
    if (!isUserLoggedIn) {
      generateButton.textContent = 'Please log in';
    } else if (!hasCredits) {
      generateButton.textContent = 'Purchase Credits to Generate';
    } else {
      generateButton.textContent = 'Generate Cover Letter (1 Credit)';
    }
  }

  // Detect job description from the current page
  async function detectJobDescription() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        detectionStatus.textContent = 'No active tab detected.';
        return;
      }

      // Inject content script to extract job description
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractJobDescription,
      });

      // Process results
      if (results && results[0] && results[0].result) {
        const extractedText = results[0].result;
        if (extractedText) {
          jobDescription.value = extractedText;
          detectionStatus.textContent = 'Job description detected!';
          detectionStatus.style.color = '#4caf50';
          updateGenerateButton();
        } else {
          detectionStatus.textContent = 'No job description detected. You can paste one manually.';
          detectionStatus.style.color = '#ff9800';
        }
      } else {
        detectionStatus.textContent = 'Could not scan this page. You can paste a job description manually.';
        detectionStatus.style.color = '#f44336';
      }
    } catch (error) {
      console.error('Error detecting job description:', error);
      detectionStatus.textContent = 'Error scanning page. You can paste a job description manually.';
      detectionStatus.style.color = '#f44336';
    }
  }

  // Function to be injected into the page
  function extractJobDescription() {
    // This function runs in the context of the webpage
    function getJobDescriptionFromPage() {
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
        '[class*="jobDescription"]',
        'section:contains("job description")',
        'div:contains("job description")',
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

      // Fallback: look for job description using text content
      try {
        // Find headings that might indicate job description sections
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'));
        for (const heading of headings) {
          if (heading.textContent.toLowerCase().includes('job description') || 
              heading.textContent.toLowerCase().includes('description') ||
              heading.textContent.toLowerCase().includes('about the job')) {
            
            // Get the parent element and its next sibling or children
            const parent = heading.parentElement;
            const nextSibling = heading.nextElementSibling;
            
            if (nextSibling) {
              return nextSibling.textContent.trim();
            } else if (parent.nextElementSibling) {
              return parent.nextElementSibling.textContent.trim();
            } else if (parent.children.length > 1) {
              // Get all text after the heading
              let text = '';
              let found = false;
              for (const child of parent.children) {
                if (found) {
                  text += child.textContent + '\n';
                } else if (child === heading) {
                  found = true;
                }
              }
              return text.trim();
            }
          }
        }
      } catch (e) {
        // Ignore errors in fallback method
      }

      return null;
    }

    return getJobDescriptionFromPage();
  }

  // Handle generate cover letter
  async function handleGenerateCoverLetter() {
    const jobDescriptionText = jobDescription.value.trim();
    if (!jobDescriptionText) {
      showError('Please enter a job description.');
      return;
    }

    if (!isLoggedIn()) {
      showError('You must be logged in to generate a cover letter.');
      return;
    }

    const credits = getUserCredits();
    if (credits <= 0) {
      showError('You need credits to generate a cover letter. Please purchase credits from the website.');
      return;
    }

    try {
      // Show loading state
      showLoadingState();

      // Get user information
      const user = await getCurrentUser();
      if (!user || !user.id) {
        throw new Error('User information not available.');
      }

      // Generate cover letter
      const result = await generateCoverLetter(user.id, jobDescriptionText);
      
      // Update credits (subtract 1)
      updateUserCredits(credits - 1);
      
      // Show result
      showResultState(result.cover_letter);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      showError(error.message || 'Failed to generate cover letter. Please try again.');
      hideLoadingState();
    }
  }

  // Handle copy to clipboard
  function handleCopyToClipboard() {
    const text = coverLetterText.textContent;
    navigator.clipboard.writeText(text)
      .then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy to Clipboard';
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        showError('Failed to copy text. Please try selecting and copying manually.');
      });
  }

  // Handle create new
  function handleCreateNew() {
    // Reset the UI to initial state
    coverLetterText.textContent = '';
    resultSection.classList.add('hidden');
    updateGenerateButton();
  }

  // Show loading state
  function showLoadingState() {
    loadingState.classList.remove('hidden');
    generateButton.disabled = true;
  }

  // Hide loading state
  function hideLoadingState() {
    loadingState.classList.add('hidden');
    updateGenerateButton();
  }

  // Show result state
  function showResultState(coverLetter) {
    hideLoadingState();
    coverLetterText.textContent = coverLetter;
    resultSection.classList.remove('hidden');
  }

  // Show error
  function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
  }

  // Check if user is logged in
  function isLoggedIn() {
    return userProfile.classList.contains('hidden') === false;
  }
});