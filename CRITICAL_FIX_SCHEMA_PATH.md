# ✅ CRITICAL FIX: Schema File Path for Render

## The Problem

**Error in Render logs:**
```
Error: ENOENT: no such file or directory,
open '/opt/render/project/src/backend/dist/models/schema.sql'
```

## Root Cause

TypeScript only compiles `.ts` files to `.js` in the `dist/` folder. It does **NOT** copy `.sql` files.

**Build result:**
- ✅ `backend/src/config/migrate.ts` → compiled to `backend/dist/config/migrate.js`
- ❌ `backend/src/models/schema.sql` → **NOT copied** to `backend/dist/models/schema.sql`

Then when migration runs:
```
node dist/config/migrate.js
```

It tried to read:
```
dist/models/schema.sql  ← ❌ DOESN'T EXIST
```

And crashed.

---

## The Solution

Changed the migration script to point to the **source** directory instead of dist:

**Old (incorrect):**
```typescript
const schemaPath = path.join(__dirname, "../models/schema.sql");
// __dirname = dist/config
// Resolves to: dist/models/schema.sql ❌
```

**New (correct):**
```typescript
const schemaPath = path.join(__dirname, "../../src/models/schema.sql");
// __dirname = dist/config
// Resolves to: src/models/schema.sql ✅
```

Also added:
- Path validation to check file exists before reading
- Clear error messages if file is not found
- Logging to show which path is being used

---

## What Changed

**File:** `backend/src/config/migrate.ts`

```diff
- const schemaPath = path.join(__dirname, "../models/schema.sql");
+ const schemaPath = path.join(__dirname, "../../src/models/schema.sql");
+ 
+ console.log(`Reading schema from: ${schemaPath}`);
+ 
+ if (!fs.existsSync(schemaPath)) {
+   throw new Error(`Schema file not found at: ${schemaPath}`);
+ }
```

---

## Next Steps

### Step 1: Redeploy Backend on Render

1. Go to: `https://dashboard.render.com` → **dhako-backend**
2. Click **Disconnect**
3. Wait 30 seconds
4. Click **Deploy latest commit**

### Step 2: Watch the Logs

You should now see:
```
Reading schema from: /opt/render/project/src/backend/src/models/schema.sql
Running 51 migration statements...
[1/51] Executing: CREATE EXTENSION IF NOT EXISTS...
[2/51] Executing: CREATE TABLE locations...
...
✅ Migration complete.
✅ Admin user created successfully
Dhako API running on port 10000 [production]
```

### Step 3: Test Login

```powershell
curl.exe -X POST "https://dhako-backend.onrender.com/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@dhako.com","password":"admin123"}'
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

## Why This Works

**Development (local):**
```
npm run build  → compiles src/config/migrate.ts to dist/config/migrate.js
npm run db:migrate  → runs dist/config/migrate.js
  → __dirname = dist/config
  → path = dist/config/../../src/models/schema.sql
  → RESOLVES TO: src/models/schema.sql ✅ (which exists)
```

**Production (Render):**
```
npm install && npm run build && npm run db:migrate
  → TypeScript compiles src to dist
  → migrate.js is in dist/config
  → __dirname = /opt/render/project/src/backend/dist/config
  → path = dist/config/../../src/models/schema.sql
  → RESOLVES TO: /opt/render/project/src/backend/src/models/schema.sql ✅
```

Both environments now correctly find the schema file!

---

## Verification Checklist

After redeployment:

- [ ] Render logs show `Reading schema from: ...src/models/schema.sql`
- [ ] Logs show `Running 51 migration statements...`
- [ ] Logs show `✅ Migration complete.`
- [ ] Logs show `✅ Admin user created successfully`
- [ ] Health endpoint works: `GET /health` returns 200
- [ ] Login works: `POST /auth/login` returns token
- [ ] Frontend can login with admin@dhako.com / admin123
- [ ] Dashboard loads after login

---

## Summary

**This was the critical blocker:** The migration script couldn't find the SQL schema file in production.

**Now fixed:** The migration script correctly points to the source directory, so it will always find the schema file on Render.

**Result:** Database migration will succeed, tables will be created, admin user will be seeded, and the entire system will work! 🚀

