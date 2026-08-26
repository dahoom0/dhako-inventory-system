# Dhako Inventory, Sales & Business Management System — Product Requirements

## Prompt (for an AI system / development team)

> Design and build a modern, centralized inventory, sales, and business
> management platform for **Dhako**, a company that imports products,
> stores them in a main warehouse, distributes them to three branches,
> and sells to customers.
>
> The system must give Dhako a single, real-time source of truth for
> stock across all locations, connect sales directly to inventory and
> profit, and give the owner a dashboard that answers "How is the
> business doing right now?" in seconds. Treat inventory as the
> output of recorded transactions (receipts, transfers, sales,
> adjustments) — never as a number a user edits by hand. Build it as
> a lean modular monolith (not microservices), fully responsive
> across desktop, tablet, and mobile, since warehouse and branch
> staff will use it on the floor.

---

## 1. System Overview

Dhako needs one platform covering:

1. **Sales Management**
2. **Inventory Management**
3. **Admin Dashboard & Business Analytics**

The system maintains one accurate, real-time view of inventory across:

- Main Warehouse
- Branch 1
- Branch 2
- Branch 3

Every stock movement automatically updates quantities and writes a history record — no manual reconciliation.

---

## 2. Product Management

Keep products simple. No brand field.

| Field | Example |
|---|---|
| Product Name | Refrigerator 300L |
| Category | Refrigerator |
| Cost Price | RM 1,200 |
| Selling Price | RM 1,600 |

**Gross Profit per Unit = Selling Price − Cost Price** → RM 400 in the example above.

---

## 3. Inventory Management

Track quantity per product **per location**.

| Location | Quantity |
|---|---:|
| Main Warehouse | 50 |
| Branch 1 | 10 |
| Branch 2 | 8 |
| Branch 3 | 12 |
| **Total** | **80** |

Admin sees both total company inventory and per-location breakdowns from a single, centralized multi-location view — no spreadsheets required.

---

## 4. Low Stock / Reorder Thresholds

**Minimum Stock Level is configurable per product, and per product-per-location**, not hard-coded.

| Product | Minimum Stock |
|---|---:|
| Refrigerator A | 10 |
| Washing Machine B | 5 |
| AC C | 15 |

Status logic:

- Quantity ≤ Minimum → 🟡 **LOW STOCK**
- Quantity = 0 → 🔴 **OUT OF STOCK**

Example: Refrigerator A, minimum 10, current 10 → LOW STOCK.

Authorized users (Admin, Warehouse Manager) can edit thresholds at any time, and can set different minimums per location for the same product (e.g., a high-traffic branch may need a higher buffer than the warehouse).

---

## 5. Inventory Alerts

Auto-generated, surfaced in the dashboard, notification center, and the relevant user's notification panel:

- **Low Stock** — "Refrigerator A is below the minimum stock level."
- **Out of Stock** — "Refrigerator A is out of stock at Branch 2."
- **Slow Moving** — "Product B has not been sold for 60 days."
- **Stock Adjustment** — "5 units of Product C were removed as damaged stock."
- **Transfer** — "20 units of Product D were transferred from Warehouse to Branch 1."

---

## 6. Warehouse Management — Receiving

When imported stock arrives:

1. Select purchase/import
2. Select product
3. Enter quantity received
4. Confirm receipt
5. Warehouse inventory increases automatically

Example: 100 → +50 received → **150**.

Every receipt records: date, product, quantity, user, location, transaction type.

---

## 7. Warehouse Management — Outgoing Stock

### A. Delivery to Branch

Example: Warehouse sends 20 cartons to Branch 1.

- Warehouse: 100 → 80
- Branch 1: 30 → 50

Transfers carry a status: **Pending → Approved → Sent → Received** (or **Cancelled**), with a full audit trail of who moved what, when, and between which locations.

### B. Direct Customer Delivery

Warehouse can fulfill an order directly (e.g., 5 refrigerators). This auto-decrements warehouse stock and records the sale, linking straight into Sales Management.

---

## 8. Stock Adjustments (Damaged / Broken / Lost)

Every adjustment records: product, location, quantity, reason, user, date/time, notes.

Reasons:

- Damaged
- Broken
- Lost
- Incorrect Count
- Returned
- Manual Correction
- Other

Example: 100 cartons, 1 damaged → recorded adjustment → **99**. This creates accountability and prevents unexplained inventory changes.

---

## 9. Stock Movement Ledger

A single, append-only history of every inventory change:

