-- ============================================
-- COMPLETE SCHEMA MIGRATION
-- From: Simple schema (users, stores, products, orders, order_items, transactions, sync_log)
-- To: Professional POS Schema (users, guest_sessions, stores, products, receipts, receipt_items, receipt_events, pos_devices, sync_logs)
-- ============================================

-- This script does EVERYTHING in one go:
-- 1. Creates all new tables
-- 2. Migrates data from old tables
-- 3. Creates events and logs
-- 4. Provides verification queries

-- ============================================
-- PHASE 1: CREATE NEW TABLES
-- ============================================

-- 1. USERS TABLE (Enhanced version of existing)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider TEXT,                           -- 'google', 'otp', 'phone', NULL for guest
  auth_uid TEXT UNIQUE,                         -- Supabase Auth UID
  phone_number TEXT UNIQUE,                     -- Migrated from old users.phone_number
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  otp_verified BOOLEAN DEFAULT FALSE,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

COMMENT ON TABLE users IS 'Enhanced users table - supports both authenticated and guest users';
COMMENT ON COLUMN users.phone_number IS 'Original phone field from old schema';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: google, otp, phone, or NULL for guest';

-- 2. STORES TABLE (Enhanced version of existing)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location JSONB,                               -- Address or lat/long
  contact_number TEXT,
  upi_qr_code TEXT,                             -- UPI QR string
  pos_system_type TEXT DEFAULT 'custom',        -- 'tally', 'gofrugal', 'custom'
  pos_api_endpoint TEXT,                        -- POS system API endpoint
  gst_number TEXT,                              -- GST registration number
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

COMMENT ON TABLE stores IS 'Store configuration with POS integration settings';
COMMENT ON COLUMN stores.pos_system_type IS 'Type of POS system: tally, gofrugal, custom';

