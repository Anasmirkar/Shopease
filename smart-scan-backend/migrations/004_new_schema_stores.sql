-- Migration: Create stores table (multi-store support)
-- Purpose: Isolate each store's data for multi-store POS deployments

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  gst_number TEXT,
  pos_type TEXT,          -- 'tally', 'goFrugal', 'custom', 'other'
  pos_endpoint TEXT,      -- API endpoint for POS system
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_stores_gst_number ON stores(gst_number);

-- Comments for documentation
COMMENT ON TABLE stores IS 'Represents individual retail stores with their POS configuration';
COMMENT ON COLUMN stores.gst_number IS 'GST Registration Number for tax compliance and billing';
COMMENT ON COLUMN stores.pos_type IS 'Type of POS system used: tally, goFrugal, custom, etc';
COMMENT ON COLUMN stores.pos_endpoint IS 'API endpoint URL if POS system has API integration';
