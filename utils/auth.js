// Authentication utilities for the extension

// Get the current user from local storage or API
async function getCurrentUser() {
  // First check if we have user in storage
  const { user } = await chrome.storage.local.get('user');
  
  if (user) {
    return user;
  }
  
  // If no user in storage, try to get from token
  try {
    const token = await getAuthToken();
    if (token) {
      // Get user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userInfo = await response.json();
        
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
        
        return userData;
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  
  return null;
}

// Get auth token from Chrome identity API using direct approach
function getAuthToken() {
  return new Promise((resolve, reject) => {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    
    // Use launchWebAuthFlow instead of getAuthToken
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('redirect_uri', chrome.identity.getRedirectURL('oauth2'));
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
    
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: false
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.log('Auth flow error (non-interactive):', chrome.runtime.lastError.message);
          resolve(null); // Not returning an error for non-interactive mode
          return;
        }
        
        if (!responseUrl) {
          resolve(null);
          return;
        }
        
        // Parse the token from the response URL
        const url = new URL(responseUrl);
        const fragmentParams = new URLSearchParams(url.hash.substring(1));
        const token = fragmentParams.get('access_token');
        
        if (token) {
          resolve(token);
        } else {
          reject(new Error('No token found in response'));
        }
      }
    );
  });
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
    
    // Launch the auth flow
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true
      },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Auth flow error: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        if (!responseUrl) {
          reject(new Error('No response URL received'));
          return;
        }
        
        try {
          // Parse the token from the response URL
          const url = new URL(responseUrl);
          const fragmentParams = new URLSearchParams(url.hash.substring(1));
          const token = fragmentParams.get('access_token');
          
          if (!token) {
            reject(new Error('No token found in response'));
            return;
          }
          
          // Get user info from Google
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            
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
            reject(new Error('Failed to get user info'));
          }
        } catch (error) {
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