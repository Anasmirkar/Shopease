-- Migration: Create pos_devices table (Bridge app identity)
-- Purpose: Register and authenticate Bridge PC apps for secure receipt fetching

CREATE TABLE IF NOT EXISTS pos_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,        -- E.g., "Counter-1", "Counter-2", "Billing-Station"
  device_id TEXT UNIQUE NOT NULL,   -- Hardware identifier for device tracking
  api_key TEXT UNIQUE NOT NULL,     -- API key for Bridge app authentication
  
  status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED')),
  
  last_activity TIMESTAMP,
  registered_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pos_devices_store_id ON pos_devices(store_id);
CREATE INDEX IF NOT EXISTS idx_pos_devices_api_key ON pos_devices(api_key);
CREATE INDEX IF NOT EXISTS idx_pos_devices_device_id ON pos_devices(device_id);

-- Comments for documentation
COMMENT ON TABLE pos_devices IS 'Registered Bridge PC apps - only these can fetch and consume receipts';
COMMENT ON COLUMN pos_devices.device_id IS 'Hardware fingerprint: CPU ID, MAC address, etc - prevents cloning';
COMMENT ON COLUMN pos_devices.api_key IS 'Secret key for authentication - like JWT but simpler for local apps';
COMMENT ON COLUMN pos_devices.last_activity IS 'Last time this device accessed the API - for monitoring and heartbeat';
