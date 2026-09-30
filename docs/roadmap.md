# TailorConnect — Execution Roadmap

## Phase 0: Architecture Specification (Current)
- High-level system architecture, monorepo layout, database ERD, API contract, UI/UX design tokens & route map, implementation roadmap.

## Phase 1: Monorepo Foundation & Core Infrastructure
- pnpm monorepo setup (`apps/web`, `apps/api`, `packages/types`, `packages/validation`, `packages/api-client`, `prisma`).
- Prisma schema creation & sync with PostgreSQL 18.
- Base UI design system components & responsive layout shell.
- Authentication & JWT token infrastructure.

## Phase 2: Tailor & Boutique Studio Onboarding
- Multi-step onboarding wizard for tailors.
- Business capability setup: services, specializations, pricing, portfolio, working hours.

## Phase 3: Customer Discovery & Deterministic Geo-Matching
- Service category taxonomy seeding.
- Proximity & capability matching engine with explainable match reasons.
- Public tailor profile and portfolio showcases.

## Phase 4: Request Intake, AI Requirement Parser & Quoting Loop
- Natural language stitching requirement input with instant AI extraction preview.
- Request submission, photo attachments, contextual Q&A chat.
- Itemized quote builder and customer acceptance flow.

## Phase 5: Orders & Amazon-Style Production Timeline
- Order generation (`TC-2026-XXXXXX`).
- State machine order transitions with immutable `OrderStatusHistory`.
- Interactive vertical timeline tracking UI for customers.
- Tailor orders workbench with "Due Today" filters.

## Phase 6: Appointments & Schedule Management
- Working hours time-slot generator.
- Customer booking flow for measurement, fitting, consultation, and pickup.

## Phase 7: Payment Engine & Receipts
- Abstract `PaymentService` architecture.
- Test/Mock online payment provider.
- In-store offline Cash/UPI recording and digital receipt view.

## Phase 8: Verified Reviews & Reputation System
- Order-verified review submission (only completed orders).
- Bayesian ratings aggregation on business profile.

## Phase 9: Admin Management Console
- Platform health dashboard, business verification approval/rejection queue, global order inspection.

## Phase 10: PWA Shell, Comprehensive Testing & Polish
- Web App Manifest & service worker offline cache.
- End-to-end user journeys verification (Customer, Tailor, Admin).
