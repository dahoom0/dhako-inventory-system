# INVENTORY_MANAGER Dashboard Features

## Overview
The INVENTORY_MANAGER dashboard now has 5 main features (accessible from menu):

```
📊 ALAAB (INVENTORY)
📦 PRODUCTS (PRODUCTS LIBRARY)
📦 DALAB (ORDER STOCK)
➕ ITEM CUSUB (NEW ITEM)
💔 JAAJAB (DAMAGED/LOST)
```

---

## 1. 📊 ALAAB (Inventory) - Complete Stock Management

**Purpose:** View all items by warehouse/branch, see movements, track low stocks

### Features:

#### Location Selection
- Select from all 6 locations:
  - 🏭 Warehouse A (w1)
  - 🏭 Warehouse B (w2)
  - 🏭 Warehouse C (w3)
  - 🏪 Branch Mogadishu (b1)
  - 🏪 Branch Hargeisa (b2)
  - 🏪 Branch Kismayo (b3)
- Click location button to switch view
- Shows current location info with item count

#### Inventory Items Table
For selected location, displays:
- **Product Name** - Full product name
- **Units** - Total units in stock
- **Cartoons** - Number of cartoons
- **Min Stock** - Minimum required level
- **Last Updated** - Last update date
- **Status** - Color-coded (🔴 Low Stock / ✓ OK)

#### Search Function
- Search by product name
- Real-time filtering
- Shows "X of Y items" count

#### Low Stock Alert
- Red alert box at top showing low stock items
- Lists items below minimum stock
- Shows current vs. minimum quantities

#### Movement History Table
Shows recent stock transfers:
- **Product** - Item moved
- **From** - Source warehouse/branch
- **To** - Destination warehouse/branch
- **Qty** - Quantity transferred
- **Date** - Transfer date
- **Status** - Pending/Sent/Received

### Example Data:
```
Warehouse A (w1):
- Coca Cola 330ml: 500 units (21 CTN) ✓ OK
- Mineral Water 600ml: 320 units (13 CTN) ✓ OK

Branch Mogadishu (b1):
- Coca Cola 330ml: 100 units (4 CTN) ✓ OK
- Cooking Oil 1L: 200 units (8 CTN) ✓ OK
```

---

## 2. 📦 PRODUCTS (Products Library) - Complete Catalog Management

**Purpose:** Store all products with full details, search, edit, manage storage locations

### Features:

#### Product Search
- Search by product name OR SKU
- Real-time filtering
- Shows "X/Y products" count
- Case-insensitive search

#### Add New Product Button
Opens form with fields:
- **Product Name*** (required) - e.g., "Coca Cola 330ml"
- **SKU*** (required) - e.g., "CC-330"
- **Category** - Select from:
  - Beverages
  - Snacks
  - Oils
  - Dairy
  - Grains
  - Frozen
  - Household
  - Other
- **Items Per Cartoon*** (required) - e.g., 24
- **Cost Per Cartoon*** (required) - e.g., $22.00
- **Selling Price Per Item*** (required) - e.g., $1.50
- **Minimum Stock Level*** (required) - e.g., 100 units
- **Primary Storage Location*** (required) - Choose warehouse or branch

**Buttons:** "Add Product" or "Cancel"

#### Edit Products
- Click "Edit" button on any product row
- Opens same form pre-filled with current data
- Can change:
  - Name
  - SKU
  - Category
  - Prices
  - Storage location (moves product to different warehouse/branch)
  - Minimum stock
- Click "Update Product" to save changes
- **Last Updated** date auto-updates

#### Products Table
Displays all products with columns:

| Column | Content |
|--------|---------|
| Product Name | Full name |
| SKU | Stock keeping unit |
| Category | Product category |
| Per Ctn | Items per cartoon |
| Cost | Cost per cartoon ($) |
| Sell | Selling price per item ($) |
| Margin | Profit margin % |
| Stored At | Location (warehouse/branch) |
| Actions | Edit / Delete buttons |

#### Example Products:
```
1. Coca Cola 330ml
   - SKU: CC-330
   - Category: Beverages
   - 24 items/cartoon
   - Cost: $22.00/CTN, Sell: $1.50/item
   - Margin: 45%
   - Stored: Warehouse A

2. Instant Noodles
   - SKU: IN-PKT
   - Category: Snacks
   - 48 items/cartoon
   - Cost: $28.00/CTN, Sell: $0.80/item
   - Margin: 45%
   - Stored: Warehouse B
```

