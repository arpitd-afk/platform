#!/bin/bash
# ============================================================
# Chess Academy Pro — Setup Script
# Runs migration + seed against Neon PostgreSQL
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      Chess Academy Pro — Setup           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── Backend setup ───────────────────────────────────────────
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo ""
echo "🗄️  Running database migration on Neon..."
node src/db/migrate.js

echo ""
echo "🌱 Seeding demo accounts..."
node src/db/seed.js

cd ..

# ─── Frontend setup ──────────────────────────────────────────
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Copy env if not exists
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Created frontend/.env.local"
fi

cd ..

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                  ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  Start backend:   cd backend && npm run dev          ║"
echo "║  Start frontend:  cd frontend && npm run dev         ║"
echo "║                                                      ║"
echo "║  Frontend → http://localhost:3000                    ║"
echo "║  Backend  → http://localhost:5000                    ║"
echo "║                                                      ║"
echo "║  Demo login:  student@demo.com / demo1234            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
