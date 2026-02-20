---
title: "Refund Scenarios"
description: "Understanding refund workflows, timelines, and scenarios"
category: "support"
order: 2
---

This document covers all refund scenarios and their handling in the OnArrival integration.

---

## Refund Types

### Full Refund

The entire booking amount is refunded when:
- Booking fails after payment capture
- Flight is cancelled by airline
- System error prevents booking completion

### Partial Refund

A portion of the booking amount is refunded when:
- User initiates cancellation (subject to fare rules)
- Airline schedule change with partial rebooking
- Ancillary cancellation (e.g., seat, baggage)

---

## Refund Scenarios

### Scenario 1: Booking Failed After Payment

**Trigger:** PNR generation fails after payment is captured

**Flow:**
1. OnArrival detects booking failure
2. Automatic refund initiated via `/refund` API
3. Full amount refunded (cash + coins)
4. `REFUND_INITIATED` webhook sent to partner

```json
{
  "refundReason": {
    "type": "BOOKING_FAILED",
    "specificReason": "PNR generation failed - airline system unavailable"
  }
}
```

**Timeline:** Refund initiated within 5 minutes of failure

---

### Scenario 2: User Cancellation (Before Travel)

**Trigger:** User requests booking cancellation

**Flow:**
1. User initiates cancellation in app
2. Cancellation charges calculated per fare rules
3. Partner approval (optional, based on config)
4. Refund initiated via `/refund` API
5. Partial refund after deducting charges

```json
{
  "refundReason": {
    "type": "USER_CANCELLATION",
    "specificReason": "Customer requested cancellation"
  },
  "totalAmount": 5000,
  "amountInCash": 3500,
  "cancellationCharges": 1500
}
```

**Timeline:**
- Refund initiated: Immediate after approval
- Credit to customer: 5-7 business days (bank dependent)

---

### Scenario 3: Airline Cancellation

**Trigger:** Airline cancels the flight

**Flow:**
1. OnArrival receives cancellation from airline
2. `BOOKING_UPDATED` webhook sent with cancellation status
3. Full refund automatically initiated
4. User notified via partner's messaging

```json
{
  "refundReason": {
    "type": "OFFLINE_PROCESSING",
    "specificReason": "Flight cancelled by airline - AI101 on 2025-03-15"
  }
}
```

**Timeline:** Refund within 24 hours of airline cancellation

---

### Scenario 4: Schedule Change - User Declines

**Trigger:** Airline changes schedule, user doesn't accept

**Flow:**
1. Schedule change notification sent to user
2. User declines new timing
3. Cancellation processed
4. Full refund initiated (no cancellation charges)

---

### Scenario 5: Payment Gateway Error

**Trigger:** Payment captured but gateway returns error before confirmation

**Flow:**
1. Payment status polling detects discrepancy
2. Reconciliation identifies captured but unbooked payment
3. Automatic refund initiated
4. Support ticket created for review

```json
{
  "refundReason": {
    "type": "SYSTEM_CANCELLATION",
    "specificReason": "Payment captured but booking not confirmed - gateway timeout"
  }
}
```

---

### Scenario 6: Duplicate Payment

**Trigger:** User accidentally pays twice

**Flow:**
1. Second payment detected during booking
2. Duplicate flagged automatically
3. Refund for duplicate amount
4. Original booking proceeds

---

## Refund Calculation

### Components

| Component | Refund Rule |
| --- | --- |
| Base Fare | Per airline fare rules |
| Taxes | Usually fully refundable |
| Convenience Fee | Non-refundable (configurable) |
| Coins/Rewards | Credited back to user balance |
| Ancillaries | Per ancillary cancellation policy |

### Example Calculation

```
Original Booking:
  Base Fare: ₹5,000
  Taxes: ₹1,200
  Convenience Fee: ₹249
  Coins Used: 500 (worth ₹50)
  Total Paid: ₹6,399

Cancellation Charges (per fare rule): ₹1,500

Refund Breakdown:
  Cash Refund: ₹5,000 + ₹1,200 - ₹1,500 - ₹249 = ₹4,451
  Coins Refund: 500 coins
  Total Value Refunded: ₹4,501
```

---

## Refund Timelines

| Payment Method | Refund Timeline |
| --- | --- |
| UPI | 2-4 hours |
| Credit Card | 5-7 business days |
| Debit Card | 5-7 business days |
| Net Banking | 3-5 business days |
| Wallet | Immediate |
| Coins/Rewards | Immediate |

{% callout type="note" %}
These timelines are for credit to customer account after refund is processed by OnArrival. Actual times depend on bank processing.
{% /callout %}

---

## Refund Status Flow

```
REFUND_INITIATED
      ↓
REFUND_PROCESSING
      ↓
   ┌──┴──┐
   ↓     ↓
REFUND_SUCCESS  REFUND_FAILED
```

### Status Definitions

| Status | Description |
| --- | --- |
| `REFUND_INITIATED` | Refund request accepted |
| `REFUND_PROCESSING` | Being processed by payment gateway |
| `REFUND_SUCCESS` | Successfully credited |
| `REFUND_FAILED` | Failed - manual intervention needed |

---

## Handling Failed Refunds

When a refund fails:

1. **Automatic Retry:** System retries up to 3 times
2. **Manual Review:** If retries fail, ticket created
3. **Alternative Methods:** Support may process via alternative channel
4. **Escalation:** Unresolved after 48 hours escalates to management

### Common Failure Reasons

| Reason | Resolution |
| --- | --- |
| Invalid bank account | Verify account details |
| Gateway timeout | Retry after delay |
| Insufficient funds (in merchant account) | Finance team notification |
| RRN not found | Manual reconciliation |

---

## Refund Webhooks

### Refund Initiated

```json
{
  "eventType": "REFUND_INITIATED",
  "refundId": "RF123456789",
  "paymentId": "PID876543210",
  "bookingId": "BK123456",
  "refundAmount": 4451,
  "coinsRefunded": 500,
  "initiatedAt": "2025-03-13T10:15:30+00:00"
}
```

### Refund Completed

```json
{
  "eventType": "REFUND_COMPLETED",
  "refundId": "RF123456789",
  "status": "REFUND_SUCCESS",
  "cashRefunded": 4451,
  "coinsRefunded": 500,
  "utr": "UTR987654321",
  "completedAt": "2025-03-13T14:30:15+00:00"
}
```

{% callout type="warning" %}
Always verify refund status via the `/refund/{refundId}` API for critical operations. Webhooks may be delayed.
{% /callout %}
