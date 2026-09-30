# TailorConnect — Architecture Specification

## Monorepo Layout
- `apps/web`: React 19, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, PWA Service Worker.
- `apps/api`: Node.js, Express/NestJS modular pattern, Prisma Client, JWT auth, Zod validation, REST v1.
- `packages/types`: Shared TypeScript types and enums (`OrderStatus`, `UserRole`, `PaymentMethod`, etc.).
- `packages/validation`: Shared Zod validation schemas.
- `packages/api-client`: Standard typed API client functions for frontend queries & mutations.
- `prisma`: Prisma ORM schema, migrations, seed script.

## Core Architectural Decisions
1. **PWA-First:** Installable on Android, iOS, and Desktop with offline cache shell and safe-area compatibility.
2. **Deterministic Hybrid Geo-Matching:** Two-tier matching engine combining hard relational filters (garment category, verification status, service radius, turnaround) with weighted scoring (specialization fit, proximity decay, bayesian rating, pricing compatibility).
3. **Graceful AI Requirement Extraction:** Natural language intake is parsed via LLM into structured JSON and guarded by Zod schemas. If the AI service is unreachable, the system gracefully falls back to structured category dropdowns without blocking the user.
4. **Server-Authoritative Order State Machine:** Transitions are guarded and logged immutably into `OrderStatusHistory` for a verified Amazon-style tracking timeline.
