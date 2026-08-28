# Dhako — Complete Build Prompt for an AI Coding Tool

Build a complete, production-ready, multi-warehouse and multi-branch
**Inventory, Sales, Expense, Debt, Profit, and Analytics Management System.**

Do not build a frontend mockup. Build a complete functional system:
database, backend/API, authentication, role-based permissions,
inventory transaction logic, sales logic, expense logic, debt and
payment logic, profit calculations, analytics queries, reports, and a
responsive frontend.

**Before writing any implementation code**, first design the complete
database schema, entity relationships, system architecture, API
structure, role permissions, and inventory transaction flow. Then
implement it in a modular, scalable way.

---

## 1. System Overview

The business has three operational areas:

1. **Central Warehouses**
2. **Branches**
3. **Admin — Analytics & Management**

The business runs multiple central warehouses, initially:

- Warehouse A
- Warehouse B
- Warehouse C

...and multiple branches, with more of both added over time.

**Every warehouse and every branch has its own independent inventory.**
Stock moves between warehouses, and from warehouses to branches. Every
single stock movement is permanently recorded in a transaction/history
system — inventory quantities never change silently.

The system must keep inventory, sales, expenses, debts, profit, and
analytics accurate and consistent at all times.

---

## 2. User Roles & Permissions

Three roles, each scoped to a different slice of the system.

### A. Admin — full company-wide access

| Can... | |
|---|---|
| View | all warehouses & warehouse inventory, all branches & branch inventory, sales/expenses/debts/debt payments from every branch, stock movements, inventory history, all reports |
| Dashboards | sales, profit, expenses, low-inventory alerts, top/lowest-selling products, most/least profitable products, loss-making products, branch comparison |
| Manage | users & roles, warehouses, branches, products, low-stock thresholds |

Admin analytics must be filterable by: **all branches / one branch,
warehouse, product, product category**, and by date — **today,
yesterday, this week, this month, this year, custom range.**

### B. Store Manager — central warehouse operations

Can: view assigned warehouses & their inventory; add/edit products;
receive new stock; record supplier deliveries; transfer stock between
warehouses; send stock from warehouses to branches; view warehouse
stock/transfer/receiving history; view low-stock items in warehouses.

Must **not** have Admin's company-wide analytics or user-management access.

### C. Branch Manager / Branch Staff — single-branch operations

Can, for **their own branch only**: view local inventory and available
products; record sales (daily and per-transaction); record expenses;
record customer debts and debt payments; view their branch's sales,
expense, debt, and inventory history; view basic branch reports.

Must **not**: access other branches; directly modify warehouse
inventory; transfer stock from a warehouse without authorization;
access company-wide Admin analytics.

---

## 3. Product Management

Inventory is **carton-based**, with support for individual units where needed.

| Field | Notes |
|---|---|
| Product ID | |
| Product Name | |
| SKU / Product Code | |
| Category | |
| Unit of measurement | |
| CTN | number of cartons |
| Qty/CTN | quantity inside one carton |
| Total Quantity | **auto-calculated:** `CTN × Qty/CTN` |
| Cost price /CTN and /unit | |
| Selling price /CTN and /unit | |
| Low-stock threshold | |
| Created / Updated date | |
| Product status | |

**Example** — Coca Cola: 10 CTN × 24 Qty/CTN = **240 total units**.

Selling by carton or by individual unit must both correctly update the
remaining total quantity.

---

## 4. Central Warehouse Management

Warehouses start as A, B, C, but the architecture must let Admin add
more warehouses later without a code change. Each warehouse holds
independent inventory.

**Example:**

| Product | Warehouse A | Warehouse B | Warehouse C | Company Total |
|---|---:|---:|---:|---:|
| Coca Cola | 50 CTN | 20 CTN | 15 CTN | **85 CTN** |
| Water | 30 CTN | 40 CTN | — | **70 CTN** |
| Juice | 20 CTN | — | 60 CTN | **80 CTN** |

The system must always know exact per-warehouse stock and the
company-wide total per product.

---

## 5. Receiving New Stock

Store Manager records stock arriving at a warehouse.

**Example:** Coca Cola, 100 CTN, Qty/CTN 24, Cost RM 30/CTN → Warehouse A.

The system:

