-- Migration: Create receipts table (source of truth)
-- Purpose: Store receipt/order data with lifecycle states for POS integration

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
  
  status TEXT NOT NULL CHECK (status IN ('OPEN','LOCKED','CONSUMED','EXPIRED')),
  
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  
  receipt_code TEXT UNIQUE NOT NULL,    -- What barcode encodes (12-15 chars)
  receipt_number TEXT,                   -- Human-readable receipt number
  
  created_at TIMESTAMP DEFAULT now(),
  locked_at TIMESTAMP,                   -- When barcode was generated
  consumed_at TIMESTAMP,                 -- When scanned at counter
  expired_at TIMESTAMP,
  
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_receipts_store_id ON receipts(store_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_code ON receipts(receipt_code);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_guest_session_id ON receipts(guest_session_id);

-- Comments for documentation
COMMENT ON TABLE receipts IS 'Source of truth for all transactions - one receipt per checkout';
COMMENT ON COLUMN receipts.status IS 'Lifecycle: OPEN (editing) → LOCKED (barcode generated) → CONSUMED (scanned at POS) → EXPIRED';
COMMENT ON COLUMN receipts.receipt_code IS 'Encoded in barcode - used for quick lookup at POS counter';
COMMENT ON COLUMN receipts.locked_at IS 'Timestamp when barcode generated - prevents double billing';
COMMENT ON COLUMN receipts.consumed_at IS 'Timestamp when scanned at counter - tracks POS entry point';