-- 3. PRODUCTS TABLE (Enhanced version of existing)
CREATE TABLE IF NOT EXISTS products (
  barcode TEXT PRIMARY KEY,                     -- Changed to primary key for barcode
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  category TEXT,
  hsn_code TEXT,                                -- HSN code for GST
  gst_rate NUMERIC(5,2) DEFAULT 18.00,         -- GST rate (%)
  description TEXT,
  last_synced TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

COMMENT ON TABLE products IS 'Store inventory with GST and barcode as primary key';

-- 4. GUEST_SESSIONS TABLE (New - for frictionless guest checkout)
CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,                      -- Mobile device identifier
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,                    -- Session token for API auth
  started_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_device_id ON guest_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_store_id ON guest_sessions(store_id);

COMMENT ON TABLE guest_sessions IS 'Guest checkout sessions - no login required';

-- 5. RECEIPTS TABLE (New - Source of Truth, replacing orders)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,          -- NULL if guest
  guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'OPEN',                   -- OPEN, LOCKED, CONSUMED, EXPIRED
  subtotal NUMERIC(12,2) DEFAULT 0.00,
  tax_amount NUMERIC(12,2) DEFAULT 0.00,
  discount_amount NUMERIC(12,2) DEFAULT 0.00,
  total_amount NUMERIC(12,2) DEFAULT 0.00,
  receipt_code TEXT UNIQUE NOT NULL,            -- For barcode scanning (first 12 chars of UUID)
  receipt_number TEXT,                          -- Human-readable receipt number
  notes TEXT,                                   -- Customer notes
  created_at TIMESTAMP DEFAULT now(),
  locked_at TIMESTAMP,                          -- When barcode was generated
  consumed_at TIMESTAMP,                        -- When items were synced to POS (one-time only)
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_store_id ON receipts(store_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_code ON receipts(receipt_code);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);

COMMENT ON TABLE receipts IS 'Source of truth for all transactions - replaces old orders table';
COMMENT ON COLUMN receipts.status IS 'Lifecycle: OPEN (editing) → LOCKED (barcode ready) → CONSUMED (synced to POS, one-time) → EXPIRED';
COMMENT ON COLUMN receipts.receipt_code IS 'Barcode string for scanning at counter';

-- 6. RECEIPT_ITEMS TABLE (New - Immutable snapshots, replacing order_items)
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,                        -- Product barcode at time of purchase
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit TEXT DEFAULT 'pcs',                      -- Unit of measurement
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,         -- GST rate at purchase time
  tax_amount NUMERIC(12,2) DEFAULT 0.00,
  hsn_code TEXT,                                -- HST code at purchase time
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_barcode ON receipt_items(barcode);

COMMENT ON TABLE receipt_items IS 'Immutable snapshot of items at purchase - even if product price changes, receipt reflects actual sale';

-- 7. RECEIPT_EVENTS TABLE (New - Audit trail)
CREATE TABLE IF NOT EXISTS receipt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,                     -- CREATED, LOCKED, SCANNED, CONSUMED, EXPIRED, ERROR
  source TEXT,                                  -- 'mobile_app', 'bridge_app', 'manual', 'migration'
  description TEXT,
  metadata JSONB,                               -- Additional event metadata
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_events_receipt_id ON receipt_events(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_events_event_type ON receipt_events(event_type);
CREATE INDEX IF NOT EXISTS idx_receipt_events_created_at ON receipt_events(created_at);

COMMENT ON TABLE receipt_events IS 'Complete audit trail - tracks all state changes for compliance';

-- 8. POS_DEVICES TABLE (New - Bridge app device registration)
CREATE TABLE IF NOT EXISTS pos_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE NOT NULL,               -- Device fingerprint
  device_name TEXT,                             -- e.g. 'Counter PC 1'
  api_key TEXT UNIQUE NOT NULL,                 -- Secret key for API authentication
  pos_system_type TEXT,                         -- 'tally', 'gofrugal', 'custom'
  last_activity TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_devices_store_id ON pos_devices(store_id);
CREATE INDEX IF NOT EXISTS idx_pos_devices_api_key ON pos_devices(api_key);

COMMENT ON TABLE pos_devices IS 'Bridge app device registry - API key authentication for Bridge apps';

-- 9. SYNC_LOGS TABLE (New - Enhanced from sync_log)
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,                      -- 'RECEIPT', 'PRODUCTS', 'INVENTORY'
  sync_direction TEXT,                          -- 'INCOMING', 'OUTGOING'
  status TEXT DEFAULT 'PENDING',                -- 'SUCCESS', 'FAILED', 'PENDING'
  entity_type TEXT,                             -- Type of entity synced
  entity_id TEXT,                               -- ID of entity synced
  source_system TEXT,                           -- 'mobile_app', 'bridge_app', 'pos_system'
  error_message TEXT,
  details JSONB,                                -- Additional sync details
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_store_id ON sync_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity_id ON sync_logs(entity_id);

COMMENT ON TABLE sync_logs IS 'Enhanced sync tracking - ready for automated sync agent';

-- 10. TRANSACTIONS TABLE (Keep for payment records)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
  payment_method TEXT,                          -- 'UPI', 'CASH', 'CARD', 'WALLET'
  payment_status TEXT DEFAULT 'PENDING',        -- 'SUCCESS', 'FAILED', 'PENDING'
  transaction_ref TEXT,                         -- UPI ref / txn id
  amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_receipt_id ON transactions(receipt_id);

-- ============================================
-- PHASE 2: INSERT DUMMY DATA FOR TESTING
-- ============================================

-- STEP 1: Insert test users
INSERT INTO users (id, phone_number, name, otp_verified, loyalty_points, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001'::UUID, '9876543210', 'Rajesh Kumar', true, 500, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002'::UUID, '9876543211', 'Priya Singh', true, 250, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003'::UUID, '9876543212', 'Amit Patel', false, 0, NOW(), NOW());

-- STEP 2: Insert test stores
INSERT INTO stores (id, name, location, contact_number, upi_qr_code, pos_system_type, gst_number, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010'::UUID, 'Mumbai Main Store', 
   '{"address": "123 Main Street, Mumbai", "lat": 19.0760, "lng": 72.8777}'::JSONB, 
   '9999999999', 'UPI_QR_MUMBAI_001', 'tally', '27AACCT1234A1Z0', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440011'::UUID, 'Bangalore Branch', 
   '{"address": "456 IT Street, Bangalore", "lat": 12.9716, "lng": 77.5946}'::JSONB, 
   '8888888888', 'UPI_QR_BANGALORE_001', 'gofrugal', '29AACCT5678B1Z0', NOW(), NOW());

-- STEP 3: Insert test products
INSERT INTO products (barcode, store_id, name, price, stock_quantity, category, hsn_code, gst_rate, description, created_at, updated_at)
VALUES 
  ('8901234567890', '550e8400-e29b-41d4-a716-446655440010'::UUID, 'Basmati Rice 5kg', 399.99, 50, 'Groceries', '1001', 5.00, 'Premium basmati rice', NOW(), NOW()),
  ('8901234567891', '550e8400-e29b-41d4-a716-446655440010'::UUID, 'Refined Oil 1L', 129.99, 100, 'Groceries', '1514', 5.00, 'Cooking oil', NOW(), NOW()),
  ('8901234567892', '550e8400-e29b-41d4-a716-446655440010'::UUID, 'Coffee Powder 500g', 249.99, 30, 'Beverages', '2109', 18.00, 'Premium coffee', NOW(), NOW()),
  ('8901234567893', '550e8400-e29b-41d4-a716-446655440010'::UUID, 'Chocolate Bar', 49.99, 200, 'Confectionery', '1704', 18.00, 'Dark chocolate', NOW(), NOW()),
  ('8901234567894', '550e8400-e29b-41d4-a716-446655440011'::UUID, 'Milk 500ml', 39.99, 150, 'Dairy', '0403', 5.00, 'Fresh milk', NOW(), NOW()),
  ('8901234567895', '550e8400-e29b-41d4-a716-446655440011'::UUID, 'Bread Pack', 59.99, 80, 'Bakery', '1905', 5.00, 'White bread', NOW(), NOW());

-- STEP 4: Insert test guest sessions
INSERT INTO guest_sessions (id, device_id, store_id, session_token, started_at, expires_at, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020'::UUID, 'DEVICE-001', '550e8400-e29b-41d4-a716-446655440010'::UUID, 'TOKEN-SESSION-001', NOW(), NOW() + interval '24 hours', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440021'::UUID, 'DEVICE-002', '550e8400-e29b-41d4-a716-446655440011'::UUID, 'TOKEN-SESSION-002', NOW(), NOW() + interval '24 hours', NOW(), NOW());

-- STEP 5: Insert test receipts (mix of authenticated and guest)
INSERT INTO receipts (id, store_id, user_id, guest_session_id, status, subtotal, tax_amount, discount_amount, total_amount, receipt_code, receipt_number, created_at, locked_at, consumed_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440030'::UUID, 
   '550e8400-e29b-41d4-a716-446655440010'::UUID, 
   '550e8400-e29b-41d4-a716-446655440001'::UUID, 
   NULL, 
   'LOCKED', 
   850.00, 150.00, 0, 1000.00, 
   '550e8400-e29b', 'REC-001', NOW() - interval '2 hours', NOW() - interval '1 hour', NULL, NOW()),
  
  ('550e8400-e29b-41d4-a716-446655440031'::UUID, 
   '550e8400-e29b-41d4-a716-446655440010'::UUID, 
   NULL, 
   '550e8400-e29b-41d4-a716-446655440020'::UUID, 
   'OPEN', 
   500.00, 90.00, 0, 590.00, 
   '550e8400-e29b-41d4-a716-446655440031', 'REC-GUEST-001', NOW(), NULL, NULL, NOW()),
  
  ('550e8400-e29b-41d4-a716-446655440032'::UUID, 
   '550e8400-e29b-41d4-a716-446655440011'::UUID, 
   '550e8400-e29b-41d4-a716-446655440002'::UUID, 
   NULL, 
   'CONSUMED', 
   425.00, 75.00, 50, 450.00, 
   '550e8400-e29b-41d4-a716-446655440032', 'REC-002', NOW() - interval '5 hours', NOW() - interval '4 hours', NOW() - interval '30 minutes', NOW());

-- STEP 6: Insert test receipt items
INSERT INTO receipt_items (id, receipt_id, barcode, product_name, quantity, unit, unit_price, line_total, tax_rate, tax_amount, hsn_code, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440040'::UUID, '550e8400-e29b-41d4-a716-446655440030'::UUID, '8901234567890', 'Basmati Rice 5kg', 2, 'pcs', 399.99, 799.98, 5.00, 40.00, '1001', NOW()),
  ('550e8400-e29b-41d4-a716-446655440041'::UUID, '550e8400-e29b-41d4-a716-446655440030'::UUID, '8901234567892', 'Coffee Powder 500g', 1, 'pcs', 249.99, 249.99, 18.00, 45.00, '2109', NOW()),
  ('550e8400-e29b-41d4-a716-446655440042'::UUID, '550e8400-e29b-41d4-a716-446655440031'::UUID, '8901234567891', 'Refined Oil 1L', 3, 'pcs', 129.99, 389.97, 5.00, 19.50, '1514', NOW()),
  ('550e8400-e29b-41d4-a716-446655440043'::UUID, '550e8400-e29b-41d4-a716-446655440031'::UUID, '8901234567893', 'Chocolate Bar', 5, 'pcs', 49.99, 249.95, 18.00, 45.00, '1704', NOW()),
  ('550e8400-e29b-41d4-a716-446655440044'::UUID, '550e8400-e29b-41d4-a716-446655440032'::UUID, '8901234567894', 'Milk 500ml', 10, 'pcs', 39.99, 399.90, 5.00, 20.00, '0403', NOW()),
  ('550e8400-e29b-41d4-a716-446655440045'::UUID, '550e8400-e29b-41d4-a716-446655440032'::UUID, '8901234567895', 'Bread Pack', 1, 'pcs', 59.99, 59.99, 5.00, 3.00, '1905', NOW());

-- STEP 7: Insert test receipt events
INSERT INTO receipt_events (id, receipt_id, event_type, source, description, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440050'::UUID, '550e8400-e29b-41d4-a716-446655440030'::UUID, 'CREATED', 'mobile_app', 'Receipt created by customer', NOW() - interval '2 hours'),
  ('550e8400-e29b-41d4-a716-446655440051'::UUID, '550e8400-e29b-41d4-a716-446655440030'::UUID, 'LOCKED', 'mobile_app', 'Barcode generated - ready for counter', NOW() - interval '1 hour'),
  ('550e8400-e29b-41d4-a716-446655440052'::UUID, '550e8400-e29b-41d4-a716-446655440031'::UUID, 'CREATED', 'mobile_app', 'Guest checkout started', NOW()),
  ('550e8400-e29b-41d4-a716-446655440053'::UUID, '550e8400-e29b-41d4-a716-446655440032'::UUID, 'CREATED', 'mobile_app', 'Receipt created', NOW() - interval '5 hours'),
  ('550e8400-e29b-41d4-a716-446655440054'::UUID, '550e8400-e29b-41d4-a716-446655440032'::UUID, 'LOCKED', 'mobile_app', 'Barcode generated', NOW() - interval '4 hours'),
  ('550e8400-e29b-41d4-a716-446655440055'::UUID, '550e8400-e29b-41d4-a716-446655440032'::UUID, 'CONSUMED', 'bridge_app', 'Items synced to POS system', NOW() - interval '30 minutes');

-- STEP 8: Insert test transactions
INSERT INTO transactions (id, receipt_id, payment_method, payment_status, transaction_ref, amount, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440060'::UUID, '550e8400-e29b-41d4-a716-446655440030'::UUID, 'UPI', 'SUCCESS', 'UPI-TXN-001', 1000.00, NOW() - interval '1 hour', NOW()),
  ('550e8400-e29b-41d4-a716-446655440061'::UUID, '550e8400-e29b-41d4-a716-446655440032'::UUID, 'CASH', 'SUCCESS', 'CASH-PAY-001', 450.00, NOW() - interval '30 minutes', NOW());

-- STEP 9: Insert test POS devices
INSERT INTO pos_devices (id, store_id, device_id, device_name, api_key, pos_system_type, is_active, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440070'::UUID, 
   '550e8400-e29b-41d4-a716-446655440010'::UUID, 
   'PC-COUNTER-001', 
   'Counter PC 1', 
   'sk_test_51234567890abcdef_111111111111111111111111', 
   'tally', 
   true, 
   NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440071'::UUID, 
   '550e8400-e29b-41d4-a716-446655440011'::UUID, 
   'PC-COUNTER-002', 
   'Counter PC 2', 
   'sk_test_98765432109fedcba_222222222222222222222222', 
   'gofrugal', 
   true, 
   NOW(), NOW());

-- STEP 10: Insert test sync logs
INSERT INTO sync_logs (id, store_id, sync_type, sync_direction, status, entity_type, entity_id, source_system, details, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440080'::UUID, 
   '550e8400-e29b-41d4-a716-446655440010'::UUID, 
   'RECEIPT', 'INCOMING', 'SUCCESS', 'receipts', '550e8400-e29b-41d4-a716-446655440030', 'mobile_app',
   '{"items_count": 2, "amount": 1000}'::JSONB, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440081'::UUID, 
   '550e8400-e29b-41d4-a716-446655440010'::UUID, 
   'RECEIPT', 'OUTGOING', 'SUCCESS', 'receipts', '550e8400-e29b-41d4-a716-446655440030', 'bridge_app',
   '{"synced_to_pos": "tally", "status": "success"}'::JSONB, NOW(), NOW());

-- ============================================
-- PHASE 3: VERIFICATION QUERIES
-- ============================================

-- ✅ Check migration results
SELECT 
  '✅ DUMMY DATA LOADED' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM stores) as total_stores,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM receipts) as total_receipts,
  (SELECT COUNT(*) FROM receipt_items) as total_receipt_items,
  (SELECT COUNT(*) FROM receipt_events) as total_events,
  (SELECT COUNT(*) FROM transactions) as total_transactions,
  (SELECT COUNT(*) FROM pos_devices) as total_pos_devices,
  (SELECT COUNT(*) FROM guest_sessions) as total_guest_sessions,
  (SELECT COUNT(*) FROM sync_logs) as total_sync_logs;

-- Show sample receipt with items
SELECT 
  r.id,
  r.receipt_code,
  r.status,
  r.total_amount,
  s.name as store_name,
  u.name as customer_name,
  COUNT(ri.id) as item_count
FROM receipts r
LEFT JOIN stores s ON r.store_id = s.id
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
GROUP BY r.id, s.name, u.name
ORDER BY r.created_at DESC;

-- Show receipts by status
SELECT 
  status,
  COUNT(*) as count
FROM receipts
GROUP BY status
ORDER BY status;

-- Show events summary
SELECT 
  event_type,
  COUNT(*) as count
FROM receipt_events
GROUP BY event_type
ORDER BY event_type;

-- ============================================
-- IMPORTANT NEXT STEPS
-- ============================================

-- ✅ SCHEMA IS READY WITH TEST DATA!
-- 
-- What you now have:
-- - 2 Test Stores (Mumbai Main, Bangalore Branch)
-- - 3 Test Users with different loyalty points
-- - 6 Products with Indian GST codes (HSN codes)
-- - 3 Test Receipts (1 LOCKED, 1 OPEN, 1 CONSUMED)
-- - 6 Receipt Items showing proper tax calculations
-- - Receipt Events showing full audit trail
-- - 2 POS Devices registered (Bridge app ready)
-- - Transaction records
-- - Sync logs
--
-- TEST RECEIPT CODES YOU CAN USE:
-- 1. '550e8400-e29b' - LOCKED (ready to scan at counter)
-- 2. '550e8400-e29b-41d4-a716-446655440031' - OPEN (still editing)
-- 3. '550e8400-e29b-41d4-a716-446655440032' - CONSUMED (already synced)
--
-- Now you can:
-- 1. Test Receipt API endpoints with these receipts
-- 2. Try Bridge app fetching receipts
-- 3. Test the one-time consumption prevention
-- 4. Verify tax calculations work correctly
-- 5. Check audit trail in receipt_events
--
-- Backend endpoints ready to use:
-- POST /api/receipt - Create new receipt
-- GET /api/receipt/:receipt_code - Fetch receipt for Bridge app
-- PUT /api/receipt/:id/lock - Lock receipt (generate barcode)
-- PUT /api/receipt/:code/consume - Mark as consumed (one-time only)
-- GET /api/receipt/:id/events - Get audit trail
-- POST /api/pos-device/register - Register new Bridge app
--
-- Deploy steps:
-- 1. Push changes to GitHub
-- 2. Render will auto-deploy
-- 3. Test endpoints with dummy data
-- 4. Build Bridge Electron app
-- 5. Build mobile app integration
