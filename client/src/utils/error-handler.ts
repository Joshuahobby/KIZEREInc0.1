import { toast } from "@/hooks/use-toast";

// Error types
interface ApiError extends Error {
  status?: number;
  details?: Record<string, any>;
}

// Function to check if an error is a response from the API
function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'status' in error;
}

// Function to extract error message from API response
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.message || data.error || response.statusText || 'An error occurred';
  } catch (e) {
    return response.statusText || 'An error occurred';
  }
}

// Main error handler function
export async function handleError(error: unknown): Promise<void> {
  console.error("Error encountered:", error);
  
  // Default error message
  let title = "Error";
  let description = "An unexpected error occurred. Please try again.";
  
  // Handle different error types
  if (isApiError(error)) {
    // API error with status code
    title = `Error ${error.status || ''}`;
    description = error.message;
    
    // Add more detailed logging in development
    if (process.env.NODE_ENV === 'development' && error.details) {
      console.error("Error details:", error.details);
    }
  } else if (error instanceof Error) {
    // Standard JS error
    title = error.name || "Error";
    description = error.message;
  } else if (typeof error === 'string') {
    // String error
    description = error;
  }
  
  // Show toast notification
  toast({
    variant: "destructive",
    title,
    description,
  });
}

// Function to create an API error from a response
export async function createApiError(response: Response): Promise<ApiError> {
  const message = await extractErrorMessage(response);
  const error = new Error(message) as ApiError;
  error.status = response.status;
  return error;
}

// Function to handle errors in try/catch blocks
export function catchErrorHandler(callback: (error: unknown) => void = handleError) {
  return (error: unknown) => {
    callback(error);
    // Return a default value if needed
    return null;
  };
}