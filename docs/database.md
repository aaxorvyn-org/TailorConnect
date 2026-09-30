# TailorConnect — Database Architecture

## Engine & ORM
- PostgreSQL 18 with Prisma ORM
- Primary Keys: UUID v4
- Timezones: All timestamps stored in UTC (`timestamptz`)

## Key Entities
- `User` & `Profile`
- `Business`, `BusinessMember`, `BusinessLocation`, `BusinessService`, `BusinessSpecialization`, `BusinessPortfolio`
- `ServiceCategory`, `Service`
- `CustomerRequest`, `RequestImage`, `RequestMessage`
- `Quote`, `QuoteItem`
- `Order`, `OrderStatusHistory`, `OrderNote`
- `Appointment`
- `Payment`, `PaymentTransaction`
- `Review`
- `Notification`, `NotificationPreference`
- `AdminAction`

## Core Indexes
- Spatial composite index: `BusinessLocation(latitude, longitude)`
- Locality search: `BusinessLocation(city, locality)`
- Order query performance: `Order(customerId, status)`, `Order(businessId, status)`
- History timeline audit: `OrderStatusHistory(orderId, createdAt)`
