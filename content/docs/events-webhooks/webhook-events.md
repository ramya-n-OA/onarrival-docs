---
title: "Webhooks"
description: "Server-to-server notifications for booking lifecycle events"
category: "events-webhooks"
order: 6
---

Webhooks deliver real-time notifications to your backend when booking lifecycle events occur. Implement webhook handlers to keep your systems synchronized with OnArrival.

---

## Configuration

### Endpoint Requirements

Your webhook endpoint must:

- Use HTTPS with a valid TLS certificate
- Accept POST requests with JSON body
- Respond within 5 seconds
- Return a 2xx status code on success

### Authentication

All webhook requests include these headers:

```http
POST /webhooks/onarrival HTTP/1.1
Host: api.yourcompany.com
Content-Type: application/json
x-api-key: <YOUR_SHARED_API_KEY>
x-webhook-signature: sha256=<HMAC_SIGNATURE>
x-webhook-timestamp: 1705312245
x-webhook-id: wh_evt_abc123
```

---

## Signature Verification

Verify the webhook signature to ensure requests originate from OnArrival.

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  // Prevent replay attacks - reject if older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(timestamp) > 300) {
    throw new Error('Webhook timestamp expired');
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures (timing-safe)
  const actual = signature.replace('sha256=', '');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    throw new Error('Invalid webhook signature');
  }

  return true;
}
```

---

## Event Types

### FLIGHT_BOOKING_CONFIRMED

Sent when a booking is successfully ticketed with a PNR.

```json
{
  "event": "FLIGHT_BOOKING_CONFIRMED",
  "timestamp": "2024-01-15T10:30:00Z",
  "webhookId": "wh_evt_abc123",
  "data": {
    "orderId": "ord_xyz789",
    "userId": "user_12345",
    "pnr": "ABC123",
    "status": "CONFIRMED",
    "totalAmount": 15000,
    "currency": "INR",
    "segments": [
      {
        "origin": "BOM",
        "destination": "DEL",
        "departure": "2024-01-20T06:00:00+05:30",
        "arrival": "2024-01-20T08:15:00+05:30",
        "airline": "6E",
        "flightNumber": "6E-2341",
        "class": "ECONOMY"
      }
    ],
    "passengers": [
      {
        "name": "JOHN DOE",
        "type": "ADULT",
        "ticketNumber": "098-1234567890"
      }
    ],
    "contact": {
      "email": "john@example.com",
      "phone": "+919876543210"
    }
  }
}
```

**Use this webhook to:**
- Update booking status in your database
- Send confirmation notifications to users
- Trigger loyalty point accrual

---

### FLIGHT_BOOKING_FAILED

Sent when a booking fails after payment was collected.

```json
{
  "event": "FLIGHT_BOOKING_FAILED",
  "timestamp": "2024-01-15T10:32:00Z",
  "webhookId": "wh_evt_def456",
  "data": {
    "orderId": "ord_xyz789",
    "userId": "user_12345",
    "failureReason": "FARE_EXPIRED",
    "failureCode": "ERR_FARE_001",
    "message": "The selected fare is no longer available",
    "refund": {
      "initiated": true,
      "refundId": "ref_abc123",
      "amount": 15000,
      "estimatedCompletion": "2024-01-17T10:30:00Z"
    }
  }
}
```

**Failure Codes:**

| Code | Description | Recovery |
|------|-------------|----------|
| `FARE_EXPIRED` | Fare no longer available | Auto-refund initiated |
| `SEAT_UNAVAILABLE` | Requested seats sold out | Auto-refund initiated |
| `AIRLINE_REJECTION` | Airline declined booking | Contact support |
| `PAYMENT_MISMATCH` | Amount verification failed | Contact support |

---

### FLIGHT_PAYMENT_COMPLETED

Sent when payment is successfully processed (before ticketing).

```json
{
  "event": "FLIGHT_PAYMENT_COMPLETED",
  "timestamp": "2024-01-15T10:28:00Z",
  "webhookId": "wh_evt_ghi789",
  "data": {
    "orderId": "ord_xyz789",
    "userId": "user_12345",
    "paymentId": "pay_abc123",
    "transactionId": "txn_987654",
    "amount": 15000,
    "currency": "INR",
    "paymentMode": "UPI",
    "gatewayResponse": {
      "rrn": "123456789012",
      "utr": "UTR987654321",
      "bankReference": "BNK_REF_123"
    }
  }
}
```

---

### FLIGHT_CANCELLATION_COMPLETED

Sent when a booking cancellation is processed.

```json
{
  "event": "FLIGHT_CANCELLATION_COMPLETED",
  "timestamp": "2024-01-16T14:00:00Z",
  "webhookId": "wh_evt_jkl012",
  "data": {
    "orderId": "ord_xyz789",
    "userId": "user_12345",
    "cancellationId": "can_abc123",
    "pnr": "ABC123",
    "type": "FULL",
    "reason": "USER_REQUESTED",
    "charges": {
      "cancellationFee": 1500,
      "airlinePenalty": 500,
      "totalDeduction": 2000
    },
    "refund": {
      "refundId": "ref_xyz789",
      "amount": 13000,
      "method": "ORIGINAL_PAYMENT_MODE"
    }
  }
}
```

---

### FLIGHT_REFUND_PROCESSED

Sent when a refund is credited to the user.

```json
{
  "event": "FLIGHT_REFUND_PROCESSED",
  "timestamp": "2024-01-18T11:30:00Z",
  "webhookId": "wh_evt_mno345",
  "data": {
    "refundId": "ref_xyz789",
    "orderId": "ord_xyz789",
    "userId": "user_12345",
    "originalPaymentId": "pay_abc123",
    "refundAmount": 13000,
    "breakdown": {
      "cashRefunded": 12000,
      "coinsRefunded": 1000,
      "coinsValue": 100
    },
    "status": "COMPLETED",
    "gatewayResponse": {
      "rrn": "987654321098",
      "utr": "UTR123456789",
      "processedAt": "2024-01-18T11:29:45Z"
    }
  }
}
```

---

### FLIGHT_SCHEDULE_CHANGED

Sent when an airline modifies the flight schedule.

```json
{
  "event": "FLIGHT_SCHEDULE_CHANGED",
  "timestamp": "2024-01-17T08:00:00Z",
  "webhookId": "wh_evt_pqr678",
  "data": {
    "orderId": "ord_xyz789",
    "userId": "user_12345",
    "pnr": "ABC123",
    "changeType": "TIME_CHANGE",
    "segment": {
      "original": {
        "departure": "2024-01-20T06:00:00+05:30",
        "arrival": "2024-01-20T08:15:00+05:30"
      },
      "updated": {
        "departure": "2024-01-20T07:30:00+05:30",
        "arrival": "2024-01-20T09:45:00+05:30"
      }
    },
    "actionRequired": true,
    "options": ["ACCEPT", "REFUND"]
  }
}
```

**Change Types:**

| Type | Description |
|------|-------------|
| `TIME_CHANGE` | Departure/arrival time modified |
| `DATE_CHANGE` | Flight moved to different date |
| `FLIGHT_CANCELLED` | Flight cancelled by airline |
| `EQUIPMENT_CHANGE` | Aircraft type changed |

---

### REWARDS_EARNED

Sent when a user earns loyalty points from a booking.

```json
{
  "event": "REWARDS_EARNED",
  "timestamp": "2024-01-15T10:35:00Z",
  "webhookId": "wh_evt_stu901",
  "data": {
    "orderId": "ord_xyz789",
    "userId": "user_12345",
    "rewards": {
      "coinsEarned": 750,
      "coinValue": 75.00,
      "earnRate": "5%",
      "tierBonus": 1.5
    },
    "newBalance": 15750,
    "displayMessage": "You earned 750 coins worth ₹75"
  }
}
```

---

## Response Format

Acknowledge receipt with a JSON response:

**Success:**

```json
{
  "received": true,
  "webhookId": "wh_evt_abc123",
  "processedAt": "2024-01-15T10:30:01Z"
}
```

**Queued for async processing:**

```json
{
  "received": true,
  "webhookId": "wh_evt_abc123",
  "status": "QUEUED",
  "message": "Event accepted for processing"
}
```

---

## Retry Policy

Failed webhook deliveries are retried with exponential backoff:

| Attempt | Delay | Total Elapsed |
|---------|-------|---------------|
| 1 | Immediate | 0s |
| 2 | 30 seconds | 30s |
| 3 | 2 minutes | 2m 30s |
| 4 | 10 minutes | 12m 30s |
| 5 | 30 minutes | 42m 30s |
| 6 | 1 hour | 1h 42m 30s |

After 6 failed attempts, the webhook is marked as failed. Use the OnArrival dashboard to view failed webhooks and trigger manual retries.

{% callout type="warning" title="Idempotency" %}
Webhooks may be delivered more than once. Use the `webhookId` field to deduplicate events in your handler.
{% /callout %}

---

## Best Practices

1. **Respond quickly** — Return 200 immediately and process asynchronously
2. **Implement idempotency** — Store processed `webhookId` values
3. **Verify signatures** — Always validate the HMAC signature
4. **Log everything** — Store raw payloads for debugging
5. **Set up alerts** — Monitor for failed webhook deliveries
6. **Use a queue** — Process webhooks via a message queue for reliability

---

## Testing

Use the OnArrival dashboard to send test webhooks to your endpoint:

1. Navigate to **Settings → Webhooks**
2. Enter your endpoint URL
3. Click **Send Test Event**
4. Select the event type to simulate

Test payloads are marked with `"test": true` in the data object.
