---
title: SendBird Integration for Support
order: 6
---

## 1. Overview & Purpose

The AI Travel Assistant is an in-app support chatbot powered by OnArrival that helps customers resolve booking and payment-related queries through self-service, while intelligently escalating to human support when backend or manual intervention is required.

### What the Bot Is

- A contextual, booking-aware support assistant
- Embedded inside the client's mobile or web application
- Designed to answer queries, explain charges, and collect required information

### What Problems It Solves

- Reduces customer support load
- Improves response time for common queries
- Prevents incorrect actions by validating eligibility and charges upfront
- Ensures clean handoff to support with full context

### When It Is Used vs Human Support

- Bot: Information, explanations, charge visibility, document collection
- Human Support: Actual processing (cancellation, refund, rebooking, manual verification)

## 2. Supported Use Cases

### 2.1 Booking-Related Queries

- Booking details (PNR, dates, routes, traveller info)
- Booking status (confirmed, cancelled, upcoming, completed)
- Travel dates and passenger information

### 2.2 Payment-Related Queries

- Payment success / failure
- Pending payment explanations
- Transaction reference and invoice details

### 2.3 Cancellation & Refund

- Cancellation eligibility
- Cancellation charges and refund breakdown
- Refund status tracking
- Partial / offline refund explanations
- Next steps and timelines (policy-based, not promises)

### 2.4 Escalation & Support

- Automatic escalation to human support
- Ticket creation with full conversation context
- Priority-based routing

Note: The bot does not directly modify bookings, cancel tickets, or process refunds.

## 3. What the Bot Can Do (Self-Service)

### 3.1 Answer Questions

**Booking Details**
- PNR, flight times, routes, traveller info from Order Data

**Booking Status**
- Confirmed, cancelled, upcoming from Order State

**Cancellation Charges**
- Exact charges and refund amount from Fare Rules

**Amendment Charges**
- Reschedule charges from Fare Rules

**Travel Policies**
- Cancellation, baggage, refund timelines from Knowledge Base

**Membership Benefits**
- Lounge access, priority support from Client Config

**General FAQs**
- Payment methods, booking flow from Knowledge Base

### 3.2 Initiate Actions (Then Escalate)

**Cancellation**
- Bot: Shows charges, confirms intent
- Escalated For: Actual cancellation

**Reschedule**
- Bot: Collects new date, shows charges
- Escalated For: Rebooking

**Refund Request**
- Bot: Shows refund amount
- Escalated For: Refund processing

**Name Correction**
- Bot: Collects documents
- Escalated For: Manual update

**DOB / Passport Update**
- Bot: Collects documents
- Escalated For: Manual update

### 3.3 Document Handling

- Accepts uploads (passport, ID proofs, supporting documents)
- Validates that documents were uploaded successfully
- Provides downloads: E-ticket PDF, Invoice / receipt PDF

## 4. Smart Booking Awareness

### 4.1 Multi-Traveller Handling

- Detects bookings with multiple travellers
- Asks: "All travellers or specific traveller?"
- All travellers → Shows accurate charges
- Specific traveller → Escalates (manual charge calculation)

### 4.2 Trip Type Awareness

- One-way → Direct handling
- Round-trip → Asks: "Outbound, return, or both?"
- Multi-city → Handles leg-by-leg

## 5. User Experience Flow

1. User opens Support / Help
2. Chatbot loads with booking context
3. User asks a question or selects an action
4. Bot: Answers directly, or collects required inputs, or escalates to support

## 6. Conversation Flow Examples

### 6.1 Cancellation Flow

User: "I want to cancel my booking"
Bot: Checks status, date, travellers
Bot: "All travellers or specific?"
User: "All"
Bot: "Charges: ₹2,350. Refund: ₹4,650. Proceed?"
User: "Yes"
Bot: Escalates to support with context

### 6.2 Reschedule Flow

User: "Reschedule to March 23"
Bot: Validates eligibility
Bot: "Amendment charges: ₹500. Proceed?"
User: "Yes"
Bot: Escalates to support

### 6.3 Name Correction Flow

User: "Correct name on ticket"
Bot: "Whose name?"
User: "John Doe"
Bot: "Upload passport"
User uploads document
Bot: Escalates to support

### 6.4 FAQ Flow (No Escalation)

User: "What's your cancellation policy?"
Bot: Answers from KB
Bot: "Anything else?"
Conversation ends

## 7. Escalation to Human Support

### 7.1 Automatic Escalation Triggers

- User confirms action - Backend processing required
- Partial traveller requests - Manual charge calculation
- Documents uploaded - Manual verification
- User asks for human twice - User preference
- Charges shown as ₹0 - Data unavailable
- Requests between 9 PM – 9 AM IST - Ticket created for next business day

### 7.2 What Gets Passed to Support

- Conversation summary (auto-generated)
- Booking / order ID
- Requested action
- Uploaded documents
- Priority level (P0 / P1 / P2)

## 8. Priority System

**P0 - Immediate**
- Travel within 6 hours, payment issues

**P1 - High**
- Travel within 24–48 hours

**P2 - Normal**
- Travel > 72 hours

## 9. What the Bot Cannot Do

- Cancel or modify bookings → Escalates
- Process refunds → Escalates
- Change dates in system → Escalates
- Access airline systems → Uses internal order data
- Handle non-travel queries → Redirects politely
- Promise refund timelines → Shares policy only

## 10. Technical Architecture (High Level)

### Components

- Client mobile/web app
- Chatbot UI
- OnArrival chatbot backend
- Booking, payment, and support systems

### Key Points

- UI is stateless
- Context and state maintained on backend
- Bot actions are read-only or intent-based
- No direct financial or booking mutations

## 11. Integration Models

- Embedded WebView
- Native SDK (if applicable)
- API-based integration (client-owned UI)

Each model defines:
- What client builds
- What OnArrival provides
- Data and auth responsibilities

## 12. Authentication & Data Access

- Booking context passed securely (token / JWT / S2S)
- Bot responses scoped to authenticated booking
- No access to: Full card data, Unnecessary PII
- All conversations logged for audit

## 13. Logging, Monitoring & Auditability

- Conversation logs (non-sensitive)
- API and event logs
- Escalation audit trail
- Error and fallback monitoring

## 14. Security Considerations

- Authenticated access only
- TLS encryption in transit
- No storage of payment credentials
- Tenant-isolated knowledge base
- Alignment with OWASP / bank security expectations

## 15. SLA & Availability

- Bot availability aligned with platform SLA
- Escalation SLAs tied to priority (P0 / P1 / P2)
- Off-hours ticket creation with next-day handling

## 16. Responsibilities Matrix

**Bot backend**
- OnArrival: Yes
- Client: No

**Knowledge base**
- OnArrival: Yes
- Client: No

**UI placement**
- OnArrival: No
- Client: Yes

**User authentication**
- OnArrival: No
- Client: Yes

**Support agents**
- OnArrival: No
- Client: Yes

## 17. Key Differentiators

1. No hallucinations (order + KB only)
2. Transparent charges before actions
3. Smart escalation logic
4. Multi-tenant isolation
5. Document validation before escalation
6. Off-hours intelligent handling

## 18. Metrics Tracked

- Total conversations
- Escalation rate
- Self-service resolution rate
- User ratings (0–5)
- Knowledge base improvement signals
