# Role-Based Dashboards

Each user role now has their own dedicated dashboard when they log in.

## User Roles & Dashboards

### 1. ADMIN (admin@dhako.com / admin123)
**Dashboard:** Admin Dashboard (src/pages/admin/AdminDashboard.tsx)
- Full access to all system features
- User management
- Location management
- Product management
- Sales analytics
- Expense tracking
- Debt management
- See all branches and warehouses

---

### 2. INVENTORY_MANAGER (inventory@dhako.com / inventory123)
**Dashboard:** Inventory Manager Dashboard (src/pages/admin/InventoryManagerDashboard.tsx)

**First Page When Logging In:**
Three large, colorful buttons:

1. **📦 Dalab (Order Stock)**
   - Request items from warehouse to branches
   - Select source warehouse
   - Choose product
   - Enter number of cartoons
   - Tracks order status (Pending/Approved/Sent/Received)

2. **➕ Item Cusub (New Item)**
   - Add new products to catalog
   - Enter product name
   - Items per cartoon
   - Cost per cartoon
   - Selling price per item
   - View all products in inventory

3. **💔 Jaajab (Damaged/Lost Items)**
   - Record damaged or lost items
   - Select damaged product
   - Quantity damaged
   - Reason (broken, expired, lost, etc.)
   - Track damage history

**Quick Stats:**
- Pending Orders count
- Total Products in system
- Damage Reports this month

**Additional Features:**
- Product Management (add/edit products)
- Inventory page (view all stock)
- Receiving page (receive stock)
- Transfers page (manage stock movements)

---

### 3. BRANCH_MANAGER (branch@dhako.com / branch123)
**Dashboard:** Branch Dashboard (src/pages/BranchDashboard.tsx)

**First Page When Logging In:**
Displays InventoryManager with three buttons:

1. **📦 Dalab (Order Stock)**
   - Request items from warehouse to this branch
   - Simplified for branch-level operations
   - Only shows relevant warehouses and products

2. **➕ Item Cusub (New Item)**
   - Add new products to branch inventory
   - Record product details
   - Track branch-specific inventory

3. **💔 Jaajab (Damaged/Lost Items)**
   - Report damaged items at branch
   - Track damage history for accountability

**Restrictions:**
- Only see their assigned branch data (b1, b2, or b3)
- Cannot access warehouse operations (Receiving, Product Management)
- Cannot see sales, expenses, or debts
- Cannot manage users

---

## File Structure

```
src/pages/
├── BranchDashboard.tsx (BRANCH_MANAGER dashboard - shows InventoryManager)
├── admin/
│   ├── AdminDashboard.tsx (ADMIN dashboard)
│   ├── InventoryManagerDashboard.tsx (INVENTORY_MANAGER dashboard)
│   ├── UserManagement.tsx
│   ├── LocationManagement.tsx
│   └── ProductManagement.tsx
└── inventory/
    ├── InventoryManager.tsx (Menu component with 3 buttons)
    ├── OrderStock.tsx (Dalab - Order Stock)
    ├── AddNewItem.tsx (Item Cusub - New Item)
    └── RecordDamage.tsx (Jaajab - Damaged/Lost Items)
```

## Key Design Features

✅ **Non-Technical Friendly:**
- Large buttons with icons
- Simple, clear form fields
- Somali transliterated names with English explanations
- Large text and spacing
- Color-coded sections

✅ **Role-Based Access:**
- Each role sees only their dashboard
- Sidebar shows only relevant menu items
- Access control enforced in App.tsx

✅ **Simple Navigation:**
- INVENTORY_MANAGER: Three options (Dalab/Item Cusub/Jaajab)
- BRANCH_MANAGER: Same three options (scoped to their branch)
- ADMIN: Full system access

## Testing

### Login as INVENTORY_MANAGER
- Email: `inventory@dhako.com`
- Password: `inventory123`
- Expected: See InventoryManagerDashboard with 3 large buttons + quick stats

### Login as BRANCH_MANAGER
- Email: `branch@dhako.com`
- Password: `branch123`
- Expected: See InventoryManager with 3 large buttons (branch-scoped)

### Login as ADMIN
- Email: `admin@dhako.com`
- Password: `admin123`
- Expected: See AdminDashboard with full system access

---

## Build Status
✅ Exit code 0
- Size: 725KB (js), 197KB (gzip)
- No TypeScript errors
