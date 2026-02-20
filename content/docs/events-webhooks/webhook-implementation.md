---
title: "Webhook Implementation"
description: "How to receive and process OnArrival events via webhooks"
category: "events-webhooks"
order: 2
---

Webhooks are HTTPS endpoints on your server that receive event notifications from OnArrival.

## What is a Webhook?

A webhook is the **delivery mechanism** for events:

1. Something happens in OnArrival (payment completes, booking confirmed)
2. OnArrival sends an HTTP POST request to your endpoint
3. Your server processes the event and responds with 200 OK
4. OnArrival retries if your server is unavailable

## Setting Up Your Webhook Endpoint

### 1. Create an HTTPS Endpoint

Your webhook URL must:
- Be publicly accessible via HTTPS
- Accept POST requests
- Return 200-299 status codes for success
- Respond within 5 seconds

**Example endpoint:**
```
https://api.yourcompany.com/webhooks/onarrival
```

### 2. Implement the Handler

**Example: Node.js/Express**
```javascript
app.post('/webhooks/onarrival', async (req, res) => {
  try {
    const event = req.body;
    
    // Validate webhook signature
    if (!verifySignature(req)) {
      return res.status(401).send('Invalid signature');
    }
    
    // Process the event
    await processEvent(event);
    
    // Acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});

async function processEvent(event) {
  const { userId, eventType, flightData } = event;
  
  switch(eventType) {
    case 'FLIGHT_PAYMENT_COMPLETED':
      await handlePaymentCompleted(userId, flightData);
      break;
    case 'FLIGHT_BOOKING_SUCCESS':
      await handleBookingSuccess(userId, flightData);
      break;
    default:
      console.log('Unknown event type:', eventType);
  }
}
```

## Retry Logic

If your endpoint fails, OnArrival retries with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 15 minutes |
| 4th retry | 1 hour |
| 5th retry | 6 hours |

## Best Practices

### 1. Process Asynchronously

Don't block the webhook response:
```javascript
app.post('/webhooks/onarrival', async (req, res) => {
  // Acknowledge immediately
  res.status(200).send('OK');
  
  // Process async
  processEventAsync(req.body)
    .catch(err => console.error('Processing error:', err));
});
```

### 2. Handle Duplicates

Events may be delivered more than once. Use idempotency:
```javascript
async function processEvent(event) {
  const eventId = `${event.eventType}_${event.flightData.id}`;
  
  if (await db.eventProcessed(eventId)) {
    return; // Already processed
  }
  
  await handleEvent(event);
  await db.markEventProcessed(eventId);
}
```

### 3. Log Everything

Maintain audit logs for all webhook events.