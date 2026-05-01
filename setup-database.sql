-- ============================================================
-- Scanto Database Setup
-- Safe to run multiple times — fully idempotent
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  phone_number TEXT,
  otp_verified BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  address    TEXT,
  city       TEXT,
  state      TEXT,
  pincode    TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode    TEXT NOT NULL,
  name       TEXT NOT NULL,
  price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  category   TEXT,
  brand      TEXT,
  image_url  TEXT,
  weight     NUMERIC(10,3),
  store_id   UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (barcode, store_id)
);

CREATE TABLE IF NOT EXISTS store_products (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (store_id, product_id)
);

CREATE TABLE IF NOT EXISTS carts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
  store_id     UUID REFERENCES stores(id) ON DELETE SET NULL,
  user_id      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','checked_out','cancelled')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS carts_session_uuid_idx ON carts (session_uuid);

CREATE TABLE IF NOT EXISTS cart_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id      UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  barcode      TEXT,
  product_name TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkouts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id      UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  cashier_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','completed','failed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        TEXT,
  receipt_number TEXT,
  store_name     TEXT,
  products       JSONB,
  total_amount   NUMERIC(10,2),
  payment_method TEXT,
  date           TEXT,
  time           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MIGRATIONS — fix existing tables if already deployed
-- ============================================================

-- 1. Change carts.user_id from UUID to TEXT (for guest IDs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name  = 'carts'
      AND column_name = 'user_id'
      AND data_type   = 'uuid'
  ) THEN
    ALTER TABLE carts DROP CONSTRAINT IF EXISTS carts_user_id_fkey;
    ALTER TABLE carts ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- 2. Remove duplicate stores (keep oldest row per name), then add UNIQUE constraint
DO $$
BEGIN
  -- Delete duplicates, keeping the earliest created row per name
  DELETE FROM stores
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id::text) AS rn
      FROM stores
    ) ranked
    WHERE rn > 1
  );

  -- Now add the constraint if it doesn't exist yet
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'stores'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'stores_name_unique'
  ) THEN
    ALTER TABLE stores ADD CONSTRAINT stores_name_unique UNIQUE (name);
  END IF;
END $$;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read stores"              ON stores;
DROP POLICY IF EXISTS "public read products"            ON products;
DROP POLICY IF EXISTS "public read store_products"      ON store_products;
DROP POLICY IF EXISTS "anon insert store_products"      ON store_products;
DROP POLICY IF EXISTS "anon insert guests"              ON guests;
DROP POLICY IF EXISTS "anon select guests"              ON guests;
DROP POLICY IF EXISTS "anon insert users"               ON users;
DROP POLICY IF EXISTS "anon select users"               ON users;
DROP POLICY IF EXISTS "anon update users"               ON users;
DROP POLICY IF EXISTS "anon insert carts"               ON carts;
DROP POLICY IF EXISTS "anon select carts"               ON carts;
DROP POLICY IF EXISTS "anon insert cart_items"          ON cart_items;
DROP POLICY IF EXISTS "anon select cart_items"          ON cart_items;
DROP POLICY IF EXISTS "anon insert shopping_history"    ON shopping_history;
DROP POLICY IF EXISTS "anon select shopping_history"    ON shopping_history;

CREATE POLICY "public read stores"           ON stores           FOR SELECT USING (true);
CREATE POLICY "public read products"         ON products         FOR SELECT USING (true);
CREATE POLICY "public read store_products"   ON store_products   FOR SELECT USING (true);
CREATE POLICY "anon insert store_products"   ON store_products   FOR INSERT WITH CHECK (true);
CREATE POLICY "anon insert guests"           ON guests           FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select guests"           ON guests           FOR SELECT USING (true);
CREATE POLICY "anon insert users"            ON users            FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select users"            ON users            FOR SELECT USING (true);
CREATE POLICY "anon update users"            ON users            FOR UPDATE USING (true);
CREATE POLICY "anon insert carts"            ON carts            FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select carts"            ON carts            FOR SELECT USING (true);
CREATE POLICY "anon insert cart_items"       ON cart_items       FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select cart_items"       ON cart_items       FOR SELECT USING (true);
CREATE POLICY "anon insert shopping_history" ON shopping_history FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select shopping_history" ON shopping_history FOR SELECT USING (true);

-- ============================================================
-- SEED — Stores  (WHERE NOT EXISTS — no constraint needed)
-- ============================================================
INSERT INTO stores (name, address, phone)
SELECT v.name, v.address, v.phone
FROM (VALUES
  ('Scanto Demo Store', 'Shop No 1, Main Market, Dapoli, Maharashtra 415712', '9876543210'),
  ('Fresh Mart Dapoli', 'Near Bus Stand, Dapoli, Ratnagiri 415712',           '9823456789'),
  ('Super Bazaar',      'Market Road, Chiplun, Ratnagiri 415605',             '9812345678')
) AS v(name, address, phone)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE stores.name = v.name);

