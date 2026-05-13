# Unique User ID Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────┐                 │
│  │  localStorage    │         │  sessionStorage  │                 │
│  │                  │         │                  │                 │
│  │  User ID:        │         │  Session ID:     │                 │
│  │  user-lm3k9x-... │         │  session-lm3k... │                 │
│  │                  │         │                  │                 │
│  │  (Persistent)    │         │  (Per Tab)       │                 │
│  └────────┬─────────┘         └────────┬─────────┘                 │
│           │                            │                            │
│           └────────────┬───────────────┘                            │
│                        │                                            │
│                        ▼                                            │
│           ┌────────────────────────┐                                │
│           │   lib/user-id.ts       │                                │
│           │                        │                                │
│           │  • getUserId()         │                                │
│           │  • getSessionId()      │                                │
│           │  • generateRequestId() │                                │
│           └────────────┬───────────┘                                │
│                        │                                            │
│                        ▼                                            │
│           ┌────────────────────────┐                                │
│           │  Request ID Generated  │                                │
│           │                        │                                │
│           │  Format:               │                                │
│           │  userId|sessionId|     │                                │
│           │  timestamp|random      │                                │
│           └────────────┬───────────┘                                │
│                        │                                            │
└────────────────────────┼────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  lib/billing-graphql.ts                                       │  │
│  │                                                               │  │
│  │  gqlFetch() {                                                 │  │
│  │    headers: {                                                 │  │
│  │      "X-Request-ID": generateRequestId(),                    │  │
│  │      "X-User-ID": getUserId(),                               │  │
│  │      "X-Session-ID": getSessionId()                          │  │
│  │    }                                                          │  │
│  │  }                                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  lib/api.ts                                                   │  │
│  │                                                               │  │
│  │  fetchEmployeeData() {                                        │  │
│  │    headers: {                                                 │  │
│  │      "X-Request-ID": generateRequestId(),                    │  │
│  │      "X-User-ID": getUserId(),                               │  │
│  │      "X-Session-ID": getSessionId()                          │  │
│  │    }                                                          │  │
│  │  }                                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  hooks/use-pincode-lookup.ts                                  │  │
│  │                                                               │  │
│  │  fetch(pincodeUrl) {                                          │  │
│  │    headers: {                                                 │  │
│  │      "X-Request-ID": generateRequestId(),                    │  │
│  │      "X-User-ID": getUserId(),                               │  │
│  │      "X-Session-ID": getSessionId()                          │  │
│  │    }                                                          │  │
│  │  }                                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    HTTP REQUEST                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST https://api.example.com/endpoint                               │
│                                                                       │
│  Headers:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Content-Type: application/json                              │   │
│  │ Authorization: Bearer token...                              │   │
│  │ X-Request-ID: user-abc|session-xyz|1715625600000|a7b8c9d   │   │
│  │ X-User-ID: user-lm3k9x-8h2j5k9p3q                          │   │
│  │ X-Session-ID: session-lm3k9y-9i3k6l0q4r                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Body:                                                               │
│  {                                                                   │
│    "firstName": "John",                                              │
│    "lastName": "Doe",                                                │
│    "mobileNo": "9876543210"                                          │
│  }                                                                   │
│                                                                       │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Extract Headers                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const requestId = req.headers['x-request-id'];             │   │
│  │ const userId = req.headers['x-user-id'];                   │   │
│  │ const sessionId = req.headers['x-session-id'];             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  2. Check for Duplicates                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ if (await isRequestProcessed(requestId)) {                 │   │
│  │   return { error: 'Duplicate request' };                   │   │
│  │ }                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  3. Process Request                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const result = await processRequest(req.body);             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  4. Mark as Processed                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ await markRequestProcessed(requestId);                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  5. Log Request                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ logger.info('API Request', {                               │   │
│  │   requestId, userId, sessionId,                            │   │
│  │   endpoint: req.url,                                       │   │
│  │   timestamp: new Date()                                    │   │
│  │ });                                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## ID Generation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    First Visit                                │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  getUserId()     │
                  │  called          │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Check           │
                  │  localStorage    │
                  └────────┬─────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
            ┌──────────┐    ┌──────────┐
            │  Found   │    │  Not     │
            │          │    │  Found   │
            └────┬─────┘    └────┬─────┘
                 │               │
                 │               ▼
                 │      ┌──────────────────┐
                 │      │  Generate new    │
                 │      │  user-{ts}-{rnd} │
                 │      └────────┬─────────┘
                 │               │
                 │               ▼
                 │      ┌──────────────────┐
                 │      │  Save to         │
                 │      │  localStorage    │
                 │      └────────┬─────────┘
                 │               │
                 └───────┬───────┘
                         │
                         ▼
                ┌──────────────────┐
                │  Return User ID  │
                └──────────────────┘
