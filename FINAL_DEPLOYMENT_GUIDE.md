# ✅ FINAL FIX: Schema.sql Copy During Build

## The Problem (Original)
```
Error: ENOENT: no such file or directory,
open '/opt/render/project/src/backend/dist/models/schema.sql'
```

Render was running old code that tried to find schema.sql in dist/ but it wasn't there.

## The Solution (Applied)

Instead of trying to reference source files from production, we now **copy schema.sql into dist/ during the build process**.

### What Changed

**File: `backend/package.json`**

```json
"build": "tsc --project tsconfig.json && node -e \"const fs = require('fs'); const path = require('path'); const distDir = path.join(__dirname, 'dist/models'); if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true }); fs.copyFileSync(path.join(__dirname, 'src/models/schema.sql'), path.join(distDir, 'schema.sql')); console.log('✅ Copied schema.sql to dist/')\""
```

This:
1. Compiles TypeScript (`tsc`)
2. Creates `dist/models/` directory if it doesn't exist
3. Copies `src/models/schema.sql` to `dist/models/schema.sql`
4. Logs confirmation

**File: `backend/src/config/migrate.ts`**

```typescript
const schemaPath = path.join(__dirname, "../models/schema.sql");
// __dirname = dist/config
// Resolves to: dist/models/schema.sql ✅
```

---

## Build Result

Now when you build:

```bash
npm run build
```

You get:
```
✅ Copied schema.sql to dist/

dist/
├── config/
│   ├── migrate.js
│   └── seed.js
├── models/
│   ├── schema.sql         ← ✅ NOW PRESENT
│   ├── types.js
│   └── types.js.map
└── server.js
```

---

## Deployment Flow on Render

```bash
npm install
    ↓
npm run build
    ├─ tsc compiles src/ to dist/
    └─ Copies schema.sql to dist/models/schema.sql ✅
    ↓
npm run db:migrate
    ├─ Runs dist/config/migrate.js
    ├─ Looks for dist/models/schema.sql ✅ (now exists)
    ├─ Connects to PostgreSQL
    └─ Creates 51 tables ✅
    ↓
npm run db:seed
    ├─ Runs dist/config/seed.js
    ├─ Creates admin user ✅
    └─ Logs: "✅ Admin user created successfully"
    ↓
npm start
    └─ Dhako API running on port 10000 [production]
```

---

## Next Steps

### Step 1: Push Latest Commit

The new fix is already committed. Make sure it's pushed:

```bash
git push origin main
```

### Step 2: Redeploy on Render

1. Go to `https://dashboard.render.com` → **dhako-backend**
2. Click **Disconnect**
3. Click **Deploy latest commit**

### Step 3: Watch the Logs

You should see:
```
npm install
npm run build
✅ Copied schema.sql to dist/
npm run db:migrate
Reading schema from: /opt/render/project/src/backend/dist/models/schema.sql
Running 51 migration statements...
[1/51] Executing: CREATE EXTENSION IF NOT EXISTS "pgcrypto"...
[2/51] Executing: CREATE TABLE locations...
...
✅ Migration complete.
npm run db:seed
✅ Admin user created successfully
npm start
Dhako API running on port 10000 [production]
```

### Step 4: Test Connection

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

Expected:
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

✅ **Development (Windows):**
- `npm run build` copies schema.sql to dist/
- `npm run db:migrate` finds it at `dist/models/schema.sql`

✅ **Production (Render Linux):**
- `npm run build` copies schema.sql to dist/
- `npm run db:migrate` finds it at `dist/models/schema.sql`
- Migration runs successfully
- Admin user created
- Backend ready to serve requests

✅ **Cross-platform:**
- Uses Node.js built-in `fs` module (works on Windows, Linux, macOS)
- No shell commands (`mkdir`, `cp`)
- Works in all environments

---

## Verification Checklist

After redeployment:

- [ ] Build output shows: `✅ Copied schema.sql to dist/`
- [ ] Migration output shows: `Running 51 migration statements...`
- [ ] Migration completes: `✅ Migration complete.`
- [ ] Seed completes: `✅ Admin user created successfully`
- [ ] Backend starts: `Dhako API running on port 10000 [production]`
- [ ] Health check works: `GET /health` → 200 OK
- [ ] Login works: `POST /auth/login` → returns token
- [ ] Frontend login succeeds
- [ ] Dashboard displays

---

## Summary

**Root cause:** TypeScript doesn't copy `.sql` files to dist, so production build was missing schema.sql

**Solution:** Copy schema.sql during build using Node.js

**Result:** Production deployment now self-contained and fully functional

**Status:** ✅ Ready to deploy

