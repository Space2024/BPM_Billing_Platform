/**
 * User ID Management
 * Generates and manages a unique user identifier for tracking and preventing duplicates
 */

const USER_ID_KEY = "blupeacock_user_id";
const SESSION_ID_KEY = "blupeacock_session_id";

/**
 * Generate a unique ID using timestamp + random string
 */
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Get or create a persistent user ID (stored in localStorage)
 * This ID persists across sessions and represents the device/browser
 */
export function getUserId(): string {
  if (typeof window === "undefined") {
    // Server-side: generate a temporary ID
    return `server-${generateUniqueId()}`;
  }

  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      userId = `user-${generateUniqueId()}`;
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn("localStorage not available, using temporary user ID");
    return `temp-${generateUniqueId()}`;
  }
}

/**
 * Get or create a session ID (stored in sessionStorage)
 * This ID is unique per browser tab/session
 */
export function getSessionId(): string {
  if (typeof window === "undefined") {
    // Server-side: generate a temporary ID
    return `server-session-${generateUniqueId()}`;
  }

  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      sessionId = `session-${generateUniqueId()}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    console.warn("sessionStorage not available, using temporary session ID");
    return `temp-session-${generateUniqueId()}`;
  }
}

/**
 * Get a combined tracking ID that includes both user and session
 */
export function getTrackingId(): string {
  return `${getUserId()}|${getSessionId()}`;
}

/**
 * Generate a unique request ID for each API call
 * Format: userId|sessionId|timestamp|random
 */
export function generateRequestId(): string {
  const userId = getUserId();
  const sessionId = getSessionId();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  
  return `${userId}|${sessionId}|${timestamp}|${random}`;
}

/**
 * Clear user ID (useful for testing or logout)
 */
export function clearUserId(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(USER_ID_KEY);
    } catch (error) {
      console.warn("Failed to clear user ID");
    }
  }
}

/**
 * Clear session ID
 */
export function clearSessionId(): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_ID_KEY);
    } catch (error) {
      console.warn("Failed to clear session ID");
    }
  }
}

/**
 * Get user metadata for API calls
 */
export function getUserMetadata() {
  return {
    userId: getUserId(),
    sessionId: getSessionId(),
    trackingId: getTrackingId(),
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
  };
}
