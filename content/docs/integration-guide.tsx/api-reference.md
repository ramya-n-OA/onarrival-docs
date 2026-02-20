---
title: "API Reference"
description: "Complete API documentation with request/response examples"
category: "integration-guide"
order: 7
---

Complete reference for all OnArrival integration APIs.

## Environments

| Environment | Base URL | API Key |
| --- | --- | --- |
| **UAT** | `https://devflights.onarriv.io` | Provided during onboarding |
| **Production** | Provided after UAT sign-off | Provided after UAT sign-off |

## Authentication Headers

All S2S API calls require these headers:

```bash
x-api-key: <YOUR_API_KEY>
userId: <APPLICATION_USER_ID>
Content-Type: application/json
```

---

## Payment APIs

### POST /payment/init

Initialize a payment transaction.

**Direction:** OnArrival → Partner Backend

**Request:**

```json
{
  "amountInCash": 5000.00,
  "amountInCoins": 500.00,
  "coinsRedeemed": 5000,
  "totalAmount": 5500.00,
  "orderId": "ORD123456789",
  "timeoutInSeconds": 300,
  "userId": "USER123456",
  "transactionId": "TXN987654321",
  "dateOfTravel": "2025-03-13T14:29:30+00:00",
  "metaInfo": {
    "entityName": "FLIGHT",
    "paymentMethod": "CARD",
    "deviceType": "MOBILE",
    "returnUrl": "https://partner.app/pay/callback"
  }
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `amountInCash` | decimal | ✓ | Amount paid using cash |
| `amountInCoins` | decimal | ✓ if burn | Amount paid using coins (INR equivalent) |
| `coinsRedeemed` | integer | ✓ if burn | Number of coins used |
| `totalAmount` | decimal | ✓ | Total = amountInCash + amountInCoins |
| `orderId` | string | | Booking ID for the itinerary |
| `timeoutInSeconds` | int | ✓ | PG timeout (max 900) |
| `transactionId` | string | ✓ | OnArrival-generated unique ID |
| `dateOfTravel` | datetime | ✓ | Departure date (for loyalty logic) |
| `metaInfo` | object | | Additional context (max 15 key-value pairs) |

**Response:**

```json
{
  "paymentId": "PID20250313123456789",
  "transactionId": "TXN987654321",
  "amountInCash": 5000,
  "amountInCoins": 500,
  "totalAmount": 5500.00,
  "paymentGatewayMetaInfo": {
    "checkSum": "a1b2c3d4e5f6...",
    "timeOutInSeconds": 300,
    "paymentOptions": ["CARD", "NET_BANKING", "UPI", "WALLET"],
    "gatewayReferenceId": "GREF987654321"
  },
  "createdAt": "2025-03-13T14:29:30+00:00"
}
```

{% callout type="tip" %}
The `paymentGatewayMetaInfo` object is passed unmodified via the JS bridge to initialize your native payment SDK.
{% /callout %}

---

### GET /payment/{paymentId}

Get payment status. Can be polled or received via webhook.

**Response:**

```json
{
  "transactionId": "TR123456789",
  "paymentId": "PID98765432",
  "amountInCash": 5000.00,
  "amountInCoins": 500,
  "totalAmount": 5500.00,
  "coinRedeemed": 5000,
  "status": "PAYMENT_SUCCESSFUL",
  "paymentGateway": "RAZORPAY",
  "rrn": "RRN123456789XYZ",
  "paymentMode": "UPI",
  "utr": "UTR123456789ABC",
  "userId": "USER123456",
  "payedAt": "2025-03-13T14:30:45+00:00",
  "createdAt": "2025-03-13T14:29:30+00:00",
  "rewards": {
    "earned": {
      "status": "PROCESSED",
      "amount": 275.00,
      "displayMessage": ["You earned 5% jewels worth ₹275"],
      "processedAt": "2025-03-13T14:35:12+00:00"
    }
  }
}
```

**Payment Status Values:**

| Status | Description | Next Action |
| --- | --- | --- |
| `PAYMENT_INITIATED` | Payment started | Wait for completion |
| `PAYMENT_SUCCESSFUL` | Payment completed | Confirm booking |
| `PAYMENT_FAILED` | Payment declined | Show error, allow retry |
| `PAYMENT_CANCELLED` | User cancelled | Return to checkout |

{% callout type="warning" %}
Fields `rrn` and `utr` are **mandatory** for reconciliation and audit trails.
{% /callout %}

---

### POST /refund

Initiate a refund for a payment.

**Required Headers:**

```bash
x-api-key: <YOUR_API_KEY>
userId: <APPLICATION_USER_ID>
Idempotency-Key: <UUID>
```

**Request:**

```json
{
  "paymentId": "TR987654321",
  "totalAmount": 4500,
  "amountInCash": 4000,
  "amountInCoins": 500,
  "coinsToRefund": 5000,
  "userId": "USER123456",
  "refundReason": {
    "type": "BOOKING_FAILED",
    "specificReason": "Fare expired during payment processing"
  },
  "metaInfo": {
    "cancellationId": "31421"
  }
}
```

**Refund Reason Types:**

| Type | Usage |
| --- | --- |
| `BOOKING_FAILED` | Booking could not be confirmed |
| `USER_CANCELLATION` | Customer-initiated cancellation |
| `OFFLINE_PROCESSING` | Admin/support initiated |
| `SYSTEM_CANCELLATION` | System-triggered cancellation |

{% callout type="note" %}
All refund requests must include an `Idempotency-Key` header. Retain keys for at least 24 hours to handle retries.
{% /callout %}

---

### GET /refund/{refundId}

Get refund status.

**Response:**

```json
{
  "refundId": "RF123456789",
  "paymentId": "PID876543210",
  "refundAmount": 4500,
  "cashRefunded": 4000,
  "coinsRefunded": 5000,
  "coinsRefundedValue": 500,
  "status": "REFUND_SUCCESS",
  "refundGateway": "RAZORPAY",
  "rrn": "RRN987654321ABC",
  "utr": "UTR987654321DEF",
  "initiatedAt": "2025-03-12T10:15:30+00:00",
  "processedAt": "2025-03-12T10:20:45+00:00",
  "completedAt": "2025-03-13T11:30:15+00:00"
}
```

**Refund Status Values:**

| Status | Description |
| --- | --- |
| `REFUND_INITIATED` | Refund request accepted |
| `REFUND_PROCESSING` | Being processed by gateway |
| `REFUND_SUCCESS` | Successfully credited |
| `REFUND_FAILED` | Failed - manual intervention needed |

---

## Order APIs

### GET /s2s/api/v1/flight/orders

List all flight orders for a user.

```bash
curl --location "https://devflights.onarriv.io/s2s/api/v1/flight/orders" \
  --header "userId: USER123456" \
  --header "x-api-key: YOUR_API_KEY"
