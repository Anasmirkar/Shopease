-- Migration: Create guest_sessions table (frictionless checkout)
-- Purpose: Track guest shopping sessions without requiring login

CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_device_id ON guest_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_store_id ON guest_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires_at ON guest_sessions(expires_at);

-- Comments for documentation
COMMENT ON TABLE guest_sessions IS 'Tracks guest user sessions for frictionless shopping without login';
COMMENT ON COLUMN guest_sessions.device_id IS 'Unique device identifier to track and prevent fraud';
COMMENT ON COLUMN guest_sessions.expires_at IS 'Session expiry time - receipts created after expiry are invalid';
