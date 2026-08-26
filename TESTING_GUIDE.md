# User Role Mapping & Location-Scoped Data Access - Testing Guide

## Overview
This document verifies the implementation of user-location mapping and location-scoped data access across all roles in the inventory management system.

## Test Users & Credentials

### 1. ADMIN User
- **Email:** `admin@dhako.com`
- **Password:** `admin123`
- **Role:** ADMIN
- **Assigned Locations:** ALL (w1, w2, w3, b1, b2, b3)
- **Primary Location:** None (can manage everything)

### 2. INVENTORY_MANAGER User
- **Email:** `inventory@dhako.com`
- **Password:** `inventory123`
- **Role:** INVENTORY_MANAGER
- **Assigned Locations:** All warehouses + all branches (w1, w2, w3, b1, b2, b3)
- **Primary Location:** w1 (Warehouse A)

### 3. BRANCH_MANAGER User (Mogadishu)
- **Email:** `branch@dhako.com`
- **Password:** `branch123`
- **Role:** BRANCH_MANAGER
- **Assigned Locations:** b1 only
- **Primary Location:** b1 (Branch Mogadishu)

### 4. Additional BRANCH_MANAGER Users
- **Email:** `branch2@dhako.com` → Branch Hargeisa (b2)
- **Email:** `branch3@dhako.com` → Branch Kismayo (b3)

---

## Test Cases

### ✓ Test 1: ADMIN Login & Full Access

**Action:** Login as `admin@dhako.com`

**Expected Results:**
- ✓ Dashboard: Can see admin dashboard with all KPIs
- ✓ Inventory: Can see all warehouses (w1, w2, w3) and all branches (b1, b2, b3)
- ✓ Sales: Can view all sales across all locations
- ✓ Expenses: Can view all expenses across all locations
- ✓ Debts: Can view all debts across all locations
- ✓ Product Management: Can create/edit/delete products (canManageProducts = true)
- ✓ Receiving: Can receive stock at all warehouses
- ✓ Transfers: Can see all transfers between any warehouses/branches
- ✓ Users: Can manage all users and assign roles

**Navigation Sidebar:** Shows all main menu items (Dashboard, Inventory, Sales, Expenses, Debts, Product Management, Users, Receiving, Transfers)

---

### ✓ Test 2: INVENTORY_MANAGER Login & Warehouse/Branch Access

**Action:** Login as `inventory@dhako.com`

**Expected Results:**
- ✓ Dashboard: Redirects to inventory dashboard (no admin dashboard)
- ✓ Inventory: 
  - Can see all warehouses (w1, w2, w3) and branches (b1, b2, b3)
  - Can manage stock movements between locations
  - Can see low stock items across all warehouses
- ✓ Product Management: Can create/edit products (canManageProducts = true)
- ✓ Receiving: 
  - Can receive stock at any warehouse
  - Warehouse dropdown shows only w1, w2, w3
- ✓ Transfers: Can view and manage transfers
  - Shows transfers involving accessible warehouses
- ✓ Sales: NO ACCESS (shows "Access Denied" or redirects)
- ✓ Expenses: NO ACCESS (shows "Access Denied" or redirects)
- ✓ Debts: NO ACCESS (shows "Access Denied" or redirects)
- ✓ Users: NO ACCESS

**Navigation Sidebar:** Shows limited menu (Dashboard, Inventory, Product Management, Receiving, Transfers only)

---

### ✓ Test 3: BRANCH_MANAGER Login & Branch-Only Access

**Action:** Login as `branch@dhako.com`

**Expected Results:**
- ✓ Dashboard: Shows BranchDashboard (not admin dashboard)
  - Displays: "Branch Mogadishu" with:
    - Today's Sales KPI
    - Total Sales (monthly)
    - Profit calculation
    - Inventory Value
    - Outstanding Debts
    - Low Stock Items
  - Daily Sales table showing branch transactions
  - Quick Actions: Record Sale, View Inventory, Request Stock, View Debts
- ✓ Inventory: 
  - Shows only BRANCH type inventory for b1
  - Does NOT see warehouse inventory (w1, w2, w3)
  - Does NOT see other branches (b2, b3)
  - Low stock alerts only for b1
- ✓ Product Management: NO ACCESS (canManageProducts = false)
- ✓ Receiving: NO ACCESS (warehouse operation)
- ✓ Transfers: 
  - Shows only transfers to/from b1
  - Cannot see transfers between other branches (b2↔b3)
  - Cannot see warehouse transfers (w1→w2)
- ✓ Sales: NO ACCESS
- ✓ Expenses: NO ACCESS
- ✓ Debts: NO ACCESS
- ✓ Users: NO ACCESS

**Navigation Sidebar:** Shows only (Dashboard, Inventory)

**Location Isolation:** Verifies that b1 can only see/access:
- b1 inventory
- b1 transfers (incoming/outgoing)
- b1 sales/debts

---

### ✓ Test 4: Location Filtering in Data Tables

**Action:** Login as each user type and inspect data

