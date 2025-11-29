# API Documentation

## Base URL
\`\`\`
http://localhost:3000/api
\`\`\`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

---

## Auth Endpoints

### POST /auth/register

Register a new user.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "securepassword123",
  "college": "State University"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "message": "User registered successfully. Please verify your email.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@university.edu",
    "college": "State University",
    "verificationStatus": "UNVERIFIED",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "otp": "123456"  // Only in development
}
\`\`\`

---

### POST /auth/login

Authenticate a user.

**Request Body:**
\`\`\`json
{
  "email": "john@university.edu",
  "password": "securepassword123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@university.edu",
    "verificationStatus": "VERIFIED",
    "trustScore": 85,
    "badges": ["🏆 Trusted Seller"],
    "avgRating": 4.8
  }
}
\`\`\`

---

### POST /auth/verify-email

Verify email with OTP.

**Request Body:**
\`\`\`json
{
  "email": "john@university.edu",
  "otp": "123456"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Email verified successfully",
  "verified": true
}
\`\`\`

---

### POST /auth/verify-id

AI verification of student ID.

**Request Body:**
\`\`\`json
{
  "userId": "uuid",
  "idPhotoUrl": "https://storage.example.com/id-photo.jpg"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Student ID verified successfully!",
  "verified": true,
  "verificationDetails": {
    "confidence": 85,
    "matchesEmail": true,
    "reason": null
  },
  "user": {
    "id": "uuid",
    "verificationStatus": "VERIFIED",
    "trustScore": 20,
    "badges": []
  }
}
\`\`\`

---

## Items Endpoints

### GET /items

Get all available items.

**Query Parameters:**
- \`page\` (optional): Page number (default: 1)
- \`limit\` (optional): Items per page (default: 20)
- \`category\` (optional): Filter by category
- \`sellerId\` (optional): Filter by seller

**Response (200):**
\`\`\`json
{
  "items": [
    {
      "id": "uuid",
      "name": "iPhone Charger",
      "price": 25.00,
      "photo": "https://...",
      "condition": "NEW",
      "category": "Electronics",
      "seller": {
        "id": "uuid",
        "name": "Jane Smith",
        "verificationStatus": "VERIFIED",
        "avgRating": 4.9
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
\`\`\`

---

### POST /items

Create a new item listing. **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "name": "TI-84 Calculator",
  "category": "Electronics",
  "description": "Barely used, works perfectly",
  "price": 50.00,
  "condition": "LIKE_NEW",
  "photo": "https://..."
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "message": "Item listed successfully",
  "item": { ... },
  "priceAnalysis": {
    "rating": "Fair",
    "averagePrice": 55,
    "explanation": "Price is in line with typical campus marketplace prices."
  }
}
\`\`\`

---

### GET /items/:id

Get item details.

**Response (200):**
\`\`\`json
{
  "item": {
    "id": "uuid",
    "name": "TI-84 Calculator",
    "description": "Barely used, works perfectly",
    "price": 50.00,
    "condition": "LIKE_NEW",
    "aiPriceRating": "Fair",
    "avgCampusPrice": 55,
    "priceExplanation": "...",
    "seller": {
      "id": "uuid",
      "name": "Jane Smith",
      "trustScore": 85,
      "avgRating": 4.9,
      "completedDeals": 47,
      "badges": ["🏆 Trusted Seller"]
    }
  }
}
\`\`\`

---

## Search Endpoint

### POST /search

AI-powered search.

**Request Body:**
\`\`\`json
{
  "query": "need iPhone charger urgent",
  "category": "Electronics",
  "maxPrice": 30,
  "page": 1,
  "limit": 20
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "query": {
    "original": "need iPhone charger urgent",
    "parsed": {
      "item": "iPhone charger",
      "urgency": "high",
      "category": "electronics",
      "keywords": ["iPhone", "charger"]
    }
  },
  "items": [ ... ],
  "pagination": { ... }
}
\`\`\`

---

## Transaction Endpoints

### POST /transactions/request

Request to buy an item. **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "itemId": "uuid"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "message": "Item request sent to seller",
  "transaction": {
    "id": "uuid",
    "status": "REQUESTED",
    "escrowAmount": 25.00,
    "item": { ... },
    "buyer": { ... },
    "seller": { ... }
  }
}
\`\`\`

---

### POST /transactions/accept

Seller accepts the transaction. **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "transactionId": "uuid"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Transaction accepted. Chat is now open.",
  "transaction": {
    "id": "uuid",
    "status": "ACCEPTED"
  }
}
\`\`\`

---

### POST /transactions/pay

Pay for item (escrow lock). **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "transactionId": "uuid",
  "paymentId": "razorpay_payment_id"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Payment secured in escrow. Please arrange meetup.",
  "transaction": {
    "status": "PAID",
    "paymentId": "..."
  },
  "countdown": {
    "start": "2024-01-01T10:00:00.000Z",
    "end": "2024-01-02T10:00:00.000Z",
    "hoursRemaining": 24
  }
}
\`\`\`

---

### POST /transactions/confirm

Buyer confirms item received. **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "transactionId": "uuid"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Transaction completed! Funds released to seller.",
  "transaction": {
    "status": "COMPLETED"
  },
  "nextStep": "Please rate the seller",
  "ratingRequired": true
}
\`\`\`

---

### POST /transactions/refund

Request a refund. **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "transactionId": "uuid",
  "reason": "Item not as described"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "message": "Refund processed successfully",
  "transaction": {
    "status": "REFUNDED"
  },
  "refundId": "..."
}
\`\`\`

---

## Ratings Endpoint

### POST /ratings

Submit a rating. **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "userId": "uuid",
  "transactionId": "uuid",
  "stars": 5,
  "comment": "Great seller, fast transaction!"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "message": "Rating submitted successfully",
  "rating": {
    "id": "uuid",
    "stars": 5,
    "comment": "Great seller, fast transaction!"
  }
}
\`\`\`

---

### GET /ratings

Get ratings for a user.

**Query Parameters:**
- \`userId\` (required): User ID
- \`page\` (optional): Page number
- \`limit\` (optional): Items per page

**Response (200):**
\`\`\`json
{
  "ratings": [ ... ],
  "stats": {
    "average": 4.8,
    "total": 47,
    "distribution": {
      "5": 40,
      "4": 5,
      "3": 2,
      "2": 0,
      "1": 0
    }
  },
  "pagination": { ... }
}
\`\`\`

---

## Disputes Endpoint

### POST /disputes

Open a dispute. **Requires authentication.**

**Request Body:**
\`\`\`json
{
  "transactionId": "uuid",
  "evidenceText": "The item was not as described...",
  "photos": ["https://..."]
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "message": "Dispute submitted for review",
  "dispute": {
    "id": "uuid",
    "decision": "PENDING"
  },
  "aiAnalysis": {
    "decision": "buyer_favor",
    "confidence": 75,
    "reasoning": "...",
    "suggestedAction": "Process refund to buyer, warn seller."
  }
}
\`\`\`

---

## Error Responses

All errors follow this format:

\`\`\`json
{
  "error": "Error message",
  "details": [...]  // Optional validation errors
}
\`\`\`

### Common Status Codes
- \`400\` - Bad Request (validation error)
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`409\` - Conflict
- \`500\` - Internal Server Error
