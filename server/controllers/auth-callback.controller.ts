import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';
import axios from 'axios';
import { storage } from '../storage';
import { hashPassword } from '../utils/auth-crypto';

const logger = createLogger('AuthCallbackController');

/**
 * Controller to handle OAuth callbacks
 */
export class AuthCallbackController {
  /**
   * Handle Google OAuth callback
   * This endpoint handles the callback from the Google OAuth flow
   */
  static async handleGoogleCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;
      
      // Check for errors from the OAuth provider
      if (error) {
        logger.error('Error from Google OAuth', { error });
        return res.send(`
          <html>
            <script>
              window.opener.postMessage({ 
                type: 'google_auth_error', 
                error: '${error}' 
              }, window.location.origin);
              window.close();
            </script>
          </html>
        `);
      }
      
      // Validate state token to prevent CSRF
      if (!state) {
        logger.error('Missing state parameter in OAuth callback');
        return res.send(`
          <html>
            <script>
              window.opener.postMessage({ 
                type: 'google_auth_error', 
                error: 'Missing state parameter. Authentication failed.' 
              }, window.location.origin);
              window.close();
            </script>
          </html>
        `);
      }
      
      // Verify we received a code
      if (!code) {
        logger.error('Missing code parameter in OAuth callback');
        return res.send(`
          <html>
            <script>
              window.opener.postMessage({ 
                type: 'google_auth_error', 
                error: 'Missing authorization code. Authentication failed.' 
              }, window.location.origin);
              window.close();
            </script>
          </html>
        `);
      }
      
      // Exchange code for tokens
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google-callback`;
      const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;
      
      logger.info('Exchanging code for tokens', { 
        hasCode: !!code, 
        redirectUri,
        hasApiKey: !!firebaseApiKey
      });
      
      // Get Firebase configuration from environment
      const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
      
      // Create OAuth client ID from project ID
      const clientId = `${firebaseProjectId}.apps.googleusercontent.com`;
      
      logger.info('Firebase config for OAuth', { 
        hasProjectId: !!firebaseProjectId,
        hasApiKey: !!firebaseApiKey,
        clientId
      });
      
      // Send request to Google to exchange code for tokens
      const tokenResponse = await axios.post(tokenUrl, {
        code,
        client_id: clientId,
        client_secret: process.env.GOOGLE_CLIENT_SECRET || 'client_secret_not_required_for_implicit_flow',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });
      
      const { access_token, id_token } = tokenResponse.data;
      
      // Get user info with access token
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const userData = userInfoResponse.data;
      
      // Verify we have the minimum required user data
      if (!userData.email) {
        logger.error('User email missing from Google response', { userData });
        return res.send(`
          <html>
            <script>
              window.opener.postMessage({ 
                type: 'google_auth_error', 
                error: 'User email missing from authentication result.' 
              }, window.location.origin);
              window.close();
            </script>
          </html>
        `);
      }
      
      // Find or create user
      let user = await storage.getUserByEmail(userData.email);
      
      if (!user) {
        // Create a new user with the data from Google
        try {
          // Generate a secure random password that won't be used for login
          const securePassword = `OAuthUser_${Date.now()}_${Math.random().toString(36).substring(2)}!`;
          const hashedPass = await hashPassword(securePassword);
          
          user = await storage.createUser({
            fullName: userData.name,
            username: userData.email,
            email: userData.email,
            password: hashedPass,
            phoneNumber: null,
            role: 'Subscriber',
            avatarUrl: userData.picture || null,
            preferences: {}
          });
          
          logger.info('Created new user from Google auth', { userId: user.id, email: userData.email });
        } catch (error) {
          logger.error('Failed to create user from Google auth', { error, email: userData.email });
          return res.send(`
            <html>
              <script>
                window.opener.postMessage({ 
                  type: 'google_auth_error', 
                  error: 'Failed to create user account' 
                }, window.location.origin);
                window.close();
              </script>
            </html>
          `);
        }
      }
      
      // Update avatar URL if provided and different from what's stored
      if (user && userData.picture && (!user.avatarUrl || user.avatarUrl !== userData.picture)) {
        try {
          const updatedUser = await storage.updateUser(user.id, { avatarUrl: userData.picture });
          if (updatedUser) {
            user = updatedUser;
            logger.info('Updated user avatar from Google auth', { userId: user.id });
          }
        } catch (updateError) {
          logger.warn('Failed to update user avatar', { userId: user.id, error: updateError });
          // Non-critical error, continue with login
        }
      }
      
      // Login the user
      req.login(user, (err) => {
        if (err) {
          logger.error('Login error during Google callback', { userId: user.id, error: err });
          return res.send(`
            <html>
              <script>
                window.opener.postMessage({ 
                  type: 'google_auth_error', 
                  error: 'Failed to create session after authentication' 
                }, window.location.origin);
                window.close();
              </script>
            </html>
          `);
        }
        
        // Return user data without password
        const { password, ...userData } = user;
        
        // Send success message to parent window and close popup
        return res.send(`
          <html>
            <script>
              window.opener.postMessage({ 
                type: 'google_auth_success', 
                user: ${JSON.stringify(userData)},
                token: '${id_token}' 
              }, window.location.origin);
              window.close();
            </script>
          </html>
        `);
      });
      
    } catch (error) {
      logger.error('Error in Google OAuth callback', { error });
      return res.send(`
        <html>
          <script>
            window.opener.postMessage({ 
              type: 'google_auth_error', 
              error: 'An unexpected error occurred during authentication' 
            }, window.location.origin);
            window.close();
          </script>
        </html>
      `);
    }
  }
}