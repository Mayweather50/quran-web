-- =============================================================
-- 005_avatars_attendance_chats.sql
-- Adds avatars (already had avatar_url, just ensures), attendance
-- tracking, and the chat tables for the new admin features.
--
-- Idempotent: safe to re-run.
-- =============================================================

-- ── Avatars ──────────────────────────────────────────────────
-- The users.avatar_url column was already in 001_schema; this is a
-- guard for older installs that pre-date that.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- ── Attendance tracking on bookings ──────────────────────────
-- "attended" is set when the teacher (or admin) marks a confirmed
-- lesson as actually held. Distinct from status='completed' so that
-- back-fills don't accidentally toggle attendance.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'attended'
  ) THEN
    ALTER TABLE bookings ADD COLUMN attended BOOLEAN;
  END IF;
END $$;

-- Helpful index for the upcoming attendance dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_attended
  ON bookings (lesson_date) WHERE attended IS NOT NULL;

-- ── Chats: 1-1 conversation between two users ────────────────
CREATE TABLE IF NOT EXISTS chats (
  id          BIGSERIAL PRIMARY KEY,
  -- Always store user_a < user_b alphabetically so each pair has a
  -- single canonical row. Enforced via a CHECK constraint.
  user_a      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  last_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chats_pair_ordered CHECK (user_a < user_b),
  CONSTRAINT chats_pair_unique  UNIQUE (user_a, user_b)
);

CREATE INDEX IF NOT EXISTS idx_chats_user_a ON chats(user_a);
CREATE INDEX IF NOT EXISTS idx_chats_user_b ON chats(user_b);

CREATE TABLE IF NOT EXISTS messages (
  id          BIGSERIAL PRIMARY KEY,
  chat_id     BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id   TEXT   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT   NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(chat_id) WHERE read_at IS NULL;

-- Trigger: keep chats.last_at in sync with the latest message so the
-- chat list can sort cheaply.
CREATE OR REPLACE FUNCTION trg_messages_touch_chat() RETURNS trigger AS $$
BEGIN
  UPDATE chats SET last_at = NEW.created_at WHERE id = NEW.chat_id;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_touch_chat ON messages;
CREATE TRIGGER messages_touch_chat
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION trg_messages_touch_chat();
