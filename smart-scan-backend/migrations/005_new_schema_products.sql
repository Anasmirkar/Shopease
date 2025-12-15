-- Migration: Create products table (store-owned inventory)
-- Purpose: Store product data per store with barcode as primary identifier

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  hsn TEXT,                   -- HSN code for GST classification
  tax_rate NUMERIC(4,2),      -- Tax percentage (e.g., 5, 12, 18)
  unit VARCHAR(50),           -- Unit: kg, pcs, ltr, etc
  category TEXT,              -- Product category for organization
  last_synced TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Constraint: Same barcode can exist in different stores
  UNIQUE (store_id, barcode)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Comments for documentation
COMMENT ON TABLE products IS 'Store inventory with barcode as primary identifier';
COMMENT ON COLUMN products.barcode IS 'Product barcode (EAN-13 or internal code) - unique per store';
COMMENT ON COLUMN products.hsn IS 'Harmonized System of Nomenclature code for GST taxation';
COMMENT ON COLUMN products.tax_rate IS 'GST tax rate percentage: 0, 5, 12, 18, 28 for India';
