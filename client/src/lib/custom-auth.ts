import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

/**
 * Custom authentication functions as backup only
 * As requested by the user, we're using Firebase's popup method for authentication
 * This module is kept for backward compatibility but isn't actively used
 */

// Helper function to generate a random state token for CSRF protection
function generateStateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

/**
 * Opens a new window to the Google Authentication URL with the correct parameters
 * NOTE: This function is no longer recommended. Use firebase.ts signInWithGoogle instead
 * which uses the popup method as requested.
 * 
 * @param redirectPath The path to redirect to after successful authentication (e.g. '/dashboard')
 * @returns A promise that resolves when the popup is opened
 * @deprecated Use signInWithGoogle from firebase.ts instead
 */
export function openGoogleAuthWindow(redirectPath: string = '/dashboard'): Promise<{ success: boolean, user?: any, error?: string }> {
  console.warn('[CustomAuth] This method is deprecated. Use signInWithGoogle from firebase.ts instead');
  
  return new Promise((resolve) => {
    try {
      // Get the Firebase app instance
      const app = getApp();
      const auth = getAuth(app);
      
      // Required parameters
      const apiKey = app.options.apiKey;
      if (!apiKey) {
        throw new Error('Firebase API key not available');
      }
      
      // Generate state token for CSRF protection
      const stateToken = generateStateToken();
      localStorage.setItem('auth_state_token', stateToken);
      localStorage.setItem('auth_redirect_path', redirectPath);
      localStorage.setItem('auth_start_time', Date.now().toString());

      // Prepare Google OAuth URL parameters
      // Instead of using Firebase's built-in handlers, we'll use our own custom endpoint
      const redirectUri = `${window.location.origin}/api/auth/google-callback`;

      // These are the standard OAuth parameters
      const oauthParams = new URLSearchParams({
        client_id: '407408718192.apps.googleusercontent.com', // This is a well-known Google client ID used by Firebase
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'email profile',
        state: stateToken
      });
      
      // Get Firebase project config for OAuth
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
      
      // Create Firebase OAuth client ID based on project ID
      const firebaseOAuthClientId = `${firebaseConfig.projectId}.apps.googleusercontent.com`;
      
      // Update oauthParams with actual client ID
      oauthParams.set('client_id', firebaseOAuthClientId);
      
      // Build the full Google OAuth URL
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/auth?${oauthParams.toString()}`;
      
      console.log('[CustomAuth] Opening Google auth window with URL params:', {
        client_id: firebaseOAuthClientId,
        redirect_uri: redirectUri,
        state: stateToken
      });
      
      // Open the popup window
      const popup = window.open(
        googleOAuthUrl,
        'googleAuthPopup',
        'width=500,height=600,top=50,left=50'
      );
      
      // Check if popup was blocked
      if (!popup || popup.closed) {
        console.error('[CustomAuth] Popup was blocked by browser');
        resolve({ 
          success: false, 
          error: 'Authentication popup was blocked by the browser. Please enable popups for this site and try again.' 
        });
        return;
      }
      
      // Setup message listener for the popup to communicate back
      const messageListener = (event: MessageEvent) => {
        // Verify origin - only accept messages from our own domain
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data?.type === 'google_auth_success') {
          const { user, token } = event.data;
          console.log('[CustomAuth] Received successful auth message from popup');
          
          // Clean up
          window.removeEventListener('message', messageListener);
          if (!popup.closed) {
            popup.close();
          }
          
          // Resolve the promise with the user data
          resolve({
            success: true,
            user
          });
        } else if (event.data?.type === 'google_auth_error') {
          const { error } = event.data;
          console.error('[CustomAuth] Error in auth popup:', error);
          
          // Clean up
          window.removeEventListener('message', messageListener);
          if (!popup.closed) {
            popup.close();
          }
          
          // Resolve with error
          resolve({
            success: false,
            error: error || 'Authentication failed'
          });
        }
      };
      
      // Add message listener
      window.addEventListener('message', messageListener);
      
      // Handle popup closing
      const checkClosedInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', messageListener);
          
          // If we didn't receive a message but the popup closed,
          // assume the user cancelled the process
          resolve({
            success: false,
            error: 'Authentication cancelled by user'
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error('[CustomAuth] Error opening Google auth popup:', error);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during authentication'
      });
    }
  });
}

/**
 * Check if we have a pending OAuth state token in localStorage
 * This helps us determine if we're in the middle of an authentication flow
 * 
 * @returns Boolean indicating if authentication is pending
 */
export function hasAuthPending(): boolean {
  const stateToken = localStorage.getItem('auth_state_token');
  const startTime = localStorage.getItem('auth_start_time');
  
  if (!stateToken || !startTime) {
    return false;
  }
  
  // Check if the auth attempt is recent (less than 10 minutes old)
  const startTimeMs = parseInt(startTime, 10);
  const now = Date.now();
  const tenMinutesMs = 10 * 60 * 1000;
  
  return !isNaN(startTimeMs) && (now - startTimeMs < tenMinutesMs);
}

/**
 * Get the pending auth state data
 * 
 * @returns Object with state token and redirect path, or null if no auth pending
 */
export function getPendingAuthData() {
  if (!hasAuthPending()) {
    return null;
  }
  
  return {
    stateToken: localStorage.getItem('auth_state_token'),
    redirectPath: localStorage.getItem('auth_redirect_path')
  };
}

/**
 * Clear pending auth data from localStorage
 */
export function clearPendingAuthData() {
  localStorage.removeItem('auth_state_token');
  localStorage.removeItem('auth_redirect_path');
  localStorage.removeItem('auth_start_time');
}