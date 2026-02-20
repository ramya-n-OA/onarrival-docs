---
title: Payment & Authentication Edge Cases
description: >-
  This document outlines various Edge cases for Payment and Authentication along
  with the final Booking status. 
category: integration-guide
order: 3
---

## 1. Authentication Flow (OnArrival PWA)

Authentication starts when the user clicks **Flights** or **Hotels** inside the client's native app.

At that moment, OnArrival needs to establish a **trusted session** before any booking or payment activity can begin.

The authentication flow has **three distinct stages**:

| Stage | Purpose |
| --- | --- |
| **1. Token validation** | Verify the user's identity and organization |
| **2. Session creation** | Create an OnArrival session tied to the user |
| **3. User & meta info exchange** | Fetch rewards, campaigns, and personalization |

### Step 1 — Token Validation & Authentication

Before the PWA opens, it triggers:
```
eventLogin
```

The client application must return a **JWT token** in the response.

OnArrival then validates this token by checking:

- Token signature (using your **JWKS URL and public key**)
- Token expiry (`exp`)
- Issuer (`iss`)
- Organization identifiers (`organizationId`, `organizationCode`)

Only if all checks pass does the flow continue.

### Step 2 — Session Creation

If the token is valid, OnArrival creates a session for the user.

This session is used to:

- Flight searches, bookings, and payments to the correct user
- Maintain continuity across page refreshes and app navigation
- Allow background processing even if the app is closed

### Step 3 — User Profile & Meta Info

After the session is created, OnArrival calls the **User Profile API (S2S)** to fetch:

- User details (name, email, phone, etc.)
- Campaigns, coins, and offers
- Any personalization or eligibility flags

This information is then used to:

- Show the correct rewards
- Apply discounts
- Personalize the booking experience

### Authentication Failure Scenarios

Authentication can fail for the following reasons:

| Scenario | What it means | OnArrival behavior | User experience |
| --- | --- | --- | --- |
| **Token expired** | JWT is valid but `exp` has passed | Triggers `eventRefreshToken`  | Seamless if refreshed, else error |
| **Invalid signature / missing public key** | JWT cannot be verified | Login is blocked | "Flight services not available" screen |
| **Org details mismatch** | `iss`, `organizationId`, or `organizationCode` do not match | Access is blocked | "Flight services not available" screen |

### How refresh works (runtime behavior)

1. `eventRefreshToken` is called
2. Client returns JWT
3. OnArrival validates the token

## 2. Payment Flow & Edge Cases

This section explains how payments are initiated, processed, confirmed, retried, and refunded in the OnArrival platform, including how edge cases are handled to ensure a safe and reliable user experience.

![Payment Flow Diagram](./images/payment-flow.png)

### 2.1. Payment Initiation

The payment journey begins when the user clicks **Confirm Payment** on the PWA.

At this point:

- OnArrival's backend calls the **Payment Init API**
- This call registers the payment intent on the Partner's system
- The final payable amount (cash + coins) is locked
- Payment gateway–specific details are generated

If **payment init fails** (for example, due to validation errors or temporary backend issues):

- The user is shown an error
- The user can safely retry payment
- No money movement occurs at this stage

### 2.2. Passing Payment Details to Native App

When the payment init call succeeds:

- The Partner returns a `paymentGatewayMetaInfo` object containing all data required to start the payment gateway
- This payload is passed unchanged through the OnArrival PWA to the native app using the **JS Event Bridge**
- The native app initializes the Partner's Payment Gateway SDK

At this stage:

- OnArrival **does not interact** directly with the payment gateway
- All payment interactions happen within the native SDK

### 2.3. Payment at the Gateway (User Interaction)

The user completes the payment on the gateway using their chosen method (card, UPI, net banking, wallet, etc.).

From the gateway's perspective, three things can happen:

1. Payment is authorised and money is captured
2. Payment fails due to bank or user-level issues
3. The user abandons the flow (app closed, network drop, timeout)

Importantly, **gateway success does not immediately mean booking success**.

### 2.4. Frontend Behaviour After Gateway Completion

Once the user exits the payment gateway:

- The user is redirected back to the PWA
- A **"Payment Processing"** screen is shown
- A timer is displayed to indicate that confirmation is in progress

This screen exists purely for user experience.

It does **not** determine the final payment outcome.

### 2.5. Backend Confirmation (Source of Truth)

While the user sees the processing screen, OnArrival's backend independently confirms the payment outcome.

This happens in two parallel ways:

**Preferred path – Webhook & Payment Status Response**

- The Partner's backend sends a webhook to OnArrival with the payment result (`SUCCESS` or `FAILED`)
- Once the webhook confirms the "Success" of payment, a Payment Status response is sent from the client's backend.

