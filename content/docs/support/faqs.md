---
title: "Frequently Asked Questions"
description: "Frequently asked questions about OnArrival integration"
category: "support"
order: 1
---

## General Questions

### What is OnArrival?

OnArrival is a modular travel platform that enables consumer businesses to launch travel experiences inside their existing app — without building a full OTA stack or integrating multiple suppliers.

### How long does integration take?

Typical integrations go live in **< 30 days** compared to 6-9 months with traditional stacks. The timeline depends on:
- Complexity of customizations
- Partner API readiness
- Testing and UAT cycles

### What platforms are supported?

OnArrival supports:
- **Mobile:** iOS, Android, Flutter, React Native
- **Web:** Any modern browser
- **Backend:** Any language with HTTP/REST support

---

## Authentication & Security

### What JWT algorithm should I use?

We recommend **RS256** (RSA Signature with SHA-256). ES256 is also supported. HS256 (HMAC) is not recommended for production.

### How do I rotate my JWT signing keys?

If using JWKS:
1. Add the new key to your JWKS endpoint with a new `kid`
2. Start signing new tokens with the new key
3. Keep the old key in JWKS until all existing tokens expire
4. Remove the old key after grace period

If using static PEM:
1. Share the new public key with OnArrival
2. Wait for confirmation of key update
3. Start using the new key

### What happens if my token expires during a booking?

The PWA will call `eventRefreshToken()` to request a fresh token from your native app. Ensure your app can refresh tokens without user interaction.

---

## Payments

### Which payment gateways are supported?

OnArrival is gateway-agnostic. You integrate your own payment gateway. Common integrations include:
- Razorpay
- PayU
- Juspay
- Stripe
- Cashfree

### What happens if payment times out?

If payment doesn't complete within the fare hold window (typically 15 minutes):
1. The booking will fail
2. A refund will be automatically initiated
3. User will need to search again

### Can I offer EMI or BNPL options?

Yes, any payment method supported by your gateway can be offered. Configure the available payment options in the `paymentGatewayMetaInfo` response.

---

## Booking & Inventory

### What inventory sources are available?

OnArrival aggregates from multiple sources:
- GDS (Amadeus, Sabre, Travelport)
- NDC direct connects
- LCC aggregators
- Partner BYOS (Bring Your Own Supply)

### Can I use my own inventory?

Yes, through the BYOS program. Contact your OnArrival account manager for integration details.

### How are fare rules handled?

Fare rules are fetched in real-time from suppliers and displayed to users before booking. Rules include:
- Cancellation policy
- Change fees
- Baggage allowance
- Validity dates

---

## Webhooks & Events

### What events are sent via webhooks?

| Event | When |
| --- | --- |
| `BOOKING_CONFIRMED` | PNR generated successfully |
| `BOOKING_FAILED` | Booking could not be completed |
| `PAYMENT_SUCCESSFUL` | Payment received |
| `PAYMENT_FAILED` | Payment declined or errored |
| `REFUND_INITIATED` | Refund process started |
| `REFUND_COMPLETED` | Refund credited |

### What if my webhook endpoint is down?

OnArrival implements retry logic:
1. Immediate retry after failure
2. Exponential backoff (1m, 5m, 15m, 1h)
3. Maximum 5 retry attempts
4. Alert to OnArrival ops after all retries fail

### Can I receive webhooks for all bookings?

Yes, you can configure webhook filters for:
- All bookings
- Specific booking statuses
- Specific product types (flights, hotels)
- Specific user segments

---

## Troubleshooting

### WebView is loading slowly

1. Ensure WebView is preloaded on app launch (singleton pattern)
2. Enable caching: `domStorageEnabled = true`
3. Check network connectivity
4. Verify CDN performance in your region

### JavaScript bridge not working

1. Verify `javaScriptEnabled = true` in WebView settings
2. Check console logs for JavaScript errors
3. Ensure bridge script is injected after page load
4. Verify handler names match exactly

### Payment status not updating

1. Check if webhook endpoint is reachable
2. Verify IP whitelisting configuration
3. Check S2S authentication headers
4. Review payment gateway logs

### Token validation failing

1. Verify `iss` claim matches registered issuer
2. Check token expiry (`exp`)
3. Ensure `kid` matches a key in your JWKS
4. Verify public key / JWKS endpoint is accessible

---

## Support

### How do I contact support?

- **Technical Issues:** Raise a ticket via the OnArrival Partner Portal
- **Account Issues:** Contact your account manager
- **Urgent Production Issues:** Use the emergency hotline provided during onboarding

### What SLAs are provided?

| Priority | Response Time | Resolution Time |
| --- | --- | --- |
| P1 (Production down) | 15 minutes | 2 hours |
| P2 (Major impact) | 1 hour | 8 hours |
| P3 (Minor impact) | 4 hours | 24 hours |
| P4 (General query) | 24 hours | 72 hours |
