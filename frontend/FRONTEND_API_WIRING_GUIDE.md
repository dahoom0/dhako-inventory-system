# Frontend API Wiring Guide - Replace Mock Data with Real API

Complete guide to wire all frontend pages to the backend API.

---

## Priority Order

1. **HIGH PRIORITY** (Must have):
   - [ ] Sales.tsx - Record and view sales
   - [ ] Inventory.tsx - View inventory levels
   - [ ] Expenses.tsx - Track expenses
   - [ ] Debts.tsx - Manage customer debt
   - [ ] ProductManagement.tsx - CRUD products
   - [ ] Dashboard.tsx - Show business metrics

2. **MEDIUM PRIORITY** (Should have):
   - [ ] LocationManagement.tsx - Manage locations
   - [ ] AdminDashboardWithBranches.tsx - Branch-specific view
   - [ ] CustomerManagement.tsx - Manage customers (already done)

3. **LOW PRIORITY** (Nice to have):
   - [ ] BranchManagerDashboard.tsx - Branch staff dashboard
   - [ ] InventoryManagerDashboard.tsx - Inventory staff dashboard

---

## Template: Converting a Page from Mock to Real API

### Step 1: Remove Mock Data Imports
```typescript
// ❌ OLD
import { SALES, PRODUCTS, fmt, saleRevenue, saleProfit, type Sale } from "../data/mock";

// ✅ NEW
import { salesApi, productApi } from "../utils/api";
```

### Step 2: Update State
```typescript
// ❌ OLD
const [sales, setSales] = useState<Sale[]>(SALES);

// ✅ NEW
const [sales, setSales] = useState<Sale[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Step 3: Add useEffect to Fetch Data
```typescript
// ✅ NEW
useEffect(() => {
  loadSales();
}, []);