-- ============================================================
-- SEED — Products per store
-- ============================================================

-- SCANTO DEMO STORE — daily groceries (standard price)
INSERT INTO products (barcode, name, price, category, brand, weight, store_id)
SELECT v.barcode, v.name, v.price, v.category, v.brand, v.weight, s.id
FROM stores s
CROSS JOIN (VALUES
  ('8901058000227', 'Amul Butter 100g',            55.00, 'Dairy',         'Amul',      0.100),
  ('8901063116017', 'Britannia Good Day 75g',       35.00, 'Biscuits',      'Britannia', 0.075),
  ('8901058010615', 'Maggi Noodles 70g',            14.00, 'Instant Food',  'Nestle',    0.070),
  ('8901288000027', 'Tata Salt 1kg',                24.00, 'Grocery',       'Tata',      1.000),
  ('8901314004745', 'Colgate Toothpaste 200g',     119.00, 'Personal Care', 'Colgate',   0.200),
  ('8901030000027', 'Lifebuoy Soap 100g',           42.00, 'Personal Care', 'Lifebuoy',  0.100),
  ('8902912000021', 'Haldirams Aloo Bhujia 150g',   60.00, 'Snacks',        'Haldirams', 0.150),
  ('7622210100498', 'Dairy Milk Chocolate 40g',     50.00, 'Confectionery', 'Cadbury',   0.040)
) AS v(barcode, name, price, category, brand, weight)
WHERE s.name = 'Scanto Demo Store'
ON CONFLICT (barcode, store_id) DO NOTHING;

-- FRESH MART DAPOLI — personal care & staples (+5% markup)
INSERT INTO products (barcode, name, price, category, brand, weight, store_id)
SELECT v.barcode, v.name, ROUND((v.price * 1.05)::numeric, 2), v.category, v.brand, v.weight, s.id
FROM stores s
CROSS JOIN (VALUES
  ('8901058000227', 'Amul Butter 100g',          55.00, 'Dairy',         'Amul',     0.100),
  ('8901288000027', 'Tata Salt 1kg',              24.00, 'Grocery',       'Tata',     1.000),
  ('8710908539229', 'Surf Excel Detergent 500g',  95.00, 'Household',     'HUL',      0.500),
  ('8901030000027', 'Lifebuoy Soap 100g',         42.00, 'Personal Care', 'Lifebuoy', 0.100),
  ('8901396451944', 'Dettol Handwash 200ml',      95.00, 'Personal Care', 'Dettol',   0.200),
  ('8901063101679', 'Aashirvaad Atta 5kg',       225.00, 'Grocery',       'ITC',      5.000),
  ('8901396030118', 'Sunflower Oil 1L',          145.00, 'Cooking Oil',   'Sundrop',  1.000),
  ('8901030810013', 'Vim Dishwash Bar 200g',      28.00, 'Household',     'HUL',      0.200)
) AS v(barcode, name, price, category, brand, weight)
WHERE s.name = 'Fresh Mart Dapoli'
ON CONFLICT (barcode, store_id) DO NOTHING;

-- SUPER BAZAAR — snacks & variety (3% discount)
INSERT INTO products (barcode, name, price, category, brand, weight, store_id)
SELECT v.barcode, v.name, ROUND((v.price * 0.97)::numeric, 2), v.category, v.brand, v.weight, s.id
FROM stores s
CROSS JOIN (VALUES
  ('8901063116017', 'Britannia Good Day 75g',      35.00, 'Biscuits',      'Britannia', 0.075),
  ('8904259900038', 'Parle-G Biscuits 200g',       20.00, 'Biscuits',      'Parle',     0.200),
  ('8901058010615', 'Maggi Noodles 70g',           14.00, 'Instant Food',  'Nestle',    0.070),
  ('8901491102345', 'Lays Classic Salted 26g',     20.00, 'Snacks',        'Pepsico',   0.026),
  ('8902912000021', 'Haldirams Aloo Bhujia 150g',  60.00, 'Snacks',        'Haldirams', 0.150),
  ('7622210100498', 'Dairy Milk Chocolate 40g',    50.00, 'Confectionery', 'Cadbury',   0.040),
  ('8901314004745', 'Colgate Toothpaste 200g',    119.00, 'Personal Care', 'Colgate',   0.200),
  ('8901063101679', 'Aashirvaad Atta 5kg',        225.00, 'Grocery',       'ITC',       5.000)
) AS v(barcode, name, price, category, brand, weight)
WHERE s.name = 'Super Bazaar'
ON CONFLICT (barcode, store_id) DO NOTHING;

-- ============================================================
-- SEED — store_products join table
-- ============================================================
INSERT INTO store_products (store_id, product_id, price)
SELECT s.id, p.id, p.price
FROM stores s
JOIN products p ON p.store_id = s.id
ON CONFLICT (store_id, product_id) DO NOTHING;
