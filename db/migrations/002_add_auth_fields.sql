-- Migration: Add authentication fields to users table
-- Created: 2024

-- Add password hash and OAuth fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50), -- 'google', 'github', or NULL for password auth
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255); -- OAuth provider's user ID

-- Create index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;

-- Create index for email lookups (for password login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

