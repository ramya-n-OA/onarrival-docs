---
title: "JS Bridge Events"
description: "Client-side communication between your native app and OnArrival PWA"
category: "events-webhooks"
order: 5
---

The JS Bridge enables bidirectional communication between your native mobile app and OnArrival's PWA running in a WebView.

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Native App    │◄───────►│  OnArrival PWA  │
│   (Your Code)   │  Bridge │   (WebView)     │
└─────────────────┘         └─────────────────┘
```

Your native app exposes a JavaScript interface that the PWA calls to request native functionality like authentication, payments, and file downloads.

---

## Setup

### WebView Configuration

{% callout type="tip" title="Performance Tip" %}
Initialize the WebView once at app startup and keep it persistent. Our PWA is optimized at under 2MB with aggressive caching, ensuring instant transitions between native and web screens.
{% /callout %}

### Bridge Implementation

Register the bridge interface on the WebView's JavaScript context:

```javascript
// Expose to WebView
window.OnArrivalBridge = {
  eventLogin: () => { /* ... */ },
  eventPaymentGateway: (payload) => { /* ... */ },
  eventDownload: (url) => { /* ... */ },
  // ... other handlers
};
```

---

## PWA → Native Events

These events are triggered by the PWA and must be handled by your native app.

### eventLogin

Requests user credentials to establish a session.

| Property | Type | Description |
|----------|------|-------------|
| Direction | PWA → Native | — |
| Trigger | Session initialization |  |
| Required | Yes | |

**Expected Response:**

```json
{
  "id": "user_12345",
  "username": "john.doe",
  "mobile": "+919876543210",
  "email": "john@example.com",
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "orgId": "org_001",
  "orgCode": "ACME"
}
```

**Implementation:**

```kotlin
// Android (Kotlin)
@JavascriptInterface
fun eventLogin(): String {
    val user = authManager.getCurrentUser()
    return JSONObject().apply {
        put("id", user.id)
        put("username", user.name)
        put("mobile", user.phone)
        put("email", user.email)
        put("token", authManager.getJwtToken())
        put("orgId", config.orgId)
        put("orgCode", config.orgCode)
    }.toString()
}
```

```swift
// iOS (Swift)
func eventLogin() -> String {
    guard let user = AuthManager.shared.currentUser else {
        return "{\"error\": \"Not authenticated\"}"
    }
    let response: [String: Any] = [
        "id": user.id,
        "username": user.name,
        "mobile": user.phone,
        "email": user.email,
        "token": AuthManager.shared.jwtToken,
        "orgId": Config.orgId,
        "orgCode": Config.orgCode
    ]
    return JSONSerialization.string(from: response)
}
```

---

### eventPaymentGateway

Triggers the native payment SDK with transaction details.

| Property | Type | Description |
|----------|------|-------------|
| Direction | PWA → Native | — |
| Trigger | User initiates payment |  |
| Required | Yes | |

**Input Payload:**

```json
{
  "paymentId": "pay_abc123xyz",
  "transactionId": "txn_987654321",
  "amountInCash": 4500,
  "amountInCoins": 500,
  "totalAmount": 5000,
  "paymentGatewayMetaInfo": {
    "checkSum": "a1b2c3d4e5...",
    "timeOutInSeconds": 300,
    "paymentOptions": ["UPI", "CARD", "NET_BANKING", "WALLET"],
    "gatewayReferenceId": "gw_ref_123"
  }
}
```

**Expected Response:**

```json
{
  "status": "SUCCESS",
  "data": {
    "transactionId": "txn_987654321",
    "amountPaid": 5000,
    "paymentMode": "UPI",
    "utr": "123456789012"
  }
}
```

**Status Codes:**

| Status | Description | Next Action |
|--------|-------------|-------------|
| `SUCCESS` | Payment completed | PWA proceeds to booking |
| `FAILED` | Payment declined | Display error, allow retry |
| `CANCELLED` | User closed gateway | Return to checkout |
| `TIMEOUT` | Session expired | Restart payment flow |

---

### eventDownload

Requests native file download for tickets and invoices.

| Property | Type | Description |
|----------|------|-------------|
| Direction | PWA → Native | — |
| Input | URL string | File to download |

**Input:**

```
https://cdn.onarrival.io/tickets/TKT_ABC123.pdf
```

**Implementation:**

```kotlin
// Android
@JavascriptInterface
fun eventDownload(url: String) {
    val request = DownloadManager.Request(Uri.parse(url))
        .setTitle("Booking Ticket")
        .setNotificationVisibility(VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalPublicDir(DIRECTORY_DOWNLOADS, "ticket.pdf")
    downloadManager.enqueue(request)
}
```

---

### eventRefreshToken

Requests a fresh JWT when the current token expires.

| Property | Type | Description |
|----------|------|-------------|
| Direction | PWA → Native | — |
| Trigger | Token expiration (HTTP 401) | |

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJSUzI1NiIs..."
}
```

{% callout type="warning" title="Token Refresh" %}
Implement this handler to prevent session interruptions. The PWA will call this automatically when it receives a 401 response from OnArrival APIs.
{% /callout %}

---

### eventLocation

Requests device location for airport suggestions and personalization.

| Property | Type | Description |
|----------|------|-------------|
| Direction | PWA → Native | — |
| Required | No (optional) | |

**Expected Response:**

```json
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "accuracy": 10
}
```

---

### eventCoins

Retrieves user's reward balance for display in the booking flow.

**Expected Response:**

```json
{
  "balance": 15000,
  "value": 1500.00,
  "currency": "INR"
}
```

---

### eventDeviceInfo

Provides device metadata for UI adjustments and analytics.

**Expected Response:**

```json
{
  "platform": "ios",
  "appVersion": "2.5.1",
  "osVersion": "17.2",
  "deviceId": "uuid-device-123",
  "statusBarHeight": 44,
  "safeAreaBottom": 34
}
```

---

### eventOpenUrl

Opens a URL in the native browser or in-app browser tab.

**Input:**

```
https://www.airline.com/manage-booking?pnr=ABC123
```

---

### eventOpenNativeRoutes

Navigates to a specific screen in your native app.

**Input Values:**

| Route | Description |
|-------|-------------|
| `support` | Customer support screen |
| `faq` | FAQ section |
| `rewards` | Rewards/loyalty dashboard |
| `profile` | User profile settings |
| `home` | App home screen |

---

### back

Signals that the user wants to exit the WebView.

**Usage:** Handle this to pop the WebView from your navigation stack or minimize it.

---

## Native → PWA Events

Your native app can trigger navigation within the PWA.

### oa_client_redirect_to

Navigates the PWA to a specific route.

```javascript
// From native code, execute in WebView:
webView.evaluateJavascript(
  "window.postMessage({type: 'oa_client_redirect_to', url: '/my-bookings'}, '*')"
)
```

**Supported Routes:**

| Route | Description |
|-------|-------------|
| `/` | Home/search |
| `/my-bookings` | Booking list |
| `/booking/{id}` | Booking details |
| `/support` | Help center |

---

### oaBack

Notifies the PWA that the hardware back button was pressed.

```javascript
webView.evaluateJavascript(
  "window.postMessage({type: 'oaBack'}, '*')"
)
```

---

## Error Handling

All bridge methods should handle errors gracefully:

```javascript
window.OnArrivalBridge = {
  eventLogin: async () => {
    try {
      const user = await nativeAuth.getUser();
      return JSON.stringify(user);
    } catch (error) {
      return JSON.stringify({
        error: true,
        code: "AUTH_FAILED",
        message: error.message
      });
    }
  }
};
```

---

## Testing

Use browser developer tools to test bridge calls:

```javascript
// In browser console (for development)
window.OnArrivalBridge = {
  eventLogin: () => JSON.stringify({
    id: "test_user",
    username: "Test User",
    token: "test_jwt_token"
  })
};
```
