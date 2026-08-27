-- Dhako Database Initialization Script
-- Run this in your Render PostgreSQL shell

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Locations (warehouses + branches)
CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('WAREHOUSE', 'BRANCH')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users & roles
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('ADMIN','STORE_MANAGER','BRANCH_MANAGER','BRANCH_STAFF')),
  location_id   UUID REFERENCES locations(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  sku             TEXT UNIQUE NOT NULL,
  category        TEXT NOT NULL,
  unit            TEXT NOT NULL,
  qty_per_ctn     INT NOT NULL CHECK (qty_per_ctn > 0),
  cost_per_ctn    NUMERIC(12,2) NOT NULL CHECK (cost_per_ctn >= 0),
  sell_per_ctn    NUMERIC(12,2) NOT NULL CHECK (sell_per_ctn >= 0),
  min_stock_ctn   INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock movements (event-sourced inventory)
CREATE TABLE stock_movements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL CHECK (type IN (
                      'STOCK_RECEIVED','WAREHOUSE_TRANSFER','BRANCH_TRANSFER',
                      'SALE','ADJUSTMENT','RETURN'
                    )),
  product_id        UUID NOT NULL REFERENCES products(id),
  from_location_id  UUID REFERENCES locations(id),
  to_location_id    UUID REFERENCES locations(id),
  qty_ctn           INT NOT NULL,
  cost_per_ctn      NUMERIC(12,2) NOT NULL,
  reference_id      UUID,
  reason            TEXT,
  notes             TEXT,
  created_by        UUID NOT NULL REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_from_loc ON stock_movements(from_location_id);
CREATE INDEX idx_movements_to_loc ON stock_movements(to_location_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at);

-- Inventory levels view (computed from movements)
CREATE VIEW inventory_levels AS
SELECT
  product_id,
  location_id,
  SUM(qty_ctn) AS qty_ctn,
  SUM(qty_ctn) * p.qty_per_ctn AS qty_units,
  SUM(qty_ctn) * p.cost_per_ctn AS cost_value
FROM (
  SELECT product_id, to_location_id AS location_id, qty_ctn
  FROM stock_movements WHERE to_location_id IS NOT NULL
  UNION ALL
  SELECT product_id, from_location_id AS location_id, -qty_ctn
  FROM stock_movements WHERE from_location_id IS NOT NULL
) mv
JOIN products p ON p.id = mv.product_id
GROUP BY product_id, location_id, p.qty_per_ctn, p.cost_per_ctn;

-- Insert sample locations
INSERT INTO locations (name, type) VALUES
  ('Warehouse A', 'WAREHOUSE'),
  ('Warehouse B', 'WAREHOUSE'),
  ('Warehouse C', 'WAREHOUSE'),
  ('Branch 1', 'BRANCH'),
  ('Branch 2', 'BRANCH'),
  ('Branch 3', 'BRANCH');

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES (
  'Admin User',
  'admin@dhako.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeDA8T5sP5VKgczpW',
  'ADMIN'
);

-- Success message
SELECT 'Database initialized successfully! Admin login: admin@dhako.com / admin123' as message;