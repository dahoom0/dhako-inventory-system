# Verify Render Deployment - Complete Connection Test

This guide will verify that:
1. ✅ Backend is running on Render
2. ✅ Backend can connect to PostgreSQL database
3. ✅ Frontend can connect to backend
4. ✅ Full login flow works end-to-end

## Step 1: Check Backend Health

### 1.1 Backend Service Status
Go to: **https://dashboard.render.com** → **dhako-backend** → **Logs**

Look for:
```
✅ Admin user created successfully
   Email: admin@dhako.com
   Password: admin123

Dhako API running on port 10000 [production]
```

If you see deployment errors, check the build command output above these lines.

### 1.2 Test Health Endpoint

```powershell
curl.exe -X GET "https://dhako-backend.onrender.com/health"
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-27T..."
}
```

**If this fails**: Backend service is down or not accessible. Check Render logs.

---

## Step 2: Check Database Connection

### 2.1 Test Login (Creates DB Query)

```powershell
curl.exe -X POST "https://dhako-backend.onrender.com/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@dhako.com","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "System Admin",
      "email": "admin@dhako.com",
      "role": "ADMIN"
    }
  }
}
```

**Possible errors and fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid credentials` | User doesn't exist or password wrong | Re-run seed script or check DATABASE_URL |
| `Internal server error` | Database connection failed | Check DATABASE_URL env var in Render |
| Connection timeout | Backend unreachable | Check backend service status |

### 2.2 Verify in Render Logs

After the login test, check **Render Logs** for:
```
POST /api/v1/auth/login 200
```

This confirms the database query succeeded.

---

## Step 3: Check Frontend Environment Variable

### 3.1 Frontend Environment Configuration

Go to: **https://dashboard.render.com** → **dhako-frontend** → **Environment**

Verify:
```
VITE_API_URL=https://dhako-backend.onrender.com
```

**If missing**: Add it now and redeploy frontend.

### 3.2 Check Frontend Build Log

Go to: **https://dashboard.render.com** → **dhako-frontend** → **Logs**

Look for the build command output:
```
vite v8.0.5 building client environment for production...
...
✓ built in 1.29s
```

Should complete successfully.

---

## Step 4: Test Frontend → Backend Connection

### 4.1 Open Frontend and Login

1. Go to: `https://dhako-frontend.onrender.com`
2. Try to login with:
   - Email: `admin@dhako.com`
   - Password: `admin123`

### 4.2 Check Browser Developer Tools

**Ctrl+Shift+J** (or right-click → Inspect → Console tab)

#### 4.2.1 Check Network Tab
1. Click **Network** tab
2. Try login again
3. Look for a POST request to `auth/login`
4. It should show:
   - **Status**: `200 OK`
   - **URL**: `https://dhako-backend.onrender.com/api/v1/auth/login`
   - **Response**: Valid JSON with token

#### 4.2.2 Check Console Tab
Look for any errors like:
- `CORS error` → Backend CORS configuration issue
- `Failed to fetch` → Backend unreachable
- Network errors → Connection problem

#### 4.2.3 Check LocalStorage
Open Browser Console and run:
```javascript
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('user'));
```

Should show:
- `authToken`: JWT token string
- `user`: JSON with user data

---

## Step 5: Verify Complete Data Flow

### 5.1 Check Backend Environment Variables

Go to: **Render → dhako-backend → Environment**

Verify these are set:
```
DATABASE_URL=postgresql://dhako_user:...@dpg-...
JWT_SECRET=ak7mP2x09hL5vR8sT3bw6jH4iD1g0oE
NODE_ENV=production
FRONTEND_URL=https://dhako-frontend.onrender.com
PORT=10000
```

### 5.2 Check Database Connection

In Render Logs, after a login attempt, look for any:
```
PostgreSQL pool error
connection refused
```

If you see these, check `DATABASE_URL` is correct.

### 5.3 Check CORS Configuration

Backend allows requests from:
```
origin: env.frontendUrl = https://dhako-frontend.onrender.com
```

If frontend is on a different URL, CORS will fail. Verify frontend URL matches.

---

## Step 6: Full End-to-End Test

Execute this PowerShell script to test the complete flow:

