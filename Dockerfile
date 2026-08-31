# Professional Combined Frontend + Backend Docker Image
# Multi-stage build: Frontend (Vite) + Backend (Node.js)

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend

WORKDIR /build/frontend

COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/index.html ./
COPY frontend/.figma ./.figma
COPY frontend/src ./src

# VITE_API_URL is passed at build time by Render (or defaults to same-origin for self-hosted)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_NODE_ENV=production

RUN npm ci && npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend

WORKDIR /build/backend

COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/scripts ./scripts
COPY backend/src ./src

RUN npm ci && npm run build

# Stage 3: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S app && adduser -S app -u 1001

# Copy backend files
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend
COPY --from=backend /build/backend/dist ./dist

# Copy schema
COPY --from=backend /build/backend/src/models/schema.sql ./dist/src/models/

# Copy frontend build to public directory
RUN mkdir -p /app/public
COPY --from=frontend /build/frontend/dist /app/public

# Fix permissions
RUN chown -R app:app /app

USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/v1/auth/me', {headers: {'Authorization': 'Bearer test'}}, (r) => {if (r.statusCode !== 200 && r.statusCode !== 401) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
