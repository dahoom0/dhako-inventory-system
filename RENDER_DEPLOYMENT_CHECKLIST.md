# Render Deployment Checklist - Complete Setup

## 📋 What You Have Right Now

✅ **GitHub Repository** - Code pushed  
✅ **PostgreSQL Database** - Deployed on Render (`dpg-da7vmi0ae00c73a9i5i0-a.onrender.com`)  
✅ **Backend Service** - Deployed on Render (but needs DB connection)  
✅ **Frontend Service** - Deployed on Render (but needs API connection)  
❌ **Database Schema** - Not initialized yet  
❌ **Environment Variables** - Not set on Render services  

---

## 🎯 Phase 1: Initialize Database (LOCAL MACHINE)

### What to do:
Run this command from your backend folder:

```bash
cd backend
node init-db.js
```

### What it does:
- Connects to your Render PostgreSQL database
- Creates all tables (users, products, locations, sales, expenses, etc.)
- Seeds initial data (1 admin user, 3 locations, 15 products)
- Verifies everything is set up

### Expected output:
```
🔌 Connecting to PostgreSQL...
✅ Connected!

📝 Running initialization SQL...
.........................
✅ Executed: 23, Skipped (already exists): 0

📊 Verifying tables:
  ✓ users
  ✓ locations
  ✓ products
  ✓ inventory
  ✓ sales
  ✓ expenses
  ✓ debts
  ✓ transfers
  ✓ receiving
  ✓ adjustments
  ✓ debt_payments

👤 Users: 1
📦 Products: 15
📍 Locations: 3

🎉 Database ready! You can now start the backend.
```

### If it fails:
```
❌ Connection Error: ...
```

**Troubleshooting:**
- Make sure you're connected to the internet
- Database might be temporarily down - wait 5 min and retry
- Check the connection string in `init-db.js` is correct

---

## 🎯 Phase 2: Configure Backend on Render

