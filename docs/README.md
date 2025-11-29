# QuickGrab - AI-Powered Campus Marketplace

QuickGrab is a real-time, AI-powered, verified student marketplace where students can instantly find, meet, and grab everyday items from nearby verified sellers on campus.

## 🚀 Features

### Core Platform Features

1. **AI Student Verification** - Verify students using AI-powered ID card analysis
2. **AI Smart Search** - Natural language search with urgency detection
3. **Escrow Payments** - Secure payment flow with timeout protection
4. **Real-time Chat** - Socket.io powered communication
5. **Trust Network** - Ratings, badges, and trust scores
6. **AI Moderation** - Automatic scam detection and dispute resolution

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- React + TailwindCSS
- ShadCN UI Components
- Socket.io Client

### Backend
- Next.js API Routes
- PostgreSQL with Prisma ORM
- Socket.io
- Claude AI API (for verification, search, moderation)

## 📁 Project Structure

\`\`\`
├── app/
│   ├── (auth)/                 # Auth pages
│   │   └── signup/
│   ├── (main)/                 # Main app pages
│   │   ├── home/
│   │   ├── item/[id]/
│   │   ├── chat/[transactionId]/
│   │   ├── meetup/[transactionId]/
│   │   ├── profile/[id]/
│   │   ├── dispute/[id]/
│   │   └── list-item/
│   ├── api/                    # API Routes
│   │   ├── auth/
│   │   ├── items/
│   │   ├── search/
│   │   ├── transactions/
│   │   ├── ratings/
│   │   └── disputes/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     # ShadCN UI components
│   ├── layout/
│   └── features/
├── lib/
│   ├── ai/                     # AI services
│   │   ├── claude.ts
│   │   ├── verification.ts
│   │   ├── search-parser.ts
│   │   ├── price-checker.ts
│   │   ├── moderation.ts
│   │   └── meetup.ts
│   ├── services/
│   │   └── trust-engine.ts
│   ├── socket/
│   │   └── client.ts
│   ├── validators/
│   │   └── index.ts
│   ├── utils/
│   └── db.ts
├── prisma/
│   ├── schema.prisma
│   └── seed/
├── docs/
└── public/
\`\`\`

## 🔧 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- (Optional) Anthropic API key for AI features

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/Harshul23/5-star.git
cd 5-star
git checkout quickgrab-mvp
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Configure your \`.env\`:
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/quickgrab"
JWT_SECRET="your-secret-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"  # Optional
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
\`\`\`

5. Set up the database:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

6. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

## 📡 API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register a new user
- \`POST /api/auth/login\` - Login
- \`POST /api/auth/verify-email\` - Verify email with OTP
- \`POST /api/auth/verify-id\` - AI verification of student ID

### Items
- \`GET /api/items\` - List all items
- \`POST /api/items\` - Create a new item
- \`GET /api/items/:id\` - Get item details
- \`PUT /api/items/:id\` - Update item
- \`DELETE /api/items/:id\` - Delete item

### Search
- \`POST /api/search\` - AI-powered search

### Transactions
- \`POST /api/transactions/request\` - Request to buy item
- \`POST /api/transactions/accept\` - Seller accepts request
- \`POST /api/transactions/pay\` - Pay and lock escrow
- \`POST /api/transactions/confirm\` - Confirm item received
- \`POST /api/transactions/refund\` - Request refund

### Ratings
- \`POST /api/ratings\` - Submit rating
- \`GET /api/ratings?userId=xxx\` - Get user ratings

### Disputes
- \`POST /api/disputes\` - Open a dispute
- \`GET /api/disputes\` - Get user's disputes

## 🔄 Transaction Flow

\`\`\`
REQUESTED → ACCEPTED → PAID → MEETING → COMPLETED
                ↓
           (timeout)
                ↓
            REFUNDED
\`\`\`

## 🏆 Trust Score Calculation

Trust Score (0-100) = 
- Verification (0-20)
- Ratings (0-40)
- Deal Volume (0-20)
- Reliability (0-20)

### Badge System
- 🏆 Trusted Seller: 50+ deals, 4.8+ rating
- ⚡ Quick Responder: <5min average response
- 💎 Fair Pricer: 90%+ fair price listings
- 🎯 100% Success Rate: 10+ deals, 0% cancellation

## 🤖 AI Features

### AI Verification
Uses Claude Vision API to:
- Extract name, college, expiry from ID
- Match with email domain
- Detect fake/expired IDs

### AI Search Parser
Parses natural language queries:
- Input: "need iPhone charger urgent"
- Output: { item: "iPhone charger", urgency: "high" }

### AI Price Checker
Compares prices with campus averages:
- Fair / Overpriced / Underpriced / Great Deal

### AI Moderation
- Chat toxicity detection
- Scam pattern detection
- Automated dispute resolution

### AI Meetup Suggestions
Suggests safe meetup locations based on:
- User locations
- Campus landmarks
- Safety ratings

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- Escrow payment protection
- AI-powered fraud detection

## 📱 Pages

| Route | Description |
|-------|-------------|
| \`/\` | Landing page |
| \`/signup\` | Registration flow |
| \`/home\` | Browse & search items |
| \`/item/:id\` | Item details |
| \`/list-item\` | List new item |
| \`/chat/:transactionId\` | Real-time chat |
| \`/meetup/:transactionId\` | Meetup coordination |
| \`/profile/:id\` | User profile |
| \`/dispute/:id\` | Dispute resolution |

## 📄 License

MIT License