| Date | Product | Type | From | To | Qty | User |
|---|---|---|---|---|---:|---|
| Aug 25 | AC 1.5HP | Transfer | Warehouse | Branch 1 | 20 | Ahmed |
| Aug 25 | Refrigerator | Sale | Branch 1 | Customer | 2 | Ali |
| Aug 25 | Washing Machine | Damage | Branch 2 | — | 1 | Hassan |
| Aug 26 | AC 1.5HP | Receive | Supplier | Warehouse | 50 | Ahmed |

---

## 10. Sales Management

A sale captures: product, quantity, selling price, customer, branch/location, date.

Auto-calculated:

- **Total Sale = Quantity × Selling Price**
- **Gross Profit = Revenue − Cost**

Example: AC 1.5HP × 3 @ RM 1,600 (cost RM 1,200) → Revenue RM 4,800, Cost RM 3,600, **Profit RM 1,200**.

---

## 11. Automatic Inventory Update After Sale

```
Sale recorded → Inventory decreases → Profit calculated → Dashboard updates
```

No manual inventory edits after a sale. Example: Branch 1 AC stock 20 → sells 3 → 17, automatically.

---

## 12. Sales Returns

Example: customer bought 3, returns 1. System records the return and adjusts inventory by condition.

Return status: **Returned → Inspected → Restocked / Damaged**.

---

## 13. Admin Dashboard

Opening screen answers: **"How is Dhako performing today?"**

KPI cards:

- Today's Sales / Today's Profit
- Monthly Sales / Monthly Profit
- Total Inventory Value
- Total Products
- Low Stock Products / Out-of-Stock Products

---

## 14. Sales Analytics

| Product | Units Sold | Revenue | Profit |
|---|---:|---:|---:|
| AC 1.5HP | 120 | RM 192K | RM 48K |
| Refrigerator | 80 | RM 128K | RM 32K |
| Washing Machine | 55 | RM 88K | RM 19K |

Identifies best/worst sellers and fast/slow movers.

---

## 15. Profit Analytics

- **High Profit** / **Low Profit** product rankings
- **Profit Margin = Gross Profit ÷ Revenue × 100**

Example: RM 1,600 sell, RM 1,200 cost → RM 400 profit → **25% margin**.

Connects COGS, sales, and gross profit so profitability can be viewed at item and invoice level.

---

## 16. Slow-Moving Products

Configurable velocity thresholds (e.g., 30 days = Slow Moving, 60 days = Very Slow).

| Product | Stock | Last Sale | Days Since Sale |
|---|---:|---|---:|
| Product A | 30 | June 20 | 66 |
| Product B | 15 | July 5 | 51 |
| Product C | 12 | July 20 | 36 |

Surfaces capital tied up in slow inventory.

---

## 17. Branch Analytics

| Branch | Sales | Profit | Expenses |
|---|---:|---:|---:|
| Branch 1 | RM 100K | RM 25K | RM 8K |
| Branch 2 | RM 80K | RM 18K | RM 6K |
| Branch 3 | RM 120K | RM 30K | RM 10K |

Ranks branches by sales, profit, and inventory efficiency; shows best-selling products per branch.

---

## 18. Inventory Intelligence

Turns raw numbers into decisions:

- ⚠️ **Reorder** — "AC 1.5HP has reached its minimum stock level."
- 📦 **Overstock** — "Product B has 150 units but only sold 8 this month."
- 🔥 **Fast Moving** — "Product C sold 80 units this month."
- 💰 **High Profit** — "Product D generated RM 18,500 gross profit this month."
- 📉 **Low Profit** — "Product E generated only RM 400 profit this month."

---

## 19. Inventory Value

Example: 100 units × RM 1,200 cost = **RM 120,000** inventory value.

Shown at warehouse level, branch level, and company total.

---

## 20. User Roles & Permissions

| Role | Access |
|---|---|
| **Admin** | Full access: all branches, all inventory, products, users, sales, profit, expenses, reports, thresholds, audit logs |
| **Warehouse Manager** | Receive stock, deliver to branches/customers, adjust damaged/lost stock, view warehouse inventory, process transfers |
| **Branch Manager** | View branch inventory, record sales, receive transfers, process returns, view branch performance |
| **Sales Employee** | Record sales, view available products/prices, view relevant inventory |

Role-based access control prevents users from acting outside their responsibilities.

---

## 21. Audit Trail

Every inventory-impacting action is logged with before/after state:

```
Ahmed changed Refrigerator stock
Before: 50 → Adjustment: -1 → After: 49
Reason: Damaged
Date: 25 August 2026
```

Full audit trails are a required control, not an optional feature.

---

## 22. Navigation Structure

