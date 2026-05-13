/**
 * Example Usage of User ID Utilities
 * 
 * This file demonstrates how to use the user ID utilities
 * for tracking and preventing duplicates in your application.
 */

import {
  getUserId,
  getSessionId,
  generateRequestId,
  getTrackingId,
  getUserMetadata,
  clearUserId,
  clearSessionId,
} from "@/lib/user-id";

// ─── Example 1: Get User Identifiers ──────────────────────────────────────────

export function exampleGetIdentifiers() {
  // Get persistent user ID (same across sessions)
  const userId = getUserId();
  console.log("User ID:", userId);
  // Output: user-lm3k9x-8h2j5k9p3q

  // Get session ID (unique per tab/session)
  const sessionId = getSessionId();
  console.log("Session ID:", sessionId);
  // Output: session-lm3k9y-9i3k6l0q4r

  // Generate unique request ID for an API call
  const requestId = generateRequestId();
  console.log("Request ID:", requestId);
  // Output: user-lm3k9x-8h2j5k9p3q|session-lm3k9y-9i3k6l0q4r|1715625600000|a7b8c9d

  // Get combined tracking ID
  const trackingId = getTrackingId();
  console.log("Tracking ID:", trackingId);
  // Output: user-lm3k9x-8h2j5k9p3q|session-lm3k9y-9i3k6l0q4r
}

// ─── Example 2: Get Complete User Metadata ────────────────────────────────────

export function exampleGetMetadata() {
  const metadata = getUserMetadata();
  console.log("User Metadata:", metadata);
  
  /* Output:
  {
    userId: "user-lm3k9x-8h2j5k9p3q",
    sessionId: "session-lm3k9y-9i3k6l0q4r",
    trackingId: "user-lm3k9x-8h2j5k9p3q|session-lm3k9y-9i3k6l0q4r",
    timestamp: "2024-05-13T10:30:00.000Z",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
  }
  */
}

// ─── Example 3: Custom API Call with User ID ──────────────────────────────────

export async function exampleCustomApiCall() {
  const requestId = generateRequestId();
  const userId = getUserId();
  const sessionId = getSessionId();

  try {
    const response = await fetch("https://api.example.com/endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include unique identifiers to prevent duplicates
        "X-Request-ID": requestId,
        "X-User-ID": userId,
        "X-Session-ID": sessionId,
      },
      body: JSON.stringify({
        data: "your data here",
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// ─── Example 4: Track User Actions ────────────────────────────────────────────

export function exampleTrackUserAction(action: string, data?: any) {
  const metadata = getUserMetadata();

  // Log to analytics service
  console.log("User Action:", {
    action,
    data,
    ...metadata,
  });

  // Send to analytics endpoint
  fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": metadata.userId,
      "X-Session-ID": metadata.sessionId,
    },
    body: JSON.stringify({
      action,
      data,
      timestamp: metadata.timestamp,
    }),
  }).catch(console.error);
}

// ─── Example 5: Prevent Duplicate Form Submissions ────────────────────────────

export async function examplePreventDuplicateSubmission(formData: any) {
  const requestId = generateRequestId();
  
  // Store request ID to prevent duplicate submissions
  const submittedRequests = new Set<string>(
    JSON.parse(sessionStorage.getItem("submitted_requests") || "[]")
  );

  // Check if this request was already submitted
  if (submittedRequests.has(requestId)) {
    console.warn("Duplicate submission detected!");
    return { error: "This form was already submitted" };
  }

  try {
    // Submit the form
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        "X-User-ID": getUserId(),
        "X-Session-ID": getSessionId(),
      },
      body: JSON.stringify(formData),
    });

    // Mark request as submitted
    submittedRequests.add(requestId);
    sessionStorage.setItem(
      "submitted_requests",
      JSON.stringify(Array.from(submittedRequests))
    );

    return await response.json();
  } catch (error) {
    console.error("Submission failed:", error);
    throw error;
  }
}

// ─── Example 6: Clear IDs (for testing or logout) ─────────────────────────────

export function exampleClearIdentifiers() {
  // Clear user ID (will generate new one on next access)
  clearUserId();
  console.log("User ID cleared");

  // Clear session ID (will generate new one on next access)
  clearSessionId();
  console.log("Session ID cleared");

  // Clear submitted requests
  sessionStorage.removeItem("submitted_requests");
  console.log("Submitted requests cleared");
}

// ─── Example 7: React Component Usage ─────────────────────────────────────────

export function exampleReactComponent() {
  // This is a pseudo-code example showing how to use in React components
  
  /*
  import { getUserId, generateRequestId } from "@/lib/user-id";
  import { useState, useEffect } from "react";

  export function MyComponent() {
    const [userId, setUserId] = useState<string>("");

    useEffect(() => {
      // Get user ID when component mounts
      setUserId(getUserId());
    }, []);

    const handleSubmit = async () => {
      const requestId = generateRequestId();
      
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "X-Request-ID": requestId,
          "X-User-ID": userId,
        },
        body: JSON.stringify({ data: "example" }),
      });

      const result = await response.json();
      console.log("Result:", result);
    };

    return (
      <div>
        <p>User ID: {userId}</p>
        <button onClick={handleSubmit}>Submit</button>
      </div>
    );
  }
  */
}

// ─── Example 8: Server-Side Usage (Next.js API Route) ─────────────────────────

export function exampleServerSideUsage() {
  // This is a pseudo-code example for Next.js API routes
  
  /*
  // pages/api/example.ts
  import type { NextApiRequest, NextApiResponse } from "next";

  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    // Extract unique identifiers from headers
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const sessionId = req.headers["x-session-id"] as string;

    // Check for duplicate requests
    const isDuplicate = await checkDuplicateRequest(requestId);
    if (isDuplicate) {
      return res.status(409).json({ error: "Duplicate request" });
    }

    // Log the request
    console.log("API Request:", {
      requestId,
      userId,
      sessionId,
      method: req.method,
      url: req.url,
    });

    // Process the request
    const result = await processRequest(req.body);

    // Mark request as processed
    await markRequestProcessed(requestId);

    return res.status(200).json(result);
  }

  async function checkDuplicateRequest(requestId: string): Promise<boolean> {
    // Check in database or cache
    // Return true if request was already processed
    return false;
  }

  async function markRequestProcessed(requestId: string): Promise<void> {
    // Store in database or cache
    // Mark this request ID as processed
  }

  async function processRequest(data: any): Promise<any> {
    // Your business logic here
    return { success: true };
  }
  */
}