```powershell
# Test 1: Health check
Write-Host "1. Testing backend health..." -ForegroundColor Cyan
$health = curl.exe -X GET "https://dhako-backend.onrender.com/health" 2>$null
if ($health -like "*ok*") {
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend is not responding" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n2. Testing login (database connection)..." -ForegroundColor Cyan
$loginResponse = curl.exe -X POST "https://dhako-backend.onrender.com/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@dhako.com","password":"admin123"}' 2>$null

if ($loginResponse -like '*"success":true*') {
    Write-Host "   ✅ Login successful" -ForegroundColor Green
    Write-Host "   ✅ Database connection working" -ForegroundColor Green
    
    # Extract token
    $token = ($loginResponse | ConvertFrom-Json).data.token
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "   ❌ Login failed" -ForegroundColor Red
    Write-Host "   Response: $loginResponse" -ForegroundColor Yellow
    exit 1
}

# Test 3: Protected endpoint (requires token)
Write-Host "`n3. Testing protected endpoint..." -ForegroundColor Cyan
$meResponse = curl.exe -X GET "https://dhako-backend.onrender.com/api/v1/auth/me" `
  -H "Authorization: Bearer $token" 2>$null

if ($meResponse -like '*"success":true*') {
    Write-Host "   ✅ Protected endpoint accessible" -ForegroundColor Green
    Write-Host "   ✅ Token authentication working" -ForegroundColor Green
} else {
    Write-Host "   ❌ Protected endpoint failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All tests passed! Frontend-Backend-Database connection verified." -ForegroundColor Green
```

---

## Step 7: Troubleshooting

### Problem: "CORS error" in browser console

**Cause**: Frontend URL doesn't match backend's FRONTEND_URL setting

**Fix**:
1. Go to **Render → dhako-backend → Environment**
2. Update `FRONTEND_URL` to match your frontend URL exactly
3. Redeploy backend

### Problem: "Failed to fetch" error

**Cause**: Backend is down or unreachable

**Fix**:
1. Check **Render → dhako-backend → Logs** for errors
2. Check build command output
3. Verify `DATABASE_URL` is correct

### Problem: Login returns "Invalid credentials"

**Cause**: Admin user doesn't exist in database

**Fix**:
1. Check **Render → dhako-backend → Logs** for:
   ```
   ✅ Admin user created successfully
   ```
2. If not there, the seed script didn't run. Re-run with:
   ```bash
   npm run db:seed
   ```

### Problem: "Internal server error" on login

**Cause**: Database connection failed or validation error

**Fix**:
1. Check **Render Logs** for the actual error
2. Verify `DATABASE_URL` is correct
3. Verify database is accessible

### Problem: Frontend can't reach backend

**Cause**: Wrong API URL in frontend environment

**Fix**:
1. Go to **Render → dhako-frontend → Environment**
2. Verify `VITE_API_URL=https://dhako-backend.onrender.com`
3. Redeploy frontend

---

## Complete Connection Diagram

```
User Browser
    ↓
Frontend (https://dhako-frontend.onrender.com)
    ↓ Makes API call with VITE_API_URL
Backend (https://dhako-backend.onrender.com)
    ↓ Queries database
PostgreSQL Database (on Render)
    ↓ Returns user data
Backend returns JWT token
    ↓
Frontend stores in localStorage
    ↓
Frontend sends token on subsequent requests
    ↓
Backend validates token
    ↓ Queries database
Database returns protected data
    ↓
Backend returns data to frontend
```

---

## Verification Checklist

- [ ] Backend health endpoint returns 200 with `status: ok`
- [ ] Login endpoint returns 200 with valid JWT token
- [ ] Token can be used to access `/auth/me` endpoint
- [ ] Frontend loads without CORS errors
- [ ] Frontend login form is visible
- [ ] Frontend login succeeds with admin credentials
- [ ] Frontend stores token in localStorage
- [ ] Frontend displays dashboard after login
- [ ] All environment variables are correctly set on Render
- [ ] Database is accessible from backend

---

## Quick Status Check

Run this to get a quick overview:

```powershell
Write-Host "🔍 Quick Render Status Check" -ForegroundColor Cyan
Write-Host ""

# Check backend
$backend = curl.exe -s "https://dhako-backend.onrender.com/health" | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($backend.status -eq "ok") {
    Write-Host "✅ Backend: Running" -ForegroundColor Green
} else {
    Write-Host "❌ Backend: Not responding" -ForegroundColor Red
}

# Check login
$login = curl.exe -s -X POST "https://dhako-backend.onrender.com/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@dhako.com","password":"admin123"}' | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($login.success) {
    Write-Host "✅ Database: Connected (login successful)" -ForegroundColor Green
    Write-Host "✅ Admin User: Exists" -ForegroundColor Green
} else {
    Write-Host "❌ Database: Error" -ForegroundColor Red
}

# Check frontend
$frontend = curl.exe -s -o /dev/null -w "%{http_code}" "https://dhako-frontend.onrender.com"
if ($frontend -eq "200") {
    Write-Host "✅ Frontend: Deployed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: Error ($frontend)" -ForegroundColor Red
}
```

---

## If Everything Works

🎉 Your system is fully connected:
- Frontend ↔ Backend ✅
- Backend ↔ Database ✅
- All APIs operational ✅
- Ready for production ✅

You can now:
1. Login on frontend
2. View dashboard
3. Perform all operations
4. Data persists in database

