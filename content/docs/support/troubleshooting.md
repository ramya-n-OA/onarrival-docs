---
title: "Edge Cases"
description: "Handling payment failures, session timeouts, and error scenarios"
category: "support"
order: 6
---

This document covers common edge cases and error scenarios in the OnArrival integration.

---

## Payment Edge Cases

### Fare Expiry During Payment

Flights hold fares for a maximum of **15 minutes**. If payment processing exceeds this window:

1. OnArrival will return `BOOKING_FAILED` status
2. A refund will be automatically initiated
3. User should be prompted to retry search

**Recommended Actions:**
- Show clear timeout countdown to users
- Implement optimistic UI updates
- Pre-warm payment gateway connections

---

### Payment Gateway Timeout

If the payment gateway doesn't respond within the configured timeout:

```json
{
  "status": "PAYMENT_FAILED",
  "gatewayResponseCode": "TIMEOUT",
  "gatewayResponseMessage": "Gateway did not respond in time"
}
```

**Handling:**
1. Do NOT retry the payment automatically
2. Check payment status via `/payment/{paymentId}`
3. If status is `PENDING`, wait for webhook or poll periodically

---

### Duplicate Payment Attempts

If a user attempts to pay twice for the same order:

1. The second request should be blocked at the Partner's gateway
2. Return the status of the existing payment
3. Never create duplicate payment records

---

## Session Edge Cases

### Token Expiry During Booking

If the JWT token expires mid-session:

1. `eventRefreshToken()` is called from PWA to Native
2. Native should return a fresh token
3. If refresh fails, redirect user to re-authenticate

{% callout type="warning" %}
Never store tokens in localStorage for security reasons. Use secure cookie storage or native secure storage.
{% /callout %}

---

### Session Timeout

If the user is inactive for extended periods:

1. OnArrival will emit a session timeout event
2. Native should handle graceful logout
3. Any in-progress bookings should be saved as drafts

---

## Booking Edge Cases

### PNR Generation Failure

If the airline system fails to generate a PNR:

```json
{
  "bookingStatus": "BOOKING_FAILED",
  "failureReason": "PNR_GENERATION_FAILED",
  "failureMessage": "Airline system unavailable"
}
```

**User Impact:**
- Payment will be refunded automatically
- User should retry with a different flight/time

---

### Partial Booking Failure

For multi-segment bookings where one segment fails:

1. All segments are rolled back
2. Full refund is initiated
3. User is notified of the specific failure

---

## Network Edge Cases

### Connectivity Loss

If network is lost during critical operations:

1. **During search:** Show cached results if available
2. **During payment:** Do NOT retry automatically
3. **During booking confirmation:** Poll for status when reconnected

### Retry Strategy

For failed API calls:

| Scenario | Retry | Delay |
| --- | --- | --- |
| Network timeout | Yes | Exponential backoff |
| 5xx Server Error | Yes | 2s, 4s, 8s |
| 4xx Client Error | No | — |
| Payment Error | No | Manual only |

---

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "FARE_EXPIRED",
    "message": "The selected fare is no longer available",
    "details": {
      "fareId": "FARE123",
      "expiredAt": "2025-03-13T14:29:30+00:00"
    }
  },
  "timestamp": "2025-03-13T14:30:00+00:00",
  "requestId": "req_abc123"
}
```

### Common Error Codes

| Code | Description | Action |
| --- | --- | --- |
| `FARE_EXPIRED` | Fare no longer available | Retry search |
| `SEAT_UNAVAILABLE` | Selected seat taken | Choose different seat |
| `PAYMENT_DECLINED` | Gateway declined | Try different payment method |
| `BOOKING_LIMIT_EXCEEDED` | Too many active bookings | Wait or cancel existing |
| `INVALID_TOKEN` | JWT validation failed | Re-authenticate |
