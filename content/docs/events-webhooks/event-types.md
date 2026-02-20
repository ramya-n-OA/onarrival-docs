---
title: "Event Types Reference"
description: "Complete catalogue of all OnArrival server-side events"
category: "events-webhooks"
order: 1
---


OnArrival emits **server-side events** to track user intent, booking lifecycle, payment progression, and refunds in near-real-time.

## What Are Events?

Events are **lifecycle signals** that tell you WHAT happened:
- A user searched for flights
- A payment completed
- A booking was confirmed
- A refund was processed

{% callout type="note" %}
**Events vs Webhooks:** Events are the signals (WHAT). Webhooks are the delivery mechanism (HOW you receive them).
{% /callout %}

## Common Event Structure

All events follow this envelope:
```json
{
  "userId": "APPLICATION_USER_ID",
  "eventType": "EVENT_NAME",
  "flightData": { /* nullable, event-specific */ }
}
```

## Complete Event Catalogue

| Category | Event | When Fired | Payload |
|----------|-------|------------|---------|
| **User Intent** | `USER_LOADED_FLIGHT` | User enters flight experience | `null` |
| **Search** | `FLIGHT_SEARCHED` | User performs search | Search object |
| **Selection** | `FLIGHT_SELECTED` | User selects flight | Order-derived |
| **Payment** | `FLIGHT_PAYMENT_INITIATED` | Payment starts | Order-derived |
| | `FLIGHT_PAYMENT_COMPLETED` | Payment succeeds | Order-derived |
| | `FLIGHT_PAYMENT_FAILED` | Payment fails | Order-derived |
| | `FLIGHT_PAYMENT_CANCELLED` | User cancels payment | Order-derived |
| **Booking** | `FLIGHT_BOOKING_INITIATED` | Booking starts | Order-derived |
| | `FLIGHT_BOOKING_SUCCESS` | Booking confirmed | Order-derived |
| | `FLIGHT_BOOKING_FAILED` | Booking fails | Order-derived |
| | `FLIGHT_BOOKING_CANCELLED` | Booking cancelled | Order-derived |
| | `FLIGHT_CONFIRMED` | Booking confirmed | Order-derived |
| **Reschedule** | `FLIGHT_RESCHEDULE_REQUESTED` | Reschedule initiated | Order-derived |
| | `FLIGHT_RESCHEDULED` | Reschedule completed | Order-derived |
| **Refund** | `FLIGHT_REFUND_INITIATED` | Refund started | Order-derived |
| | `FLIGHT_REFUND_SUCCESS` | Refund completed | Order-derived |
| | `FLIGHT_REFUND_FAILED` | Refund failed | Order-derived |

## Example Event Payloads

### FLIGHT_PAYMENT_COMPLETED
```json
{
  "userId": "USER123",
  "eventType": "FLIGHT_PAYMENT_COMPLETED",
  "flightData": {
    "id": "G01KPC79QDB79HP2EENU",
    "bookingStatus": "PAYMENT_SUCCESSFUL",
    "orderAmount": {
      "totalAmount": 24798,
      "currency": "INR"
    }
  }
}
```

### FLIGHT_BOOKING_SUCCESS
```json
{
  "userId": "USER123",
  "eventType": "FLIGHT_BOOKING_SUCCESS",
  "flightData": {
    "id": "G01KPC79QDB79HP2EENU",
    "bookingId": "250318206806",
    "bookingStatus": "BOOKING_CONFIRMED",
    "downloadAttachment": {
      "eticket": {
        "url": "https://example.com/ticket.pdf"
      }
    }
  }
}
```

