-- Migration: Create receipt_events table (audit trail)
-- Purpose: Enterprise-grade audit trail for compliance, debugging, and dispute resolution

CREATE TABLE IF NOT EXISTS receipt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,     -- CREATED, LOCKED, SCANNED, CONSUMED, EXPIRED, ERROR
  source TEXT NOT NULL,         -- 'mobile', 'bridge', 'admin', 'system'
  description TEXT,             -- Additional details about event
  
  -- Who triggered it
  triggered_by TEXT,            -- user_id or device_id
  
  -- Additional metadata
  metadata JSONB,               -- Custom data: {"error": "...", "pos_response": "...", etc}
  
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_receipt_events_receipt_id ON receipt_events(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_events_event_type ON receipt_events(event_type);
CREATE INDEX IF NOT EXISTS idx_receipt_events_created_at ON receipt_events(created_at);

-- Comments for documentation
COMMENT ON TABLE receipt_events IS 'Complete audit trail of all receipt state changes - essential for compliance and debugging';
COMMENT ON COLUMN receipt_events.event_type IS 'Event: CREATED (checkout), LOCKED (barcode generated), SCANNED (at counter), CONSUMED (in POS)';
COMMENT ON COLUMN receipt_events.source IS 'Which system triggered event: mobile app, bridge app, admin panel, or system';
COMMENT ON COLUMN receipt_events.metadata IS 'JSON data: error logs, POS response, system messages for advanced debugging';
