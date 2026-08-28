# DHako Database Setup Guide

Your database is already deployed on **Render PostgreSQL**. Now we need to:
1. Initialize the database schema
2. Set environment variables on Render
3. Verify the connection

---

## ✅ Step 1: Your Database Information

From your `init-db.js`, you have:

```
Host: dpg-da7vmi0ae00c73a9i5i0-a.onrender.com
Port: 5432
Database: dhako
User: dhako_user
Password: eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj
```

**Connection String (External):**
```
postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako
```

---

## ✅ Step 2: Initialize Database Schema (Run Locally)

Your database is empty. Run this from your local machine to create tables:

```bash
cd backend
node init-db.js
```

This will:
- Connect to your Render PostgreSQL
- Run `init-database.sql` to create all tables
- Verify the setup
- Show you the count of seeded data

**Expected output:**
```
🔌 Connecting to PostgreSQL...
✅ Connected!

📝 Running initialization SQL...
.......................
✅ Executed: 23, Skipped (already exists): 0

📊 Verifying tables:
  ✓ users
  ✓ locations
  ✓ products
  ✓ inventory
  ✓ sales
  ...

👤 Users: 1
📦 Products: 15
📍 Locations: 3

🎉 Database ready!
```

---

## ✅ Step 3: Set Environment Variables on Render

### For Backend Service

Go to your **Render Dashboard** → Select your backend service → **Settings** → **Environment**

Add these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (or default) |
| `JWT_SECRET` | Generate a strong key (e.g., `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Your frontend URL (e.g., `https://dhako-frontend.onrender.com`) |

### Save & Deploy

After adding variables:
1. Click **Save**
2. The service will redeploy automatically
3. Watch the deployment log

---

## ✅ Step 4: Set CORS on Frontend

### For Frontend Service

Go to **Render Dashboard** → Select frontend → **Settings** → **Environment**

Add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com` |

The backend URL should be something like:
```
https://dhako-backend.onrender.com
```

or whatever your Render backend service is named.

---

## ✅ Step 5: Verify Connection

### Option A: Check Backend Logs

1. Go to Render Dashboard → Backend service
2. Click **Logs**
3. Look for:
   ```
   Dhako API running on port 10000
   ```

### Option B: Test API Health

Make a request to test the connection:

```bash
curl https://your-backend-url.onrender.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-28T10:30:45.123Z"
}
```

### Option C: Check Database in pgAdmin

1. Open pgAdmin locally
2. Connect to the same database:
   - Host: `dpg-da7vmi0ae00c73a9i5i0-a.onrender.com`
   - Port: `5432`
   - Database: `dhako`
   - User: `dhako_user`
   - Password: `eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj`

3. You should see all the tables created

---

## ⚠️ Important Notes

### Security
- **Change JWT_SECRET in production** — Use a strong random value:
  ```bash
  openssl rand -base64 32
  ```
- **Rotate credentials** if you share this database URL
- **Use HTTPS** for all API calls (Render provides this by default)

### Database Persistence
- Your Render PostgreSQL database **persists** data across redeploys
- Data in the database will remain even if you restart services
- **Backups**: Render PostgreSQL includes automatic backups

### SSL Connection
The connection string uses SSL by default. If you need to customize it:
```
postgresql://user:pass@host:port/db?sslmode=require
```

---

## 🔍 Troubleshooting

### "Connection refused"
- Check DATABASE_URL is correct
- Verify firewall allows outbound port 5432
- Test connection locally first: `psql postgresql://...`

### "Database does not exist"
- Run `node init-db.js` to create tables
- Check you're connecting to the right database

### "Table does not exist"
- Database schema wasn't initialized
- Run Step 2 again

### Frontend can't reach backend
- Check VITE_API_URL is set correctly
- Verify FRONTEND_URL in backend env matches your frontend domain
- Check CORS errors in browser console

---

## ✅ Complete Checklist

- [ ] Local database initialized (`node init-db.js` succeeded)
- [ ] Backend service has DATABASE_URL env variable
- [ ] JWT_SECRET is set in backend
- [ ] Frontend VITE_API_URL points to backend
- [ ] Backend health endpoint responds
- [ ] Can connect to database in pgAdmin
- [ ] Frontend can load and make API calls
- [ ] Test user can login (admin@dhako.com / admin123)

---

## 🚀 Quick Summary

1. **Initialize DB locally:** `node init-db.js`
2. **Add env vars to Render backend** (DATABASE_URL, JWT_SECRET, etc.)
3. **Add env vars to Render frontend** (VITE_API_URL)
4. **Wait for redeploy** (~2-3 minutes)
5. **Test** the health endpoint and login

That's it! Your DHako system is ready. 🎉
