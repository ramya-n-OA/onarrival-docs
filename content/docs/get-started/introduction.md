---
title: "Overview"
description: "Introduction to OnArrival flight booking integration"
category: "get-started"
order: 1
---

OnArrival provides APIs and UI components for embedding flight booking into mobile applications. This documentation covers the technical integration between your app and our platform.

---

## What OnArrival Provides

| Component | Description |
|-----------|-------------|
| **Booking PWA** | Pre-built flight search, selection, and checkout UI |
| **Payment APIs** | S2S payment initialization and status tracking |
| **Webhooks** | Real-time booking and payment event notifications |
| **JS Bridge** | Communication layer between native app and PWA |

---

## Integration Model

OnArrival uses a hybrid architecture where your native app hosts our Progressive Web App (PWA) in a WebView:

```
┌────────────────────────────────────────────────────────┐
│                    Your Native App                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │                    WebView                        │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │           OnArrival PWA                    │  │  │
│  │  │    (Search, Booking, Checkout UI)          │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                              │
│              JS Bridge (events)                        │
│                         │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Native SDKs (Auth, Payments, Downloads)       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                          │
                  S2S APIs + Webhooks
                          │
┌────────────────────────────────────────────────────────┐
│                   Your Backend                         │
│    (User Profile, Payment Gateway, Webhook Handlers)   │
└────────────────────────────────────────────────────────┘
```

---

## Two Integration Tracks

### Frontend (Native App)

Your mobile app implements the JS Bridge to handle:

- **Authentication** — Return JWT tokens when requested
- **Payments** — Trigger native payment gateway SDK
- **Downloads** — Save tickets and invoices to device
- **Navigation** — Handle deep links and back navigation

### Backend (Server)

Your backend implements APIs and handlers for:

- **User Profile** — Return user data for booking personalization
- **Payment Init** — Create payment intents and return gateway config
- **Webhooks** — Receive booking and payment lifecycle events

---

## Environments

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| UAT | `devflights.onarriv.io` | Development and testing |
| Production | Provided after sign-off | Live traffic |

---

## Authentication

OnArrival uses two authentication methods:

- **JWT tokens** — For user sessions (issued by your auth system)
- **S2S API keys** — For backend-to-backend calls (provided by OnArrival)

See [Authentication](/docs/integration-guide/authentication) for implementation details.
---

## Next Steps

1. Review [Pre-requisites](/docs/integration-guide/pre-requisites) checklist
2. Implement [Authentication](/docs/integration-guide/authentication) flow
3. Set up [JS Bridge Events](/docs/events-webhooks/js-bridge-events) handlers
4. Implement [Payment APIs](/docs/integration-guide/payment-integration)
5. Configure [Webhooks](/docs/events-webhooks/webhook-events)
