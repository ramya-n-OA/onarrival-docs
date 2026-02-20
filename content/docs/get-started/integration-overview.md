---
title: "Product & Integration"
description: "How OnArrival integrations work, responsibilities split, and booking lifecycle"
category: "get-started"
order: 3
---

## What is OnArrival?

OnArrival is a modular travel platform that enables consumer businesses to launch travel experiences inside their existing app — without building a full OTA stack or integrating multiple suppliers.

{% callout type="tip" title="Key Value Proposition" %}
Go live in **weeks instead of months** while retaining full control over brand, user experience, payments, and customer ownership.
{% /callout %}

Instead of providing only APIs, OnArrival offers a **Micro-App powered travel experience** that ships with:

| Capability | Description |
|------------|-------------|
| **Booking Workflows** | Fully-managed search, selection & checkout |
| **Multi-Supplier Inventory** | Aggregated flights from multiple sources |
| **Pricing Integrity** | Fare rules, ancillaries & transparent pricing |
| **S2S Payments** | Server-to-server payment init, refunds & status |
| **Lifecycle Events** | Webhooks for all booking state changes |
| **Loyalty Support** | Partner-owned rewards & value programs |

---

## Integration Architecture

The integration runs across two coordinated tracks:

### Frontend Track (Native App)

Handled via **Micro-App + JS Bridge**:

- Search, availability, fares & ancillaries
- Review & booking confirmation flow
- Native navigation & event callbacks
- Cross-screen communication with Native app

{% callout type="info" title="Brand Experience" %}
The experience feels **fully native & on-brand** — users never leave your app.
{% /callout %}

### Backend Track (Server-to-Server)

Handled via **secure S2S contracts**:

- User profile fetch & eligibility context
- Payment init, status & refunds
- Webhooks + booking lifecycle events
- Rewards earn / burn processing
- Reconciliation & audit trails

{% callout type="tip" title="Reliability" %}
S2S architecture ensures no dependency on frontend sessions, reliable retries & recoverability, and traceable booking & payment workflows.
{% /callout %}

---

## Responsibilities Matrix

### What You Own

| Area | Your Responsibility |
|------|---------------------|
| **Identity** | User authentication & JWT issuance |
| **Profile** | User data, segmentation & loyalty logic |
| **Payments** | Payment gateway execution via your SDK |
| **Refunds** | Approval workflows for refund requests |
| **Communication** | User messaging, emails & notifications |
| **Order History** | MyTrips / History screens in your app |

### What OnArrival Owns

| Area | OnArrival Responsibility |
|------|--------------------------|
| **Inventory** | Supplier aggregation & routing |
| **Search** | Pricing, fare rules & availability |
| **Booking** | Creation, lifecycle & state management |
| **Ancillaries** | Meals, baggage, seats & SSR handling |
| **Operations** | Support workflows & escalation |
| **Reconciliation** | Pricing integrity & settlement |

---

## Why This Model Works

| Benefit | Business Impact |
|---------|-----------------|
| **30-day go-live** | Faster time to market vs multi-month builds |
| **No supplier integration** | Lower engineering overhead |
| **Enterprise UX** | Full brand control with polished experience |
| **Deep supply access** | Competitive pricing & coverage |
| **BYOS option** | Bring Your Own Supply if needed |
| **Lower capex** | Better ROI vs OTA-scale rebuild |

---

## Booking Lifecycle

```
User Journey                    Backend Events
───────────────────────────────────────────────────
1. Search & Select
   └─ User browses flights

2. Review & Confirm
   └─ Fare lock created         → BOOKING_INITIATED

3. Payment
   └─ Native SDK triggered
   └─ Payment completed         → PAYMENT_COMPLETED

4. Booking Confirmed
   └─ PNR generated             → BOOKING_CONFIRMED
   └─ E-ticket delivered

5. Post-Booking
   └─ Cancellation (if any)     → BOOKING_CANCELLED
   └─ Refund processed          → REFUND_PROCESSED
```

---

## Next Steps

Ready to integrate? Follow this sequence:

**[Pre-Requisites](/docs/integration-guide/pre-requisites)** — Get UAT credentials and review checklist
2. **[Authentication](/docs/integration-guide/authentication)** — Implement JWT flow and S2S auth
3. **[JS Bridge Events](/docs/events-webhooks/js-bridge-events)** — Set up native event handlers
4. **[Payments](/docs/integration-guide/payment-integration)** — Integrate payment initialization
5. **[Webhooks](/docs/events-webhooks/webhook-events)** — Configure webhook endpoints