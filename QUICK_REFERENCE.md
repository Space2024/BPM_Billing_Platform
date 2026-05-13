# Quick Reference - Unique User ID System

## 🚀 Quick Start

### Import the utilities
```typescript
import {
  getUserId,
  getSessionId,
  generateRequestId,
  getTrackingId,
  getUserMetadata,
  clearUserId,
  clearSessionId,
} from "@/lib/user-id";
```

## 📋 Function Reference

### `getUserId()`
Returns persistent user ID (stored in localStorage)
```typescript
const userId = getUserId();
// Returns: "user-lm3k9x-8h2j5k9p3q"
```

### `getSessionId()`
Returns session ID (stored in sessionStorage)
```typescript
const sessionId = getSessionId();
// Returns: "session-lm3k9y-9i3k6l0q4r"
```

### `generateRequestId()`
Generates unique ID for each API call
```typescript
const requestId = generateRequestId();
// Returns: "user-lm3k9x-8h2j5k9p3q|session-lm3k9y-9i3k6l0q4r|1715625600000|a7b8c9d"
```

### `getTrackingId()`
Returns combined user + session ID
```typescript
const trackingId = getTrackingId();
// Returns: "user-lm3k9x-8h2j5k9p3q|session-lm3k9y-9i3k6l0q4r"
```

### `getUserMetadata()`
Returns complete user metadata object
```typescript
const metadata = getUserMetadata();
// Returns: {
//   userId: "user-lm3k9x-8h2j5k9p3q",
//   sessionId: "session-lm3k9y-9i3k6l0q4r",
//   trackingId: "user-lm3k9x-8h2j5k9p3q|session-lm3k9y-9i3k6l0q4r",
//   timestamp: "2024-05-13T10:30:00.000Z",
//   userAgent: "Mozilla/5.0..."
// }
```

### `clearUserId()`
Clears user ID from localStorage
```typescript
clearUserId();
// Next call to getUserId() will generate new ID
```

### `clearSessionId()`
Clears session ID from sessionStorage
```typescript
clearSessionId();
// Next call to getSessionId() will generate new ID
```

## 🔧 Common Use Cases

### 1. Custom API Call
```typescript
const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Request-ID": generateRequestId(),
    "X-User-ID": getUserId(),
    "X-Session-ID": getSessionId(),
  },
  body: JSON.stringify(data),
});
```

### 2. Track User Action
```typescript
function trackAction(action: string) {
  const metadata = getUserMetadata();
  console.log("User Action:", { action, ...metadata });
}
```

### 3. Prevent Duplicate Submission
```typescript
const requestId = generateRequestId();
const submitted = sessionStorage.getItem("last_request");

if (submitted === requestId) {
  console.warn("Duplicate submission!");
  return;
}

// Submit form...
sessionStorage.setItem("last_request", requestId);
```

### 4. React Component
```typescript
import { getUserId } from "@/lib/user-id";
import { useEffect, useState } from "react";

export function MyComponent() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  return <div>User ID: {userId}</div>;
}
```

## 📊 HTTP Headers

All API calls automatically include:

| Header | Description | Example |
|--------|-------------|---------|
| `X-Request-ID` | Unique per request | `user-abc\|session-xyz\|1715625600000\|a7b8c9d` |
| `X-User-ID` | Persistent user ID | `user-lm3k9x-8h2j5k9p3q` |
| `X-Session-ID` | Per-tab session ID | `session-lm3k9y-9i3k6l0q4r` |

## 🎯 API Endpoints Covered

### GraphQL (8 endpoints)
- ✅ `getBillingByMobile`
- ✅ `getAllStores`
- ✅ `createCustomerBilling`
- ✅ `verifyCustomerBilling`
- ✅ `resendBillingOtp`
- ✅ `getTextilesBillingByMobile`
- ✅ `updateBillingForJewellery`
- ✅ `updateBillingInfo`

### REST (2 endpoints)
- ✅ `fetchEmployeeData`
- ✅ Pincode lookup

## 🧪 Testing

### View in Browser DevTools
1. Open DevTools (F12)
2. Network tab
3. Make API call
4. Click request
5. Check "Request Headers"

### Console Testing
```javascript
// Get current IDs
console.log("User ID:", getUserId());
console.log("Session ID:", getSessionId());
console.log("Request ID:", generateRequestId());

// Clear and regenerate
clearUserId();
clearSessionId();
location.reload();
```

## 🔒 Storage

| Type | Storage | Lifetime | Scope |
|------|---------|----------|-------|
| User ID | localStorage | Persistent | All tabs |
| Session ID | sessionStorage | Until tab closed | Single tab |
| Request ID | Not stored | Per request | N/A |

## 🛠️ Backend Integration

### Extract Headers (Node.js/Express)
```javascript
const requestId = req.headers['x-request-id'];
const userId = req.headers['x-user-id'];
const sessionId = req.headers['x-session-id'];
```

### Duplicate Detection
```javascript
// Check if already processed
if (await redis.get(`request:${requestId}`)) {
  return res.status(409).json({ error: "Duplicate" });
}

// Process request...

// Mark as processed (expire after 1 hour)
await redis.setex(`request:${requestId}`, 3600, "processed");
```

### Logging
```javascript
logger.info("API Request", {
  requestId,
  userId,
  sessionId,
  method: req.method,
  url: req.url,
  timestamp: new Date(),
});
```

## 📁 File Locations

| File | Purpose |
|------|---------|
| `lib/user-id.ts` | Core utilities |
| `lib/billing-graphql.ts` | GraphQL integration |
| `lib/api.ts` | REST API integration |
| `hooks/use-pincode-lookup.ts` | Pincode API integration |
| `lib/example-usage.ts` | Code examples |

## 🔍 Troubleshooting

### IDs not in headers?
- Check browser console for errors
- Verify `lib/user-id.ts` is imported
- Check Network tab in DevTools

### Different ID each time?
- Request ID changes per call (expected)
- User/Session IDs should stay same
- Check localStorage/sessionStorage

### IDs cleared unexpectedly?
- User cleared browser data
- Incognito/private mode
- sessionStorage cleared on tab close

## 📚 Documentation

- `IMPLEMENTATION_SUMMARY.md` - Overview
- `UNIQUE_USER_ID_IMPLEMENTATION.md` - Detailed docs
- `ARCHITECTURE_DIAGRAM.md` - Visual diagrams
- `lib/example-usage.ts` - Code examples

## ✅ Checklist

- [x] User ID generation
- [x] Session ID generation
- [x] Request ID generation
- [x] GraphQL integration (8 APIs)
- [x] REST API integration (2 APIs)
- [x] HTTP headers added
- [x] Documentation complete
- [x] Build successful
- [ ] Backend integration (recommended)
- [ ] Duplicate detection (recommended)
- [ ] Analytics setup (optional)

## 🎉 You're All Set!

All API calls now include unique identifiers automatically. No changes needed to your component code!