**Fallback path – Polling**

- If no webhook is received within a defined window (e.g. 8 minutes), OnArrival polls the Partner's **Payment Status API for 15 minutes with a frequency of around 30 secs.**

Both paths ultimately converge into a single backend decision point.

### 2.6. Payment Outcome Handling

**Case 1: Payment Successful**

- OnArrival confirms payment success after receiving webhook from partner backend or via polling
- Payment status API becomes the source of truth
- Booking confirmation is triggered
- The user sees booking success on the PWA
- Ticket becomes available in the **My Trips** section

**Case 2: Payment Failed (Gateway-level)**

Examples include:

- Incorrect PIN
- Bank decline
- Limit exceeded
- User cancels payment

In this case:

- Payment is marked as **FAILED**
- No booking is confirmed
- The user is prompted to retry payment via the retry flow
- No refund is required since money was not captured

**Case 3: Payment Captured but No Immediate Confirmation**

This is a critical edge case and is explicitly handled in the system.

If:

- Money is captured by the gateway
- Webhook confirmation not received
- The frontend timer expires

Then:

- The user is asked to retry payment
- OnArrival continues backend reconciliation
- A final status check is performed with the Partner

If the final status shows that money was debited but no booking was confirmed:

- An **automatic refund** is initiated
- The user does not need to raise a support request

### 2.7. Booking Failure After Payment Success

In rare cases, payment may succeed but booking confirmation fails (for example, due to inventory or supplier issues or price change).

In this scenario:

- Booking is marked as **FAILED**
- A refund is automatically initiated
- Refund moves through:
- Refund Initiated
- Refund Pending (gateway processing)
- Refund Completed
- The user receives the refunded amount in the original payment method

### 2.8. Refund Handling & User Visibility

Once a refund is initiated:

- The user sees **Refund** status (Initiated, Processing, Success)
- OnArrival updates the final refund status once a webhook confirmation is received from Partner's end
- Additionally, OnArrival expects the Refund Status Response from the Partner

## 3. Edge Cases- Payment

### 3.1 Before payment is created (Pre–Payment Init)

Sometimes the user clicks **Pay**, but the request never reaches OnArrival.

For example:

- The user loses internet
- The app crashes
- The request times out

In this case:

- No `paymentId` is created
- No money can be charged
- The user can safely try again

If the user clicks **Pay** twice quickly, two requests may be sent.

OnArrival uses the `transactionId` to detect duplicate attempts and only allows one payment to be created.

### 3.2 When PayLoad is being created (`/payment/init`)

If the PG is slow or times out:

- Native cannot open the payment screen
- The partner may retry

If the payment gateway metadata (checksum, keys, config) is invalid:

- The payment SDK cannot launch
- The user sees an error
- The partner must fix the PG configuration

If `/payment/init` succeeds:

- A `paymentId` is created
- `paymentGatewayMetaInfo` is returned
- The native app launches the payment gateway SDK

### 3.3 After payment payload is created but before the gateway opens

If the user closes the app before the payment screen opens:

- The payment remains **pending until the timeout**
- The payment window eventually expires
- No money is captured

### 3.4 While the user is in the payment gateway

1. If the user abandons the payment or closes the gateway:
- The payment remains **PENDING until the timeout**
- The session and payment window eventually expire

2. If the bank declines the transaction:
- The payment is marked **FAILED**
- The user sees a failure message
- Retry payment flow

3. If the user completes payment but loses internet:
- The bank may still succeed
- OnArrival waits for webhook or polling
- The app shows **"Payment processing"**
- Refund is triggered

### 3.5 After the bank has processed the payment

1. If the payment succeeds but the webhook is delayed:
- OnArrival polls the partner's backend

2. If the webhook arrives more than once:
- Duplicates are ignored using `paymentId`

3. If payment succeeds but the flight or hotel is no longer available:
- The booking fails
- OnArrival automatically triggers the **refund API**
- The partner must process the refund

4. If coins or rewards were already applied:
- OnArrival calculates the proportional amount for the coins/ rewards and initiates the Refund
- Updated reward balances are sent back by partner

5. If the user retries Pay after success:
- The attempt is blocked using `transactionId`
- No duplicate charge is possible

6. If the app crashes after payment:
- OnArrival keeps the payment state
- Partner can fetch it using `/payment/{paymentId}`

7. If payment status is returned without `rrn` or `utr`:
- The payment cannot be reconciled
- The partner must resend a valid status

8. If the gateway reports a success but the amount is wrong:
- The transaction is flagged for investigation
- The partner must reconcile with the gateway