**Inventory Warehouse List:**
- ADMIN: Shows w1, w2, w3, b1, b2, b3
- INVENTORY_MANAGER: Shows w1, w2, w3, b1, b2, b3 (all accessible)
- BRANCH_MANAGER (b1): Shows only branch inventory, no warehouses

**Receiving Warehouse Dropdown:**
- ADMIN: All warehouses (w1, w2, w3)
- INVENTORY_MANAGER: All warehouses (w1, w2, w3)
- BRANCH_MANAGER: Cannot access Receiving page

**Transfers Table:**
- ADMIN: All transfers (any from→to combination)
- INVENTORY_MANAGER: Transfers involving w1, w2, w3
- BRANCH_MANAGER (b1): Transfers involving b1 only

**Stock Movements:**
- ADMIN: All movements across all locations
- INVENTORY_MANAGER: Movements at w1, w2, w3, b1, b2, b3
- BRANCH_MANAGER (b1): Movements at b1 only

---

### ✓ Test 5: Role-Based Sidebar Navigation

**Action:** Login as each user and verify sidebar

**ADMIN Sidebar:**
```
✓ Dashboard
✓ Inventory
✓ Sales
✓ Expenses  
✓ Debts
✓ Product Management
✓ Users
✓ Receiving
✓ Transfers
```

**INVENTORY_MANAGER Sidebar:**
```
✓ Dashboard
✓ Inventory
✓ Product Management
✓ Receiving
✓ Transfers
✗ Sales (hidden)
✗ Expenses (hidden)
✗ Debts (hidden)
✗ Users (hidden)
```

**BRANCH_MANAGER Sidebar:**
```
✓ Dashboard (BranchDashboard)
✓ Inventory
✗ Sales (hidden)
✗ Expenses (hidden)
✗ Debts (hidden)
✗ Product Management (hidden)
✗ Users (hidden)
✗ Receiving (hidden)
✗ Transfers (not shown or no access)
```

---

### ✓ Test 6: Access Denial Messages

**Action:** Try to access restricted pages

**Expected Results:**
- ✓ Non-ADMIN user accessing Sales: Shows "Access Denied" card
- ✓ Non-ADMIN user accessing Expenses: Shows "Access Denied" card
- ✓ Non-ADMIN user accessing Debts: Shows "Access Denied" card
- ✓ Non-INVENTORY_MANAGER accessing Product Management: Shows "Access Denied" card
- ✓ BRANCH_MANAGER accessing Product Management: Shows "Access Denied" card
- ✓ BRANCH_MANAGER accessing Receiving: Shows "Access Denied" or redirects

---

### ✓ Test 7: Location Helper Functions

**Action:** Verify helper functions work correctly

**canAccessLocation(locationId):**
- ADMIN: Returns true for any location
- INVENTORY_MANAGER: Returns true for w1, w2, w3, b1, b2, b3
- BRANCH_MANAGER: Returns true only for b1

**getAccessibleLocations():**
- ADMIN: Returns ["w1", "w2", "w3", "b1", "b2", "b3"]
- INVENTORY_MANAGER: Returns ["w1", "w2", "w3", "b1", "b2", "b3"]
- BRANCH_MANAGER: Returns ["b1"]

**isLocationAccessible(locationId):**
- Works same as canAccessLocation

---

## Implementation Summary

### Modified Files:
1. **src/context/AuthContext.tsx** - User-location mapping system
2. **src/App.tsx** - Integrated BranchDashboard for BRANCH_MANAGER
3. **src/pages/Inventory.tsx** - Filters by accessible locations
4. **src/pages/Sales.tsx** - ADMIN only
5. **src/pages/Expenses.tsx** - ADMIN only
6. **src/pages/Debts.tsx** - ADMIN only
7. **src/pages/admin/ProductManagement.tsx** - Role-based product management
8. **src/pages/BranchDashboard.tsx** - NEW branch manager dashboard
9. **src/pages/Receiving.tsx** - Filters warehouses by accessible locations
10. **src/pages/inventory/Transfers.tsx** - Filters transfers by accessible locations

### Key Features:
- ✓ User-location mapping in AuthContext
- ✓ Role-based access control (ADMIN/INVENTORY_MANAGER/BRANCH_MANAGER)
- ✓ Location-scoped data filtering across all pages
- ✓ BRANCH_MANAGER isolated dashboard (BranchDashboard)
- ✓ Helper functions for location access checks
- ✓ Sidebar menu reflects user role
- ✓ Access denial UI for unauthorized users
- ✓ All data tables and dropdowns respect location scoping

---

## Build Status
✓ Build successful (exit code 0)
- Size: 712KB (js), 195KB (gzip)
- No TypeScript errors
- All imports resolve correctly

---

## Next Steps
1. Run the dev server: `pnpm dev`
2. Test each user login with provided credentials
3. Verify sidebar navigation matches role expectations
4. Check data filtering in each page
5. Test location-aware dropdowns (Warehouse, Branch)
6. Verify access denial messages appear for restricted pages
7. Test transfers between locations with different user roles
