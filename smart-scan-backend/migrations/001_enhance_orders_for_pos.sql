-- Migration: Enhance orders and order_items tables for POS Bridge integration
-- Purpose: Store complete product details and GST information for fast POS entry

-- 1. Enhance order_items table to include all product details needed by POS
-- Product identification
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_hsn_code VARCHAR(20);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);

-- Quantity and measurements
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_of_measurement VARCHAR(50);

-- Tax information
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2);

-- Pricing
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total DECIMAL(12,2);

-- POS metadata
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pos_item_code VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pos_sync_status VARCHAR(50) DEFAULT 'pending';

-- 2. Enhance orders table to include store and GST details
-- Store information
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_gst_number VARCHAR(50);

-- Tax calculation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;

-- Tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS barcode_scanned_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scanned_by_counter_staff VARCHAR(255);

-- POS metadata
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pos_synced BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pos_sync_timestamp TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pos_transaction_id VARCHAR(255);

-- 3. Create index on barcode for fast lookup
CREATE INDEX IF NOT EXISTS idx_orders_barcode_number 
ON orders(id);

-- 4. Create index on order status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

-- 5. Create index on pos_sync_status for bridge queries
CREATE INDEX IF NOT EXISTS idx_order_items_pos_sync_status 
ON order_items(pos_sync_status);

-- Migration info
-- Run this migration using: node run-migrations.js
-- Expected outcome: order_items and orders tables enhanced with POS-required fields