1. Adds 100 CTN to Warehouse A
2. Calculates total units
3. Stores the cost information
4. Records date and the user who received it
5. Creates an inventory transaction
6. Updates current warehouse inventory

Every receiving transaction records: Transaction ID, product, quantity,
unit/CTN info, cost, total cost, destination warehouse, supplier (if
applicable), date, notes, recorded-by.

---

## 6. Transfer Stock Between Warehouses

Store Manager transfers stock between any two warehouses
(A→B, A→C, B→C, ...).

**Example:** Move 10 CTN Coca Cola, Warehouse A → Warehouse B.

The system must:

1. Verify Warehouse A has enough stock
2. Deduct 10 CTN from Warehouse A
3. Add 10 CTN to Warehouse B
4. Preserve correct product cost information
5. Create one permanent, auditable transfer record (source, destination, date/time, user)

**Stock must never disappear during a transfer** — see Data Integrity Rules (Section 24).

---

## 7. Send Stock from Warehouse to Branch

Store Manager sends inventory from a warehouse to a branch.

**Example:** Warehouse A → Branch 1, Coca Cola, 10 CTN.

The system must:

1. Verify Warehouse A has sufficient stock
2. Deduct 10 CTN from Warehouse A
3. Add 10 CTN to Branch 1's inventory
4. Preserve product cost
5. Record the transfer: date/time, sender, and receiver-confirmation if that step is implemented

History must clearly trace: `Warehouse A → Branch 1 → 10 CTN Coca Cola`.
Every inventory movement must be traceable end to end.

---

## 8. Branch Local Inventory

Every branch has independent inventory, never merged with warehouse
stock.

**Example:**

| Product | Branch 1 | Branch 2 |
|---|---:|---:|
| Coca Cola | 10 CTN | 15 CTN |
| Water | 5 CTN | 7 CTN |
| Juice | 8 CTN | 3 CTN |

Admin must be able to see stock per warehouse, per branch, company
total, and per-product-by-location:

**Example — Coca Cola across all locations:** Warehouse A 50, Warehouse
B 20, Warehouse C 15, Branch 1 8, Branch 2 15 → **Total 108 CTN**.

---

## 9. Sales Management

Branches record daily sales; the system supports individual sale
transactions and rolls them up into daily totals.

Each sale records: Sale ID, branch, date/time, product, quantity sold,
sold-by-CTN-or-unit, selling price, total sale amount, product cost
**at time of sale**, profit for the sale, recorded-by.

On sale: branch inventory automatically decreases.

**Example:** Coca Cola 10 CTN → sell 2 CTN → **8 CTN remaining.**

The system must **prevent selling more stock than the branch currently has.**

---

## 10. Daily Sales Record

Each branch has a Daily Sales page.

**Example — Branch 1, 25 August 2026:**

| Product | Qty | Price | Total |
|---|---:|---:|---:|
| Coca Cola | 2 CTN | RM 35/CTN | RM 70 |
| Water | 1 CTN | RM 20/CTN | RM 20 |
| **Total Daily Sales** | | | **RM 90** |

Auto-calculated: total transactions, total quantity sold, total
revenue, product cost, gross profit.

---

## 11. Expense Management

Each branch records expenses under categories: **Transport, Electricity,
Rent, Staff, Food, Maintenance, Supplies, Other.**

Each record: Expense ID, branch, date, category, description, amount,
recorded-by, optional receipt attachment.

**Example:** Transport RM 20 + Electricity RM 15 + Other RM 10 = **RM 45**.

Admin sees all expenses, all branches, filterable by branch, date,
category, amount, custom range — plus analytics: today/weekly/
monthly/yearly totals, by branch, by category, highest categories.

---

## 12. Debt Management

Branches record customer debts when a customer takes products without
paying in full.

**Example:**

```
Customer: Ahmed          Branch: Branch 1
Date: 25 August 2026     Reference: Coca Cola sale
Original Amount: RM 100  Paid: RM 0
Remaining: RM 100         Status: Unpaid
```

Status: **Unpaid → Partially Paid → Paid**, with partial payments supported.

**Example:** RM 100 debt, customer pays RM 60 → remaining RM 40 → **Partially Paid.**

Every payment records: Payment ID, Debt ID, amount paid, date,
recorded-by, notes — full payment history preserved.

Admin sees: total outstanding debt, debts by branch, unpaid/partially
paid/paid breakdowns, recent payments.

