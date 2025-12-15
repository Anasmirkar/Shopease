-- Migration: Create sync_logs table (data synchronization tracking)
-- Purpose: Track product syncs, price updates, and inventory changes for future sync agent

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL,     -- PRODUCT, PRICE, INVENTORY, RECEIPT
  sync_direction TEXT,         -- INCOMING, OUTGOING
  status TEXT,                 -- PENDING, SUCCESS, FAILED
  
  -- What was synced
  entity_type TEXT,            -- products, prices, inventory, receipts
  entity_id TEXT,
  
  details TEXT,
  error_message TEXT,          -- If status is FAILED
  
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_logs_store_id ON sync_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_synced_at ON sync_logs(synced_at);

-- Comments for documentation
COMMENT ON TABLE sync_logs IS 'Audit trail for data synchronization - tracks product, price, and inventory updates';
COMMENT ON COLUMN sync_logs.sync_type IS 'Type of sync: PRODUCT (new items), PRICE (updates), INVENTORY (stock changes)';
COMMENT ON COLUMN sync_logs.status IS 'Sync result: PENDING (in progress), SUCCESS (completed), FAILED (error)';
COMMENT ON COLUMN sync_logs.details IS 'JSON details of what was synced and results';
