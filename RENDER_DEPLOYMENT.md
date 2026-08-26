# Render Deployment Instructions

## Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `dhako-db`
   - **Database**: `dhako`
   - **User**: `dhako_user`
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 15
   - **Plan**: Free
4. Click **Create Database**
5. Wait 2-3 minutes
6. Copy the **Internal Database URL** (starts with `postgresql://`)
7. Save it - you'll need it for the backend

## Step 2: Deploy Backend

1. Click **New +** → **Web Service**
2. Connect your GitHub repository (`dahoom0/dhako-inventory-system`)
3. Fill in:
   - **Name**: `dhako-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Click **Advanced** and add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 10000
   FRONTEND_URL = https://dhako-frontend.onrender.com
   DATABASE_URL = postgresql://... (paste from Step 1)
   JWT_SECRET = (generate random: openssl rand -hex 32)
   ```
5. Click **Create Web Service**
6. Wait 5-10 minutes for build to complete
7. Copy your backend URL (e.g., `https://dhako-backend.onrender.com`)

## Step 3: Deploy Frontend

1. Click **New +** → **Static Site**
2. Connect your GitHub repository (`dahoom0/dhako-inventory-system`)
3. Fill in:
   - **Name**: `dhako-frontend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Publish Directory**: `dist`
   - **Plan**: Free
4. Click **Create Static Site**
5. Wait 3-5 minutes for build

## Step 4: Initialize Database

1. Go to your PostgreSQL database on Render
2. Click **Shell**
3. Run:
   ```bash
   psql $DATABASE_URL < /dev/stdin << 'EOF'
   -- Paste contents of backend/src/models/schema.sql here
   EOF
   ```
   
   Or use the psql CLI to connect and paste the SQL from `backend/src/models/schema.sql`

## Step 5: Verify

- Frontend: `https://dhako-frontend.onrender.com`
- Backend API: `https://dhako-backend.onrender.com/api/v1/health`
- Should return: `{"status":"ok","timestamp":"..."}

## Done! 🚀

Your Dhako system is now live on Render with PostgreSQL database.
