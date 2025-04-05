// API utilities for the extension

const API_BASE_URL = 'https://covergen-wild-mountain-3122.fly.dev/api';
const WEB_APP_URL = 'https://cvtoletter.com';

// Get user credits from API
async function getUserCreditsFromAPI(userId) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user || !user.token) {
      throw new Error('User not authenticated');
    }
    
    // Call the API to get user credits
    const response = await fetch(`${WEB_APP_URL}/api/user/credits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user credits');
    }
    
    const data = await response.json();
    return data.credits || 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    return 0;
  }
}

// Generate cover letter
async function generateCoverLetter(userId, jobDescription) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user || !user.token) {
      throw new Error('User not authenticated');
    }
    
    // Call the API to generate cover letter
    const response = await fetch(`${WEB_APP_URL}/api/generate-cover-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        user_id: userId,
        job_description: jobDescription
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate cover letter');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
}