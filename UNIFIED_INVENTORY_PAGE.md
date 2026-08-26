# Unified Inventory Page - Warehouses + Inventory Combined

## Overview

The Inventory page now combines Warehouses and Inventory into **ONE unified view**. Users can:
1. **Choose a location** at the top (warehouse or branch)
2. **See all items** for that location
3. **View movement history** for that location
4. **Track low stocks** with alerts

---

## Page Structure

### 1. **Location Selector - Top Section**

```
🏭 Warehouse A  |  🏭 Warehouse B  |  🏭 Warehouse C
🏪 Branch Mogadishu  |  🏪 Branch Hargeisa  |  🏪 Branch Kismayo
```

Features:
- Click any location button to switch view
- Selected location is highlighted in blue
- Location type shown with icon (🏭 warehouse, 🏪 branch)
- All 6 locations visible (3 warehouses + 3 branches)

---

### 2. **Location Info Cards - Quick Stats**

Four cards showing current location data:

| Card | Shows |
|------|-------|
| 📍 Current Location | Location name with icon |
| 📦 Total Items | Number of different products |
| 📊 Total Units | Total quantity of all items |
| ⚠️ Low Stock Items | Count of items below minimum |

Example:
```
Current Location: 🏭 Warehouse A
Total Items: 8
Total Units: 2,570
Low Stock Items: 1
```

---

### 3. **Tab Navigation**

Two tabs to switch views:

#### **Tab 1: 📊 Inventory Items**
- Shows all products at selected location
- Search bar to filter products
- Low stock alert box (if any items below minimum)
- Inventory table with details

#### **Tab 2: 📦 Movements**
- Shows all stock transfers involving this location
- Both incoming (to) and outgoing (from) transfers
- Transfer status indicators

---

### 4. **Search Function**

Located in the Inventory Items tab:
- Search by product name
- Real-time filtering
- Shows "X products found"
- Hides search results if no match

---

### 5. **Low Stock Alert**

Red alert box appears when items are below minimum:
```
⚠️ Low Stock Alert!
2 item(s) below minimum stock:
• Mineral Water 600ml: 1 cartoons (Min: 10)
• Green Tea 25-bag: 0 cartoons (Min: 6)
```

---

### 6. **Inventory Items Table**

Displays all items for selected location:

| Column | Details |
|--------|---------|
| **Product Name** | Full product name |
| **Units** | Total units in stock |
| **Cartoons** | Number of cartoons |
| **Min Stock** | Minimum required level |
| **Cost/Unit** | Cost per unit ($) |
| **Sell/Unit** | Selling price per unit ($) |
| **Status** | 🔴 Low or ✓ OK (color coded) |
| **Updated** | Last update date |

Example Row:
```
Coca Cola 330ml | 500 | 21 CTN | 100 | $0.92 | $1.50 | ✓ OK | 2026-08-25
```

---

### 7. **Movements Table**

Shows stock transfers involving this location:

| Column | Details |
|--------|---------|
| **Product** | Product name |
| **From** | Source location |
| **To** | Destination location |
| **Qty** | Quantity transferred |
| **Date** | Transfer date |
| **Status** | Pending / Sent / Received |

Example Row:
```
Coca Cola 330ml | Warehouse A | Branch Mogadishu | 100 | 2026-08-25 | Received
```

---

## User Journey

### Step 1: User Logs In
- INVENTORY_MANAGER logs in
- Default location selected: Warehouse A (w1)

### Step 2: Sees Location Selector
- All 6 location buttons visible at top
- Current location highlighted in blue
- Four quick stat cards below

### Step 3: Views Inventory Items Tab
- Shows all products at Warehouse A
- Can search for specific products
- Low stock alert visible (if any)
- Inventory table shows all items

### Step 4: Switch Location
- Clicks "Branch Mogadishu" button
- Page instantly updates
- Inventory items for Branch Mogadishu appear
- Movement history refreshes
- Low stock alert updates

### Step 5: View Movements
- Clicks "Movements" tab
- Sees all transfers to/from this location
- Shows Pending/Sent/Received status

### Step 6: Back to Menu
- Click sidebar "Inventory" to see this view
- Or sidebar "Dalab/Products/Jaajab" for other actions

---

## Data Shown by Location

### Warehouse A (w1):
- Coca Cola 330ml: 500 units (21 CTN) ✓ OK
- Mineral Water 600ml: 320 units (13 CTN) ✓ OK

### Warehouse B (w2):
- Orange Juice 1L: 150 units (6 CTN) ✓ OK
- Instant Noodles: 800 units (33 CTN) ✓ OK

### Warehouse C (w3):
- Biscuits Assorted: 400 units (16 CTN) ✓ OK
- Cooking Oil 1L: 200 units (8 CTN) ✓ OK

### Branch Mogadishu (b1):
- Cooking Oil 1L: 200 units (8 CTN) ✓ OK
- Coca Cola 330ml: 100 units (4 CTN) ✓ OK

### Branch Hargeisa (b2):
- Mineral Water 600ml: 150 units (6 CTN) ✓ OK

### Branch Kismayo (b3):
- Instant Noodles: 120 units (5 CTN) ✓ OK

---

## Key Features

✅ **Single Page View**
- No separate tabs for warehouses vs branches
- All data in one unified interface
- Quick location switching

✅ **Instant Updates**
- Click location → data updates immediately
- Search results filter in real-time
- Low stock alerts refresh per location

✅ **Visual Indicators**
- Color-coded status (🔴 Low / ✓ OK)
- Location icons (🏭 warehouse / 🏪 branch)
- Selected location highlighted in blue

✅ **Comprehensive Data**
- View inventory by location
- See movement history
- Track low stocks
- Quick stat cards for overview

✅ **Search & Filter**
- Search by product name
- Real-time filtering
- Shows count of results

---

## Navigation

```
INVENTORY_MANAGER Dashboard
    ↓
Sidebar: "Inventory" button
    ↓
Unified Inventory Page
    ├─ Location Selector at top
    ├─ Inventory Items Tab (default)
    │  ├─ Search bar
    │  ├─ Low stock alert
    │  └─ Inventory table
    └─ Movements Tab
       └─ Movements table
```

---

## Build Status

✅ Exit code 0
- Size: 734KB (js), 198KB (gzip)
- No TypeScript errors
- All imports resolve correctly

---

## Related Pages

From this Inventory page, access other features via sidebar:
- 📦 **Dalab** (Order Stock) - Request transfers
- 📦 **Products** - Manage product catalog
- ➕ **Item Cusub** (New Item) - Add new products
- 💔 **Jaajab** (Damage) - Report damaged items

Or click location buttons to instantly switch what inventory you're viewing.

---

## Testing Checklist

- [ ] Login as inventory@dhako.com
- [ ] See Inventory page with location selector
- [ ] Click different warehouse → inventory updates
- [ ] Click different branch → inventory updates
- [ ] See correct items for each location
- [ ] Check low stock alert appears/disappears per location
- [ ] Search products → see filtering
- [ ] Click Movements tab → see transfers for this location
- [ ] Quick stats cards update per location
- [ ] Location buttons highlight selected one
- [ ] Go to sidebar "Inventory" → stays on this page
