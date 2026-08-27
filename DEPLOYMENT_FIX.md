# Deployment Fix Guide

## The Root Cause

The login was returning `500 Internal server error` because:

1. **Schema mismatch**: The database `users` table had constraint `role IN ('ADMIN','STORE_MANAGER',...)` but frontend/controller used `INVENTORY_MANAGER`
2. **No seed data**: Even after fixing the role, there was no admin user in the database to login with
3. **Render Free limitation**: No shell access to manually create users

## Changes Made

### 1. Fixed Database Schema
**File**: `backend/src/models/schema.sql`

Changed the users table role constraint from:
```sql
role TEXT NOT NULL CHECK (role IN ('ADMIN','STORE_MANAGER','BRANCH_MANAGER','BRANCH_STAFF'))
```

To:
```sql
role TEXT NOT NULL CHECK (role IN ('ADMIN','INVENTORY_MANAGER','BRANCH_MANAGER','BRANCH_STAFF'))
```

### 2. Created Database Seed Script
**File**: `backend/src/config/seed.ts`

This automatically creates an admin user if one doesn't exist:
- Email: `admin@dhako.com`
- Password: `admin123`
- Role: `ADMIN`

### 3. Updated Backend Scripts
**File**: `backend/package.json`

Added `db:seed` script:
```json
"db:seed": "node dist/config/seed.js"
```

### 4. Fixed Auth Controller Role
**File**: `backend/src/controllers/auth.controller.ts`

Already fixed to use `INVENTORY_MANAGER` instead of `STORE_MANAGER`

## Deployment Instructions for Render

### Step 1: Update Backend Build Command

In Render dashboard:
1. Go to **dhako-backend** service
2. Click **Settings**
3. Find **Build Command**
4. Replace with:
```bash
npm install && npm run build && npm run db:migrate && npm run db:seed
```

5. Keep **Start Command** as:
```bash
npm start
```

### Step 2: Verify Environment Variables

Make sure these are set in Render **Environment Variables**:

```
DATABASE_URL=postgresql://dhako_user:...@dpg-...onrender.com:5432/dhako
JWT_SECRET=ak7mP2x09hL5vR8sT3bw6jH4iD1g0oE
NODE_ENV=production
FRONTEND_URL=https://dhako-frontend.onrender.com
PORT=10000
```

### Step 3: Deploy

1. Go to **dhako-backend** service
2. Click **Disconnect** or wait for auto-deploy trigger
3. If manual: Click **Deploy latest commit**
4. Watch the Logs:
   - Should see: `Migration complete.`
   - Should see: `✅ Admin user created successfully`
   - Should see: `Dhako API running on port 10000 [production]`

### Step 4: Test Login

```bash
curl -X POST https://dhako-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dhako.com","password":"admin123"}'
```

You should get:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "System Admin",
      "email": "admin@dhako.com",
      "role": "ADMIN"
    }
  }
}
```

## Files Modified

```
backend/src/models/schema.sql          ← Fixed role constraint
backend/src/config/seed.ts             ← New: Creates admin user
backend/src/config/env.ts              ← No changes needed
backend/src/controllers/auth.controller.ts ← Already fixed
backend/src/routes/auth.routes.ts      ← Already fixed
backend/package.json                   ← Added db:seed script
```

## Local Testing (Before Deploying)

If you want to test locally before deploying to Render:

```bash
# 1. Make sure PostgreSQL is running locally
# 2. Create a local .env in backend/
#    DATABASE_URL=postgresql://user:password@localhost:5432/dhako
#    JWT_SECRET=test-secret
#    NODE_ENV=development
#    FRONTEND_URL=http://localhost:8443

# 3. Build
npm run build

# 4. Run migration
npm run db:migrate

# 5. Run seed
npm run db:seed

# 6. Start
npm run dev

# 7. Test
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dhako.com","password":"admin123"}'
```

## Summary

| Problem | Solution |
|---------|----------|
| 500 error on login | Fixed role enum mismatch in schema |
| No admin user to login with | Created seed script that auto-creates admin |
| Manual user creation impossible on Render Free | Build command now runs seed automatically |
| Schema and code out of sync | Verified all role names match across files |

After deployment, the login flow should work:
- Frontend sends credentials
- Backend queries PostgreSQL
- User is found (from seed)
- Password validated
- JWT token returned
- Frontend stores token and user in localStorage
- Authenticated requests now work

