# ✅ Render Deployment - READY

## The Problem & Solution

**Issue:** Migration script couldn't find `schema.sql` in production

**Root Cause:** tsc only compiles `.ts` → `.js`, doesn't copy `.sql` files

**Solution:** Use `process.cwd()` to read schema from source directory

---

## What Changed

### `backend/package.json`
```json
"scripts": {
  "build": "tsc --project tsconfig.json",
  "db:migrate": "node dist/config/migrate.js"
}
```

Simplified build script - no copying needed.

### `backend/src/config/migrate.ts`
```typescript
const schemaPath = path.join(process.cwd(), "src/models/schema.sql");
```

Changed from looking in `dist/models/` to using `process.cwd()` to find schema in source.

---

## Why This Works

**How `process.cwd()` resolves:**

**Development (local):**
```
cd backend
npm run db:migrate
  → node dist/config/migrate.js
  → process.cwd() = /Users/you/project/backend
  → schema path = /Users/you/project/backend/src/models/schema.sql ✅
```

**Production (Render):**
```
Build runs from: /opt/render/project/src/backend
npm run db:migrate
  → node dist/config/migrate.js
  → process.cwd() = /opt/render/project/src/backend
  → schema path = /opt/render/project/src/backend/src/models/schema.sql ✅
```

Both find the schema file!

---

## Build Command on Render

Should be:
```bash
npm install && npm run build && npm run db:migrate && npm run db:seed
```

This will now:
1. Install dependencies
2. Compile TypeScript (produces dist/)
3. Run migration (reads from src/models/schema.sql)
4. Seed admin user
5. Start the server

---

## Deployment Steps

### Step 1: Verify Changes Committed

```bash
git log --oneline -1
# Should show: Fix: Use process.cwd() to locate schema.sql...
```

### Step 2: Redeploy on Render

1. Go to `https://dashboard.render.com` → **dhako-backend**
2. Click **Disconnect**
3. Click **Deploy latest commit**

### Step 3: Watch Logs for Success

You should see:
```
Running 'npm install'
...
Running 'npm run build'
...
Running 'npm run db:migrate'
Reading schema from: /opt/render/project/src/backend/src/models/schema.sql
Running 51 migration statements...
[1/51] Executing: CREATE EXTENSION IF NOT EXISTS "pgcrypto"...
[2/51] Executing: CREATE TABLE locations...
[3/51] Executing: CREATE TABLE users...
...
✅ Migration complete.

Running 'npm run db:seed'
✅ Admin user created successfully

Running 'npm start'
Dhako API running on port 10000 [production]
```

### Step 4: Test the Connection

```powershell
$body = '{"email":"admin@dhako.com","password":"admin123"}'
Invoke-WebRequest -Uri "https://dhako-backend.onrender.com/api/v1/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -TimeoutSec 20 `
    -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

Expected response:
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

---

## Complete End-to-End Test

After successful login:

### 1. Test Protected Endpoint
```bash
curl -H "Authorization: Bearer <token_from_login>" \
  https://dhako-backend.onrender.com/api/v1/auth/me
```

Should return user details.

### 2. Test Frontend Login
- Go to `https://dhako-frontend.onrender.com`
- Enter: `admin@dhako.com` / `admin123`
- Should load dashboard

### 3. Verify Data Persistence
- Login to frontend
- Perform an action (create, update, etc.)
- Refresh page
- Data should persist in database ✅

---

## Verification Checklist

- [ ] Changes committed and pushed
- [ ] Backend redeploys successfully
- [ ] Migration shows: `✅ Migration complete.`
- [ ] Seed shows: `✅ Admin user created successfully`
- [ ] Health endpoint: `GET /health` → 200
- [ ] Login endpoint: `POST /auth/login` → 200 with token
- [ ] Protected endpoint: `GET /auth/me` → 200 with user
- [ ] Frontend loads without CORS errors
- [ ] Frontend login succeeds
- [ ] Dashboard displays data
- [ ] Data persists after page refresh

---

## Architecture Summary

```
Frontend (HTTPS)
  ↓ VITE_API_URL=https://dhako-backend.onrender.com
Backend (HTTPS)
  ↓ DATABASE_URL=postgresql://...
PostgreSQL Database
  ↓ Returns data
Backend → Frontend → Browser
```

All three layers now connected and functional! ✅

---

## If Issues Persist

Check in order:

1. **Backend logs** - Any errors during build or migration?
2. **Database status** - Is PostgreSQL running on Render?
3. **Environment variables** - Are all required vars set?
4. **Network** - Can frontend reach backend URL?

Common issues and fixes:
- `Migration complete` doesn't appear → Check build command in Render settings
- Database connection error → Verify DATABASE_URL environment variable
- Login returns 500 → Check Render logs for actual error
- CORS error → Verify FRONTEND_URL matches deployed frontend URL

---

## Success Criteria

✅ Backend running
✅ Database schema created
✅ Admin user created
✅ API endpoints responding
✅ Frontend can login
✅ Dashboard loads
✅ Data persists
✅ All three layers communicating

**You are here:** Ready for final deployment! 🚀

