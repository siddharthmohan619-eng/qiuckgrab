# QuickGrab MVP - Architecture Documentation

## Overview

QuickGrab is an AI-powered peer-to-peer campus marketplace that enables verified students to buy and sell items safely with escrow payments and intelligent features.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS v4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM v6
- **AI**: Claude API (Anthropic) for search parsing, price checking, meetup suggestions, and moderation
- **Real-time**: Socket.io for chat and notifications
- **Payments**: Razorpay (sandbox) for escrow

## Project Structure

```
/app
  /(auth)             # Auth routes (signup, verify)
  /(main)             # Main app routes
    /home             # Home feed with AI search
    /item/[id]        # Item detail page
    /chat/[transactionId] # Real-time chat
    /meetup/[transactionId] # Meetup coordination
    /profile/[id]     # User profile & trust score
    /dispute/[id]     # Dispute resolution
    /list-item        # Create new listing
  /api                # API routes
    /auth             # Authentication endpoints
    /items            # Item CRUD
    /search           # AI-powered search
    /transactions     # Transaction state machine
    /ratings          # Rating system
    /disputes         # Dispute handling

/components
  /ui                 # Shadcn-style UI components

/lib
  /ai                 # AI service integrations
  /services           # Business logic (trust engine)
  /socket             # Socket.io client
  /utils              # Helper functions
  /validators         # Zod schemas

/prisma
  schema.prisma       # Database schema
  /seed               # Demo data seeder
```

## Database Schema

### Core Models

- **User**: Student accounts with verification status, trust scores, and badges
- **Item**: Listings with AI price ratings
- **Transaction**: Escrow flow with state machine
- **Rating**: 5-star reviews with comments
- **Dispute**: AI-assisted resolution

### Transaction States

```
REQUESTED → ACCEPTED → ESCROWED → MEETUP_SET → COMPLETED
                 ↓          ↓
              DECLINED   DISPUTED → RESOLVED
```

## AI Features

1. **Search Parser**: Natural language → structured query
2. **Price Checker**: Fair market value assessment
3. **Meetup Suggester**: Safe campus location recommendations
4. **Content Moderator**: Listing/message screening
5. **Dispute Resolver**: AI-powered arbitration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/verify-id` - Student ID verification

### Items
- `GET/POST /api/items` - List/create items
- `GET/PATCH/DELETE /api/items/[id]` - Single item operations

### Search
- `GET /api/search?q=...` - AI-powered search

### Transactions
- `POST /api/transactions/request` - Request to buy
- `POST /api/transactions/accept` - Seller accepts
- `POST /api/transactions/pay` - Lock escrow
- `POST /api/transactions/confirm` - Confirm delivery
- `POST /api/transactions/refund` - Refund buyer

### Ratings
- `GET/POST /api/ratings` - List/create ratings

### Disputes
- `GET/POST /api/disputes` - List/create disputes

## Trust Score Engine

Trust scores (0-100) are calculated from:
- Verification status (20 points)
- Average rating (40 points)
- Deal volume (20 points)
- Reliability/no-shows (20 points)

Badges awarded:
- 🏆 Trusted Seller (score ≥ 85)
- ⚡ Quick Responder (< 5min avg response)
- 💎 Fair Pricer (items rated "Fair" or better)
- ✅ Verified Student (completed ID verification)

## Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_SOCKET_URL=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

## Development Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed demo data
npx ts-node prisma/seed/index.ts

# Start development server
npm run dev
```

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```
