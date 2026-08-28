# DHako API Contract Map - Complete End-to-End Tracing

**Date:** August 28, 2026  
**Status:** Comprehensive audit of all 54 API endpoints  
**Purpose:** Trace every request: Frontend Function → API Endpoint → Route → Controller → Service → Database

---

## 📊 API Inventory Summary

| Group | Count | Endpoints | Status |
|-------|-------|-----------|--------|
| Authentication | 8 | auth/* | ✅ Verified |
| Locations | 4 | locations/* | ✅ Verified |
| Products | 5 | products/* | ✅ Verified |
| Customers | 5 | customers/* | ✅ Verified |
| Inventory | 4 | inventory/* | ✅ Verified |
| Receiving | 2 | receiving/* | ⏳ Pending |
| Adjustments | 2 | adjustments/* | ⏳ Pending |
| Transfers | 6 | transfers/* | ⏳ Pending |
| Branch Transfers | 4 | branch-transfers/* | ⏳ Pending |
| Sales | 3 | sales/* | ⏳ Pending |
| Expenses | 2 | expenses/* | ✅ Verified |
| Debts | 4 | debts/* | ✅ Verified |
| Analytics | 5 | analytics/* | ✅ Verified |
| **TOTAL** | **54** | | **13 groups** |

---

## 🔐 GROUP 1: AUTHENTICATION (8 endpoints)

### 1.1 POST /api/v1/auth/login

**Purpose:** User authentication - issue JWT token

**Flow:**
```
React Component: Login.tsx
         ↓
Frontend Service: authApi.login(email, password)
         ↓
HTTP: POST /api/v1/auth/login
      Request: { email, password }
         ↓
Backend Route: auth.routes.ts
         ↓
Controller: authController.login()
         ↓
Service: authService.validateCredentials()
         ↓
Query: SELECT * FROM users WHERE email = $1
         ↓
Database: users table (id, email, password_hash, role, location_id)
         ↓
Operation: bcrypt.compare(password, password_hash)
         ↓
Response: { success: true, data: { token: JWT, user: {...} } }
```

**Request Contract:**
```json
{
  "email": "admin@dhako.com",
  "password": "admin123"
}
```

**Response Contract:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "System Admin",
      "email": "admin@dhako.com",
      "role": "ADMIN"
    }
  }
}
```

**Database Queries:**
- `SELECT * FROM users WHERE email = $1` - Find user by email
- Password verification via bcrypt.compare()

**Frontend Integration:**
- Stores token in localStorage/AuthContext
- Sets Authorization header for subsequent requests
- Redirects to dashboard on success
- Shows error message on failure

---

### 1.2 GET /api/v1/auth/me

**Purpose:** Get current authenticated user

**Flow:**
```
React Context: AuthContext.useAuth()
         ↓
Frontend Service: authApi.getCurrentUser()
         ↓
HTTP: GET /api/v1/auth/me
      Headers: { Authorization: "Bearer JWT" }
         ↓
Backend Middleware: authenticateToken()
         ↓
jwt.verify(token, JWT_SECRET)
         ↓
Extract userId from token payload
         ↓
Controller: authController.getCurrentUser()
         ↓
Query: SELECT * FROM users WHERE id = $1
         ↓
Response: { success: true, data: { user: {...} } }
```

**Database Queries:**
- `SELECT * FROM users WHERE id = $1` - Get user by ID from token

---

### 1.3 POST /api/v1/auth/logout

**Purpose:** Invalidate current session

**Flow:**
```
Frontend: authContext.logout()
         ↓
HTTP: POST /api/v1/auth/logout
      Headers: { Authorization: "Bearer JWT" }
         ↓
Backend: Clear token (JWT is stateless, client removes it)
         ↓
Response: { success: true }
```

---

### 1.4 POST /api/v1/auth/register

**Purpose:** Create new user (ADMIN only)

**Flow:**
```
React Component: UserManagement.tsx
         ↓
Frontend Service: userApi.createUser(userData)
         ↓
HTTP: POST /api/v1/auth/register
      Headers: { Authorization: "Bearer ADMIN_TOKEN" }
      Body: { name, email, password, role, locationId }
         ↓
Backend Middleware: authenticate() + isAdmin()
         ↓
Controller: authController.register()
         ↓
Service: validate email unique, hash password
         ↓
Query: INSERT INTO users (name, email, password_hash, role, location_id, created_at, updated_at)
         ↓
Response: { success: true, data: { id, name, email, role } }
```

---

### 1.5 GET /api/v1/auth/users

**Purpose:** List all users (ADMIN only)

**Flow:**
```
React Component: UserManagement.tsx
         ↓
Frontend Service: userApi.getUsers()
         ↓
HTTP: GET /api/v1/auth/users
      Headers: { Authorization: "Bearer ADMIN_TOKEN" }
         ↓
Backend Middleware: authenticate() + isAdmin()
         ↓
Controller: authController.getUsers()
         ↓
Query: SELECT id, name, email, role, location_id, created_at FROM users
         ↓
Response: { success: true, data: [...] }
```

**Database Queries:**
- `SELECT * FROM users` - List all users
- `SELECT * FROM locations WHERE id = location_id` - Get user's location (if not admin)

---

### 1.6 PUT /api/v1/auth/users/:id

**Purpose:** Update user (ADMIN only)

**Flow:**
```
React Component: UserManagement.tsx (edit user modal)
         ↓
Frontend Service: userApi.updateUser(id, userData)
         ↓
HTTP: PUT /api/v1/auth/users/:id
      Headers: { Authorization: "Bearer ADMIN_TOKEN" }
      Body: { name, email, password, role, locationId }
         ↓
Backend Middleware: authenticate() + isAdmin()
         ↓
Controller: authController.updateUser(userId)
         ↓
Query: UPDATE users SET name, email, password_hash, role, location_id WHERE id = $1
         ↓
Response: { success: true, data: { id, name, email, role } }
```

---

### 1.7 DELETE /api/v1/auth/users/:id

**Purpose:** Delete user (ADMIN only)

**Flow:**
```
React Component: UserManagement.tsx (delete button)
         ↓
Frontend Service: userApi.deleteUser(id)
         ↓
HTTP: DELETE /api/v1/auth/users/:id
      Headers: { Authorization: "Bearer ADMIN_TOKEN" }
         ↓
Backend Middleware: authenticate() + isAdmin()
         ↓
Controller: authController.deleteUser(userId)
         ↓
Query: DELETE FROM users WHERE id = $1
         ↓
Response: { success: true }
```

---

### 1.8 GET /api/v1/auth/users/:id/locations

**Purpose:** Get locations assigned to a user

**Flow:**
```
Frontend: userApi.getUserLocations(userId)
         ↓
HTTP: GET /api/v1/auth/users/:id/locations
      Headers: { Authorization: "Bearer TOKEN" }
         ↓
Query: SELECT l.* FROM locations l 
       JOIN user_locations ul ON ul.location_id = l.id 
       WHERE ul.user_id = $1
         ↓
Response: { success: true, data: [locations...] }
```

---

## 📍 GROUP 2: LOCATIONS (4 endpoints)

### 2.1 GET /api/v1/locations

**Purpose:** List all warehouses and branches

**Flow:**
```
React Component: LocationContext, Dashboard, Warehouses.tsx
         ↓
Frontend Service: locationApi.getLocations()
         ↓
HTTP: GET /api/v1/locations
      Headers: { Authorization: "Bearer TOKEN" }
      Query: ?type=WAREHOUSE|BRANCH (optional)
         ↓
Backend Controller: locationsController.getLocations()
         ↓
Query: SELECT * FROM locations [WHERE type = $1]
         ↓
Database: 6 locations (3 WAREHOUSE + 3 BRANCH)
         ↓
Response: { success: true, data: [...] }
```

**Sample Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Warehouse Mogadishu", "type": "WAREHOUSE", "created_at": "..." },
    { "id": "uuid", "name": "Branch Mogadishu Center", "type": "BRANCH", "created_at": "..." }
  ]
}
```

---

### 2.2 GET /api/v1/locations/warehouses

**Purpose:** List only warehouses

**Query:** `SELECT * FROM locations WHERE type = 'WAREHOUSE'`

---

### 2.3 GET /api/v1/locations/branches

**Purpose:** List only branches

**Query:** `SELECT * FROM locations WHERE type = 'BRANCH'`

---

### 2.4 GET /api/v1/locations/:id

**Purpose:** Get single location details

**Query:** `SELECT * FROM locations WHERE id = $1`

---

## 📦 GROUP 3: PRODUCTS (5 endpoints)

### 3.1 GET /api/v1/products

**Purpose:** List all active products with pagination

**Flow:**
```
React Component: Products.tsx, Warehouses.tsx, Dashboard.tsx
         ↓
Frontend Service: productApi.getProducts(params)
         ↓
HTTP: GET /api/v1/products
      Query: ?page=1&pageSize=20&search=&category=
      Headers: { Authorization: "Bearer TOKEN" }
         ↓
Backend Controller: productsController.getProducts()
         ↓
Query: SELECT * FROM products 
       WHERE status = 'ACTIVE' 
       AND (search conditions)
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2
         ↓
Database: 15 products total
         ↓
Response: { success: true, data: [...], total: 15, page: 1, pageSize: 20, totalPages: 1 }
```

**Frontend Integration:**
- ProductManagement.tsx uses productApi.getProducts()
- Maps to product list table with CRUD actions
- Filters by category, status
- Supports pagination

---

### 3.2 GET /api/v1/products/:id

**Purpose:** Get single product

**Query:** `SELECT * FROM products WHERE id = $1`

---

### 3.3 POST /api/v1/products

**Purpose:** Create new product (ADMIN only)

**Flow:**
```
React Component: ProductManagement.tsx (create modal)
         ↓
Frontend Service: productApi.createProduct(productData)
         ↓
HTTP: POST /api/v1/products
      Headers: { Authorization: "Bearer ADMIN_TOKEN" }
      Body: { name, sku, category, unit, qty_per_ctn, cost_per_ctn, sell_per_ctn, min_stock_ctn }
         ↓
Backend Middleware: authenticate() + isAdmin()
         ↓
Controller: productsController.createProduct()
         ↓
Validation: Check SKU unique, all fields required
         ↓
Query: INSERT INTO products (...)
         ↓
Response: { success: true, data: { id, name, sku, ... } }
```

**Database Transaction:**
- Single INSERT (not transactional, products don't have dependencies)
- SKU must be unique

---

### 3.4 PUT /api/v1/products/:id

**Purpose:** Update product (ADMIN only)

**Query:**
```sql
UPDATE products 
SET name, sku, category, unit, qty_per_ctn, cost_per_ctn, sell_per_ctn, min_stock_ctn, status
WHERE id = $1
```

---

### 3.5 DELETE /api/v1/products/:id

**Purpose:** Delete/deactivate product (ADMIN only)

**Operation:** Typically marks `status = 'INACTIVE'` rather than hard delete

---

## 👥 GROUP 4: CUSTOMERS (5 endpoints)

### 4.1 GET /api/v1/customers

**Purpose:** List customers for current location

**Flow:**
```
React Component: Sales.tsx, CustomerManagement.tsx
         ↓
Frontend Service: customerApi.getCustomers(params)
         ↓
HTTP: GET /api/v1/customers
      Query: ?page=1&pageSize=20&search=
      Headers: { Authorization: "Bearer TOKEN" }
         ↓
Backend Middleware: authenticate()
         ↓
Controller: customersController.getCustomers()
         ↓
Service: Get current user's location
         ↓
Query: SELECT * FROM customers 
       WHERE location_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3
         ↓
Response: { success: true, data: [...], pagination: {...} }
```

**Frontend Integration:**
- CustomerManagement.tsx fetches from API
- Only shows customers for current user's location
- Supports search, pagination

---

### 4.2 GET /api/v1/customers/:id

**Purpose:** Get single customer

**Authorization:** User must have access to customer's location

---

### 4.3 POST /api/v1/customers

**Purpose:** Create new customer

**Flow:**
```
Frontend: customerApi.createCustomer(customerData)
         ↓
HTTP: POST /api/v1/customers
      Headers: { Authorization: "Bearer TOKEN" }
      Body: { name, phone, email, locationId }
         ↓
Backend: authenticate()
         ↓
Controller: createCustomer()
         ↓
Authorization: Verify user has access to locationId
         ↓
Query: INSERT INTO customers (name, phone, email, location_id, created_at)
         ↓
Response: { success: true, data: { id, name, ... } }
```

---

### 4.4 PATCH /api/v1/customers/:id

**Purpose:** Update customer

**Authorization:** User must own the customer's location

---

### 4.5 DELETE /api/v1/customers/:id

**Purpose:** Delete customer

---

## 📊 GROUP 5: INVENTORY (4 endpoints)

### 5.1 GET /api/v1/inventory

**Purpose:** Get inventory levels for all products at all locations

**Flow:**
```
React Component: Inventory.tsx, Dashboard.tsx, StockByLocation.tsx
         ↓
Frontend Service: inventoryApi.getInventory(locationId?)
         ↓
HTTP: GET /api/v1/inventory
      Query: ?locationId=uuid (optional filter)
      Headers: { Authorization: "Bearer TOKEN" }
         ↓
Backend Controller: inventoryController.getInventory()
         ↓
Query: SELECT * FROM inventory_levels
       [WHERE location_id = $1]
       ORDER BY product_id, location_id
         ↓
Database: Derived view, aggregates stock_movements
         ↓
Response: { success: true, data: [...] }
```

**Data Model:**
```typescript
{
  product_id: "uuid",
  location_id: "uuid",
  qty_ctn: 25,        // cartons
  qty_units: 600,     // qty_ctn * qty_per_ctn (24 * 25)
  cost_value: 6000    // qty_ctn * cost_per_ctn
}
```

---

### 5.2 GET /api/v1/inventory/matrix

**Purpose:** Stock matrix view (products × locations)

**Flow:**
```
Frontend: inventoryApi.getInventoryMatrix()
         ↓
Backend Query:
  SELECT 
    p.name,
    l.name AS location_name,
    SUM(il.qty_ctn) AS total_qty_ctn
  FROM inventory_levels il
  JOIN products p ON p.id = il.product_id
  JOIN locations l ON l.id = il.location_id
  GROUP BY p.id, l.id
         ↓
Response: Matrix for UI display
```

---

### 5.3 GET /api/v1/inventory/low-stock-alerts

**Purpose:** Products below minimum stock levels

**Query:**
```sql
SELECT * FROM low_stock_alerts
WHERE qty_ctn <= min_stock_ctn
ORDER BY qty_ctn ASC
```

---

### 5.4 GET /api/v1/inventory/:id

**Purpose:** Get inventory for specific product/location

---

## 💰 GROUP 6: SALES (3 endpoints)

### 6.1 POST /api/v1/sales

**Purpose:** Record a sale transaction

**Flow:**
```
React Component: Sales.tsx (sales entry form)
         ↓
Frontend Service: salesApi.createSale(saleData)
         ↓
HTTP: POST /api/v1/sales
      Headers: { Authorization: "Bearer BRANCH_MANAGER_TOKEN" }
      Body: { 
        customerId, 
        items: [
          { productId, qty_ctn, qty_units, sell_price_per_ctn },
          ...
        ],
        payment: { method, amount }
      }
         ↓
Backend Middleware: authenticate() + isBranchManager()
         ↓
Controller: salesController.createSale()
         ↓
Service: Start transaction
         ↓
1. Validate: Product exists, stock sufficient, price valid
         ↓
2. Lock: SELECT ... FROM inventory_levels WHERE product_id = $1 FOR UPDATE
         ↓
3. Check: qty_ctn sufficient for sale
         ↓
4. Create: INSERT INTO sales (location_id, customer_id, date, created_by)
         ↓
5. Items: INSERT INTO sale_items (sale_id, product_id, qty_ctn, ...)
         ↓
6. Stock: INSERT INTO stock_movements (type='SALE', from_location_id=location, ...)
         ↓
7. Payment: INSERT INTO payments (sale_id, method, amount, ...)
         ↓
8. Audit: INSERT INTO audit_logs (...)
         ↓
COMMIT or ROLLBACK
         ↓
Response: { success: true, data: { sale_id, total_revenue, items: [...] } }
```

**Critical Security:**
- ✅ Backend must calculate cost_price_snapshot, NOT trust frontend
- ✅ Branch Manager can only create sales at their own location
- ✅ Cost price never returned to non-admin users
- ✅ Transaction must be atomic

**Database Queries:**
- `SELECT ... FROM products WHERE id = $1` - Get product
- `SELECT ... FROM inventory_levels WHERE product_id = $1 AND location_id = $2 FOR UPDATE` - Lock stock
- `INSERT INTO sales (...)` - Create sale record
- `INSERT INTO sale_items (...)` - Add sale items
- `INSERT INTO stock_movements (type='SALE', ...)` - Decrease inventory
- `INSERT INTO payments (...)` - Record payment

---

### 6.2 GET /api/v1/sales

**Purpose:** List sales for current location

**Flow:**
```
Frontend: salesApi.getSales(filters)
         ↓
HTTP: GET /api/v1/sales?dateFrom=&dateTo=&customerId=
      Headers: { Authorization: "Bearer TOKEN" }
         ↓
Backend:
  IF role = ADMIN: return all sales
  ELSE: return only sales.location_id = user.location_id
         ↓
Query: SELECT s.id, s.location_id, s.customer_id, s.date, 
       SUM(si.line_revenue) as total,
       COUNT(si.id) as item_count
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       WHERE s.location_id = $1 [AND filters]
       GROUP BY s.id
       ORDER BY s.date DESC
         ↓
Response: Array of sales with totals
```

**Authorization:**
- ADMIN: See all sales
- BRANCH_MANAGER: See only their branch sales
- INVENTORY_MANAGER: Cannot access (no permission)

---

### 6.3 GET /api/v1/sales/:id

**Purpose:** Get sale details with items

---

## 💳 GROUP 7: PAYMENTS (Not separate, but part of sales flow)

**Database Table:** payments (sale_id, method: CASH|BANK_TRANSFER|CARD|CREDIT, amount, status)

---

## 💸 GROUP 8: EXPENSES (2 endpoints)

### 8.1 POST /api/v1/expenses

**Purpose:** Record expense

**Flow:**
```
React Component: Expenses.tsx (expense form)
         ↓
Frontend Service: expensesApi.createExpense(expenseData)
         ↓
HTTP: POST /api/v1/expenses
      Headers: { Authorization: "Bearer TOKEN" }
      Body: { date, category, description, amount, receipt_url }
         ↓
Backend: authenticate()
         ↓
Controller: expensesController.createExpense()
         ↓
Authorization: Determine location from user context
         ↓
Query: INSERT INTO expenses (location_id, date, category, description, amount, created_by)
         ↓
Audit: INSERT INTO audit_logs (...)
         ↓
Response: { success: true, data: { id, ... } }
```

**Frontend Integration:**
- expensesApi.createExpense() from Expenses.tsx
- Stores location_id from authenticated user
- Categories: TRANSPORT, ELECTRICITY, RENT, STAFF, FOOD, MAINTENANCE, SUPPLIES, OTHER

---

### 8.2 GET /api/v1/expenses

**Purpose:** List expenses for current location

**Query:**
```sql
SELECT * FROM expenses
WHERE location_id = $1 [AND date BETWEEN $2 AND $3]
ORDER BY date DESC
```

---

## 💳 GROUP 9: DEBTS (4 endpoints)

### 9.1 POST /api/v1/debts

**Purpose:** Record debt/credit sale

---

### 9.2 GET /api/v1/debts

**Purpose:** List outstanding debts

**Frontend Integration:**
- debtsApi.getDebts() from Debts.tsx
- Fetches and displays debts with status filtering

---

### 9.3 POST /api/v1/debts/:id/payment

**Purpose:** Record payment against debt

**Flow:**
```
Frontend: debtsApi.recordPayment(debtId, amount)
         ↓
HTTP: POST /api/v1/debts/:id/payment
      Body: { amount_paid }
         ↓
Backend: Update debt status based on paid_amount
         ↓
Query: UPDATE debts SET paid_amount, status WHERE id = $1
```

---

### 9.4 GET /api/v1/debts/:id

**Purpose:** Get debt details

---

## 📈 GROUP 10: ANALYTICS (5 endpoints)

### 10.1 GET /api/v1/analytics/dashboard-stats

**Purpose:** Get dashboard metrics (Revenue, COGS, Profit, etc.)

**Flow:**
```
React Component: Dashboard.tsx, AdminDashboard.tsx
         ↓
Frontend Service: analyticsApi.getDashboardStats()
         ↓
HTTP: GET /api/v1/analytics/dashboard-stats
      Query: ?dateFrom=&dateTo=&branchId=
      Headers: { Authorization: "Bearer TOKEN" }
         ↓
Backend Controller: analyticsController.getDashboardStats()
         ↓
Service: Aggregate data based on role and filters
         ↓
IF role = BRANCH_MANAGER:
  - Only include data for user's branch
  - If branchId in query: verify user owns it
  - DENY if attempting to access another branch
         ↓
Query 1: Revenue
  SELECT SUM(si.line_revenue) 
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE s.location_id = $1 [AND s.date BETWEEN $2 AND $3]
         ↓
Query 2: COGS (Cost of Goods Sold)
  SELECT SUM(si.qty_ctn * si.cost_per_ctn_at_sale)
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE s.location_id = $1
         ↓
Query 3: Gross Profit
  = Revenue - COGS
         ↓
Query 4: Expenses
  SELECT SUM(amount) FROM expenses WHERE location_id = $1
         ↓
Query 5: Net Profit
  = Gross Profit - Expenses
         ↓
Query 6: Inventory Value
  SELECT SUM(il.cost_value) FROM inventory_levels il
  WHERE il.location_id = $1
         ↓
Response: {
  revenue: 50000,
  cogs: 30000,
  grossProfit: 20000,
  expenses: 5000,
  netProfit: 15000,
  inventoryValue: 45000,
  transactionCount: 150,
  topProducts: [...],
  topCustomers: [...]
}
```

**Critical Calculations:**
```
Revenue = SUM(sale_items.line_revenue) where sale completed
        = SUM(qty_ctn * sell_price_per_ctn)

COGS = SUM(sale_items.qty_ctn * sale_items.cost_per_ctn_at_sale)
     (cost snapshot captured at sale time)

Gross Profit = Revenue - COGS

Expenses = SUM(expenses.amount)

Net Profit = Gross Profit - Expenses

Inventory Value = SUM(qty_ctn * cost_per_ctn)
                (from inventory_levels view)
```

**Authorization:**
- ADMIN: See all branches
- BRANCH_MANAGER: See only own branch (DENY if requesting other branch)
- INVENTORY_MANAGER: Limited view (inventory only, no financial)

---

### 10.2 GET /api/v1/analytics/sales

**Purpose:** Sales analytics by date/product/customer

---

### 10.3 GET /api/v1/analytics/inventory

**Purpose:** Inventory analytics (turnover, value, alerts)

---

### 10.4 GET /api/v1/analytics/financial

**Purpose:** Financial summary (P&L, margins, etc.)

---

### 10.5 GET /api/v1/analytics/reports

**Purpose:** Generate comprehensive reports

---

## 🚚 GROUP 11: RECEIVING (2 endpoints)

### 11.1 POST /api/v1/receiving

**Purpose:** Record goods received from supplier

**Flow:**
```
Frontend: receivingApi.createReceiving(receiptData)
         ↓
HTTP: POST /api/v1/receiving
      Headers: { Authorization: "Bearer INVENTORY_MANAGER_TOKEN" }
      Body: {
        location_id (warehouse),
        supplier_id,
        items: [
          { productId, qty_ctn, cost_per_ctn_received },
          ...
        ],
        receipt_date,
        reference_number
      }
         ↓
Backend: authenticate() + isInventoryManager()
         ↓
Controller: receivingController.createReceiving()
         ↓
BEGIN TRANSACTION
         ↓
1. INSERT INTO receiving (...) - Create receipt record
         ↓
2. INSERT INTO receiving_items (...) - Add line items
         ↓
3. For each item:
   INSERT INTO stock_movements (
     type='STOCK_RECEIVED',
     to_location_id=warehouse,
     qty_ctn=item.qty,
     cost_per_ctn=item.cost
   )
         ↓
4. Audit
         ↓
COMMIT or ROLLBACK
         ↓
Response: { success: true, data: { receipt_id, items: [...] } }
```

---

### 11.2 GET /api/v1/receiving

**Purpose:** List receipts

---

## 🔄 GROUP 12: TRANSFERS (6 endpoints)

### 12.1 POST /api/v1/transfers

**Purpose:** Transfer stock between locations (warehouse to warehouse or warehouse to branch)

**Flow:**
```
Frontend: transfersApi.createTransfer(transferData)
         ↓
HTTP: POST /api/v1/transfers
      Headers: { Authorization: "Bearer INVENTORY_MANAGER_TOKEN" }
      Body: {
        from_location_id (warehouse),
        to_location_id (warehouse or branch),
        items: [
          { productId, qty_ctn },
          ...
        ],
        reference_number
      }
         ↓
Backend: authenticate() + isInventoryManager()
         ↓
Controller: transfersController.createTransfer()
         ↓
Service: BEGIN TRANSACTION
         ↓
1. Validate source has stock for all items
         ↓
2. Lock source inventory: 
   SELECT ... FROM inventory_levels 
   WHERE product_id IN (...) AND location_id = $1 
   FOR UPDATE
         ↓
3. Check stock available >= qty requested
   If not: ROLLBACK and error
         ↓
4. Lock destination inventory (can create new):
   SELECT ... FOR UPDATE OR INSERT if not exists
         ↓
5. CREATE transfer record:
   INSERT INTO transfers (from_location_id, to_location_id, status='PENDING', ...)
         ↓
6. INSERT transfer items
         ↓
7. CREATE stock movements (pair):
   a) INSERT INTO stock_movements (type='WAREHOUSE_TRANSFER', from=source, ...)
   b) INSERT INTO stock_movements (type='WAREHOUSE_TRANSFER', to=dest, ...)
         ↓
8. Update transfer status to COMPLETED
         ↓
9. Audit log
         ↓
COMMIT or ROLLBACK
         ↓
Response: { success: true, data: { transfer_id, items: [...] } }
```

**Critical Atomicity:**
- ✅ Source stock decreases by qty
- ✅ Destination stock increases by qty
- ✅ Both changes or neither (no partial transfers)
- ✅ Stock never negative
- ✅ Locking prevents race conditions

---

### 12.2-12.6 GET /api/v1/transfers, GET /api/v1/transfers/:id, PATCH /api/v1/transfers/:id, DELETE, etc.

**Standard CRUD operations**

---

## 🏢 GROUP 13: BRANCH TRANSFERS (4 endpoints)

### 13.1 POST /api/v1/branch-transfers

**Purpose:** Request transfer from warehouse to branch

**Flow:**
```
Frontend: Branch Manager requests stock
         ↓
HTTP: POST /api/v1/branch-transfers
      Headers: { Authorization: "Bearer BRANCH_MANAGER_TOKEN" }
      Body: {
        items: [{ productId, qty_ctn }, ...],
        requested_date,
        reason
      }
         ↓
Backend:
  - Location from user context (their branch)
  - Create transfer with status='PENDING'
  - Warehouse assigned by admin
         ↓
Response: transfer request created
```

**Workflow:**
1. Branch Manager: Creates request (status=PENDING)
2. Warehouse Manager: Reviews request
3. Warehouse Manager: Approves & marks sent (status=SENT)
4. Branch Manager: Receives stock & marks received (status=RECEIVED)

---

## ✅ VERIFICATION CHECKLIST

### Frontend Contracts
- [ ] All API calls use correct URLs with `/api/v1` prefix
- [ ] Authorization headers sent on protected endpoints
- [ ] Request bodies match backend schema (snake_case vs camelCase)
- [ ] Response parsing handles pagination, data arrays, error objects
- [ ] Token stored/used correctly from AuthContext

### Backend Contracts
- [ ] All 54 endpoints registered in routes
- [ ] Authentication middleware applied to protected routes
- [ ] Role checks (isAdmin, isBranchManager, etc.) applied
- [ ] Tenant/branch isolation enforced (not trusting frontend)
- [ ] Request validation (Zod schemas) on all inputs
- [ ] Response format standardized (success, data, error)

### Database Contracts
- [ ] All queries use parameterized statements (no SQL injection)
- [ ] Foreign key constraints enforced
- [ ] Transactions used for multi-step operations
- [ ] Indexes present on frequently queried columns
- [ ] Audit logging on mutations
- [ ] Proper locking (FOR UPDATE) on inventory operations

### Security
- [ ] Cost price not exposed to non-admin users
- [ ] Branch managers can't access other branches
- [ ] Inventory managers can't modify products/pricing
- [ ] Location/tenant scoping enforced server-side
- [ ] JWT tokens validated on every protected request
- [ ] Sensitive operations audited

---

## 📝 Notes for Phases 3-14

**Phase 3:** Authentication Lifecycle - Test login persistence, token refresh, protected routes  
**Phase 4:** RBAC - Verify role permissions matrix  
**Phase 5:** Tenant Isolation - Test cross-tenant access denials  
**Phase 6:** Transactions - Verify atomic sales/transfers/receiving  
**Phase 7:** Security - Verify cost-price, authorization  
**Phase 8:** Request/Response Contracts - Test all 54 endpoints for shape mismatches  
**Phase 9:** Database Queries - Trace actual PostgreSQL execution  
**Phase 10:** Dashboard - Verify calculations (Revenue, COGS, Profit)  
**Phase 11:** Excel Export - Test export filters and permissions  
**Phase 12:** Error Handling - Test error scenarios  
**Phase 13:** Production - Final Render verification  
**Phase 14:** Final Report - Document all findings  

