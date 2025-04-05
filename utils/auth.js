// Authentication utilities for the extension

// Get the current user from local storage or API
async function getCurrentUser() {
  // First check if we have user in storage
  const { user } = await chrome.storage.local.get('user');
  
  if (user) {
    return user;
  }
  
  // If no user in storage, we'll return null - user must explicitly sign in
  return null;
}

// Get auth token from Chrome identity API using direct approach
function getAuthToken() {
  // This function is not used in the non-interactive flow anymore
  // It's only kept for potential future use
  return Promise.resolve(null);
}

// Sign in with Google using the web auth flow
async function signInWithGoogle() {
  return new Promise((resolve, reject) => {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    
    // Create an auth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('redirect_uri', chrome.identity.getRedirectURL('oauth2'));
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
    
    console.log('Auth URL:', authUrl.toString());
    console.log('Redirect URL:', chrome.identity.getRedirectURL('oauth2'));
    
    // Launch the auth flow - ALWAYS interactive for explicit sign in
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true
      },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Auth flow error:', chrome.runtime.lastError.message);
          reject(new Error(`Auth flow error: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        if (!responseUrl) {
          console.error('No response URL received');
          reject(new Error('No response URL received'));
          return;
        }
        
        try {
          console.log('Response URL:', responseUrl);
          
          // Parse the token from the response URL
          const url = new URL(responseUrl);
          const fragmentParams = new URLSearchParams(url.hash.substring(1));
          const token = fragmentParams.get('access_token');
          
          if (!token) {
            console.error('No token found in response');
            reject(new Error('No token found in response'));
            return;
          }
          
          console.log('Token obtained successfully');
          
          // Get user info from Google
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            console.log('User info obtained:', userInfo.email);
            
            // Convert Google user format to our format
            const userData = {
              id: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              token
            };
            
            // Store user in local storage
            await chrome.storage.local.set({ user: userData });
            
            resolve(userData);
          } else {
            const errorText = await response.text();
            console.error('Failed to get user info:', response.status, errorText);
            reject(new Error(`Failed to get user info: ${response.status} ${errorText}`));
          }
        } catch (error) {
          console.error('Error processing auth response:', error);
          reject(error);
        }
      }
    );
  });
}

// Sign out
async function signOut() {
  // Just remove the user from storage
  return new Promise((resolve) => {
    chrome.storage.local.remove(['user', 'userCredits'], () => {
      resolve();
    });
  });
}