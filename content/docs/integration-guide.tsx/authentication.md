---
title: Authentication
description: 'JWT tokens, S2S API keys, and session management'
category: integration-guide
order: 2
---

OnArrival uses two authentication methods: **JWT tokens** for user sessions and **API keys** for server-to-server communication.

***

## Authentication Methods

| Context          | Method           | When to Use            |
| ---------------- | ---------------- | ---------------------- |
| User Profile API | JWT Bearer Token | Session initialization |
| Payment APIs     | S2S API Key      | Backend operations     |
| Webhooks         | S2S API Key      | Event notifications    |
| Refund APIs      | S2S API Key      | Transaction processing |

***

### User Profile API — JWT (User Session Auth)

The User Profile API is invoked as part of the login / session initialization flow.

* Called during an active user Login (triggered via \`eventLogin\`) and session creation
* Executed only after token validation succeeds
* Requires user identity and authorization context
* Short-lived call used for booking and personalization setup

This API relies on the \*\*user’s JWT token\*\*, which validates identity and permissions.

### Payment, Refund & Webhook APIs — S2S Authentication (\`x-api-key\`)

Payment and refund workflows operate asynchronously of the user session. Therefore, these APIs use Server-to-Server authentication via \`x-api-key\` instead of user tokens.

S2S authentication is required because:

1\. Session Timeout Resilience:

    Payment or refund processing may continue even after the user leaves the app or the session expires.

    

2\. Asynchronous Processing

    Payment gateways may return status updates or callbacks at delayed intervals.

    OnArrival needs to poll payment status after the user's session has ended (not preferred since it’s expensive and high load on server)

3\. Background & System-Triggered Operations

    These flows may execute without any active user interaction, including:

* automated cancellations
* admin / support actions
* offline or delayed processing
* reconciliation & retries
* scheduled status checks

4\. Webhook Security

* Webhooks do not carry user session context
* S2S authentication ensures secure validation and processing of external events.

5\. System-to-System Communication

 

Notifications and status events occur at the platform level and are not tied to a user request, so they must not depend on user authentication.

## JWT Authentication

JWT tokens authenticate users during session initialization. Your app generates a signed JWT and passes it to OnArrival via the JS Bridge.

### Token Requirements

Your JWT must include these claims:

```json
{
  "sub": "user_12345",
  "iss": "https://auth.yourcompany.com",
  "exp": 1705312245,
  "iat": 1705308645,
  "organizationId": "org_abc123",
  "organizationCode": "ACME"
}
```

| Claim              | Type   | Description                      |
| ------------------ | ------ | -------------------------------- |
| `sub`              | string | Unique user identifier           |
| `iss`              | string | Your token issuer URL            |
| `exp`              | number | Expiration time (Unix timestamp) |
| `iat`              | number | Issued at time (Unix timestamp)  |
| `organizationId`   | string | Provided by OnArrival            |
| `organizationCode` | string | Provided by OnArrival            |

### Signing Algorithms

OnArrival supports these algorithms:

* **RS256** (RSA + SHA-256) — Recommended
* **RS384** (RSA + SHA-384)
* **RS512** (RSA + SHA-512)
* **ES256** (ECDSA + SHA-256)

***

## Public Key Configuration

Provide OnArrival with your public key for token verification.

### Option 1: JWKS Endpoint (Recommended)

Host a JSON Web Key Set at a public URL:

```
https://auth.yourcompany.com/.well-known/jwks.json
```

**Response format:**

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-2024-01",
      "use": "sig",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nn...",
      "e": "AQAB"
    }
  ]
}
```

{% callout type="tip" title="Key Rotation" %}
JWKS enables seamless key rotation. Include a `kid` (Key ID) in your JWT header that matches a key in your JWKS.
{% /callout %}

### Option 2: Static Public Key

Share a PEM-encoded public key during integration setup:

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQ
SuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT...
-----END PUBLIC KEY-----
```

Use this option if your keys rotate infrequently.

***

## S2S API Key Authentication

Server-to-server calls use API key authentication. This applies to all payment, refund, and webhook operations.

### Request Headers

```http
POST /api/v1/payment/init HTTP/1.1
Host: api.onarrival.io
Content-Type: application/json
x-api-key: sk_live_abc123xyz789
x-user-id: user_12345
```

| Header      | Description                           |
| ----------- | ------------------------------------- |
| `x-api-key` | Your S2S API key                      |
| `x-user-id` | The user associated with this request |

### Why S2S Authentication?

Payment and webhook operations occur outside the user's session context:

* **Async processing** — Payment gateways respond after session timeout
* **Background jobs** — Refunds, cancellations, reconciliation
* **Webhooks** — No user session available
* **Admin operations** — Support workflows, manual adjustments

***

## Session Flow

The session flow establishes user identity when the PWA loads:

```
1. User opens PWA in WebView
2. PWA calls eventLogin() via JS Bridge
3. Native app returns user data + JWT
4. OnArrival validates JWT signature
5. OnArrival calls your User Profile API
6. Session established
```

### eventLogin Response

```json
{
  "id": "user_12345",
  "username": "John Doe",
  "mobile": "+919876543210",
  "email": "john@example.com",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "orgId": "org_abc123",
  "orgCode": "ACME"
}
```

***

## Token Generation API

If you cannot issue JWTs, OnArrival can generate tokens on your behalf.

**Endpoint:** `POST /s2s/api/v1/auth/token`

**Request:**

```bash
curl -X POST https://api.onarrival.io/s2s/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_live_abc123xyz789" \
  -d '{
    "userId": "user_12345",
    "email": "john@example.com",
    "phone": "+919876543210"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

{% callout type="note" %}
Either `email` or `phone` is required for token generation.
{% /callout %}

***

## Token Refresh

When a token expires, the PWA calls `eventRefreshToken()` via the JS Bridge. Your native app should:

1. Generate a new JWT
2. Return it to the PWA
3. The PWA retries the failed request

```javascript
// JS Bridge handler
eventRefreshToken: async () => {
  const newToken = await authService.refreshToken();
  return { token: newToken };
}
```

***

## Security Checklist

* JWT tokens use RS256 or stronger algorithm
* Token expiry is set appropriately (recommended: 1 hour)
* JWKS endpoint uses HTTPS
* S2S API keys are stored securely (not in client code)
* IP allowlisting configured for webhook endpoints
* Token refresh handler implemented in native app
