# TailorConnect

> **AI-Powered Tailoring & Boutique Marketplace — PWA-first Web Application**

TailorConnect is a modern digital operating system and marketplace that connects customers who need custom garment stitching with nearby vetted tailors and boutiques, managing the entire lifecycle: **Request → AI Parsing → Hybrid Matching → Quote → Booking → Payment → Cutting/Stitching → Delivery → Verified Review**.

---

## Architecture Highlights
- **Progressive Web App (PWA):** Responsive, installable on Mobile (iOS/Android) and Desktop with offline app shell.
- **Backend API:** Clean modular REST API (`/api/v1`), decoupled from client presentation.
- **Database:** PostgreSQL 18 with Prisma ORM, UUIDs throughout, UTC timestamps, and indexed spatial/order queries.
- **Amazon-Style Production Timeline:** Server-authoritative order state machine with immutable transition history (`OrderStatusHistory`).
- **Hybrid Deterministic Matching:** Explainable geo-distance, capability, turnaround, and specialization scoring.
- **Fail-Safe AI Extraction:** Structured natural language parsing with Zod schema validation and graceful fallback.

---

## Monorepo Layout
```text
tailorconnect/
├── apps/
│   ├── web/           # React 19 + Vite + TypeScript + Tailwind CSS PWA
│   └── api/           # Modular REST API (Node.js/Express/TypeScript)
├── packages/
│   ├── types/         # Shared TypeScript interfaces & enums
│   ├── validation/    # Shared Zod schemas
│   ├── api-client/    # Typed API client
│   └── utils/         # Currency, formatting, and geo math helpers
├── prisma/            # Prisma schema, migrations, and seed script
└── docs/              # In-depth architectural & API specifications
```

---

## Getting Started

### 1. Prerequisites
- Node.js >= 20 (Tested on Node v24)
- pnpm >= 9 (or npm)
- PostgreSQL 18 (Local service or Docker)

### 2. Setup & Installation
```bash
# Clone and install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Push schema to database
pnpm db:push

# Seed development data (Meera Boutique, Ramesh Tailors, etc.)
pnpm db:seed

# Start development servers
pnpm dev
```

---

## Documentation
- [System Architecture](file:///docs/architecture.md)
- [Database Schema & ERD](file:///docs/database.md)
- [REST API Contract](file:///docs/api.md)
- [Security & RBAC](file:///docs/security.md)
- [Execution Roadmap](file:///docs/roadmap.md)
