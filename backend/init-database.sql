-- Dhako Inventory & Business Management — PostgreSQL Schema
-- Principle: inventory is ALWAYS derived from stock_movements (event-sourced).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Locations (warehouses + branches) ────────────────────────────────────────
CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('WAREHOUSE', 'BRANCH')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Users & roles ─────────────────────────────────────────────────────────────
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

-- ── Products ──────────────────────────────────────────────────────────────────
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

-- ── Stock movements (append-only ledger) ──────────────────────────────────────
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

CREATE INDEX idx_movements_product    ON stock_movements(product_id);
CREATE INDEX idx_movements_from_loc   ON stock_movements(from_location_id);
CREATE INDEX idx_movements_to_loc     ON stock_movements(to_location_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at);

-- ── Derived inventory view ─────────────────────────────────────────────────────
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

-- ── Customers ─────────────────────────────────────────────────────────────────
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  location_id UUID REFERENCES locations(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Sales ──────────────────────────────────────────────────────────────────────
CREATE TABLE sales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  customer_id UUID REFERENCES customers(id),
  date        DATE NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sale_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id             UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id),
  qty_ctn             INT NOT NULL CHECK (qty_ctn > 0),
  qty_units           INT NOT NULL,
  sell_price_per_ctn  NUMERIC(12,2) NOT NULL,
  cost_per_ctn_at_sale NUMERIC(12,2) NOT NULL,
  line_revenue        NUMERIC(12,2) GENERATED ALWAYS AS (qty_ctn * sell_price_per_ctn) STORED,
  line_gross_profit   NUMERIC(12,2) GENERATED ALWAYS AS (qty_ctn * (sell_price_per_ctn - cost_per_ctn_at_sale)) STORED
);

CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_sales_location     ON sales(location_id);
CREATE INDEX idx_sales_date         ON sales(date);

-- ── Expenses ───────────────────────────────────────────────────────────────────
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  date        DATE NOT NULL,
  category    TEXT NOT NULL CHECK (category IN (
                'TRANSPORT','ELECTRICITY','RENT','STAFF','FOOD',
                'MAINTENANCE','SUPPLIES','OTHER'
              )),
  description TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_location ON expenses(location_id);
CREATE INDEX idx_expenses_date     ON expenses(date);

-- ── Debts & payments ───────────────────────────────────────────────────────────
CREATE TABLE debts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  location_id     UUID NOT NULL REFERENCES locations(id),
  sale_id         UUID REFERENCES sales(id),
  original_amount NUMERIC(12,2) NOT NULL CHECK (original_amount > 0),
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status          TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','PARTIALLY_PAID','PAID')),
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE debt_payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id     UUID NOT NULL REFERENCES debts(id),
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  notes       TEXT,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Transfers ──────────────────────────────────────────────────────────────────
CREATE TABLE transfers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location_id UUID NOT NULL REFERENCES locations(id),
  to_location_id   UUID NOT NULL REFERENCES locations(id),
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','SENT','RECEIVED','CANCELLED')),
  requested_by     UUID NOT NULL REFERENCES users(id),
  approved_by      UUID REFERENCES users(id),
  sent_at          TIMESTAMPTZ,
  received_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transfer_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  qty_ctn     INT NOT NULL CHECK (qty_ctn > 0)
);

-- ── Branch Transfers ───────────────────────────────────────────────────────────
CREATE TABLE branch_transfers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_warehouse_id UUID NOT NULL REFERENCES locations(id),
  to_branch_id     UUID NOT NULL REFERENCES locations(id),
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','SENT','RECEIVED','CANCELLED')),
  requested_by     UUID NOT NULL REFERENCES users(id),
  approved_by      UUID REFERENCES users(id),
  sent_at          TIMESTAMPTZ,
  received_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE branch_transfer_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES branch_transfers(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  qty_ctn     INT NOT NULL CHECK (qty_ctn > 0)
);

-- ── Analytics views ────────────────────────────────────────────────────────────
CREATE VIEW daily_sales_summary AS
SELECT
  s.location_id,
  s.date,
  COUNT(DISTINCT s.id)           AS num_transactions,
  SUM(si.qty_ctn)                AS total_ctns_sold,
  SUM(si.line_revenue)           AS total_revenue,
  SUM(si.qty_ctn * si.cost_per_ctn_at_sale) AS total_cogs,
  SUM(si.line_gross_profit)      AS total_gross_profit
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
GROUP BY s.location_id, s.date;

CREATE VIEW low_stock_alerts AS
SELECT
  il.product_id,
  il.location_id,
  il.qty_ctn,
  p.min_stock_ctn,
  p.name AS product_name,
  l.name AS location_name,
  l.type AS location_type,
  CASE
    WHEN il.qty_ctn = 0         THEN 'OUT_OF_STOCK'
    WHEN il.qty_ctn <= p.min_stock_ctn THEN 'LOW_STOCK'
  END AS alert_type
FROM inventory_levels il
JOIN products p  ON p.id = il.product_id
JOIN locations l ON l.id = il.location_id
WHERE il.qty_ctn <= p.min_stock_ctn
ORDER BY il.qty_ctn ASC;

-- ── SEED DATA ──────────────────────────────────────────────────────────────────
-- Locations
INSERT INTO locations (name, type) VALUES
  ('Warehouse A', 'WAREHOUSE'),
  ('Warehouse B', 'WAREHOUSE'),
  ('Warehouse C', 'WAREHOUSE'),
  ('Branch 1', 'BRANCH'),
  ('Branch 2', 'BRANCH'),
  ('Branch 3', 'BRANCH');

-- Admin User (password: admin123)
INSERT INTO users (name, email, password_hash, role, location_id) VALUES
  ('Admin User', 'admin@dhako.com', '$2b$10$Ov9CpPfEksmj.kd3Rvt1G.zG/YW7HjBLQAQMV9L5jKJzAG5tG.yoa', 'ADMIN', NULL);

-- Products
INSERT INTO products (name, sku, category, unit, qty_per_ctn, cost_per_ctn, sell_per_ctn, min_stock_ctn, status) VALUES
  ('Coca Cola 330ml', 'CC330', 'Beverages', 'can', 24, 22.00, 30.00, 10, 'ACTIVE'),
  ('Mineral Water 600ml', 'MW600', 'Beverages', 'bottle', 24, 12.00, 18.00, 15, 'ACTIVE'),
  ('Orange Juice 1L', 'OJ1L', 'Beverages', 'carton', 12, 35.00, 48.00, 8, 'ACTIVE'),
  ('Instant Noodles', 'IN001', 'Food', 'pack', 40, 28.00, 38.00, 12, 'ACTIVE'),
  ('Biscuits Assorted', 'BA001', 'Snacks', 'packet', 20, 18.00, 26.00, 8, 'ACTIVE'),
  ('Cooking Oil 1L', 'CO1L', 'Cooking', 'bottle', 12, 55.00, 72.00, 10, 'ACTIVE'),
  ('Sugar 1kg', 'SU1K', 'Cooking', 'bag', 10, 45.00, 58.00, 8, 'ACTIVE'),
  ('Detergent Powder 1kg', 'DP1K', 'Household', 'box', 6, 48.00, 65.00, 5, 'ACTIVE'),
  ('Sardines 425g', 'SA425', 'Food', 'tin', 24, 60.00, 80.00, 8, 'ACTIVE'),
  ('Green Tea 25-bag', 'GT25', 'Beverages', 'box', 12, 30.00, 42.00, 6, 'ACTIVE');
