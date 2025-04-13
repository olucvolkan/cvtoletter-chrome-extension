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

// Update user credits after generating a cover letter
async function updateUserCreditsAfterGeneration(userId) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user || !user.token) {
      throw new Error('User not authenticated');
    }
    
    // Call the API to update credits
    const response = await fetch(`${WEB_APP_URL}/api/user/decrement-credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        user_id: userId
      })
    });
    
    if (!response.ok) {
      console.error('Failed to update credits on server');
      // Don't throw here, just log the error and allow the process to continue
    }
    
    // Return latest credits count from API
    return await getUserCreditsFromAPI(userId);
  } catch (error) {
    console.error('Error updating credits:', error);
    // If there's an error, we'll return -1 to indicate we should use local calculation
    return -1;
  }
}