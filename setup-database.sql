-- ============================================================
-- Scanto Database Setup
-- Run this entire file in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  phone_number TEXT,
  otp_verified BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS guests (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id  text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT NOW()
);

-- ============================================================
-- STORES
-- ============================================================
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

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode    TEXT NOT NULL,
  name       TEXT NOT NULL,
  price      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  category   TEXT,
  brand      TEXT,
  image_url  TEXT,
  weight     NUMERIC(10, 3),
  store_id   UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (barcode, store_id)
);

-- ============================================================
-- CARTS
-- ============================================================
CREATE TABLE IF NOT EXISTS carts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
  store_id     UUID REFERENCES stores(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'checked_out', 'cancelled')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS carts_session_uuid_idx ON carts (session_uuid);

-- ============================================================
-- CART_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id      UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  barcode      TEXT,
  product_name TEXT NOT NULL,
  price        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHECKOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS checkouts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id      UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  cashier_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'completed', 'failed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SHOPPING_HISTORY  (legacy / reporting)
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  receipt_number TEXT,
  store_name     TEXT,
  products       JSONB,
  total_amount   NUMERIC(10, 2),
  payment_method TEXT,
  date           TEXT,
  time           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_history ENABLE ROW LEVEL SECURITY;

-- Public read for stores and products
CREATE POLICY "public read stores"   ON stores   FOR SELECT USING (true);
CREATE POLICY "public read products" ON products FOR SELECT USING (true);

-- Anon can insert/select guests (for guest login)
CREATE POLICY "anon insert guests"   ON guests   FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select guests"   ON guests   FOR SELECT USING (true);

-- Anon can manage users (for Google sign-up/sign-in)
CREATE POLICY "anon insert users"    ON users    FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select users"    ON users    FOR SELECT USING (true);
CREATE POLICY "anon update users"    ON users    FOR UPDATE USING (true);

-- Anon can create and read carts (for checkout flow)
CREATE POLICY "anon insert carts"       ON carts       FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select carts"       ON carts       FOR SELECT USING (true);
CREATE POLICY "anon insert cart_items"  ON cart_items  FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select cart_items"  ON cart_items  FOR SELECT USING (true);

-- Shopping history
CREATE POLICY "anon insert shopping_history" ON shopping_history FOR INSERT WITH CHECK (true);
CREATE POLICY "anon select shopping_history" ON shopping_history FOR SELECT USING (true);
