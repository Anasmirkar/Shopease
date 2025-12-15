-- Migration: Create users table (future-proof login)
-- Purpose: Store both authenticated and guest users for loyalty, analytics, and future features

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider TEXT,               -- 'google', 'otp', 'phone', NULL for guest
  auth_uid TEXT UNIQUE,              -- Supabase Auth UID
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores both authenticated users (with login) and guest users created during checkout';
COMMENT ON COLUMN users.auth_provider IS 'Provider used for authentication: google, otp, phone, or NULL for guest';
COMMENT ON COLUMN users.auth_uid IS 'Supabase authentication UID - links to Supabase Auth';
