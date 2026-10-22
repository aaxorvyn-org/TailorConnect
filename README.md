# Tailor Marketplace & Shop Management System

> **Phase 1: Foundation & Architecture Setup** (Complete)  
> **Phase 2: UI, Navigation & Multi-Role Dashboards** (Complete)  
> **Phase 5: Tailor Customer Management Module** (Complete)  
> **Phase 6: Location-based Tailor Discovery** (Complete)  
> **Phase 7: Tailor Shop Profile + Design Gallery** (Complete)  
> **Phase 8: Customer Measurement Management System** (Complete)  
> **Phase 9: Online Tailoring Order Management System** (Complete)

A full-stack, multi-vendor web application platform designed for bespoke tailors, couture ateliers, and discerning customers.


---

## Application Navigation & Page Routes

### Public Marketplace
| Page | URL Path | Description |
| :--- | :--- | :--- |
| **Home** | `/` | Sartorial hero section, bespoke categories, featured ateliers, trending lookbook, trust metrics |
| **Find Tailors** | `/tailors` | Search and filter master cutters by specialty, city, rating, and distance with consultation booking |
| **Tailor Registration** | `/register-tailor` | Onboarding flow for master cutters & studios with craftsmanship standards agreement |
| **Login** | `/login` | Multi-role portal sign-in (Customer, Tailor Atelier, Admin) with 1-click demo shortcuts |
| **About** | `/about` | ThreadCraft atelier narrative, 4 core pillars, and artisan verification standards |
| **Services** | `/services` | Bespoke suits, bridal couture, alterations, doorstep measuring, and textile sourcing |
| **Contact** | `/contact` | Concierge message dispatch and global flagship atelier directory |

### Customer Dashboard
| View | URL Path | Description |
| :--- | :--- | :--- |
| **Customer Overview** | `/dashboard/customer` | Wardrobe summary, active commissions, and nearby recommendations |
| **Nearby Tailors** | `/dashboard/customer/nearby` | Geographic artisan discovery with browser GPS, radius filtering, radar map, and distance sorting |
| **My Measurements** | `/dashboard/customer/measurements` | Dynamic made-to-measure profile management (Shirt, Pants, Blouse, Dress, Lehenga, Suit, Kids Wear) with backend template generation |
| **Orders** | `/dashboard/customer/orders` | Active & completed made-to-measure tracking with milestone stage breakdown |
| **Profile** | `/dashboard/customer/profile` | 32-point digital anatomical measurement sheet (cm/in) and fitting addresses |


### Tailor Atelier Dashboard
| View | URL Path | Description |
| :--- | :--- | :--- |
| **Atelier Overview** | `/dashboard/tailor` | Operations desk, daily fitting appointments, and production pipeline queue |
| **Shop Profile** | `/dashboard/tailor/profile` | Public storefront profile editor with real-time marketplace card preview |
| **Customers** | `/dashboard/tailor/customers` | Patron directory with search, pagination, profile view, notes storage, and order history |
| **Designs** | `/dashboard/tailor/designs` | Atelier lookbook manager with publish new design modal |
| **Orders** | `/dashboard/tailor/orders` | Workshop production queue with interactive stage milestone advancement |
| **Settings** | `/dashboard/tailor/settings` | Operating lead times, rush surcharges, and notification preferences |

### Admin Dashboard
| View | URL Path | Description |
| :--- | :--- | :--- |
| **Admin Console** | `/dashboard/admin` | Platform GMV metrics, pending atelier certification approval queue, system health monitor |

---

## Reusable Components Library

Located in `frontend/src/components/`:
- **Common**: `Button`, `Card` (`StatCard`), `FormFields` (`Input`, `Textarea`, `Select`, `Checkbox`), `Modal`, `SearchBar`, `FeedbackStates` (`LoadingSpinner`, `SkeletonCard`, `EmptyState`, `ErrorState`), `Toast` (`ToastProvider`, `useToast`)
- **Layout**: `Navbar` (responsive header with mobile drawer), `Footer` (rich sitemap), `Sidebar` (multi-role dashboard navigation)
- **Shared**: `TailorCard`, `DesignCard`, `OrderCard`

---

## Running Locally

### Backend (FastAPI + PostgreSQL structure):
```powershell
cd backend
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```
- Endpoint: `http://127.0.0.1:8000/api/health`

### Frontend (React + Vite + TypeScript + Tailwind):
```powershell
cd frontend
npm run dev
```
- Web UI: `http://localhost:5173`
