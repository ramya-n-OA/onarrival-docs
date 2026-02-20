---
title: "Pre-Requisites"
description: "Technical requirements and setup checklist for OnArrival integration"
category: "integration-guide"
order: 1
---

Complete these technical requirements before starting your integration.

---

## Credentials & Environment Access

### UAT Environment

| Item | Value |
|------|-------|
| Base URL | `https://devflights.onarriv.io` |
| Admin Console | Contact OnArrival team |
| API Documentation | You're reading it |

### Required Credentials

You'll receive the following from OnArrival:

```bash
# JWT Validation
ONARRIVAL_JWT_PUBLIC_KEY=<your-public-key>
ONARRIVAL_JWT_ISSUER=https://your-domain.com

# S2S API Access
ONARRIVAL_S2S_API_KEY=sk_uat_xxxxxxxxxxxxx
ONARRIVAL_S2S_SECRET=your-s2s-secret

# Webhook Verification
ONARRIVAL_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Authentication Setup

### JWT Token Requirements

Your JWT tokens must include these claims:

```json
{
  "sub": "user-unique-id",
  "email": "user@example.com",
  "phone": "+919876543210",
  "name": "User Name",
  "iat": 1704067200,
  "exp": 1704153600,
  "iss": "https://your-domain.com"
}
```

### Token Signing

OnArrival supports:
- **RS256** (RSA + SHA256) - Recommended
- **ES256** (ECDSA + SHA256)

Provide one of the following for token verification:

**Option A: JWKS Endpoint (Recommended)**
```
https://your-domain.com/.well-known/jwks.json
```

**Option B: Static Public Key**
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
-----END PUBLIC KEY-----
```

---

## Backend API Requirements

### User Profile API

Implement an endpoint to return user profile data:

```http
GET /api/user/profile
Authorization: Bearer <s2s-token>
x-user-id: <user-id>
```

Response schema:

```json
{
  "id": "usr_12345",
  "email": "user@example.com",
  "phone": "+919876543210",
  "name": {
    "first": "John",
    "last": "Doe"
  },
  "tier": "gold",
  "wallet_balance": 5000,
  "currency": "INR"
}
```

### Payment Initialization API

Implement an endpoint to initialize payments:

```http
POST /api/payments/init
Content-Type: application/json
Authorization: Bearer <s2s-token>
```

Request body:

```json
{
  "order_id": "ord_xxxxx",
  "amount": 15000,
  "currency": "INR",
  "user_id": "usr_12345",
  "metadata": {
    "booking_type": "flight",
    "pnr": "ABC123"
  }
}
```

Response:

```json
{
  "payment_id": "pay_xxxxx",
  "gateway_order_id": "gw_order_123",
  "gateway_config": {
    "key": "rzp_test_xxxxx",
    "name": "Your App",
    "prefill": {
      "email": "user@example.com",
      "contact": "+919876543210"
    }
  }
}
```

---

## Webhook Endpoints

Implement these webhook handlers on your backend:

### Required Webhooks

| Event | Your Endpoint |
|-------|--------------|
| `BOOKING_CONFIRMED` | `POST /webhooks/onarrival/booking` |
| `BOOKING_FAILED` | `POST /webhooks/onarrival/booking` |
| `PAYMENT_SUCCESS` | `POST /webhooks/onarrival/payment` |
| `PAYMENT_FAILED` | `POST /webhooks/onarrival/payment` |
| `REFUND_INITIATED` | `POST /webhooks/onarrival/refund` |
| `REFUND_COMPLETED` | `POST /webhooks/onarrival/refund` |

### Webhook Payload Example

```json
{
  "event": "BOOKING_CONFIRMED",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "booking_id": "bk_xxxxx",
    "pnr": "ABC123",
    "user_id": "usr_12345",
    "amount": 15000,
    "status": "CONFIRMED"
  },
  "signature": "sha256=xxxxxx"
}
```

### Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `sha256=${expected}` === signature;
}
```

---

## JS Bridge Implementation

Your native app must implement these bridge functions:

```javascript
// Required bridge interface
window.OnArrivalBridge = {
  // Called when PWA needs user credentials
  eventLogin: async () => {
    const jwt = await nativeSDK.getAuthToken();
    return { token: jwt };
  },

  // Called to trigger payment
  eventPaymentGateway: async (config) => {
    const result = await nativeSDK.openPaymentGateway(config);
    return {
      status: result.success ? 'SUCCESS' : 'FAILED',
      payment_id: result.paymentId,
      error: result.error
    };
  },

  // Called for file downloads
  eventDownload: async (url, filename) => {
    await nativeSDK.downloadFile(url, filename);
    return { success: true };
  },

  // Called for location access
  eventLocation: async () => {
    const coords = await nativeSDK.getLocation();
    return {
      latitude: coords.lat,
      longitude: coords.lng
    };
  },

  // Called when JWT expires
  eventRefreshToken: async () => {
    const newToken = await nativeSDK.refreshToken();
    return { token: newToken };
  }
};
```

---

## IP Whitelisting

### Your IPs (outbound to OnArrival)

Provide us with the static IPs your servers will use to call our APIs.

### OnArrival IPs (inbound webhooks)

Add these IPs to your firewall allowlist:

**UAT:**
- `52.66.xxx.xxx`
- `13.232.xxx.xxx`

**Production:** Provided after UAT sign-off

---

## Checklist

Before starting integration:

- [ ] UAT credentials received
- [ ] JWT signing configured
- [ ] User Profile API implemented
- [ ] Payment Init API implemented
- [ ] Webhook endpoints deployed
- [ ] JS Bridge implemented in native app
- [ ] IP whitelisting completed

{% callout type="tip" %}
Complete the checklist above before scheduling your integration kickoff call with OnArrival.
{% /callout %}
