# Dhako API Routes Documentation

**Base URL:** `http://localhost:3001/api/v1`

All endpoints (except `/auth/login` and `/auth/register`) require `Authorization: Bearer <token>` header.

---

## Authentication Routes

### POST `/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "ADMIN|STORE_MANAGER|BRANCH_MANAGER|BRANCH_STAFF",
      "locationId": "uuid|null"
    }
  }
}
```

---

### POST `/auth/register`
Register a new user (ADMIN only).

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "ADMIN|STORE_MANAGER|BRANCH_MANAGER|BRANCH_STAFF",
  "locationId": "uuid|null"
}
```

---

### GET `/auth/me`
Get current authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "string",
    "locationId": "uuid|null"
  }
}
```

---

## Locations Routes

### GET `/locations`
Get all warehouses and branches (ADMIN, STORE_MANAGER).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Warehouse A",
      "type": "WAREHOUSE",
      "createdAt": "2026-08-25T00:00:00Z"
    }
  ]
}
```

### POST `/locations`
Create a new location (ADMIN only).

**Body:**
```json
{
  "name": "string",
  "type": "WAREHOUSE|BRANCH"
}
```

---

## Products Routes

### GET `/products`
Get all products (paginated, searchable).

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `search` (optional, searches name/sku)
- `category` (optional)
- `status` (optional: ACTIVE, INACTIVE)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Coca Cola 330ml",
        "sku": "CC330",
        "category": "Beverages",
        "unit": "can",
        "qtyPerCtn": 24,
        "costPerCtn": 22,
        "sellPerCtn": 30,
        "minStockCtn": 5,
        "status": "ACTIVE"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### POST `/products`
Create product (ADMIN, STORE_MANAGER).

**Body:**
```json
{
  "name": "string",
  "sku": "string",
  "category": "string",
  "unit": "string",
  "qtyPerCtn": "number",
  "costPerCtn": "number",
  "sellPerCtn": "number",
  "minStockCtn": "number"
}
```

### PATCH `/products/:id`
Update product (ADMIN, STORE_MANAGER).

### GET `/products/:id`
Get single product details.

---

## Inventory Routes

### GET `/inventory/matrix`
Get full inventory matrix (all products × all locations).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "uuid",
      "productName": "Coca Cola 330ml",
      "locationId": "uuid",
      "locationName": "Warehouse A",
      "locationType": "WAREHOUSE",
      "qtyCtn": 50,
      "qtyUnits": 1200,
      "costValue": 1100
    }
  ]
}
```

### GET `/inventory/warehouse/:warehouseId`
Get inventory for a specific warehouse.

### GET `/inventory/branch/:branchId`
Get inventory for a specific branch.

### GET `/inventory/product/:productId`
Get inventory distribution for a single product across all locations.

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "productName": "string",
    "locations": [
      {
        "locationId": "uuid",
        "locationName": "string",
        "locationType": "WAREHOUSE|BRANCH",
        "qtyCtn": 50,
        "qtyUnits": 1200
      }
    ],
    "companyTotalCtn": 150,
    "companyTotalUnits": 3600
  }
}
```

### GET `/inventory/alerts`
Get low stock alerts across all locations.

**Query Params:**
- `locationType` (optional: WAREHOUSE, BRANCH, or both)
- `locationId` (optional)
- `severity` (optional: LOW_STOCK, OUT_OF_STOCK)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "uuid",
      "productName": "string",
      "locationId": "uuid",
      "locationName": "string",
      "qtyCtn": 2,
      "minStockCtn": 5,
      "alertType": "LOW_STOCK"
    }
  ]
}
```

### POST `/inventory/receive`
Record new stock arrival at warehouse (STORE_MANAGER).

**Body:**
```json
{
  "productId": "uuid",
  "warehouseId": "uuid",
  "qtyCtn": "number",
  "costPerCtn": "number",
  "supplier": "string",
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "movementId": "uuid",
    "productId": "uuid",
    "warehouseId": "uuid",
    "qtyCtn": 100,
    "timestamp": "2026-08-25T10:30:00Z"
  }
}
```

### GET `/inventory/movements`
Get recent stock movements/transactions (pagination).

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 50)
- `type` (optional: STOCK_RECEIVED, WAREHOUSE_TRANSFER, BRANCH_TRANSFER, SALE, ADJUSTMENT)
- `productId` (optional)
- `locationId` (optional)
- `startDate` (optional: ISO date)
- `endDate` (optional: ISO date)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "type": "STOCK_RECEIVED",
        "productName": "Coca Cola",
        "qtyCtn": 100,
        "fromLocation": null,
        "toLocation": "Warehouse A",
        "date": "2026-08-25T10:30:00Z",
        "user": "Ahmed",
        "notes": "Supplier delivery"
      }
    ],
    "total": 250,
    "page": 1,
    "pageSize": 50,
    "totalPages": 5
  }
}
```

