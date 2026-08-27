# Fix Render Database Migration Issue

## Problem Found
```
error: relation "users" does not exist
```

The `users` table and other tables were not created in the PostgreSQL database. The migration ran but didn't create the schema properly.

## Root Cause
PostgreSQL on Render took too long to initialize, or the migration ran in a way that failed silently.

## Solution

### Step 1: Redeploy Backend with New Migration Script

1. Go to **Render Dashboard** → **dhako-backend**
2. Click **Disconnect**
3. Wait 30 seconds
4. Click **Deploy latest commit**
5. Watch the logs carefully

You should see:
```
Running 51 migration statements...
[1/51] Executing: CREATE EXTENSION IF NOT EXISTS...
[2/51] Executing: CREATE TABLE locations...
...
✅ Migration complete.
✅ Admin user created successfully
Dhako API running on port 10000 [production]
```

### Step 2: Verify in Logs

The backend logs should show clear migration output. Look for:
- ✅ `Migration complete.`
- ✅ `Admin user created successfully`
- No error messages about "relation does not exist"

### Step 3: Test Login Again

After deployment completes, test:

```powershell
$body = '{"email":"admin@dhako.com","password":"admin123"}'
$response = Invoke-WebRequest -Uri "https://dhako-backend.onrender.com/api/v1/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -TimeoutSec 20 `
    -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

Should return:
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

## If It Still Doesn't Work

### Option A: Check Build Command

Make sure the Build Command in Render is:
```bash
npm install && npm run build && npm run db:migrate && npm run db:seed
```

**Not just:**
```bash
npm install && npm run build
```

### Option B: Manually Run Migration in Render

1. Go to **Render → dhako-backend → Shell**
2. Run:
   ```bash
   npm run db:migrate
   ```
3. Watch for any errors

### Option C: Check PostgreSQL Service

1. Go to **Render → dhako-db (PostgreSQL)**
2. Check if it shows as **Running**
3. If it's suspended, click **Activate** 

---

## What Changed

The migration script now:
- ✅ Splits SQL into individual statements
- ✅ Logs each statement as it executes
- ✅ Ignores "already exists" errors (idempotent)
- ✅ Uses proper SSL configuration for Render
- ✅ Better error reporting

This makes debugging much easier and handles edge cases on Render.

---

## Quick Checklist

After redeploying:

- [ ] Backend logs show `✅ Migration complete.`
- [ ] Backend logs show `✅ Admin user created successfully`
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Login endpoint returns `{"success":true,"data":{...}}`
- [ ] Frontend can login with `admin@dhako.com` / `admin123`
- [ ] Dashboard loads after login

---

## If All Else Fails

We might need to:
1. Delete the PostgreSQL database on Render
2. Create a new one
3. Let it initialize fully
4. Redeploy the backend with fresh migration

But try the steps above first!