const loadSales = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await salesApi.getSales({ page: 1, limit: 100 });
    setSales(data.data); // data contains {data: [], total, page, pageSize, totalPages}
  } catch (err: any) {
    setError(err.message || "Failed to load sales");
    console.error("Error loading sales:", err);
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Display Loading and Error States
```typescript
// ✅ NEW - Add before main return
if (loading) {
  return (
    <div className="p-6 text-center">
      <div className="text-lg text-blue-600">Loading data...</div>
    </div>
  );
}

if (error) {
  return (
    <div className="p-6">
      <Card className="p-4" style={{ background: "#fee2e2", borderLeft: "4px solid #dc2626" }}>
        <div style={{ color: "#991b1b" }}>Error: {error}</div>
      </Card>
    </div>
  );
}
```

### Step 5: Handle Create Operations
```typescript
// ✅ NEW - Replace handleSubmit
async function handleSubmit() {
  try {
    const newSaleData = {
      location_id: form.locationId,
      customer_id: form.customerId,
      date: form.date,
      items: [{
        product_id: form.productId,
        qty_ctn: form.qty,
        sell_price_per_ctn: form.sellPrice,
      }]
    };
    
    const response = await salesApi.createSale(newSaleData);
    setSales([response, ...sales]); // Add to front of list
    setShowModal(false);
    setForm({ productId: "", qty: 1, ... });
  } catch (err: any) {
    setError(err.message || "Failed to create sale");
  }
}
```

---

## Page-by-Page Instructions

### 1. Sales.tsx ✅

**What to Replace:**
- Mock `SALES` array (18 records) → API call `salesApi.getSales()`
- Mock `PRODUCTS` array → API call `productApi.getProducts()`

**Key Changes:**
- Add `useEffect` to load sales on mount
- Add `useEffect` to load products on mount
- Update `handleSubmit()` to call `salesApi.createSale()`
- Update field names from `branch` → `location_id`, `ctns` → `qty_ctn`, `sellPrice` → `sell_price_per_ctn`

**API Endpoints Used:**
```typescript
GET  /api/v1/sales
POST /api/v1/sales
GET  /api/v1/products
```

**Difficulty:** ⭐ (Easiest - straightforward list + create)

---

### 2. Expenses.tsx ✅

**What to Replace:**
- Mock `EXPENSES` array (12 records) → API call `expensesApi.getExpenses()`

**Key Changes:**
- Add `useEffect` to load expenses on mount
- Add `useEffect` to load locations (for branch filter)
- Update field names from `branch` → `location_id`, `amount` → `amount`, `category` → `category`

**API Endpoints Used:**
```typescript
GET  /api/v1/expenses
POST /api/v1/expenses
GET  /api/v1/locations
```

**Difficulty:** ⭐ (Simple filtering page)

---

### 3. Debts.tsx ✅

**What to Replace:**
- Mock `DEBTS` array (6 records) → API call `debtsApi.getDebts()`

**Key Changes:**
- Add `useEffect` to load debts on mount
- Update `recordPayment()` to call `debtsApi.recordPayment(debtId, amount)`
- Update field names from `paid` → `paid_amount`, `status` → `status`, `original` → `original_amount`

**API Endpoints Used:**
```typescript
GET  /api/v1/debts
POST /api/v1/debts
POST /api/v1/debts/:id/payment
```

**Difficulty:** ⭐⭐ (Includes payment recording)

---

### 4. Inventory.tsx 🔴 **NEEDS MAJOR REWRITE**

**What to Replace:**
- Mock `MOCK_INVENTORY` array → API call `inventoryApi.getInventory(locationId)`
- Mock `MOCK_MOVEMENTS` array → API call (needs endpoint implementation)

**Key Changes:**
- Replace hardcoded mock inventory with real data from backend
- Fetch inventory when location changes
- Handle inventory view by location
- Field names: `quantity` → `qty_units`, `cartoons` → `qty_ctn`, `location` → `location_id`

**API Endpoints Needed:**
```typescript
GET /api/v1/inventory/location/:locationId
GET /api/v1/inventory/movements
```

**Difficulty:** ⭐⭐⭐ (Complex - multiple locations, tabs, filtering)

---

### 5. ProductManagement.tsx 🟡

**What to Replace:**
- Mock products hardcoded in `fetchProducts()` → API call `productApi.getProducts()`

**Key Changes:**
- Replace entire `fetchProducts()` function with real API call
- Update `handleSubmit()` to use real product creation API
- Field names are mostly correct already

**API Endpoints Used:**
```typescript
GET  /api/v1/products
POST /api/v1/products
PATCH /api/v1/products/:id
DELETE /api/v1/products/:id
```

**Difficulty:** ⭐⭐ (Already partially wired)

---

### 6. Dashboard.tsx 🟡 **COMPLEX**

**What to Replace:**
- Mock `SALES` array → API call
- Mock `EXPENSES` array → API call
- Mock `DEBTS` array → API call
- Mock `PRODUCTS` array → API call
- Mock `SALES_TREND` → May need backend aggregation
- Mock `BRANCH_PERF` → May need backend aggregation

**Key Changes:**
- Replace all mock data constants with API calls
- Fetch on component mount
- Calculate KPIs from real data:
  ```typescript
  const allRevenue = sales.reduce((s, x) => s + (x.qty_ctn * x.sell_price_per_ctn), 0);
  const allCOGS = sales.reduce((s, x) => s + (x.qty_ctn * x.cost_per_ctn_at_sale), 0);
  const allGrossProfit = allRevenue - allCOGS;
  const allExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const allNetProfit = allGrossProfit - allExpenses;
  ```

**API Endpoints Used:**
```typescript
GET /api/v1/sales
GET /api/v1/expenses
GET /api/v1/debts
GET /api/v1/products
GET /api/v1/inventory/matrix
GET /api/v1/analytics/dashboard-stats (optional)
```

**Difficulty:** ⭐⭐⭐⭐ (Most complex - 30+ KPIs)

---

### 7. LocationManagement.tsx 🟡

**What to Replace:**
- Mock random stats for locations → Real stats from backend

**Key Changes:**
- Stats are currently random - need backend to return real stats
- Or calculate from real data (inventory, transactions, etc.)

**API Endpoints Needed:**
```typescript
GET /api/v1/locations
GET /api/v1/locations/:id/stats (if you implement)
```

**Difficulty:** ⭐⭐ (Mostly working, just stats)

---

### 8. AdminDashboardWithBranches.tsx 🟡 **COMPLEX**

**What to Replace:**
- Same as Dashboard.tsx but filtered by branch

**Key Changes:**
- Add branch filter state
- Fetch all data and filter by selected branch
- Or fetch filtered data from backend with query param

**API Endpoints Used:**
```typescript
GET /api/v1/sales?branch_id=:id
GET /api/v1/expenses?branch_id=:id
GET /api/v1/debts?branch_id=:id
```

**Difficulty:** ⭐⭐⭐⭐ (Same as Dashboard + branch filtering)

---

### 9. CustomerManagement.tsx ✅ **ALREADY DONE**

This page is already fully wired to the API! No changes needed.

---

### 10. BranchManagerDashboard.tsx 🔴 **NEEDS REWRITE**

**What to Replace:**
- Mock inventory hardcoded
- Sales and expenses managed locally in state

**Key Changes:**
- Fetch branch inventory on mount
- Fetch branch sales and expenses
- POST sales and expenses to backend

**API Endpoints Used:**
```typescript
GET  /api/v1/inventory/location/:locationId
GET  /api/v1/sales?location_id=:id
GET  /api/v1/expenses?location_id=:id
POST /api/v1/sales
POST /api/v1/expenses
```

**Difficulty:** ⭐⭐⭐ (Multiple data sources)

---

### 11. InventoryManagerDashboard.tsx 🟡

**What to Replace:**
- Hard-coded quick stats
- Depends on sub-components

**Key Changes:**
- Load real data for dashboard stats
- Let sub-components handle their own data loading

**API Endpoints Used:**
- Depends on sub-components

**Difficulty:** ⭐⭐

---

## Implementation Checklist

### Phase 1: Quick Wins (1-2 hours)
- [ ] Sales.tsx - Add API integration
- [ ] Expenses.tsx - Add API integration
- [ ] Debts.tsx - Add API integration

### Phase 2: Medium Complexity (2-3 hours)
- [ ] ProductManagement.tsx - Complete API integration
- [ ] LocationManagement.tsx - Add real stats

### Phase 3: Complex (3-4 hours)
- [ ] Dashboard.tsx - Full KPI calculation from real data
- [ ] AdminDashboardWithBranches.tsx - Branch-filtered dashboard

### Phase 4: Remaining (2-3 hours)
- [ ] Inventory.tsx - Real inventory data
- [ ] BranchManagerDashboard.tsx - Branch-specific data
- [ ] InventoryManagerDashboard.tsx - Inventory stats

---

## Common Field Mappings

| Frontend (Mock) | Backend (Real) | Notes |
|---|---|---|
| `branch` | `location_id` | Use location ID from API |
| `ctns` | `qty_ctn` | Cartons (CTN) |
| `sellPrice` | `sell_price_per_ctn` | Price per carton |
| `costPrice` | `cost_per_ctn_at_sale` | Cost at time of sale |
| `amount` | `amount` | Same for expenses |
| `original` | `original_amount` | Same for debts |
| `paid` | `paid_amount` | Same for debts |
| `user` | `created_by` | User ID from token |
| `id` | `id` | UUID, not string ID |

---

## Error Handling Template

```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(true);

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await someApi.getSomething();
    setData(data);
  } catch (err: any) {
    const message = err?.data?.error || err.message || "Failed to load data";
    setError(message);
    console.error("Error:", err);
  } finally {
    setLoading(false);
  }
};

// Show error:
{error && (
  <Card className="p-4 mb-4" style={{ background: "#fee2e2", borderLeft: "4px solid #dc2626" }}>
    <div style={{ color: "#991b1b" }}>Error: {error}</div>
  </Card>
)}

// Show loading:
{loading && <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>}

// Show data:
{!loading && !error && data.length > 0 && (
  // ... render table or list
)}
```

---

## Next Steps

1. **Start with Phase 1** - These are the easiest and provide immediate value
2. **Test each page** - Verify data loads from backend
3. **Check browser console** - Look for API errors
4. **Verify Render deployment** - Make sure VITE_API_URL is set correctly
5. **Update mock data file** - After all pages are wired, we can delete `data/mock.ts`

---

## API Base URL

Make sure in `frontend/src/utils/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
```

And in your `.env.development`:
```
VITE_API_URL=http://localhost:3001
```

Or on Render:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## Questions & Debugging

### "API returns 401 Unauthorized"
- Check that auth token is in localStorage
- Check that token is valid and not expired
- Login first, then try loading the page

### "CORS error"
- Check FRONTEND_URL is set in backend environment
- Check backend has proper CORS headers

### "Data doesn't update after creating item"
- Either refetch the list after POST
- Or add the new item to the state directly

### "Loading spinner never stops"
- Check browser Network tab for failed requests
- Check backend logs for errors
- Add error boundary to catch exceptions