---

## Sales Routes

### GET `/sales`
Get sales list (filter by branch, date, etc.).

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `locationId` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "branch": "Branch 1",
        "date": "2026-08-25",
        "customer": "Ahmad Trading",
        "totalRevenue": 500,
        "totalCost": 300,
        "grossProfit": 200,
        "itemCount": 3
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

### POST `/sales`
Record a new sale (BRANCH_MANAGER, BRANCH_STAFF).

**Body:**
```json
{
  "locationId": "uuid",
  "customerId": "uuid|null",
  "date": "2026-08-25",
  "items": [
    {
      "productId": "uuid",
      "qtyCtn": 2,
      "sellPricePerCtn": 30
    },
    {
      "productId": "uuid",
      "qtyCtn": 1,
      "sellPricePerCtn": 20
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "saleId": "uuid",
    "date": "2026-08-25",
    "totalRevenue": 80,
    "totalCost": 50,
    "grossProfit": 30,
    "itemCount": 2,
    "timestamp": "2026-08-25T14:30:00Z"
  }
}
```

### GET `/sales/:id`
Get sale details with all items.

### GET `/sales/:id/items`
Get all items in a sale.

---

## Expenses Routes

### GET `/expenses`
Get expenses (filter by branch, category, date).

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `locationId` (optional)
- `category` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "location": "Branch 1",
        "date": "2026-08-25",
        "category": "TRANSPORT",
        "description": "Delivery charges",
        "amount": 50,
        "createdBy": "Ali"
      }
    ],
    "total": 200,
    "page": 1,
    "pageSize": 20,
    "totalPages": 10
  }
}
```

### POST `/expenses`
Record an expense (any authenticated user for their branch).

**Body:**
```json
{
  "locationId": "uuid",
  "date": "2026-08-25",
  "category": "TRANSPORT|ELECTRICITY|RENT|STAFF|FOOD|MAINTENANCE|SUPPLIES|OTHER",
  "description": "string",
  "amount": "number"
}
```

### DELETE `/expenses/:id`
Delete an expense (ADMIN only).

---

## Debts Routes

### GET `/debts`
Get all debts (filter by branch, status, customer).

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `locationId` (optional)
- `status` (optional: UNPAID, PARTIALLY_PAID, PAID)
- `customerId` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "customerName": "Ahmed",
        "branch": "Branch 1",
        "originalAmount": 500,
        "paidAmount": 200,
        "remainingAmount": 300,
        "status": "PARTIALLY_PAID",
        "createdDate": "2026-08-20"
      }
    ],
    "total": 80,
    "page": 1,
    "pageSize": 20,
    "totalPages": 4
  }
}
```

### POST `/debts`
Create a new debt record.

**Body:**
```json
{
  "customerId": "uuid",
  "locationId": "uuid",
  "saleId": "uuid|null",
  "originalAmount": "number"
}
```

### POST `/debts/:id/payment`
Record a debt payment.

**Body:**
```json
{
  "amount": "number",
  "notes": "string"
}
```

**Logic:**
- Add amount to debt.paidAmount
- If paidAmount >= originalAmount: status = PAID
- Else if paidAmount > 0: status = PARTIALLY_PAID
- Else: status = UNPAID

### GET `/debts/:id/payments`
Get all payments for a debt.

---

## Transfers Routes