```
Dashboard

Sales

Inventory
  ├── Products
  ├── Stock by Location
  ├── Stock Movements
  ├── Transfers
  ├── Adjustments
  └── Low Stock

Purchases
  ├── Suppliers
  ├── Purchases
  └── Receiving

Expenses

Reports
  ├── Sales
  ├── Profit
  ├── Inventory
  ├── Products
  └── Branches

Notifications
Users
Settings
```

---

## 23. Responsive Requirements

Works cleanly on mobile, tablet, laptop, and desktop. Warehouse staff need tablet/phone use on the floor; sales staff need to record sales from any device. Layout adapts automatically — no separate "mobile app" needed if the web app is built responsive-first.

---

## 24. Refined Architecture

**Principle: one application, one API, one database, easy deployment.** Modular monolith over microservices — Dhako's scale doesn't justify the operational overhead of distributed services.

```
┌─────────────────────────────────────────────┐
│  Client (Web, installable as PWA)            │
│  React + TypeScript, Vite                    │
│  TanStack Query (server-state/caching)       │
│  Tailwind CSS + shadcn/ui                    │
└───────────────────┬───────────────────────────┘
                     │ REST (JSON) + WebSocket
                     │ (for live stock/alert updates)
                     ▼
┌─────────────────────────────────────────────┐
│  API — Node.js + TypeScript (Fastify/Express)│
│  Modular monolith, organized by domain:      │
│   inventory · sales · purchasing · users ·   │
│   analytics · notifications                  │
│  Zod/DTO validation at the boundary          │
│  Role-based access control (RBAC) middleware │
└───────────────────┬───────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  PostgreSQL (single source of truth)         │
│   - Append-only stock_movements ledger       │
│   - Materialized/derived stock_levels view   │
│     (never hand-edited — computed from       │
│     movements: receipts + returns − transfers│
│     − sales − damage − loss)                 │
│   - Row-level audit columns (who/when)       │
│  Redis (optional) — cache dashboard KPIs,     │
│  low-stock computations, session store        │
└─────────────────────────────────────────────┘
```

**Key architectural refinements over a basic CRUD app:**

- **Event-sourced stock, not editable state.** `stock_levels` per product/location is a derived/materialized figure, recomputed or incrementally updated from the immutable `stock_movements` ledger. This makes the audit trail (Section 21) a natural byproduct of the data model rather than a bolt-on log table.
- **Real-time updates via WebSocket** (or Server-Sent Events) so low-stock alerts and dashboard KPIs update live on warehouse/branch screens without polling.
- **Background jobs** (e.g., BullMQ on Redis, or Postgres-native `pg_cron`) for nightly slow-moving analysis, inventory valuation snapshots, and alert generation — keeps the request/response path fast.
- **PWA packaging** for the frontend so warehouse and branch staff can install it to a home screen and get basic offline resilience (queued sale/adjustment submissions) without building separate native apps.
- **Read replicas / caching only if needed** — start with a single PostgreSQL instance; add a read replica or Redis caching layer only once reporting queries measurably slow down the primary.

Deploy via **Docker Compose**: `frontend`, `api`, `postgres`, optional `redis`. No Kubernetes, no Kafka, no service mesh, no polyglot persistence — Dhako's four locations and modest transaction volume don't need it, and the added complexity would slow the team down without a corresponding benefit.

---

## 25. Core Business Workflow

```
                SUPPLIER
                   │
                   ▼
              PURCHASE
                   │
                   ▼
            MAIN WAREHOUSE
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
       Branch 1  Branch 2  Branch 3
          │        │        │
          └────────┼────────┘
                   │
                   ▼
                SALES
                   │
                   ▼
               CUSTOMER
```

```
Purchase Received → Warehouse Stock +
      → Transfer → Branch Stock
      → Sale → Branch Stock − / Revenue + / COGS calculated
      → Profit calculated → Dashboard updated
      → Low-stock / slow-moving analysis
```

---

## 26. Most Important Principle

Inventory is never a number a user manually edits. It is always the computed result of recorded transactions:

```
Current Stock
= Opening Stock
+ Received Stock
+ Returned Stock
− Branch Transfers
− Customer Sales
− Damaged Stock
− Lost Stock
```

Every change has a reason and a history — this is Dhako's single source of truth.

---

## 27. Final Goal

On opening the dashboard, the Dhako owner should immediately see:

- How much did we sell, and how much profit did we make?
- Which products are selling fastest / barely selling?
- Which products make the most / least profit?
- Which products are running low, and where is our inventory located?
- Which branch is performing best?
- How much money is tied up in inventory?
- What stock was moved, sold, damaged, or received?

One centralized, real-time system replacing manual spreadsheets and disconnected records.