---
title: User Profile API
description: 'User profile configuration, campaigns, rewards earn/burn, and convenience fees'
category: integration-guide
order: 3
---

## API Definition

**Purpose:**

The **User Profile API** is used by OnArrival to fetch user context required to create/continue a session and personalise the travel experience. This typically includes:

* User identity details (for mapping orders to the correct user)
* Campaign configuration (earn/burn rules, reward eligibility)
* Any additional user flags or tags needed for pricing/personalisation

OnArrival re-fetches this profile during payment or booking finalisation to ensure the latest reward configuration is used.

**Method / Direction:** Server-to-Server (Partner → OnArrival PWA bootstrap dependency)

**Endpoint:** HTTPS — must be reachable from OnArrival VPC

**Authentication:** JWT in header:

```
Authorization: Bearer <token>
```

***

## Response Object — High-Level Structure

```json
{
  "user": { ... },
  "campaigns": [ ... ],
  "convenienceFeeConfig": [ ... ],
  "tags": [ ... ]
}
```

| Section                | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `user`                 | User identity & eligibility profile                   |
| `campaigns`            | Earn / burn / discount programs                       |
| `convenienceFeeConfig` | Dynamic convenience fee rules                         |
| `tags`                 | Tags to identify a user cohort (Used for A/B testing) |

***

## User Object

```json
{
  "id": "123",
  "username": "John Doe",
  "mobile": "+919999999999",
  "email": "user@example.com",
  "tags": ["AV-3.2.1", "IOS", "ORG_FIRST_TIME_USER"],
  "title": "Mr",
  "gender": "MALE",
  "dateOfBirth": "1993-07-08",
  "residentCountry": "IN",
  "countryCode": "IN",
  "nationality": "IN",
  "passport": {
    "issuingCountry": "IN",
    "number": "J8329294",
    "expiration": "2025-03-29",
    "issuingDate": "2024-04-01"
  }
}
```

{% callout type="tip" %}
Any additional partner-specific attributes may be added under tags.
{% /callout %}

***

## Campaign Configuration Object

```json
{
  "campaigns": [
    {
      "earn": [ ... ],
      "discounts": [ ... ],
      "burn": {
        "coinsBalance": 10000,
        "convertionPerInrValue": 0.1,
        "maxBurnPercentagePerBooking": 70
      }
    }
  ]
}
```

| Field       | Meaning                        |
| ----------- | ------------------------------ |
| `earn`      | Coins / cashback earning rules |
| `discounts` | Flat / % discount programs     |
| `burn`      | Rules for redeeming coins      |

***

## Earn Campaign Configuration

### Campaign Types

| Type            | Key                     | Meaning                                 |
| --------------- | ----------------------- | --------------------------------------- |
| Base Campaign   | `offerType: "STANDARD"` | Default reward for all users            |
| Add-On Campaign | `offerType: "ADD_ON"`   | Additional reward for specific segments |

{% callout type="note" %}
Only one base campaign is active at a time. Multiple add-on campaigns may stack.
{% /callout %}

### Strike-Off Display Pricing

Used only for UI highlighting — does **not** affect reward calculation.

Example:

* You set: `percentagePerBooking: 3`, `strikeOffPercentagePerBooking: 2`
* User sees: "Get ~~2%~~ 3% cashback"
* User gets: 3% (always the actual value)

### Example — Percentage Based Rewards

```json
{
  "campaigns": [{
    "earn": [
      {
        "type": "COINS",
        "offerType": "STANDARD",
        "campaignName": "1% cashback",
        "percentagePerBooking": 1,
        "isVisible": true,
        "order": 1
      },
      {
        "type": "COINS",
        "offerType": "ADD_ON",
        "campaignName": "PRO user bonus",
        "percentagePerBooking": 3,
        "strikeOffPercentagePerBooking": 1,
        "isVisible": true,
        "order": 2
      }
    ]
  }]
}
```

**User outcomes:**

* Regular user → 1%
* PRO user → 1% + 3% = 4%

### Example — Fixed Amount Rewards

```json
{
  "campaigns": [{
    "earn": [
      {
        "type": "MONEY_CASHBACK",
        "offerType": "STANDARD",
        "amountPerBooking": 50,
        "order": 1
      },
      {
        "type": "COINS",
        "offerType": "ADD_ON",
        "amountPerBooking": 100,
        "stikeOffAmountPerBooking": 150,
        "order": 2
      }
    ]
  }]
}
```

***

## Convenience Fee Configuration

```json
{
  "convenienceFeeConfig": [
    {
      "isInternational": false,
      "tripType": "ONE_WAY",
      "priceRange": { "min": 0, "max": 3000 },
      "fee": 249,
      "strikeOffFee": 999
    }
  ]
}
```

Rules are applied based on route type, trip type, and fare slab.

***

### Configuration Rules