### GET `/transfers`
Get all transfers (paginated, filterable).

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `status` (optional)
- `fromLocationId` (optional)
- `toLocationId` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "from": "Warehouse A",
        "to": "Branch 1",
        "status": "PENDING",
        "itemCount": 2,
        "createdBy": "Ahmed",
        "createdDate": "2026-08-25"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### POST `/transfers`
Create a new transfer (STORE_MANAGER).

**Body:**
```json
{
  "fromLocationId": "uuid",
  "toLocationId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "qtyCtn": "number"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "uuid",
    "status": "PENDING",
    "timestamp": "2026-08-25T10:30:00Z"
  }
}
```

### POST `/transfers/:id/advance`
Advance transfer to next status (PENDING → APPROVED → SENT → RECEIVED).

**Body:**
```json
{
  "action": "APPROVE|SEND|RECEIVE"
}
```

**Logic:**
- PENDING + APPROVE → APPROVED
- APPROVED + SEND → SENT
- SENT + RECEIVE → RECEIVED (creates stock_movements ledger entries)

### GET `/transfers/:id`
Get transfer details with all items.

---

## Branch Transfers Routes

### GET `/branch-transfers`
Get all branch transfers (warehouse→branch) (paginated, filterable).

**Query Params:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `status` (optional)
- `fromWarehouseId` (optional)
- `toBranchId` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "warehouse": "Warehouse A",
        "branch": "Branch Mogadishu",
        "status": "PENDING",
        "itemCount": 2,
        "createdBy": "Ahmed",
        "createdDate": "2026-08-25"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### POST `/branch-transfers`
Create a new branch transfer (warehouse→branch) (STORE_MANAGER).

**Body:**
```json
{
  "fromWarehouseId": "uuid",
  "toBranchId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "qtyCtn": "number"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "uuid",
    "status": "PENDING",
    "timestamp": "2026-08-25T10:30:00Z"
  }
}
```

**Validation:**
- fromWarehouseId must be a WAREHOUSE location
- toBranchId must be a BRANCH location
- All products must exist and have sufficient stock at warehouse

### POST `/branch-transfers/:id/advance`
Advance branch transfer to next status (PENDING → APPROVED → SENT → RECEIVED).

**Body:**
```json
{
  "action": "APPROVE|SEND|RECEIVE|CANCEL"
}
```

**Logic:**
- PENDING + APPROVE → APPROVED
- APPROVED + SEND → SENT
- SENT + RECEIVE → RECEIVED (creates BRANCH_TRANSFER movements in ledger)
- Any status + CANCEL → CANCELLED (except RECEIVED)

### GET `/branch-transfers/:id`
Get branch transfer details with all items.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fromWarehouseId": "uuid",
    "warehouse": "Warehouse A",
    "toBranchId": "uuid",
    "branch": "Branch Mogadishu",
    "status": "PENDING",
    "requestedBy": "Ahmed",
    "createdAt": "2026-08-25T10:30:00Z",
    "items": [
      {
        "productId": "uuid",
        "productName": "Coca Cola 330ml",
        "qtyCtn": 50
      }
    ]
  }
}
```

---

## Analytics Routes

### GET `/analytics/dashboard`
Admin dashboard KPIs.

**Query Params:**
- `startDate` (optional, default: 30 days ago)
- `endDate` (optional, default: today)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 50000,
    "totalCogs": 30000,
    "grossProfit": 20000,
    "netProfit": 12000,
    "totalExpenses": 8000,
    "outstandingDebts": 5000,
    "totalInventoryValue": 15000,
    "lowStockAlerts": 12,
    "topSellingProduct": {
      "name": "Coca Cola",
      "qtySold": 500,
      "revenue": 15000
    }
  }
}
```

### GET `/analytics/sales-trend`
Sales and profit trend over time (daily data).

**Query Params:**
- `days` (default: 30, max: 365)
- `locationId` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-07-25",
      "revenue": 5000,
      "cogs": 3000,
      "grossProfit": 2000,
      "netProfit": 1500
    }
  ]
}
```

### GET `/analytics/branch-performance`
Compare all branches side-by-side.

**Query Params:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "branchId": "uuid",
      "branchName": "Branch 1",
      "sales": 20000,
      "cogs": 12000,
      "expenses": 3000,
      "grossProfit": 8000,
      "netProfit": 5000,
      "grossMargin": "40%"
    }
  ]
}
```