#### Delete Product
- Click "Delete" button
- Asks for confirmation
- Removes from catalog

#### Profit Calculation
- Formula: (Sell Price - Cost per Unit) / Sell Price × 100
- Shows margin percentage for quick profit analysis

---

## 3. 📦 DALAB (Order Stock)

**Purpose:** Request items from warehouse to branches or warehouse-to-warehouse

### Process:
1. Click "DALAB" button
2. Form appears with fields:
   - **Which Warehouse?** - Select source warehouse
   - **Which Item?** - Select product to order
   - **How Many Cartoons?** - Enter quantity
3. Click "Send Order"
4. Order appears in history with status:
   - Pending (blue)
   - Approved (light blue)
   - Sent (purple)
   - Received (green)

---

## 4. ➕ ITEM CUSUB (New Item)

**Purpose:** Add new products directly to branch inventory

### Process:
1. Click "ITEM CUSUB" button
2. Form appears with fields:
   - **Product Name** - Product name
   - **Items per Cartoon** - Packing unit
   - **Price per Cartoon ($)** - Cost price
   - **Selling Price per Item ($)** - Retail price
3. Click "Save Item"
4. Item added to branch inventory
5. Item appears in products table

---

## 5. 💔 JAAJAB (Damaged/Lost Items)

**Purpose:** Record damaged or lost inventory

### Process:
1. Click "JAAJAB" button
2. Form appears with fields:
   - **Which Item?** - Select product
   - **How Many?** - Quantity damaged
   - **What Happened?** - Select reason:
     - Broken bottles during delivery
     - Damaged packaging
     - Expired/Out of date
     - Lost in storage
     - Water/Fire damage
     - Spillage
     - Other reason
3. Click "Report Damage"
4. Damage report appears in history table

---

## Dashboard Navigation

```
INVENTORY_MANAGER LOGIN
    ↓
Welcome Page (4 buttons + quick stats)
    ↓
┌─────────────────────────────────────┐
│ 📊 ALAAB    │ 📦 PRODUCTS │ 📦 DALAB │
│ 💔 JAAJAB   │ ➕ ITEM CUSUB         │
└─────────────────────────────────────┘
    ↓
Click any button → opens that feature
Click "← Back" → returns to buttons menu
```

---

## Data Storage

All data is stored in component state (mock data):

### Inventory Data Includes:
- Product ID, Name, Quantity, Cartoons
- Location (warehouse/branch)
- Last Updated date
- Minimum stock level

### Products Library Includes:
- Product ID, Name, SKU, Category
- Items per cartoon
- Cost per cartoon
- Selling price per item
- Minimum stock
- Primary storage location
- Created & updated dates

### Movement History Includes:
- Movement ID, Product, From, To
- Quantity transferred
- Transfer date
- Status (Pending/Sent/Received)

### Damage Reports Include:
- Damage ID, Product, Quantity
- Reason for damage
- Date reported
- Reported by user

---

## User Experience

✅ **Simple & Clear**
- Large buttons with icons
- Somali names with English translations
- Minimal navigation
- One task per page

✅ **Efficient**
- Search functions on all pages
- Quick location switching
- Edit products without leaving page
- View history at a glance

✅ **Accurate**
- Real-time profit calculations
- Automatic margin percentages
- Low stock alerts
- Location-based filtering

✅ **Non-Tech Friendly**
- Color-coded status indicators
- Large text and buttons
- Simple dropdown selections
- Confirmation dialogs for destructive actions

---

## Build Status

✅ Exit code 0
- Size: 742KB (js), 200KB (gzip)
- No TypeScript errors
- All imports resolve correctly

---

## Testing Checklist

- [ ] Login as inventory@dhako.com
- [ ] See main menu with 5 buttons
- [ ] Click ALAAB → See location selector
- [ ] Switch between warehouses → See items update
- [ ] Search products → See filtering work
- [ ] Check low stock alerts
- [ ] Click PRODUCTS → See products library
- [ ] Search products → See filtering
- [ ] Click Edit → Form pre-fills
- [ ] Change storage location → Updates in table
- [ ] Click Delete → Product removed
- [ ] Click DALAB → See order form
- [ ] Click ITEM CUSUB → See add item form
- [ ] Click JAAJAB → See damage form
- [ ] Click "← Back" → Return to menu