---

## 13. Profit Calculation

```
Gross Profit = Sales Revenue − Cost of Goods Sold
Net Profit   = Sales Revenue − Cost of Goods Sold − Expenses
```

**Example:** Revenue RM 50,000 − COGS RM 30,000 = Gross Profit RM
20,000. Minus Expenses RM 8,000 = **Net Profit RM 12,000.**

**Critical rule:** store the actual product cost **at the time of each
sale**. Never recalculate historical profit using a later cost. If
Coca Cola cost RM 20 in January and later changes to RM 25, January's
profit report must still use RM 20.

---

## 14. Admin Dashboard

One screen, immediate business overview.

**Summary cards:** Total Sales, Today's Sales, Monthly Sales, Total
Expenses, Today's Expenses, Monthly Expenses, Gross Profit, Net Profit,
Total Outstanding Debt, Total Inventory Value, Low Stock Items.

**Filters:** today, yesterday, this week, this month, this year, custom range.

---

## 15. Sales Analytics

Show: sales over time (daily/weekly/monthly), sales by branch, sales
by product, quantity, revenue.

**Charts:** sales trend over time; sales by branch; sales by product.

**Identifies:** best-/worst-selling branch, top-/lowest-selling products.

---

## 16. Low Inventory Alerts

Each product has a minimum-stock threshold; the system flags anything
at or below it.

**Example:**

| Product | Location | Stock | Minimum | Status |
|---|---|---:|---:|---|
| Coca Cola | Branch 1 | 2 CTN | 5 CTN | 🟡 LOW STOCK |
| Water | Warehouse B | 1 CTN | 10 CTN | 🟡 LOW STOCK |

Filterable by warehouse, branch, or specific location.

---

## 17. Product Analytics

- **Top-selling products** — ranked by quantity sold and/or revenue.
- **Lowest-selling products.**
- **Most profitable products** — ranked by total profit, not revenue. (A product with lower revenue but higher margin can outrank a higher-revenue, lower-margin product.)
- **Least profitable products.**
- **Loss-making products** — flagged when `Cost + allocated relevant expenses > Revenue`.

Filters: date range, branch or all branches, product category.

---

## 18. Expense Analytics

Total expenses, expenses over time, by branch, by category, highest
category, highest-expense branch — with trend, category, and
branch-comparison charts.

---

## 19. Branch Comparison

**Example:**

| Branch | Sales | Cost | Expenses | Gross Profit | Net Profit |
|---|---:|---:|---:|---:|---:|
| Branch A | RM 20,000 | RM 10,000 | RM 3,000 | RM 10,000 | RM 7,000 |
| Branch B | RM 15,000 | RM 7,500 | RM 2,000 | RM 7,500 | RM 5,500 |
| Branch C | RM 10,000 | RM 4,500 | RM 3,500 | RM 5,500 | RM 2,000 |

Admin must be able to identify, at a glance: best/worst performing
branch, highest/lowest sales, most/least profitable, highest/lowest
expenses, highest debt, lowest inventory, fastest-growing branch —
across a selected set of branches and date range.

---

## 20. Inventory History & Audit Log

Every inventory-impacting action creates a permanent record:

```
STOCK RECEIVED     Supplier    → Warehouse A → 100 CTN Coca Cola
WAREHOUSE TRANSFER Warehouse A → Warehouse B →  10 CTN Coca Cola
BRANCH DELIVERY    Warehouse A → Branch 1    →  10 CTN Coca Cola
SALE               Branch 1    → Sold        →   2 CTN Coca Cola
```

Each record stores: Transaction ID, transaction type, product,
quantity, source location, destination location, date/time, user,
notes/reason, reference ID where applicable.

**Transaction types:** `STOCK_RECEIVED`, `WAREHOUSE_TRANSFER`,
`BRANCH_TRANSFER`, `SALE`, `ADJUSTMENT`, and `RETURN` if implemented.

**No inventory quantity ever changes without a traceable record.**

---

## 21. Stock Adjustments

For damaged goods, missing stock, counting corrections, or expired
products. Every adjustment requires: product, location, previous
quantity, new quantity or delta, **reason**, date, user.

**Never allow an adjustment without a recorded reason.**

---

## 22. Reports

