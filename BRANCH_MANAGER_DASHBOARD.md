# BRANCH_MANAGER Dashboard

Complete dashboard for branch managers to run their local branch operations.

---

## Dashboard Overview

When BRANCH_MANAGER logs in (branch@dhako.com), they see a main menu with three options:

```
💰 SALES (Record Selling)
💸 QARASHAAD (Expenses)
📦 INVENTORY (Local Storage)
```

Plus quick stats cards:
- Today's Sales total
- Total Expenses 
- Inventory Items count

---

## 1. 💰 SALES (Record Selling)

**Purpose:** Record daily sales transactions

### Features:

#### Add Sale Button
Opens form to record a sale:

**Form Fields:**
- **Product** (dropdown) - Select from available products:
  - Coca Cola 330ml
  - Mineral Water 600ml
  - Orange Juice 1L
  - Instant Noodles
  - Cooking Oil 1L
  
- **Quantity** (number) - How many units sold

- **Price per Unit** ($) - Price charged per unit

- **Discount** ($) - Optional discount on sale (can be left as 0)

- **Total** (auto-calculated) - Shows:
  - (Quantity × Price per Unit) - Discount

**Buttons:** "Record Sale" or "Cancel"

#### Sales History Table
Shows all recorded sales with columns:
- Product Name
- Quantity sold
- Price per unit
- Discount applied
- Total amount
- Date recorded

**Example:**
```
Coca Cola 330ml | 10 | $1.50 | $0.00 | $15.00 | 2026-08-25
Mineral Water 600ml | 5 | $0.80 | $1.00 | $3.00 | 2026-08-25
```

---

## 2. 💸 QARASHAAD (Expenses)

**Purpose:** Track branch expenses (rent, salary, utilities, etc.)

### Features:

#### Add Expense Button
Opens form to record an expense:

**Form Fields:**
- **Category** (dropdown) - Select expense type:
  - Rent
  - Staff Salary
  - Utilities
  - Transport
  - Maintenance
  - Marketing
  - Other
  
- **Amount** ($) - Expense amount (required)

- **Description** (text) - Optional details (e.g., "Monthly rent for storefront")

**Buttons:** "Record Expense" or "Cancel"

#### Expenses History Table
Shows all recorded expenses with columns:
- Category (e.g., Rent, Salary)
- Description
- Amount
- Date recorded

**Example:**
```
Rent | Monthly storefront rent | $500.00 | 2026-08-25
Staff Salary | August salary for 2 staff | $400.00 | 2026-08-20
Utilities | Water & electricity | $75.00 | 2026-08-15
```

---

## 3. 📦 INVENTORY (Local Storage)

**Purpose:** View local branch inventory (managed by Inventory Manager)

### Features:

#### Quick Stats
- Total units in stock
- Note: "Managed by Inventory Manager"

#### Low Stock Alert
Red alert box shows items below minimum stock:
```
⚠️ Low Stock Alert!
2 item(s) below minimum:
• Mineral Water 600ml: 20 units (Min: 30)
• Cooking Oil 1L: 35 units (Min: 40)
```

#### Inventory Table
Shows current branch inventory with columns:
- Product Name
- Units in stock
- Cartoons (packing units)
- Minimum stock level
- Status (🔴 Low or ✓ OK)

**Example:**
```
Coca Cola 330ml | 100 | 4 CTN | 30 | ✓ OK
Mineral Water 600ml | 20 | 1 CTN | 30 | 🔴 Low
Cooking Oil 1L | 200 | 8 CTN | 40 | ✓ OK
```

#### Note Box
Yellow info box explaining:
"Your inventory is managed by the Inventory Manager. To request stock, use the Dalab (Order) feature in the main dashboard."

---

## Dashboard Navigation

```
BRANCH_MANAGER LOGIN (branch@dhako.com)
    ↓
Main Menu
    ├─ 💰 SALES
    ├─ 💸 QARASHAAD  
    └─ 📦 INVENTORY

Click any button → Opens that section
Click "← Back" → Returns to main menu
```

---

## Key Features

✅ **Simple & Clear**
- Large buttons with icons
- Easy-to-understand form fields
- Somali names with English explanations

✅ **Record Sales**
- Add product, quantity, price, optional discount
- Auto-calculates total
- View sales history

✅ **Track Expenses**
- Multiple expense categories (rent, salary, etc.)
- Add description for details
- View expense history

✅ **Monitor Inventory**
- See current stock levels
- Low stock alerts
- Managed by Inventory Manager (branch cannot edit)

✅ **Real-time Calculation**
- Sales total calculated automatically
- Discount deducted from total
- Total expenses tracked

---

## Data Storage

All data is stored in component state (mock):

### Sales Data:
- Product, Quantity, Price/Unit, Discount
- Calculated Total
- Date recorded

### Expenses Data:
- Category, Description, Amount
- Date recorded

### Inventory Data:
- Product, Units, Cartoons, Min Stock
- Status (Low/OK)
- (Read-only - managed by Inventory Manager)

---

## User Workflow Example

### Recording a Sale:
1. Click "💰 Sales" button
2. Click "+ Add Sale"
3. Select "Coca Cola 330ml"
4. Enter Quantity: 10
5. Enter Price: $1.50
6. Leave Discount as 0
7. See Total: $15.00
8. Click "Record Sale"
9. Sale appears in history table
10. Today's Sales total updates to $15.00

### Recording an Expense:
1. Click "💸 Qarashaad" button
2. Click "+ Add Expense"
3. Select Category: "Rent"
4. Enter Amount: $500
5. Add Description: "Monthly storefront rent"
6. Click "Record Expense"
7. Expense appears in history
8. Total Expenses updates to $500

### Checking Inventory:
1. Click "📦 Inventory" button
2. See total items in stock
3. Check for low stock alert
4. View current inventory levels
5. See which items need restocking

---

## Permissions

✅ **Can Do:**
- Record sales (add product, qty, price, discount)
- Track expenses (rent, salary, utilities, etc.)
- View branch inventory levels
- See low stock alerts

❌ **Cannot Do:**
- Edit/manage inventory (Inventory Manager only)
- Add/edit products (ADMIN/Inventory Manager only)
- Access other branches' data
- Access global reports

---

## Build Status

✅ Exit code 0
- Size: 736KB (js), 198KB (gzip)
- No TypeScript errors

---

## Testing

- [ ] Login as branch@dhako.com
- [ ] See main menu with 3 buttons
- [ ] Click Sales → see form, add sale, see history
- [ ] Click Qarashaad → see form, add expense, see history
- [ ] Click Inventory → see inventory, low stock alert
- [ ] Click Back → return to main menu
- [ ] Check quick stats update as data is added
- [ ] Verify total calculations (Sales, Expenses)
- [ ] Verify date formatting
- [ ] Test all form validations
