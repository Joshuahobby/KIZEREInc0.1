// This is a temporary mock implementation until Firebase is properly installed
// Firebase types (mock)
export interface UserCredential {
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
}

/**
 * Sign in with Google using popup (mock implementation)
 * @returns Promise with mock user credential
 */
export const signInWithGoogle = (): Promise<UserCredential> => {
  console.log("Mock Google sign-in called (Firebase not yet installed)");
  
  // Return a mock successful auth
  return Promise.resolve({
    user: {
      uid: "mock-uid-123",
      displayName: "Mock User",
      email: "mockuser@example.com",
      photoURL: null
    }
  });
};

/**
 * Sign out from Firebase (mock implementation)
 * @returns Promise<void>
 */
export const firebaseSignOut = (): Promise<void> => {
  console.log("Mock sign out called (Firebase not yet installed)");
  return Promise.resolve();
};

/**
 * Extract user information (mock implementation)
 * @param result Mock UserCredential
 * @returns User information object
 */
export const extractUserInfo = (result: UserCredential) => {
  const user = result.user;
  
  return {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL,
    token: "mock-token"
  };
};

// Mock auth and provider
export const auth = { currentUser: null };
export const googleProvider = {};