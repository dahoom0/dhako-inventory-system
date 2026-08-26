# Dashboard Flow by Role

## System Flow

```
USER LOGIN
    ↓
    ├─→ ADMIN@DHAKO.COM
    │   ├─→ Login Success
    │   ├─→ Redirect to /dashboard
    │   └─→ Show: AdminDashboard.tsx
    │       ├─ Admin KPIs (all locations)
    │       ├─ User management
    │       ├─ Sales analytics
    │       └─ Full system access
    │
    ├─→ INVENTORY@DHAKO.COM
    │   ├─→ Login Success
    │   ├─→ Redirect to /dashboard
    │   └─→ Show: InventoryManagerDashboard.tsx (FIRST PAGE)
    │       ├─ Welcome message with user name
    │       ├─ 3 Large Buttons:
    │       │  ├─ 📦 DALAB (Order Stock)
    │       │  ├─ ➕ ITEM CUSUB (New Item)
    │       │  └─ 💔 JAAJAB (Damaged/Lost)
    │       └─ Quick Stats:
    │          ├─ Pending Orders (5)
    │          ├─ Total Products (24)
    │          └─ Damage Reports (3)
    │
    │   User Clicks "DALAB" (Order Stock)
    │   └─→ Show: OrderStock.tsx
    │       ├─ Form: Select Warehouse, Product, Qty
    │       └─ Table: Order History with Status
    │
    │   User Clicks "ITEM CUSUB" (New Item)
    │   └─→ Show: AddNewItem.tsx
    │       ├─ Form: Name, Per Cartoon, Cost, Sell Price
    │       └─ Table: All Products
    │
    │   User Clicks "JAAJAB" (Damaged)
    │   └─→ Show: RecordDamage.tsx
    │       ├─ Form: Product, Qty, Reason
    │       └─ Table: Damage Reports
    │
    │   User Clicks "← Back"
    │   └─→ Return to: InventoryManagerDashboard.tsx (3 buttons)
    │
    └─→ BRANCH@DHAKO.COM
        ├─→ Login Success
        ├─→ Redirect to /dashboard
        └─→ Show: BranchDashboard.tsx
            └─→ Which Calls: InventoryManager.tsx (FIRST PAGE)
                ├─ Gets branch name from locationId
                ├─ 3 Large Buttons (Branch-Scoped):
                │  ├─ 📦 DALAB (Order from Warehouse to This Branch)
                │  ├─ ➕ ITEM CUSUB (Add Item to Branch Inventory)
                │  └─ 💔 JAAJAB (Report Branch Damage)
                └─ Buttons trigger:
                   ├─ OrderStock.tsx (filtered for this branch)
                   ├─ AddNewItem.tsx (for this branch)
                   └─ RecordDamage.tsx (for this branch)
```

## Component Hierarchy

```
App.tsx
├─ renderPage()
│  ├─ role === "ADMIN"
│  │  └─ case "dashboard" → <AdminDashboard />
│  │
│  ├─ role === "INVENTORY_MANAGER"
│  │  └─ case "dashboard" → <InventoryManagerDashboard />
│  │                        ├─ state: view = "menu" | "order" | "new-item" | "damage"
│  │                        ├─ Menu View:
│  │                        │  └─ 3 Large Buttons
│  │                        ├─ Order View:
│  │                        │  └─ <OrderStock branchName="Warehouse" />
│  │                        ├─ New Item View:
│  │                        │  └─ <AddNewItem branchName="Warehouse" />
│  │                        └─ Damage View:
│  │                           └─ <RecordDamage branchName="Warehouse" />
│  │
│  └─ role === "BRANCH_MANAGER"
│     └─ case "dashboard" → <BranchDashboard />
│                          └─ <InventoryManager branchName="Branch Mogadishu" />
│                             ├─ state: view = "menu" | "order" | "new-item" | "damage"
│                             ├─ Menu View:
│                             │  └─ 3 Large Buttons
│                             ├─ Order View:
│                             │  └─ <OrderStock branchName="Branch Mogadishu" />
│                             ├─ New Item View:
│                             │  └─ <AddNewItem branchName="Branch Mogadishu" />
│                             └─ Damage View:
│                                └─ <RecordDamage branchName="Branch Mogadishu" />
```

## User Experience Walkthrough

### INVENTORY_MANAGER Journey

1. **Login Page**
   - Email: inventory@dhako.com
   - Password: inventory123

2. **Dashboard Appears (FIRST IMPRESSION)**
   - Welcome: "Welcome, Inventory Manager"
   - Subtitle: "Inventory Management System"
   - Three large colored boxes with icons:
     - Blue: 📦 DALAB
     - Green: ➕ ITEM CUSUB
     - Red: 💔 JAAJAB
   - Below: Quick stats showing 5 pending orders, 24 products, 3 damage reports

3. **Click DALAB**
   - Back button appears (← Back)
   - Form appears: "Which Warehouse? → Which Item? → How Many Cartoons?"
   - Button: "Send Order"
   - Table below shows order history

4. **Click Back**
   - Returns to 3-button menu

5. **Click ITEM CUSUB**
   - Back button appears
   - Form: "Product Name, Items per Cartoon, Price per Cartoon, Selling Price"
   - Button: "Save Item"
   - Table shows all products

6. **Click Back**
   - Returns to 3-button menu

7. **Click JAAJAB**
   - Back button appears
   - Form: "Which Item? How Many? What Happened?"
   - Button: "Report Damage"
   - Table shows damage history

### BRANCH_MANAGER Journey

1. **Login Page**
   - Email: branch@dhako.com
   - Password: branch123

2. **Dashboard Appears (SAME as INVENTORY_MANAGER BUT SCOPED)**
   - Welcome: "Welcome, Branch Manager - Mogadishu"
   - Three buttons (same layout)
   - But when they click buttons:
     - DALAB: Only shows "Warehouse A" (or all warehouses for transfer)
     - ITEM CUSUB: Adds to their branch inventory
     - JAAJAB: Reports damage at their branch

3. **Navigation**: Same as INVENTORY_MANAGER

## Key Points

✅ **Both INVENTORY_MANAGER and BRANCH_MANAGER see the same interface**
- Three colorful buttons (Dalab, Item Cusub, Jaajab)
- Simple forms
- History tables

✅ **The difference is in the DATA filtered**
- INVENTORY_MANAGER: See all warehouses and branches
- BRANCH_MANAGER: See only their assigned branch

✅ **No other pages visible**
- First login = Three buttons
- Click button = Do that task
- Click back = Return to three buttons
- No complex navigation needed

✅ **Design principle: Simplicity for non-technical users**
- Large buttons with icons
- Somali names with English explanations
- Clear, single-purpose forms
- No confusing menus or dashboards