Inventory, warehouse inventory, branch inventory, sales, daily sales,
monthly sales, expense, debt, debt payment, profit, product
performance, branch comparison, low inventory, stock movement — all
filterable, all date-range aware.

---

## 23. Database Design

Core entities: `Users, Roles, Branches, Warehouses, Products, Product
Categories, Inventory, Inventory Transactions, Stock Receipts,
Warehouse Transfers, Branch Transfers, Sales, Sale Items, Expenses,
Customers, Debts, Debt Payments, Stock Adjustments.`

**Core principle: inventory is location-based, not a single quantity
on the Product table.** A product exists in multiple locations
simultaneously:

```
Coca Cola @ Warehouse A = 50 CTN
Coca Cola @ Warehouse B = 20 CTN
Coca Cola @ Warehouse C = 15 CTN
Coca Cola @ Branch 1    =  8 CTN
Coca Cola @ Branch 2    = 15 CTN
```

Use an `Inventory` table joining `Product` ↔ `Location`. Model
`Location` with a `type: WAREHOUSE | BRANCH` discriminator rather than
separate unrelated tables — this keeps the schema scalable as more
warehouses and branches are added.

---

## 24. Data Integrity Rules

1. Inventory can never go negative.
2. A transfer cannot proceed if the source location lacks sufficient stock.
3. A sale cannot proceed if the branch lacks sufficient stock.
4. Inventory movements are **atomic** — e.g., during a transfer, stock is never deducted from the source unless it's successfully added to the destination; both succeed or both fail.
5. Every stock movement creates a transaction record.
6. Historical sales preserve the historical product cost (Section 13).
7. A debt payment can never exceed the remaining balance.
8. A fully paid debt doesn't accept further payments unless reopened by an authorized user.
9. Branch users can only access their own branch's data.
10. Admin has company-wide access.

---

## 25. UI / UX Requirements

Modern, clean, professional dashboard. Responsive across mobile,
tablet, and desktop — fast, simple, and easy to use.

**Admin sidebar:** Dashboard · Products · Warehouses · Branches ·
Inventory · Stock Transfers · Sales · Expenses · Debts · Analytics ·
Reports · Users · Settings

**Branch sidebar:** Dashboard · Local Inventory · Sales · Expenses ·
Debts · Reports

**Store Manager sidebar:** Dashboard · Warehouses · Inventory ·
Receive Stock · Transfers · Send to Branch · Stock History

Tables support search, filtering, sorting, pagination, date filtering.
Confirmation dialogs required for critical actions: delete product,
stock adjustment, stock transfer, debt correction.

---

## 26. Dashboard Charts

Sales trend line · Profit trend · Expense trend · Sales-by-branch bar
chart · Expenses-by-branch bar chart · Top-selling-products chart ·
Most-profitable-products chart · Product-category sales chart — all
respecting the selected date range/filter.

---

## 27. Core Business Flow

```
SUPPLIER
   │
   ▼
WAREHOUSE A / B / C
   │
   ▼
TRANSFER BETWEEN WAREHOUSES
   │
   ▼
SEND STOCK TO BRANCH
   │
   ▼
BRANCH LOCAL INVENTORY
   │
   ▼
SALE
   │
   ▼
REVENUE + PROFIT ANALYTICS
```

In parallel, each branch also records **Expenses**, **Customer Debts**,
and **Debt Payments**.

Admin gets company-wide visibility across: Total Sales, Total
Expenses, Gross Profit, Net Profit, Outstanding Debts, Inventory
Value, Low Stock Alerts, Top/Lowest-Selling Products, Most/Least
Profitable Products, Loss-Making Products, Expense Analysis, and
Branch Comparison.

---

## 28. Final Development Requirements

Build this as a **scalable, secure, maintainable, production-ready**
application. The architecture must accommodate, without redesign: more
warehouses, more branches, more users, more products, more
transactions, and multiple concurrent users.

Implement properly: authentication, role-based access control,
database transactions, input validation, error handling, audit
logging, pagination, indexing on frequently-queried fields, and secure
API design.

**Data accuracy is the top priority** — inventory, sales, expenses,
debts, and financial calculations must stay consistent under
concurrent use.

Deliver a complete, functional system: database + backend/API +
authentication + role-based permissions + inventory transaction logic
+ sales logic + expense logic + debt/payment logic + profit
calculations + analytics queries + reports + responsive frontend —
not a frontend mockup.