### GET `/analytics/top-products`
Top-selling products by quantity or revenue.

**Query Params:**
- `metric` (qty|revenue, default: qty)
- `limit` (default: 10)
- `startDate` (optional)
- `endDate` (optional)

### GET `/analytics/product-profitability`
Analyze product profitability.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "uuid",
      "productName": "Coca Cola",
      "qtySold": 500,
      "revenue": 15000,
      "cogs": 11000,
      "profit": 4000,
      "profitMargin": "26.67%",
      "status": "PROFIT"
    },
    {
      "productId": "uuid",
      "productName": "Water",
      "qtySold": 600,
      "revenue": 10800,
      "cogs": 7200,
      "profit": 3600,
      "profitMargin": "33.33%",
      "status": "PROFIT"
    },
    {
      "productId": "uuid",
      "productName": "Loss Item",
      "qtySold": 100,
      "revenue": 1500,
      "cogs": 2000,
      "profit": -500,
      "profitMargin": "-33.33%",
      "status": "LOSS"
    }
  ]
}
```

### GET `/analytics/expenses`
Expense analysis by category and time.

**Query Params:**
- `startDate` (optional)
- `endDate` (optional)
- `locationId` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExpenses": 10000,
    "byCategory": [
      {
        "category": "TRANSPORT",
        "amount": 3000,
        "percentage": "30%"
      }
    ],
    "byBranch": [
      {
        "branchName": "Branch 1",
        "amount": 5000,
        "percentage": "50%"
      }
    ]
  }
}
```

### GET `/analytics/low-stock`
Low inventory items with analysis.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "uuid",
      "productName": "Coca Cola",
      "locations": [
        {
          "locationName": "Branch 1",
          "currentStock": 2,
          "minimumStock": 5,
          "shortage": 3,
          "daysUntilStockout": 1
        }
      ]
    }
  ]
}
```

### GET `/analytics/outstanding-debts`
Debt analysis.

**Query Params:**
- `status` (optional: UNPAID, PARTIALLY_PAID)
- `locationId` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOutstanding": 25000,
    "unpaid": 15000,
    "partiallyPaid": 10000,
    "byBranch": [
      {
        "branchName": "Branch 1",
        "amount": 10000
      }
    ]
  }
}
```

---

## Standard Response Format

All endpoints follow this envelope format:

### Success Response:
```json
{
  "success": true,
  "data": {
    // endpoint-specific data
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Validation Error Response:
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "fieldName": ["error message"],
    "anotherField": ["error message"]
  }
}
```

---

## Error Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid input/validation failure
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business rule violation (e.g., insufficient stock)
- `500 Internal Server Error` - Server error

---

## Pagination

All list endpoints support pagination:
- `page`: Current page (1-indexed, default: 1)
- `pageSize`: Items per page (default: 20, max: 100)

Response includes:
```json
{
  "data": [...],
  "total": 250,
  "page": 1,
  "pageSize": 20,
  "totalPages": 13
}
```

---

## Authentication & Authorization

**Token Format:** JWT Bearer token

**Roles & Permissions:**

| Route | ADMIN | STORE_MANAGER | BRANCH_MGR | BRANCH_STAFF |
|-------|:-----:|:-------------:|:----------:|:------------:|
| GET /products | ✓ | ✓ | ✓ | ✓ |
| POST /products | ✓ | ✓ | - | - |
| GET /locations | ✓ | ✓ | - | - |
| GET /inventory/matrix | ✓ | ✓ | - | - |
| GET /inventory/warehouse | ✓ | ✓ | - | - |
| GET /inventory/branch/:id | ✓ | ✓ | branch only | own branch |
| POST /inventory/receive | ✓ | ✓ | - | - |
| GET /sales | ✓ | ✓ | branch only | own branch |
| POST /sales | ✓ | ✓ | own branch | own branch |
| POST /expenses | ✓ | - | own branch | own branch |
| GET /debts | ✓ | ✓ | branch only | own branch |
| POST /debts | ✓ | ✓ | own branch | own branch |
| POST /transfers | ✓ | ✓ | - | - |
| GET /analytics/* | ✓ | ✓ | limited | - |

