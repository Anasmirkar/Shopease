-- ============================================
-- SCHEMA MIGRATION: Old Orders → New Receipts
-- Purpose: Safely migrate existing order data to new receipt structure
-- ============================================

-- STEP 1: Create users from old orders (if users don't exist yet)
INSERT INTO users (id, name, phone, created_at)
SELECT DISTINCT 
  COALESCE(u.id, gen_random_uuid()),
  'Guest User',
  'unknown',
  now()
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = o.user_id)
  AND o.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Create guest sessions for orders without user_id
INSERT INTO guest_sessions (id, device_id, store_id, started_at, created_at)
SELECT 
  gen_random_uuid(),
  'migrated-' || o.id::text,
  o.store_id,
  o.created_at,
  o.created_at
FROM orders o
WHERE o.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM guest_sessions 
    WHERE device_id = 'migrated-' || o.id::text
  )
ON CONFLICT DO NOTHING;

-- STEP 3: Migrate orders to receipts
INSERT INTO receipts (
  id,
  store_id,
  user_id,
  guest_session_id,
  status,
  total_amount,
  subtotal,
  tax_amount,
  discount_amount,
  receipt_code,
  receipt_number,
  created_at,
  locked_at,
  consumed_at,
  updated_at
)
SELECT
  o.id,
  o.store_id,
  CASE WHEN o.user_id IS NOT NULL THEN o.user_id ELSE NULL END,
  CASE WHEN o.user_id IS NULL THEN gs.id ELSE NULL END,
  CASE 
    WHEN o.status = 'confirmed' THEN 'LOCKED'
    WHEN o.status = 'pending' THEN 'OPEN'
    WHEN o.status = 'completed' THEN 'CONSUMED'
    ELSE 'OPEN'
  END,
  o.total_amount,
  COALESCE(o.subtotal, o.total_amount),
  COALESCE(o.tax_amount, 0),
  COALESCE(o.discount_amount, 0),
  -- Generate receipt code from order ID (first 12 chars without hyphens)
  (o.id::text || '-' || to_char(now(), 'YYYYMMDDHHmmss'))::varchar,
  o.id::text,
  o.created_at,
  CASE WHEN o.status IN ('confirmed', 'completed') THEN o.created_at ELSE NULL END,
  CASE WHEN o.status = 'completed' THEN o.created_at ELSE NULL END,
  now()
FROM orders o
LEFT JOIN guest_sessions gs ON gs.device_id = 'migrated-' || o.id::text
WHERE NOT EXISTS (SELECT 1 FROM receipts WHERE id = o.id)
ON CONFLICT (id) DO NOTHING;

-- STEP 4: Migrate order items to receipt items
INSERT INTO receipt_items (
  id,
  receipt_id,
  barcode,
  product_name,
  quantity,
  unit,
  unit_price,
  line_total,
  tax_rate,
  tax_amount,
  hsn_code,
  created_at
)
SELECT
  oi.id,
  oi.order_id,
  oi.product_sku,
  oi.product_name,
  oi.quantity,
  COALESCE(oi.unit_of_measurement, 'pcs'),
  oi.unit_price,
  oi.line_total,
  COALESCE(oi.gst_rate, 18),
  oi.tax_amount,
  oi.product_hsn_code,
  oi.created_at
FROM order_items oi
WHERE NOT EXISTS (SELECT 1 FROM receipt_items WHERE id = oi.id)
  AND oi.order_id IN (SELECT id FROM receipts)
ON CONFLICT (id) DO NOTHING;

-- STEP 5: Create receipt events from order history
-- Log CREATED event for all receipts
INSERT INTO receipt_events (id, receipt_id, event_type, source, description, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'CREATED',
  'migration',
  'Receipt created from order during schema migration',
  r.created_at
FROM receipts r
WHERE NOT EXISTS (
  SELECT 1 FROM receipt_events 
  WHERE receipt_id = r.id AND event_type = 'CREATED'
)
ON CONFLICT DO NOTHING;

-- Log LOCKED event for confirmed/completed orders
INSERT INTO receipt_events (id, receipt_id, event_type, source, description, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'LOCKED',
  'migration',
  'Receipt locked (barcode ready)',
  r.locked_at
FROM receipts r
WHERE r.locked_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM receipt_events 
    WHERE receipt_id = r.id AND event_type = 'LOCKED'
  )
ON CONFLICT DO NOTHING;

-- Log CONSUMED event for completed orders
INSERT INTO receipt_events (id, receipt_id, event_type, source, description, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'CONSUMED',
  'migration',
  'Receipt consumed (items synced to POS)',
  r.consumed_at
FROM receipts r
WHERE r.consumed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM receipt_events 
    WHERE receipt_id = r.id AND event_type = 'CONSUMED'
  )
ON CONFLICT DO NOTHING;

-- STEP 6: Create sync logs for all migrated orders
INSERT INTO sync_logs (id, store_id, sync_type, sync_direction, status, entity_type, entity_id, details, synced_at, created_at)
SELECT
  gen_random_uuid(),
  r.store_id,
  'RECEIPT',
  'INCOMING',
  'SUCCESS',
  'receipts',
  r.id::text,
  jsonb_build_object(
    'migrated_from', 'orders',
    'original_order_id', r.id::text,
    'items_count', (SELECT COUNT(*) FROM receipt_items WHERE receipt_id = r.id),
    'total_amount', r.total_amount
  ),
  now(),
  now()
FROM receipts r
WHERE NOT EXISTS (
  SELECT 1 FROM sync_logs 
  WHERE entity_id = r.id::text AND sync_type = 'RECEIPT'
)
ON CONFLICT DO NOTHING;

-- STEP 7: Verify migration
-- Count statistics
SELECT 
  (SELECT COUNT(*) FROM receipts) as total_receipts,
  (SELECT COUNT(*) FROM receipt_items) as total_items,
  (SELECT COUNT(*) FROM receipt_events) as total_events,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM guest_sessions) as total_guest_sessions,
  (SELECT COUNT(*) FROM sync_logs WHERE sync_type = 'RECEIPT') as migration_logs;

-- ============================================
-- ⚠️ IMPORTANT: After running this script
-- ============================================
-- 1. Verify counts match above
-- 2. Check receipt_events for completeness
-- 3. Test Bridge app with migrated receipts
-- 4. Archive old orders table (don't delete!)
-- 5. Update application code to use receipts table
-- 6. Deploy updated backend

-- ============================================
-- BACKUP: Archive old tables (optional)
-- ============================================
-- ALTER TABLE orders RENAME TO orders_archived;
-- ALTER TABLE order_items RENAME TO order_items_archived;
-- ALTER TABLE shopping_history RENAME TO shopping_history_archived;

-- ============================================
-- ROLLBACK: If something goes wrong
-- ============================================
-- DELETE FROM sync_logs WHERE sync_type = 'RECEIPT' AND created_at > '2025-12-15'::timestamp;
-- DELETE FROM receipt_events WHERE created_at > '2025-12-15'::timestamp;
-- DELETE FROM receipt_items WHERE created_at > '2025-12-15'::timestamp;
-- DELETE FROM receipts WHERE created_at > '2025-12-15'::timestamp;
-- DELETE FROM guest_sessions WHERE device_id LIKE 'migrated-%';