1\. Exactly one base campaign should be active
2\. Add-on campaigns are optional
3\. \`order\` controls display priority
4\. \`${coins}\` / \`${valueOfOfferInInr}\` tokens are used only for UI display

### User-Profile Sample Response:

```json
{
  "userId": "X",
  "eventType": "FLIGHT_PAYMENT_COMPLETED",
  "flightData": {
    "id": "I7E4SR1URWK1QHC20UBN",
    "flightSearchId": "6b3263f2-3b7d-4f6e-b384-b1e46bd84f9e",
    "flightSearchInfo": {
      "from": {
        "id": "PNQ",
        "iata": "PNQ",
        "name": "Pune Airport",
        "city": "Pune",
        "state": "Maharashtra",
        "country": "IN",
        "tz": "Asia/Kolkata"
      },
      "to": {
        "id": "BOM",
        "iata": "BOM",
        "name": "Chhatrapati Shivaji Maharaj International Airport",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "IN"
      },
      "travellerCount": {
        "adult": 1,
        "child": 0,
        "infant": 0
      },
      "cabinType": "ECONOMY",
      "tripStart": {
        "date": "2025-03-28"
      },
      "international": false
    },
    "flights": [
      {
        "id": "NPE5LB4RGBMIO11FHXTU",
        "departure": "PNQ",
        "arrival": "BOM",
        "pnrNumber": "6KM2UR",
        "segments": [
          {
            "id": "1",
            "airline": {
              "code": "AI",
              "name": "Air India",
              "flightNumber": "842"
            },
            "departure": {
              "airport": {
                "iata": "PNQ",
                "name": "Lohegaon",
                "city": "Pune"
              },
              "date": "2025-03-28",
              "time": "12:40"
            },
            "arrival": {
              "airport": {
                "iata": "BOM",
                "name": "Chatrapati Shivaji Airport",
                "city": "Mumbai"
              },
              "terminal": "2",
              "date": "2025-03-28",
              "time": "13:35"
            },
            "flightDuration": {
              "display": "00h 55m"
            },
            "baggageInfo": {
              "baggages": [
                {
                  "cabin": "7kg",
                  "checkIn": "15kg",
                  "travellerType": "ADULT"
                }
              ]
            }
          }
        ]
      }
    ],
    "bookingId": "24050248334",
    "bookingStatus": "BOOKING_CONFIRMED",
    "orderAmount": {
      "currency": "INR",
      "taxAmount": 993,
      "baseAmount": 2430,
      "convenienceFee": 0,
      "totalAmount": 3423,
      "paymentSummary": {
        "status": "PAYMENT_SUCCESSFUL",
        "method": "PAYMENT_GATEWAY",
        "amountRefunded": 0
      }
    },
    "downloadAttachment": {
      "eticket": {
        "url": "https://onarrival-e-tickets.s3.ap-south-1.amazonaws.com/24050248334/e-tickets/PNQ_TO_Mumbai.pdf",
        "type": "pdf"
      }
    }
  }
}
```


Field Reference
---------------

### User Profile Fields

| Field              | Type           | Required     | Notes                                                  |
| ------------------ | -------------- | ------------ | ------------------------------------------------------ |
| `user.id`          | string         | ✓            | Primary key tying all OnArrival orders back to partner |
| `user.username`    | string         | ✓            | Full customer name for ticketing                       |
| `user.firstName`   | string         | ✓            | Customer first name                                    |
| `user.lastName`    | string         | ✓ if present | Customer last name                                     |
| `user.mobile`      | string (E.164) | ✓            | Used for SMS & WhatsApp notifications                  |
| `user.email`       | string         | ✓            | Used for e-ticket delivery                             |
| `user.title`       | enum           | ✓            | `Mr`, `Ms`, `Mrs`, `Mstr`, `Miss`                      |
| `user.tags[]`      | string\[]      | —            | Behaviour/segment tags echoed back in events           |
| `user.gender`      | enum           | —            | `MALE`, `FEMALE`, `OTHER`                              |
| `user.dateOfBirth` | ISO-8601       | if present   | Some airlines mandate it                               |
| `user.passport.*`  | object         | —            | Must be present if `international = true` in search    |

### Earn Campaign Fields

| Field                  | Description            | Values                                 |
| ---------------------- | ---------------------- | -------------------------------------- |
| `type`                 | Reward type            | `COINS`, `MONEY_CASHBACK`, `DIGI_GOLD` |
| `offerType`            | Campaign category      | `STANDARD` (base) or `ADD_ON`          |
| `campaignName`         | Display name           | Any descriptive text                   |
| `percentagePerBooking` | Reward as % of booking | e.g., 3 means 3%                       |
| `amountPerBooking`     | Fixed reward amount    | e.g., 100 means ₹100                   |
| `isVisible`            | Show to users          | `true` or `false`                      |
| `order`                | Display sequence       | 1, 2, 3...                             |

### Burn Configuration Fields

| Field                         | Type    | Required | Notes                                             |
| ----------------------------- | ------- | -------- | ------------------------------------------------- |
| `coinsBalance`                | integer | ✓        | Available coin/loyalty balance                    |
| `convertionPerInrValue`       | decimal | ✓        | Coins needed for ₹1 (e.g., `0.1` ⇒ 10 coins = ₹1) |
| `maxBurnPercentagePerBooking` | integer | —        | Max reward burn % allowed (70 means 70%)          |
