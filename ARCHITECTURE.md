# Dhako — System Architecture & Developer Guide

> **Dhako** is an inventory, sales, and business management system for a distribution company that imports products, stores them across multiple warehouses, distributes to branches, and sells to customers.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Structure](#2-repository-structure)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Design](#5-database-design)
6. [Core Business Logic](#6-core-business-logic)
7. [Use Cases & Workflows](#7-use-cases--workflows)
8. [API Reference](#8-api-reference)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [Local Development Setup](#11-local-development-setup)
12. [Key Design Decisions](#12-key-design-decisions)

---

## 1. System Overview

### What Dhako Does

Dhako manages the full lifecycle of a distribution business:

```
Supplier → [Warehouse A / B / C] → [Branch 1 / 2 / 3] → Customer
              (receive stock)         (transfer stock)     (sale)
```

The system tracks:
- **Inventory** — carton-based stock levels across 3 warehouses and 3 branches
- **Sales** — per-branch sales with historical cost snapshots for accurate profit
- **Expenses** — operational costs per location (rent, transport, staff, etc.)
- **Debts** — customer credit tracking with partial payment support
- **Transfers** — stock movement between locations with an approval pipeline
- **Analytics** — P&L, branch performance, stock alerts, sales trends

### Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript 5.7, Tailwind CSS v4 |
| Backend | Node.js, Express 4, TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod |
| Charts | Recharts v3 |
| Local DB | Docker Compose (Postgres 16 Alpine) |

---

## 2. Repository Structure

```
dhako/
├── src/                          # Frontend (React + Vite)
│   ├── main.tsx                  # React entrypoint — mounts App into #root
│   ├── App.tsx                   # Root layout, routing, sidebar toggle
│   ├── index.css                 # Tailwind v4 import + theme tokens + Google Fonts
│   ├── vite-env.d.ts             # Vite type declarations
│   ├── components/
│   │   ├── Sidebar.tsx           # Blue navigation sidebar (responsive)
│   │   └── ui.tsx                # Shared design system primitives
│   ├── data/
│   │   └── mock.ts               # All mock data + TypeScript types for local dev
│   ├── imports/
│   │   └── WhatsApp_Image_...    # Dhako logo (imported as ES module)
│   └── pages/
│       ├── Dashboard.tsx         # KPIs + P&L summary + charts
│       ├── Inventory.tsx         # Tabbed: Stock Overview / Products / Movements / Transfers / Alerts
│       ├── Sales.tsx             # Sales ledger + Record Sale modal
│       ├── Expenses.tsx          # Expense categories + ledger
│       ├── Debts.tsx             # Debt tracker + payment recording
│       ├── Warehouses.tsx        # Per-warehouse stock summary
│       ├── Placeholder.tsx       # Stub page for unbuilt routes
│       └── reports/
│           ├── SalesReport.tsx   # Product ranking + margin analysis
│           └── BranchReport.tsx  # Branch comparison + bar chart
│
├── backend/                      # Backend (Express API)
│   ├── docker-compose.yml        # Local PostgreSQL 16
│   ├── .env.example              # Environment variable template
│   ├── package.json              # Backend dependencies
│   ├── tsconfig.json             # CommonJS TypeScript config
│   └── src/
│       ├── server.ts             # Express app entry — helmet, cors, morgan, routes
│       ├── config/
│       │   ├── env.ts            # Env var validation (fails fast if missing)
│       │   ├── db.ts             # PostgreSQL connection pool (pg.Pool)
│       │   └── migrate.ts        # One-shot schema migration runner
│       ├── models/
│       │   ├── types.ts          # All TypeScript domain types
│       │   └── schema.sql        # Full PostgreSQL DDL (tables, indexes, views)
│       ├── middleware/
│       │   ├── auth.ts           # JWT Bearer token extraction & verification
│       │   ├── rbac.ts           # Role-based access control guards
│       │   └── validate.ts       # Zod request body validation
│       ├── controllers/
│       │   ├── auth.controller.ts        # Login, register, /me
│       │   ├── products.controller.ts    # CRUD for products
│       │   ├── inventory.controller.ts   # Stock matrix, alerts, receive stock, movements
│       │   ├── sales.controller.ts       # List + create sales (atomic with ledger)
│       │   ├── expenses.controller.ts    # List + create expenses
│       │   ├── debts.controller.ts       # List + create debts + record payments
│       │   ├── transfers.controller.ts   # List + create + advance transfer status
│       │   └── analytics.controller.ts  # Dashboard KPIs, trends, branch performance
│       ├── routes/
│       │   ├── index.ts          # Mounts all route groups under /api/v1
│       │   ├── auth.routes.ts
│       │   ├── products.routes.ts
│       │   ├── inventory.routes.ts
│       │   ├── sales.routes.ts
│       │   ├── expenses.routes.ts
│       │   ├── debts.routes.ts
│       │   ├── transfers.routes.ts
│       │   └── analytics.routes.ts
│       └── utils/
│           ├── jwt.ts            # signToken helper
│           ├── password.ts       # bcrypt hash + compare helpers
│           └── pagination.ts     # paginationParams + paginate response shaper
│
├── index.html                    # Vite HTML shell
├── vite.config.ts                # Vite config (React + Tailwind v4 plugin + @/ alias)
├── package.json                  # Frontend dependencies
├── ARCHITECTURE.md               # This file
└── CLAUDE.md / AGENTS.md        # AI assistant project instructions
```

---

## 3. Frontend Architecture

### Routing

The frontend uses a **custom hash-based router** — no React Router dependency. `App.tsx` holds a `page` string in `useState` and passes a `setPage` prop to `Sidebar`. Each nav item calls `setPage("pageName")` and `App` renders the matching page component.

```tsx
// App.tsx (simplified)
const [page, setPage] = useState("dashboard");

const render = () => {
  switch (page) {
    case "dashboard":  return <Dashboard />;
    case "inventory":  return <Inventory />;
    case "sales":      return <Sales />;
    // ...
  }
};
```

**Why not React Router?** The preview environment is a Figma Make canvas. A hash/state router avoids URL conflicts and keeps deployment zero-config.

### Design System (`src/components/ui.tsx`)

All shared primitives live here. Use these — don't create one-off styles:

| Component | Purpose |
|---|---|
| `Card` | White rounded container with shadow |
| `KPICard` | Metric tile with label, value, optional delta |
| `PageHeader` | Page title + subtitle + optional action button |
| `Btn` | Button (variants: `primary`, `secondary`, `ghost`, `danger`) |
| `StatusBadge` | Colored pill for status strings |
| `MovTypeBadge` | Specific badge for stock movement types |
| `Th` / `Td` | Styled table header / data cell |

### Theme Tokens (`src/index.css`)

```css
@theme inline {
  --color-primary:    #1e3a8a;   /* deep blue — sidebar, primary buttons */
  --color-accent:     #2563eb;   /* medium blue — links, highlights */
  --color-background: #f0f4ff;   /* off-white blue tint — page bg */
  --color-card:       #ffffff;   /* card backgrounds */
  --font-sans:        'Inter', system-ui, sans-serif;
  --font-mono:        'JetBrains Mono', monospace;
}
```

### Responsive Sidebar

- **Desktop (≥768px):** static sidebar, `w-[220px]`, always visible
- **Mobile (<768px):** hidden by default; hamburger button in top bar toggles it; renders as `fixed` overlay with a dark backdrop that closes it on click

### Mock Data (`src/data/mock.ts`)

All frontend pages consume data from this single file during development. When connecting to the real backend, replace these imports with `fetch()` calls to the API. The types in `mock.ts` mirror the domain types in `backend/src/models/types.ts` exactly.

Key exports:
```ts
PRODUCTS, SALES, EXPENSES, DEBTS, TRANSFERS, MOVEMENTS
WAREHOUSES, BRANCHES, ALL_LOCATIONS
fmt(n)          // dollar formatter → "$1,234"
saleRevenue(s)  // s.ctns × s.sellPrice
saleProfit(s)   // s.ctns × (s.sellPrice − s.costPrice)
SALES_TREND, BRANCH_PERF  // chart data arrays
```

---

## 4. Backend Architecture

### Request Lifecycle

```
HTTP Request
  → Express (helmet, cors, morgan, json body parser)
  → /api/v1 router
  → domain router (e.g. /products)
  → authenticate middleware (JWT verification)
  → rbac middleware (role check, if route requires it)
  → validate middleware (Zod schema, if route has one)
  → controller function
  → db query via pg.Pool
  → JSON response
```

### Middleware Stack

**`authenticate`** (`middleware/auth.ts`)
Reads `Authorization: Bearer <token>`, verifies with `JWT_SECRET`, and attaches `{ userId, role, locationId }` to `req.user`. Returns 401 if missing or invalid.

**`requireRole(...roles)`** (`middleware/rbac.ts`)
Checks `req.user.role` against the allowed list. Three pre-built guards:
- `isAdmin` — ADMIN only
- `isAdminOrStore` — ADMIN or STORE_MANAGER
- `isManager` — ADMIN, STORE_MANAGER, or BRANCH_MANAGER

**`validate(schema)`** (`middleware/validate.ts`)
Runs `schema.safeParse(req.body)`. On failure returns 400 with flattened Zod field errors. On success, replaces `req.body` with the parsed (coerced) value.

### Controllers Pattern

Each controller exports named async functions. Controllers:
1. Parse and validate input (Zod inline or via middleware)
2. Run SQL via `db.query()` or a transaction via `db.connect()` + `BEGIN/COMMIT/ROLLBACK`
3. Return `{ success: true, data: ... }` or `{ success: false, error: "..." }`

Transactions are used for any operation that writes to multiple tables atomically (create sale, advance transfer, record debt payment).

---

## 5. Database Design

### Entity-Relationship Overview

```
locations ──────────────────────────────────────────────────────────────────────
  │  (WAREHOUSE | BRANCH)
  │
  ├── users (location_id → locations)
  │
  ├── products (global, not location-scoped)
  │     └── stock_movements ──► inventory_levels VIEW (derived, never written)
  │
  ├── sales → sale_items → products
  │
  ├── expenses
  │
  ├── debts → customers
  │     └── debt_payments
  │
  └── transfers → transfer_items → products
```

### Locations Table

Warehouses and branches are **not separate tables** — they share `locations` with a `type` discriminator. This makes queries across all locations trivial and allows adding new locations without schema changes.

```sql
CREATE TABLE locations (
  id    UUID PRIMARY KEY,
  name  TEXT NOT NULL,
  type  TEXT NOT NULL CHECK (type IN ('WAREHOUSE', 'BRANCH'))
);
```

### The Inventory Model (Event-Sourced)

**Inventory is never stored as a number.** It is always computed from the `stock_movements` ledger.

```sql
-- append-only — never updated or deleted
CREATE TABLE stock_movements (
  type             TEXT,   -- STOCK_RECEIVED | SALE | BRANCH_TRANSFER | etc.
  product_id       UUID,
  from_location_id UUID,   -- NULL = external (supplier / customer)
  to_location_id   UUID,   -- NULL = external
  qty_ctn          INT,    -- cartons (positive = increase at destination)
  cost_per_ctn     NUMERIC -- historical cost snapshot
);
```

The `inventory_levels` view computes current stock:
```sql
CREATE VIEW inventory_levels AS
SELECT product_id, location_id, SUM(qty_ctn) AS qty_ctn, ...
FROM (
  SELECT product_id, to_location_id AS location_id,  qty_ctn FROM stock_movements WHERE to_location_id IS NOT NULL
  UNION ALL
  SELECT product_id, from_location_id AS location_id, -qty_ctn FROM stock_movements WHERE from_location_id IS NOT NULL
) mv
GROUP BY product_id, location_id;
```

**Why event-sourcing?** Full audit trail, no race conditions from concurrent updates, ability to replay history and fix mistakes via adjustment movements.

### Sale Items — Historical Cost Snapshot

When a sale is recorded, `cost_per_ctn_at_sale` is copied from the product's current `cost_per_ctn`. This means profit calculations remain accurate even after the product's cost is updated in the future.

```sql
CREATE TABLE sale_items (
  sell_price_per_ctn   NUMERIC,
  cost_per_ctn_at_sale NUMERIC,                          -- snapshot
  line_revenue         NUMERIC GENERATED ALWAYS AS (...) STORED,
  line_gross_profit    NUMERIC GENERATED ALWAYS AS (...) STORED
);
```

### PostgreSQL Views

| View | Purpose |
|---|---|
| `inventory_levels` | Current stock per product per location (derived from ledger) |
| `low_stock_alerts` | Products below `min_stock_ctn` threshold |
| `daily_sales_summary` | Revenue, COGS, gross profit grouped by location + date |

---

## 6. Core Business Logic

### Accounting Model

```
Revenue         = SUM(sale_items.line_revenue)
                = SUM(qty_ctn × sell_price_per_ctn)

COGS            = SUM(qty_ctn × cost_per_ctn_at_sale)

Gross Profit    = Revenue − COGS

Expenses        = SUM(expenses.amount)

Net Profit      = Gross Profit − Expenses
```

**Gross Margin %** = `(Gross Profit / Revenue) × 100`

This is enforced consistently in:
- `Dashboard.tsx` KPI cards
- Branch P&L comparison table
- `analytics.controller.ts` `/dashboard` endpoint
- `BranchReport.tsx` chart

### Inventory Unit Model

All inventory is tracked in **cartons (CTN)**. Total units are derived:

```
Total Units = qty_ctn × product.qty_per_ctn
```

Example: 10 CTN × 24 cans/CTN = 240 cans

This keeps the ledger simple (one number per movement) while the UI shows both cartons and units.

### Transfer Status Pipeline

Transfers follow a strict one-way state machine:

```
PENDING → APPROVED → SENT → RECEIVED
            ↓
        CANCELLED (at any point before RECEIVED)
```

Stock movements (ledger entries) are only written when a transfer reaches **RECEIVED** status. This prevents phantom inventory from in-transit stock.

### Debt Payment Logic

When a payment is recorded:
```
new_paid_amount = debt.paid_amount + payment.amount

if new_paid_amount >= debt.original_amount:
  status = PAID
elif new_paid_amount > 0:
  status = PARTIALLY_PAID
else:
  status = UNPAID
```

---

## 7. Use Cases & Workflows

### UC-01: Receive Stock from Supplier

**Actor:** Store Manager  
**Precondition:** Product exists in the system

1. Store manager opens **Inventory → Receive Stock**
2. Selects product, destination warehouse, quantity (CTN), cost per CTN
3. System creates a `STOCK_RECEIVED` movement in `stock_movements` with `from_location_id = NULL` (external supplier)
4. `inventory_levels` view immediately reflects the new stock
5. Dashboard low-stock alert count updates

**API:** `POST /api/v1/inventory/receive`

---

### UC-02: Transfer Stock Warehouse → Branch

**Actor:** Store Manager (requests) → Admin (approves) → Store Manager (marks sent) → Branch Manager (marks received)

1. Store manager creates transfer: selects from-location, to-location, products + quantities
2. System creates `transfers` record (status: PENDING) + `transfer_items` rows
3. Admin reviews and advances to APPROVED → SENT
4. Branch manager receives delivery, advances to RECEIVED
5. On RECEIVED: system auto-creates `BRANCH_TRANSFER` movements in the ledger
6. Branch inventory increases, warehouse inventory decreases

**API:**
- `POST /api/v1/transfers` — create
- `POST /api/v1/transfers/:id/advance` — advance status one step

---

### UC-03: Record a Sale

**Actor:** Branch Staff / Branch Manager

1. Staff opens **Sales** page, clicks **Record Sale**
2. Selects branch, customer (optional), date, product, quantity (CTN), selling price
3. System:
   - Creates `sales` header record
   - Creates `sale_items` row with current `cost_per_ctn` snapshot
   - Creates `SALE` movement in `stock_movements` (deducts from branch inventory)
   - Computed columns `line_revenue` and `line_gross_profit` are stored automatically
4. Dashboard P&L updates immediately

**API:** `POST /api/v1/sales`

---

### UC-04: Record an Expense

**Actor:** Branch Manager / Store Manager

1. Opens **Expenses** page, clicks **Add Expense**
2. Selects location, date, category, description, amount
3. System creates `expenses` record linked to location
4. Dashboard Net Profit decreases by expense amount (Net Profit = Gross Profit − Expenses)

**API:** `POST /api/v1/expenses`

---

### UC-05: Manage Customer Debt

**Actor:** Branch Staff

1. After a credit sale, staff opens **Debts** page
2. Creates a debt linked to customer + sale (optional) with original amount
3. When customer pays partially or fully, staff clicks **+ Payment**
4. System records `debt_payments` row and auto-updates debt status

**API:**
- `POST /api/v1/debts` — create debt
- `POST /api/v1/debts/:id/payment` — record payment

---

### UC-06: View Dashboard & Analytics

**Actor:** Admin / Store Manager

- **Dashboard KPIs:** Total Revenue, Gross Profit, Net Profit, Outstanding Debt, Low Stock Alerts
- **Branch P&L Table:** Per-branch Revenue / COGS / Gross Profit / Gross Margin % / Expenses / Net Profit
- **Sales Trend Chart:** 30-day area chart of revenue + gross profit
- **Branch Performance Chart:** Grouped bar chart comparing branches

**API:**
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/analytics/sales-trend`
- `GET /api/v1/analytics/branch-performance`

---

### UC-07: Monitor Low Stock

**Actor:** Store Manager / Admin

- **Inventory → Alerts tab** shows all products below `min_stock_ctn` at any location
- Alert badge count shown on the Alerts tab
- `low_stock_alerts` PostgreSQL view powers both the UI badge and the API

**API:** `GET /api/v1/inventory/alerts`

---

## 8. API Reference

**Base URL:** `http://localhost:3001/api/v1`  
**Auth:** All routes except `POST /auth/login` require `Authorization: Bearer <token>`

### Auth

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login → returns JWT token |
| POST | `/auth/register` | Admin | Create a new user account |
| GET | `/auth/me` | Any | Get current user profile |

### Products

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/products` | Any | List products (paginated, searchable) |
| GET | `/products/:id` | Any | Get single product |
| POST | `/products` | Admin/Store | Create product |
| PATCH | `/products/:id` | Admin/Store | Update product |

Query params for list: `?page=1&pageSize=20&search=cola`

### Inventory

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/inventory/matrix` | Any | Full stock matrix (all products × locations) |
| GET | `/inventory/alerts` | Any | Low stock alerts |
| GET | `/inventory/movements` | Any | Recent stock movements (last 200) |
| POST | `/inventory/receive` | Admin/Store | Receive stock from supplier |

### Sales

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/sales` | Any | List sales (filter: `?locationId=`) |
| POST | `/sales` | Any | Record new sale (atomic: ledger + items) |

### Expenses

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/expenses` | Any | List all expenses |
| POST | `/expenses` | Any | Create expense |

### Debts

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/debts` | Any | List all debts with customer info |
| POST | `/debts` | Any | Create debt record |
| POST | `/debts/:id/payment` | Any | Record a payment against a debt |

### Transfers

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/transfers` | Any | List transfers with items |
| POST | `/transfers` | Any | Create transfer request |
| POST | `/transfers/:id/advance` | Any | Advance transfer to next status |

### Analytics

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Any | Revenue, COGS, Gross/Net Profit, Debt, Alerts |
| GET | `/analytics/sales-trend` | Any | Daily revenue + gross profit (last 30 days) |
| GET | `/analytics/branch-performance` | Any | Per-branch P&L breakdown |

### Response Format

All responses follow this envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable message" }

// Validation error
{ "success": false, "error": "Validation error", "details": { "fieldName": ["error"] } }

// Paginated list
{
  "success": true,
  "data": {
    "data": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## 9. Authentication & Authorization

### JWT Flow

```
1. POST /auth/login  { email, password }
        ↓
2. Server verifies password (bcrypt compare)
        ↓
3. Server signs JWT:  { userId, role, locationId }  exp: 7d
        ↓
4. Client stores token (localStorage / memory)
        ↓
5. Client sends: Authorization: Bearer <token>  on every request
        ↓
6. authenticate middleware verifies + attaches req.user
```

### Role Permissions

| Role | Scope | Can Do |
|---|---|---|
| **ADMIN** | All locations | Everything — users, products, all reports, all locations |
| **STORE_MANAGER** | All locations | Receive stock, approve/send transfers, create products, view all |
| **BRANCH_MANAGER** | Own branch | Record sales, expenses, request transfers, view branch data |
| **BRANCH_STAFF** | Own branch | Record sales, record debt payments, view branch data |

Location-scoping: `BRANCH_MANAGER` and `BRANCH_STAFF` have `locationId` set in their JWT. Controllers can use `req.user.locationId` to filter data to their branch only.

---

## 10. Data Flow Diagrams

### Stock Flow

```
                        STOCK_RECEIVED movement
Supplier ────────────────────────────────────────► Warehouse A/B/C
                                                          │
                                              BRANCH_TRANSFER movement
                                              (on transfer RECEIVED)
                                                          │
                                                          ▼
                                                    Branch 1/2/3
                                                          │
                                                   SALE movement
                                                          │
                                                          ▼
                                                      Customer
```

### Accounting Flow

```
Sales Records
  └─ sale_items.line_revenue          ──► REVENUE
  └─ qty_ctn × cost_per_ctn_at_sale   ──► COGS
                                             │
                              REVENUE − COGS = GROSS PROFIT
                                             │
                              expenses.amount ──► EXPENSES
                                             │
                          GROSS PROFIT − EXPENSES = NET PROFIT
```

### API Request Flow

```
Client
  │  Authorization: Bearer <jwt>
  ▼
Express Server  (helmet, cors, morgan)
  │
  ▼
/api/v1 router
  │
  ├─ authenticate  →  decode JWT → req.user = { userId, role, locationId }
  │
  ├─ requireRole   →  check req.user.role against allowed list
  │
  ├─ validate      →  Zod parse req.body → replace with coerced data
  │
  ▼
Controller  →  pg.Pool query / transaction  →  PostgreSQL 16
  │
  ▼
{ success: true, data: ... }
```

---

## 11. Local Development Setup

### Prerequisites

- Node.js ≥ 20 (managed by `.mise.toml`)
- pnpm ≥ 9
- Docker + Docker Compose (for PostgreSQL)

### Step 1 — Start the Database

```bash
cd backend
docker compose up -d
# PostgreSQL 16 starts on localhost:5432
# Schema is auto-applied from src/models/schema.sql on first boot
```

### Step 2 — Configure Backend Environment

```bash
cp .env.example .env
# .env values:
# DATABASE_URL=postgresql://dhako:dhako_secret@localhost:5432/dhako_db
# JWT_SECRET=your_random_secret_here
# JWT_EXPIRES_IN=7d
# PORT=3001
# FRONTEND_URL=http://localhost:8443
```

### Step 3 — Install & Run Backend

```bash
cd backend
pnpm install
pnpm dev       # tsx watch → hot-reloads on file change
# API available at http://localhost:3001
```

### Step 4 — Run Frontend

```bash
# From repo root (Vite dev server is pre-started in Figma Make)
pnpm dev       # http://localhost:8443
```

### Step 5 — Seed Initial Data (Manual)

Insert a first admin user (the register endpoint requires an existing admin JWT):

```sql
-- Connect: psql postgresql://dhako:dhako_secret@localhost:5432/dhako_db

-- Locations
INSERT INTO locations (name, type) VALUES
  ('Warehouse A', 'WAREHOUSE'),
  ('Warehouse B', 'WAREHOUSE'),
  ('Warehouse C', 'WAREHOUSE'),
  ('Branch 1',    'BRANCH'),
  ('Branch 2',    'BRANCH'),
  ('Branch 3',    'BRANCH');

-- Admin user (password: admin123 — change immediately)
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@dhako.com',
  '$2a$12$...',   -- generate with: node -e "const b=require('bcryptjs'); b.hash('admin123',12).then(console.log)"
  'ADMIN');
```

### Useful Commands

```bash
# Backend
pnpm dev                   # start with hot reload
pnpm build                 # compile TypeScript → dist/
pnpm start                 # run compiled output

# Database
docker compose up -d       # start Postgres
docker compose down        # stop Postgres
docker compose down -v     # stop + wipe all data

# Connect to DB directly
docker exec -it backend-postgres-1 psql -U dhako -d dhako_db
```

---

## 12. Key Design Decisions

### Decision 1: Event-Sourced Inventory

**Problem:** Direct stock quantity updates cause race conditions under concurrent requests and lose audit history.

**Solution:** `stock_movements` is an append-only ledger. Stock is always `SUM(movements)`. A `STOCK_RECEIVED` movement increases stock; a `SALE` movement decreases it. Corrections are made with `ADJUSTMENT` movements — never by editing existing rows.

**Trade-off:** Reads require aggregation (the view handles this). For very large datasets, a materialized view refreshed periodically would improve read performance.

---

### Decision 2: Historical Cost Snapshots

**Problem:** Product costs change over time. If we calculate profit using the current cost, historical sales show incorrect margins.

**Solution:** `sale_items.cost_per_ctn_at_sale` copies the product's cost at the moment of sale. Profit calculations always use this snapshot, never the current product cost.

---

### Decision 3: Single `locations` Table

**Problem:** Warehouses and branches share 90% of the same fields and relationships.

**Solution:** One `locations` table with `type IN ('WAREHOUSE', 'BRANCH')`. All foreign keys (sales, expenses, inventory, transfers) point to `locations.id`. Adding a new location type in the future requires no schema change.

---

### Decision 4: Carton-Based Inventory Unit

**Problem:** Products come in different pack sizes. Tracking units alone makes receiving and transferring awkward.

**Solution:** All inventory quantities are in **cartons (CTN)**. `products.qty_per_ctn` is the multiplier to convert to units for display. The ledger stays clean with one number per row.

---

### Decision 5: Transfer Status Pipeline

**Problem:** Stock should not leave a warehouse until physically dispatched, and should not appear at a branch until physically received.

**Solution:** Transfers follow `PENDING → APPROVED → SENT → RECEIVED`. Inventory movements in the ledger are only written at **RECEIVED**. This prevents phantom stock from showing up during transit.

---

### Decision 6: Flat Frontend Router

**Problem:** React Router adds complexity and URL conflicts in the Figma Make canvas preview environment.

**Solution:** Simple `useState("page")` string router in `App.tsx`. Nav items call `setPage()`. All page components are lazy-renderable without URL parsing. When migrating to a standalone web app, swap in React Router with minimal changes.

---

*Last updated: August 2026*  
*Maintained by the Dhako engineering team.*