```

### GET /s2s/api/v1/flight/order/{orderId}

Get detailed order information.

```bash
curl --location "https://devflights.onarriv.io/s2s/api/v1/flight/order/ORD123456" \
  --header "Content-Type: application/json" \
  --header "Accept: application/json" \
  --header "userId: USER123456" \
  --header "x-api-key: YOUR_API_KEY"
```

---

## Token Generation API

If you cannot provide JWT authentication, OnArrival can generate tokens for you.

### POST /s2s/auth/token/generate

**Headers:**

```bash
Content-Type: application/json
x-api-key: <YOUR_API_KEY>
```

**Request:**

```json
{
  "userId": "user_12345",
  "email": "user@example.com",
  "phone": "+919999999999"
}
```

{% callout type="note" %}
Either `email` or `phone` is mandatory.
{% /callout %}

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "expiresAt": "2025-03-13T15:29:30+00:00",
    "userId": "user_12345"
  }
}
```

---

## Live JSON Fixtures

Test your integration with these sample payloads:

| Scenario | URL |
| --- | --- |
| Domestic One-Way | [View JSON](https://static-onarrival.s3.ap-south-1.amazonaws.com/booking-event/domesticOneway-booking-event.json) |
| Domestic Round-Trip | [View JSON](https://static-onarrival.s3.ap-south-1.amazonaws.com/booking-event/domesticReturn-booking-event.json) |
| International One-Way | [View JSON](https://static-onarrival.s3.ap-south-1.amazonaws.com/booking-event/internationOneway-booking-event.json) |
| International Round-Trip | [View JSON](https://static-onarrival.s3.ap-south-1.amazonaws.com/booking-event/internationReturn-booking-event.json) |
