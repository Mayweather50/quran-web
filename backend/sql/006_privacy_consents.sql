ALTER TABLE users
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT,
  ADD COLUMN IF NOT EXISTS personal_data_consent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_consents (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type   TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address     TEXT,
  user_agent     TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