```

## Request ID Format

```
┌─────────────────────────────────────────────────────────────────┐
│                    Request ID Structure                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  user-lm3k9x-8h2j5k9p3q | session-lm3k9y-9i3k6l0q4r | 1715625600000 | a7b8c9d
│  └──────────┬──────────┘   └──────────┬──────────┘   └────┬────┘   └───┬───┘
│             │                          │                   │            │
│        User ID                    Session ID          Timestamp     Random
│     (Persistent)                  (Per Tab)          (Milliseconds)  (7 chars)
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow for API Call

```
Component
    │
    │ calls API function
    │
    ▼
lib/billing-graphql.ts
    │
    │ generateRequestId()
    │ getUserId()
    │ getSessionId()
    │
    ▼
lib/user-id.ts
    │
    │ Check localStorage/sessionStorage
    │ Generate if needed
    │
    ▼
Return IDs
    │
    │
    ▼
Add to HTTP Headers
    │
    │ X-Request-ID
    │ X-User-ID
    │ X-Session-ID
    │
    ▼
Send HTTP Request
    │
    │
    ▼
Backend Server
    │
    │ Extract headers
    │ Check duplicates
    │ Process request
    │ Log activity
    │
    ▼
Return Response
```

## Storage Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      User ID (localStorage)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Created:  First visit to site                                   │
│  Persists: Across browser sessions                               │
│  Cleared:  User clears browser data OR clearUserId() called      │
│  Scope:    Same browser, all tabs                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Session ID (sessionStorage)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Created:  First visit in new tab/window                         │
│  Persists: Until tab is closed                                   │
│  Cleared:  Tab closed OR clearSessionId() called                 │
│  Scope:    Single browser tab only                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Request ID (Generated)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Created:  Every API call                                        │
│  Persists: Not stored (generated on-demand)                      │
│  Cleared:  N/A (not stored)                                      │
│  Scope:    Single API request                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Tab Scenario

```
Browser Window
├── Tab 1
│   ├── User ID: user-abc123 (shared)
│   └── Session ID: session-xyz789 (unique)
│
├── Tab 2
│   ├── User ID: user-abc123 (shared)
│   └── Session ID: session-def456 (unique)
│
└── Tab 3
    ├── User ID: user-abc123 (shared)
    └── Session ID: session-ghi012 (unique)

Result:
- Same user across all tabs (user-abc123)
- Different session per tab
- Unique request ID for each API call
```

## Benefits Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Without Unique IDs                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User clicks submit twice                                        │
│         │                                                         │
│         ├─► Request 1 ──► Backend ──► Creates record            │
│         │                                                         │
│         └─► Request 2 ──► Backend ──► Creates duplicate! ❌     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     With Unique IDs                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User clicks submit twice                                        │
│         │                                                         │
│         ├─► Request 1 (ID: abc123) ──► Backend ──► Creates      │
│         │                                          record ✓      │
│         │                                                         │
│         └─► Request 2 (ID: abc123) ──► Backend ──► Detects      │
│                                          duplicate ✓             │
│                                          Returns cached          │
│                                          response ✓              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Your App)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✓ lib/user-id.ts          - ID generation                      │
│  ✓ lib/billing-graphql.ts  - GraphQL APIs                       │
│  ✓ lib/api.ts              - REST APIs                          │
│  ✓ hooks/use-pincode-lookup.ts - Pincode API                    │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Headers
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Backend (To Implement)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ⚠ Extract headers         - Get X-Request-ID, etc.             │
│  ⚠ Duplicate detection     - Check if processed                 │
│  ⚠ Request logging         - Log all requests                   │
│  ⚠ Database storage        - Store request metadata             │
│  ⚠ Analytics               - Track user behavior                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Legend:
✓ = Implemented
⚠ = Recommended for backend
```
