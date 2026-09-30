# TailorConnect — Security Architecture

## Authentication & Authorization
- Password hashing using salted bcrypt with high work factor.
- JWT Access Tokens (15 min expiry) + Secure HttpOnly Refresh Cookies.
- Strict Role-Based Access Control (`CUSTOMER`, `BUSINESS`, `ADMIN`).
- Business ownership validation prevents cross-tenant access to orders or quotes.

## Input Validation & Injection Prevention
- All incoming payloads validated via Zod DTO schemas.
- Database access fully parameterized through Prisma ORM to prevent SQL injection.
- Security headers enforced via Helmet (XSS filter, frameguard, no-sniff).

## Privacy & Sensitive Data
- Customer private exact coordinates are not exposed to businesses during initial discovery. Only approximate locality is displayed until measurement or home delivery is confirmed.
- Audit logging of administrative actions (`AdminAction`).
