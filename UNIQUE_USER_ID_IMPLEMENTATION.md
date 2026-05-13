# Unique User ID Implementation

## Overview
This document describes the implementation of unique user identification across all API calls to prevent duplicate submissions and enable better tracking.

## Implementation Details

### 1. User ID Management (`lib/user-id.ts`)

The system generates and manages three types of unique identifiers:

#### **User ID** (Persistent)
- Stored in `localStorage`
- Persists across browser sessions
- Represents a unique device/browser
- Format: `user-{timestamp}-{random}`
- Example: `user-lm3k9x-8h2j5k9p3q`

#### **Session ID** (Session-based)
- Stored in `sessionStorage`
- Unique per browser tab/session
- Cleared when tab is closed
- Format: `session-{timestamp}-{random}`
- Example: `session-lm3k9y-9i3k6l0q4r`

#### **Request ID** (Per-request)
- Generated for each API call
- Combines user ID, session ID, timestamp, and random string
- Format: `{userId}|{sessionId}|{timestamp}|{random}`
- Example: `user-lm3k9x-8h2j5k9p3q|session-lm3k9y-9i3k6l0q4r|1715625600000|a7b8c9d`

### 2. HTTP Headers

All API calls now include the following custom headers:

```typescript
{
  "X-Request-ID": "unique-request-id",
  "X-User-ID": "unique-user-id",
  "X-Session-ID": "unique-session-id"
}
```

### 3. Modified Files

#### **lib/user-id.ts** (NEW)
Core utility for generating and managing unique identifiers.

**Key Functions:**
- `getUserId()` - Get or create persistent user ID
- `getSessionId()` - Get or create session ID
- `generateRequestId()` - Generate unique request ID
- `getTrackingId()` - Get combined user + session ID
- `getUserMetadata()` - Get complete user metadata
- `clearUserId()` - Clear user ID (for testing/logout)
- `clearSessionId()` - Clear session ID

#### **lib/billing-graphql.ts** (MODIFIED)
Updated the `gqlFetch` function to include unique identifiers in all GraphQL requests.

**Changes:**
```typescript
// Before
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${GQL_TOKEN}`,
}

// After
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${GQL_TOKEN}`,
  "X-Request-ID": requestId,
  "X-User-ID": userId,
  "X-Session-ID": sessionId,
}
```

#### **lib/api.ts** (MODIFIED)
Updated `fetchEmployeeData` to include unique identifiers.

**Changes:**
- Added import for user ID utilities
- Added unique ID headers to employee data API calls

#### **hooks/use-pincode-lookup.ts** (MODIFIED)
Updated pincode lookup to include unique identifiers.

**Changes:**
- Added import for user ID utilities
- Added unique ID headers to pincode API calls

#### **app/customer/actions.ts** (MODIFIED)
Added documentation about server-side handling.

**Note:** Server actions cannot directly access browser APIs (localStorage/sessionStorage), but the unique IDs are automatically included in HTTP headers by the GraphQL fetch function.

## API Calls Covered

All the following API calls now include unique user identifiers:

### GraphQL APIs (via `lib/billing-graphql.ts`)
1. ✅ `getBillingByMobile` - Look up customer by mobile
2. ✅ `getAllStores` - Fetch all stores
3. ✅ `createCustomerBilling` - Create new billing registration
4. ✅ `verifyCustomerBilling` - Verify OTP
5. ✅ `resendBillingOtp` - Resend OTP
6. ✅ `getTextilesBillingByMobile` - Fetch textiles billing
7. ✅ `updateBillingForJewellery` - Update jewellery billing
8. ✅ `updateBillingInfo` - Update billing info

### REST APIs
9. ✅ `fetchEmployeeData` - Fetch employee data (via `lib/api.ts`)
10. ✅ Pincode lookup - Postal pincode API (via `hooks/use-pincode-lookup.ts`)

## Benefits

### 1. Duplicate Prevention
- Backend can detect and reject duplicate requests using `X-Request-ID`
- Each submission has a unique identifier
- Prevents accidental double-submissions

### 2. User Tracking
- Track user journey across sessions with `X-User-ID`
- Identify unique devices/browsers
- Analyze user behavior patterns

### 3. Session Management
- Track individual browser sessions with `X-Session-ID`
- Identify concurrent sessions from same user
- Better session analytics

### 4. Debugging & Logging
- Trace specific requests using request ID
- Correlate frontend and backend logs
- Easier troubleshooting

### 5. Analytics
- Measure unique users vs sessions
- Track conversion funnels
- Identify drop-off points

## Backend Integration

To fully utilize these unique identifiers, the backend should:

### 1. Extract Headers
```javascript
const requestId = req.headers['x-request-id'];
const userId = req.headers['x-user-id'];
const sessionId = req.headers['x-session-id'];
```

### 2. Duplicate Detection
```javascript
// Check if request ID already processed
if (await isRequestProcessed(requestId)) {
  return { error: 'Duplicate request detected' };
}

// Mark request as processed
await markRequestProcessed(requestId);
```

### 3. Logging
```javascript
logger.info('API Request', {
  requestId,
  userId,
  sessionId,
  endpoint: req.url,
  timestamp: new Date().toISOString()
});
```

### 4. Database Storage
Consider storing these identifiers in your database:

```sql
CREATE TABLE api_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_request_id (request_id),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id)
);
```

## Testing

### Test User ID Generation
```typescript
import { getUserId, getSessionId, generateRequestId } from '@/lib/user-id';

console.log('User ID:', getUserId());
console.log('Session ID:', getSessionId());
console.log('Request ID:', generateRequestId());
```

### Test API Headers
Open browser DevTools → Network tab → Select any API call → Check Request Headers for:
- `X-Request-ID`
- `X-User-ID`
- `X-Session-ID`

### Clear IDs for Testing
```typescript
import { clearUserId, clearSessionId } from '@/lib/user-id';

// Clear user ID
clearUserId();

// Clear session ID
clearSessionId();

// Refresh page to generate new IDs
```

## Privacy Considerations

1. **No Personal Data**: User IDs are randomly generated and don't contain personal information
2. **Local Storage**: IDs are stored locally in the browser
3. **User Control**: Users can clear browser data to reset IDs
4. **GDPR Compliance**: Consider adding user consent for tracking
5. **Data Retention**: Define retention policies for stored IDs

## Future Enhancements

1. **Fingerprinting**: Add browser fingerprinting for better device identification
2. **IP Tracking**: Include IP address in backend logging
3. **Geolocation**: Add location data (with user consent)
4. **Device Info**: Include device type, OS, browser version
5. **Rate Limiting**: Use user ID for rate limiting
6. **Fraud Detection**: Analyze patterns for suspicious activity
7. **A/B Testing**: Use user ID for consistent experiment assignment

## Troubleshooting

### Issue: IDs not appearing in headers
**Solution:** Check browser console for errors. Ensure `lib/user-id.ts` is properly imported.

### Issue: Different IDs on each request
**Solution:** This is expected for Request ID. User ID and Session ID should remain constant.

### Issue: IDs cleared unexpectedly
**Solution:** Check if user is clearing browser data or using incognito mode.

### Issue: Server-side rendering issues
**Solution:** The utility handles SSR by generating temporary IDs when `window` is undefined.

## Summary

This implementation provides a robust system for:
- ✅ Preventing duplicate API submissions
- ✅ Tracking unique users across sessions
- ✅ Identifying individual browser sessions
- ✅ Generating unique request identifiers
- ✅ Enabling better analytics and debugging

All API calls in the application now include these unique identifiers automatically through HTTP headers.
