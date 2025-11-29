# QuickGrab API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### POST /auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securePassword123",
  "name": "John Doe",
  "college": "State University"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@university.edu",
    "name": "John Doe",
    "verificationStatus": "PENDING"
  },
  "token": "jwt_token"
}
```

### POST /auth/login

Authenticate and get a token.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "jwt_token"
}
```

### POST /auth/verify-email

Verify email with OTP code.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "code": "123456"
}
```

### POST /auth/verify-id

Upload student ID for verification.

**Request Body (multipart/form-data):**
- `photo`: Student ID image file

---

## Items Endpoints

### GET /items

List all available items.

**Query Parameters:**
- `category` (optional): Filter by category
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "iPhone 13 Charger",
      "price": 25.00,
      "condition": "NEW",
      "aiPriceRating": "Fair",
      "seller": {
        "id": "uuid",
        "name": "Jane Smith",
        "trustScore": 85
      }
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 5,
    "total": 100
  }
}
```

### POST /items

Create a new listing.

**Request Body:**
```json
{
  "name": "Calculus Textbook",
  "description": "Stewart 8th Edition",
  "category": "Books",
  "price": 45.00,
  "condition": "GOOD",
  "photos": ["base64_image_data"]
}
```

**Response:**
```json
{
  "item": { ... },
  "priceCheck": {
    "rating": "Great Deal",
    "averagePrice": 60.00,
    "explanation": "20% below average campus price"
  }
}
```

### GET /items/:id

Get item details.

### PATCH /items/:id

Update an item.

### DELETE /items/:id

Delete an item.

---

## Search Endpoint

### GET /search

AI-powered natural language search.

**Query Parameters:**
- `q` (required): Search query
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `condition` (optional): Item condition
- `sort` (optional): price_asc, price_desc, newest, rating

**Example:**
```
GET /search?q=cheap chargers under 30 dollars
```

**Response:**
```json
{
  "query": {
    "original": "cheap chargers under 30 dollars",
    "parsed": {
      "keywords": ["chargers"],
      "priceRange": { "max": 30 },
      "intent": "budget_search"
    }
  },
  "items": [...],
  "suggestions": ["You might also like: cables, adapters"]
}
```

---

## Transaction Endpoints

### POST /transactions/request

Request to buy an item.

**Request Body:**
```json
{
  "itemId": "uuid",
  "message": "Hi, is this still available?"
}
```

### POST /transactions/accept

Accept a purchase request.

**Request Body:**
```json
{
  "transactionId": "uuid"
}
```

### POST /transactions/pay

Lock funds in escrow.

**Request Body:**
```json
{
  "transactionId": "uuid",
  "paymentIntentId": "razorpay_payment_id"
}
```

### POST /transactions/confirm

Confirm delivery and release funds.

**Request Body:**
```json
{
  "transactionId": "uuid",
  "role": "buyer" | "seller"
}
```

### POST /transactions/refund

Issue refund to buyer.

**Request Body:**
```json
{
  "transactionId": "uuid",
  "reason": "Item not as described"
}
```

---

## Ratings Endpoint

### GET /ratings

Get ratings for a user.

**Query Parameters:**
- `userId` (required): User ID to get ratings for
- `page` (optional): Page number
- `limit` (optional): Ratings per page

### POST /ratings

Create a rating after transaction.

**Request Body:**
```json
{
  "transactionId": "uuid",
  "stars": 5,
  "comment": "Great seller, fast meetup!"
}
```

---

## Disputes Endpoint

### GET /disputes

Get disputes for a user.

### POST /disputes

Open a dispute.

**Request Body:**
```json
{
  "transactionId": "uuid",
  "reason": "ITEM_NOT_AS_DESCRIBED",
  "evidenceText": "The charger doesn't work",
  "photos": ["base64_evidence_photo"]
}
```

**Response:**
```json
{
  "dispute": { ... },
  "aiResolution": {
    "recommendation": "PARTIAL_REFUND",
    "confidence": 0.85,
    "reasoning": "Based on message history, item appears to have cosmetic damage not mentioned in listing."
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": [/* Optional validation errors */]
}
```

**Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
