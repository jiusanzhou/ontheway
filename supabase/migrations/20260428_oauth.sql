-- OAuth support migration
-- Makes password_hash nullable and adds OAuth provider linkage

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- OAuth identities (one user can have multiple linked providers)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,            -- 'github' | 'google'
  provider_account_id TEXT NOT NULL, -- provider's user id (string)
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);
