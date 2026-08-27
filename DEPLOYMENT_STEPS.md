# Dhako Inventory System — Render Deployment Guide

## Current Status
- ✅ Frontend deployed: https://dhako-frontend.onrender.com
- ✅ Backend service created on Render (dhako-backend)
- ✅ PostgreSQL database created (dhako-db, FREE tier, expires Sept 26, 2026)
- ✅ Desktop responsiveness fixed (CSS media queries for 1024px+ screens)
- ✅ TypeScript build working locally
- ⏳ Backend not yet deployed (requires env vars + database initialization)

## Step 1: Initialize PostgreSQL Database

Go to **Render Dashboard** → **dhako-db** → **Query** tab

Paste the entire content of `backend/init-database.sql` and execute it.

This will:
- Create all tables (locations, users, products, stock_movements, sales, expenses, debts, transfers, etc.)
- Create views for inventory levels and analytics
- Seed demo data (3 warehouses, 3 branches, 10 sample products)
- Insert admin user: **admin@dhako.com** / **admin123**

## Step 2: Set Backend Environment Variables

On Render, go to your **dhako-backend** service → **Environment** tab

Add these variables:

```
DATABASE_URL=postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako
JWT_SECRET=aK7mP2xQ9nL5vR8sT3bW6jH4fD1gC0eE
NODE_ENV=production
FRONTEND_URL=https://dhako-frontend.onrender.com
PORT=10000
```

(These are already configured on Render; verify they exist)

## Step 3: Trigger Backend Deployment

1. On the **dhako-backend** service page, click **Manual Deploy**
2. Watch the build logs — it should:
   - Install dependencies
   - Compile TypeScript (`tsc`)
   - Start the server on port 10000

Expected success message:
```
Server running on port 10000
```

## Step 4: Verify Backend Health

Once deployed, test:

```bash
curl https://dhako-backend.onrender.com/api/v1/health
```

Expected response:
```json
{ "status": "ok" }
```

## Step 5: Test Full Stack

1. **Frontend**: https://dhako-frontend.onrender.com
2. **Login** with:
   - Email: `admin@dhako.com`
   - Password: `admin123`
3. **Dashboard** should load with demo data
4. **Test responsiveness**: Desktop (1024px+) and mobile (max-width 640px)

## Troubleshooting

### Backend build fails with "MODULE_NOT_FOUND"
- Cause: `DATABASE_URL` env var not set or invalid
- Fix: Verify env vars in Render dashboard, redeploy

### Database connection timeout
- Cause: Using external URL from local machine
- Fix: Backend uses internal URL automatically (dpg-...db.onrender.com) when deployed on Render
- Cannot connect from local Windows machine due to network isolation

### Admin login fails
- Cause: Database not initialized or seed data not inserted
- Fix: Run `backend/init-database.sql` in Render Query Editor

### Frontend shows "Cannot connect to backend"
- Cause: CORS or backend URL mismatch
- Fix: Verify `FRONTEND_URL=https://dhako-frontend.onrender.com` on backend
- Frontend already configured to use `https://dhako-backend.onrender.com/api/v1`

## Architecture

```
┌─ Frontend (Static) ─────────────────────┐
│ https://dhako-frontend.onrender.com     │
│ React + Vite + Tailwind                 │
│ Responsive: mobile (640px), desktop     │
└────────────────┬────────────────────────┘
                 │ /api/v1/* requests
                 ▼
┌─ Backend (Node.js + Express) ───────────┐
│ https://dhako-backend.onrender.com      │
│ TypeScript compiled → dist/             │
│ Port: 10000                             │
└────────────────┬────────────────────────┘
                 │ queries
                 ▼
┌─ PostgreSQL (Managed) ──────────────────┐
│ Render: dhako-db (FREE, 1GB)            │
│ Internal URL: dpg-...db.onrender.com    │
│ External URL: dpg-...c.onrender.com     │
└─────────────────────────────────────────┘
```

## Files Changed (Recent)

- `src/index.css` — Added desktop media queries (1024px+) for responsive layout
- `src/App.tsx` — Optimized sidebar width (200px for desktop)
- `backend/tsconfig.json` — Fixed moduleResolution (node → node16)

All changes pushed to GitHub: https://github.com/dahoom0/dhako-inventory-system.git

