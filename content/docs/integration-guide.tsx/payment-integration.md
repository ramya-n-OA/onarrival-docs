---
title: "Payments & Refunds"
description: "Payment initialization, status tracking, and refund processing"
category: "integration-guide"
order: 4
---

This guide covers the server-to-server payment flow between OnArrival and your backend.

{% callout type="warning" title="Fare Hold Window" %}
Flight fares are held for a maximum of 15 minutes. Complete payment processing within this window to avoid booking failures.
{% /callout %}

---

## Payment Flow

```
1. User selects flight in PWA
2. OnArrival calls your /payment/init endpoint
3. You return payment gateway configuration
4. PWA triggers eventPaymentGateway() via JS Bridge
5. User completes payment in native gateway SDK
6. Native app returns payment result to PWA
7. OnArrival polls your /payment/{id} endpoint (or receives webhook)
8. Booking is confirmed
```

---

## Initialize Payment

OnArrival calls this endpoint to create a payment intent.

**Endpoint:** `POST /api/payment/init`

**Headers:**

```http
Content-Type: application/json
x-api-key: sk_live_abc123xyz789
x-user-id: user_12345
```

**Request:**

```json
{
  "orderId": "ord_xyz789",
  "transactionId": "txn_abc123",
  "userId": "user_12345",
  "totalAmount": 15000,
  "amountInCash": 14000,
  "amountInCoins": 1000,
  "coinsRedeemed": 100,
  "currency": "INR",
  "timeoutSeconds": 300,
  "metadata": {
    "bookingType": "FLIGHT",
    "segments": 1,
    "passengers": 2
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | OnArrival order identifier |
| `transactionId` | string | Unique transaction ID |
| `totalAmount` | number | Total payment amount |
| `amountInCash` | number | Cash portion of payment |
| `amountInCoins` | number | Loyalty points value |
| `coinsRedeemed` | number | Number of points redeemed |
| `timeoutSeconds` | number | Payment window (max 300) |

**Response:**

```json
{
  "paymentId": "pay_abc123",
  "transactionId": "txn_abc123",
  "totalAmount": 15000,
  "status": "PENDING",
  "gatewayConfig": {
    "key": "rzp_live_xxxxx",
    "orderId": "order_xyz",
    "amount": 1400000,
    "currency": "INR",
    "checksum": "sha256_hash...",
    "timeout": 300,
    "prefill": {
      "email": "user@example.com",
      "contact": "+919876543210"
    },
    "paymentMethods": ["UPI", "CARD", "NETBANKING", "WALLET"]
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

The `gatewayConfig` object is passed directly to your native payment SDK.

---

## Payment Status

OnArrival polls this endpoint to check payment status after the user completes the gateway flow.

**Endpoint:** `GET /api/payment/{paymentId}`

**Headers:**

```http
x-api-key: sk_live_abc123xyz789
```

**Response (Success):**

```json
{
  "paymentId": "pay_abc123",
  "transactionId": "txn_abc123",
  "orderId": "ord_xyz789",
  "userId": "user_12345",
  "status": "SUCCESS",
  "totalAmount": 15000,
  "amountInCash": 14000,
  "amountInCoins": 1000,
  "paymentMode": "UPI",
  "gateway": "RAZORPAY",
  "gatewayResponse": {
    "rrn": "123456789012",
    "utr": "UTR987654321ABC",
    "bankReference": "BNK_REF_123"
  },
  "paidAt": "2024-01-15T10:02:30Z",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Status Values:**

| Status | Description | Next Step |
|--------|-------------|-----------|
| `PENDING` | Awaiting user action | Continue polling |
| `SUCCESS` | Payment completed | Proceed to booking |
| `FAILED` | Payment declined | Show error |
| `CANCELLED` | User cancelled | Return to checkout |
| `EXPIRED` | Timeout exceeded | Restart flow |

{% callout type="note" title="Required Fields" %}
Include `rrn` and `utr` in successful payment responses. These are required for reconciliation and refund processing.
{% /callout %}

---

## Refund Processing

OnArrival calls this endpoint when a refund is required (cancellation, booking failure, etc.).

**Endpoint:** `POST /api/refund`

**Headers:**

```http
Content-Type: application/json
x-api-key: sk_live_abc123xyz789
Idempotency-Key: uuid-v4-here
```

**Request:**

```json
{
  "paymentId": "pay_abc123",
  "refundAmount": 13000,
  "amountInCash": 12000,
  "amountInCoins": 1000,
  "coinsToRefund": 100,
  "userId": "user_12345",
  "reason": {
    "type": "USER_CANCELLATION",
    "description": "Flight cancelled by user"
  },
  "metadata": {
    "cancellationId": "can_xyz789",
    "penalty": 2000
  }
}
```

**Refund Reason Types:**

| Type | Description |
|------|-------------|
| `USER_CANCELLATION` | Customer requested cancellation |
| `BOOKING_FAILED` | Booking could not be confirmed |
| `SCHEDULE_CHANGE` | Flight schedule changed |
| `DUPLICATE_PAYMENT` | Accidental double charge |
| `ADMIN_ADJUSTMENT` | Manual correction |

**Response:**

```json
{
  "refundId": "ref_xyz789",
  "paymentId": "pay_abc123",
  "status": "INITIATED",
  "refundAmount": 13000,
  "cashRefunded": 12000,
  "coinsRefunded": 100,
  "estimatedCompletion": "2024-01-17T10:00:00Z",
  "initiatedAt": "2024-01-15T10:30:00Z"
}
```

### Idempotency

All refund requests must be idempotent. OnArrival sends a unique `Idempotency-Key` header with each request.

Your implementation should:

1. Store the idempotency key with the refund request
2. Check for existing requests with the same key
3. Return the original response for duplicate requests
4. Retain keys for at least 24 hours

---

## Refund Status

**Endpoint:** `GET /api/refund/{refundId}`

**Response:**

```json
{
  "refundId": "ref_xyz789",
  "paymentId": "pay_abc123",
  "status": "COMPLETED",
  "refundAmount": 13000,
  "cashRefunded": 12000,
  "coinsRefunded": 100,
  "gatewayResponse": {
    "rrn": "987654321012",
    "utr": "UTR123456789DEF"
  },
  "initiatedAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-16T14:00:00Z"
}
```

**Refund Status Values:**

| Status | Description |
|--------|-------------|
| `INITIATED` | Refund request received |
| `PROCESSING` | Being processed by gateway |
| `COMPLETED` | Successfully refunded |
| `FAILED` | Refund could not be processed |

---

## Partial Refunds

OnArrival may send multiple refund requests against the same payment (e.g., partial cancellation). Your system must:

- Track total refunded amount per payment
- Reject refunds that exceed original payment
- Support mixed cash + coins refunds

```json
// First refund (segment cancellation)
{
  "paymentId": "pay_abc123",
  "refundAmount": 5000,
  "reason": { "type": "USER_CANCELLATION" }
}

// Second refund (remaining segments)
{
  "paymentId": "pay_abc123",
  "refundAmount": 8000,
  "reason": { "type": "USER_CANCELLATION" }
}
```

---

## Error Responses

Return standard error responses for failed requests:

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_NOT_FOUND",
    "message": "No payment found with ID pay_xyz789"
  }
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PAYMENT_NOT_FOUND` | 404 | Payment ID doesn't exist |
| `REFUND_EXCEEDS_AMOUNT` | 400 | Refund amount > payment |
| `ALREADY_REFUNDED` | 400 | Full refund already processed |
| `GATEWAY_ERROR` | 502 | Payment gateway unavailable |
| `INVALID_REQUEST` | 400 | Missing or invalid fields |

---

## Testing

Use these test payment IDs in UAT:

| Payment ID | Simulates |
|------------|-----------|
| `pay_test_success` | Successful payment |
| `pay_test_failed` | Failed payment |
| `pay_test_timeout` | Payment timeout |
| `pay_test_cancelled` | User cancelled |