### Where to go:
1. Open [Render Dashboard](https://dashboard.render.com)
2. Click on your **Backend Service** (name like `dhako-backend`)
3. Go to **Settings** tab
4. Scroll to **Environment**

### What to add:

| Variable Name | Value | Why |
|---|---|---|
| `DATABASE_URL` | `postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako` | Connect to PostgreSQL |
| `NODE_ENV` | `production` | Enable optimizations |
| `JWT_SECRET` | Any strong random string (e.g., `super_secret_key_12345`) | Sign JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiration time |
| `FRONTEND_URL` | Your frontend URL (see Phase 3) | CORS whitelist |

### Visual guide:
```
┌─ Render Dashboard
│
├─ Backend Service
│  │
│  ├─ Settings
│  │  │
│  │  └─ Environment
│  │     ├─ DATABASE_URL = postgresql://...
│  │     ├─ NODE_ENV = production
│  │     ├─ JWT_SECRET = your-secret-key
│  │     ├─ JWT_EXPIRES_IN = 7d
│  │     └─ FRONTEND_URL = https://...
│  │
│  └─ [SAVE] → Auto-redeploy in 2-3 min
```

### After saving:
- Click the **Save** button
- Service will automatically redeploy
- Wait 2-3 minutes for deployment to complete
- Check **Logs** tab to verify successful start

**Look for these logs:**
```
✅ Dhako API running on port 10000 [production]
✅ Connected to PostgreSQL
```

---

## 🎯 Phase 3: Configure Frontend on Render

### Where to go:
1. Render Dashboard
2. Click your **Frontend Service** (name like `dhako-frontend`)
3. Go to **Settings** tab
4. Scroll to **Environment**

### What to add:

| Variable Name | Value | Why |
|---|---|---|
| `VITE_API_URL` | `https://your-backend-service-name.onrender.com` | Point to backend API |

### How to find backend URL:
1. Go back to Backend Service
2. At the top, you'll see:
   ```
   dhako-backend
   https://dhako-backend-abc123.onrender.com
   ```
3. Copy that URL (the `https://...` part)
4. Add it to `VITE_API_URL` in frontend

### Example:
```
VITE_API_URL=https://dhako-backend-abc123.onrender.com
```

### After saving:
- Click **Save**
- Frontend will redeploy (wait 2-3 min)
- Check **Logs** tab

---

## ✅ Phase 4: Verification (Test Everything)

### Test 1: Backend Health Check

Open in browser or curl:
```
https://your-backend-url.onrender.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-28T12:45:30.123Z"
}
```

### Test 2: Backend Logs

1. Go to Backend Service on Render
2. Click **Logs** tab
3. Look for:
   ```
   ✅ Dhako API running on port 10000 [production]
   ```

### Test 3: Frontend Opens

1. Open your frontend URL in browser:
   ```
   https://dhako-frontend-xyz789.onrender.com
   ```

2. You should see the **Login page**

### Test 4: Login Works

1. Try logging in with:
   - **Email:** `admin@dhako.com`
   - **Password:** `admin123`

2. If successful:
   ```
   ✅ Dashboard loads
   ✅ You can see locations, products, etc.
   ```

### Test 5: Check Database Connection

Option A - From Render logs:
```
Render Backend → Logs
Look for: ✅ Connected to PostgreSQL
```

Option B - From pgAdmin (local):
1. Open pgAdmin
2. Add connection:
   - Host: `dpg-da7vmi0ae00c73a9i5i0-a.onrender.com`
   - Port: `5432`
   - Database: `dhako`
   - User: `dhako_user`
   - Password: `eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj`
3. You should see all tables with data

---

## 🚨 Troubleshooting

### Problem: Backend says "DATABASE_URL not set"

**Solution:**
1. Go to Backend Settings → Environment
2. Make sure `DATABASE_URL` is there
3. Click Save
4. Wait for redeploy

---

### Problem: "Cannot connect to database"

**Solution:**
1. Run `node init-db.js` locally (did you do Phase 1?)
2. Check connection string is exactly right
3. Wait 5 min, Render databases sometimes need time to be ready

---

### Problem: Frontend won't load or is blank

**Solution:**
1. Open browser DevTools (F12)
2. Check **Console** tab for errors
3. Most likely: `VITE_API_URL` not set correctly
4. Go to Frontend → Settings → Environment
5. Make sure `VITE_API_URL=https://your-backend-url.onrender.com`

---

### Problem: Can't login

**Solution:**
1. Frontend → Logs should show API calls
2. Backend → Logs should show incoming requests
3. If backend shows errors, check DATABASE_URL is set

---

## 📊 Success Indicators

When everything is working, you should see:

✅ Backend service shows "Live"  
✅ Frontend service shows "Live"  
✅ Backend logs show successful startup  
✅ Frontend loads without errors  
✅ Login with admin@dhako.com works  
✅ Dashboard shows data  
✅ Database has all tables with data  

---

## 🎯 Your Database Login (for pgAdmin)

Keep this safe - don't share publicly!

```
Host: dpg-da7vmi0ae00c73a9i5i0-a.onrender.com
Port: 5432
Database: dhako
Username: dhako_user
Password: eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj
External URL: postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako
```

---

## 🏁 Summary of Steps

| # | Step | Where | What |
|---|------|-------|------|
| 1 | Initialize DB | Local Terminal | `node init-db.js` |
| 2 | Set Backend Env | Render Backend Settings | Add DATABASE_URL, JWT_SECRET, etc. |
| 3 | Set Frontend Env | Render Frontend Settings | Add VITE_API_URL |
| 4 | Test Health | Browser | Visit backend `/health` |
| 5 | Test Login | Browser | Login with admin creds |
| 6 | Verify DB | pgAdmin | Connect and see tables |

---

**Once all checkmarks are green, your DHako system is fully deployed and operational! 🎉**
