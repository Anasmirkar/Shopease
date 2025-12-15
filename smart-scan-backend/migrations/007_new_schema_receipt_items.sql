-- Migration: Create receipt_items table (immutable snapshot)
-- Purpose: Store individual line items with immutable snapshot of product details at time of purchase

CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  
  -- Snapshot of product at time of purchase (immutable)
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit VARCHAR(50),
  unit_price NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  
  -- Tax information
  tax_rate NUMERIC(4,2),
  tax_amount NUMERIC(10,2),
  
  -- HSN for GST
  hsn_code TEXT,
  
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_barcode ON receipt_items(barcode);

-- Comments for documentation
COMMENT ON TABLE receipt_items IS 'Immutable snapshot of items at time of purchase - even if product price changes later';
COMMENT ON COLUMN receipt_items.barcode IS 'Product barcode - used for POS lookup and GST categorization';
COMMENT ON COLUMN receipt_items.product_name IS 'Snapshot of product name - what customer sees on receipt';
COMMENT ON COLUMN receipt_items.unit_price IS 'Price at time of purchase - for audit trail and dispute resolution';
COMMENT ON COLUMN receipt_items.hsn_code IS 'HSN code snapshot - for GST compliance and tax calculation';
