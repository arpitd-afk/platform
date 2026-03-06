# Chess Academy Pro

A comprehensive, production-ready SaaS platform for online chess academies.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3000
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials
node src/db/migrate.js   # Run schema
node src/db/seed.js      # (Optional) Seed demo data
npm run dev
# → http://localhost:5000
```

---

## 🏗️ Architecture

```
chess-academy/
├── frontend/              # Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/        # Login, Register
│   │   ├── (dashboard)/   # All role dashboards
│   │   │   ├── super-admin/
│   │   │   ├── academy/
│   │   │   ├── coach/
│   │   │   ├── student/
│   │   │   └── parent/
│   │   ├── classroom/[id] # Live teaching board
│   │   └── game/          # Chess gameplay
│   ├── components/
│   │   ├── chess/         # ChessBoard component
│   │   └── layout/        # Sidebar, TopBar
│   └── lib/               # API client, Auth context
│
└── backend/               # Node.js Express API
    └── src/
        ├── routes/        # All API routes
        ├── middleware/     # Auth, rate limiting
        ├── websocket/     # Socket.io handlers
        ├── config/        # DB, Redis config
        ├── db/            # Schema SQL
        └── utils/         # Logger, helpers
```

---

## 👥 User Roles & Demo Accounts

| Role          | Email                   | Password   | Access                             |
|---------------|-------------------------|------------|-------------------------------------|
| Super Admin   | superadmin@demo.com     | demo1234   | Full platform control               |
| Academy Admin | academy@demo.com        | demo1234   | Academy management                  |
| Coach         | coach@demo.com          | demo1234   | Classrooms, students, assignments   |
| Student       | student@demo.com        | demo1234   | Games, puzzles, lessons             |
| Parent        | parent@demo.com         | demo1234   | Child progress, payments            |

---

## 📦 Key Features

### ♟️ Chess Engine
- Real-time multiplayer games via WebSockets
- Stockfish integration for AI analysis
- Full chess rule validation (chess.js)
- Elo rating system with K-factor

### 🎓 Live Classrooms
- Synchronized chessboard for all students
- Annotation tools (arrows, highlights, circles)
- Real-time chat
- Attendance tracking
- Session recording support

### 🏆 Tournaments
- Swiss, Round Robin, Arena, Knockout formats
- Auto-pairing algorithm
- Live standings
- Prize pool management
- Cross-academy support

### 📊 Analytics
- Rating progression charts
- Skill radar (tactics, endgame, opening, etc.)
- Game accuracy & blunder detection
- Opening performance breakdown
- Parent/coach report generation

### 🛡️ Anti-Cheat
- Engine similarity detection
- Move timing analysis
- Suspicious accuracy alerts
- Manual review dashboard

### 💳 Billing
- Multi-tier subscription plans (Trial/Starter/Academy/Enterprise)
- GST-ready invoicing
- Seat-based pricing
- Stripe/Razorpay integration ready

---

## 🔌 API Reference

### Auth
```
POST /api/auth/register    Create account
POST /api/auth/login       Get JWT token
POST /api/auth/refresh     Refresh token
GET  /api/auth/me          Current user
```

### Games
```
POST /api/games              Create game
GET  /api/games/:id          Get game state
POST /api/games/:id/move     Make move
POST /api/games/:id/resign   Resign
GET  /api/games/:id/analysis Get analysis
```

### Academies
```
GET  /api/academies          List (super admin)
GET  /api/academies/:id      Get details
POST /api/academies          Create
PUT  /api/academies/:id      Update
POST /api/academies/:id/suspend   Suspend
```

### WebSocket Events
```
game:join              Join a game room
game:move              Make a move
game:resign            Resign
classroom:join         Join classroom
classroom:board_update Coach updates board
classroom:chat         Send message
classroom:raise_hand   Raise hand
```

---

## 🛠️ Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript     |
| Styling    | Tailwind CSS, Framer Motion          |
| Chess      | chess.js, react-chessboard           |
| Backend    | Node.js, Express 4                   |
| Real-time  | Socket.io                            |
| Database   | PostgreSQL 15                        |
| Cache      | Redis 7                              |
| Auth       | JWT (jsonwebtoken)                   |
| Charts     | Recharts                             |
| Payments   | Stripe / Razorpay                    |

---

## 🌐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXT_PUBLIC_APP_NAME=ChessAcademy Pro
```

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chess_academy
DB_USER=postgres
DB_PASSWORD=your-password

# Redis
REDIS_URL=redis://localhost:6379

# App
FRONTEND_URL=http://localhost:3000

# Optional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password

# Optional: Payments
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Optional: Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=chess-academy-uploads
```

---

## 📄 License
MIT © 2024 ChessAcademy Pro
