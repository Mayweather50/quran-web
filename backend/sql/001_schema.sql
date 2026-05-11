-- =============================================================
-- 001_schema.sql — full DB schema for the Quran platform.
-- Run with `npm run migrate` or psql -f.
-- Idempotent: safe to run more than once.
-- =============================================================

-- ---------- LOOKUP TABLES ------------------------------------
CREATE TABLE IF NOT EXISTS age_groups (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS levels (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS disciplines (
  name TEXT PRIMARY KEY
);

-- ---------- USERS --------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  role          TEXT NOT NULL DEFAULT 'student'
                CHECK (role IN ('student','teacher','admin')),
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  avatar_url    TEXT,
  age_text      TEXT,
  level_name    TEXT REFERENCES levels(name) ON UPDATE CASCADE ON DELETE SET NULL,
  password_hash TEXT,
  privacy_accepted_at      TIMESTAMPTZ,
  privacy_version          TEXT,
  personal_data_consent_at TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS user_consents (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type  TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address    TEXT,
  user_agent    TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);

-- ---------- TEACHERS -----------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
  id           TEXT PRIMARY KEY,
  user_id      TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  bio          TEXT DEFAULT '',
  experience   TEXT DEFAULT '',
  photo_url    TEXT,
  rating       NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(is_active);

-- ---------- M2M: teacher attributes --------------------------
CREATE TABLE IF NOT EXISTS teacher_disciplines (
  teacher_id      TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  discipline_name TEXT NOT NULL REFERENCES disciplines(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (teacher_id, discipline_name)
);

CREATE TABLE IF NOT EXISTS teacher_age_groups (
  teacher_id     TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  age_group_name TEXT NOT NULL REFERENCES age_groups(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (teacher_id, age_group_name)
);

CREATE TABLE IF NOT EXISTS teacher_levels (
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  level_name TEXT NOT NULL REFERENCES levels(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (teacher_id, level_name)
);

-- ---------- SCHEDULE SLOTS -----------------------------------
CREATE TABLE IF NOT EXISTS teacher_schedule_slots (
  id               BIGSERIAL PRIMARY KEY,
  teacher_id       TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  slot_date        DATE NOT NULL,
  slot_time        TIME NOT NULL,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  capacity         INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  meeting_provider TEXT,
  meeting_url      TEXT,
  UNIQUE (teacher_id, slot_date, slot_time)
);
CREATE INDEX IF NOT EXISTS idx_slots_teacher_date ON teacher_schedule_slots(teacher_id, slot_date);

-- ---------- BOOKINGS -----------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id               BIGSERIAL PRIMARY KEY,
  student_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  teacher_id       TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_name     TEXT,
  teacher_name     TEXT,
  lesson_date      DATE NOT NULL,
  time_slot        TIME NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','cancelled','completed')),
  discipline_name  TEXT REFERENCES disciplines(name) ON UPDATE CASCADE ON DELETE SET NULL,
  is_public        BOOLEAN NOT NULL DEFAULT FALSE,
  meeting_provider TEXT,
  meeting_url      TEXT,
  zoom_link        TEXT,
  meeting_id       TEXT,
  meeting_password TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_student        ON bookings(student_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_date   ON bookings(teacher_id, lesson_date);
-- A single student cannot have two active lessons at the same date/time,
-- even with different teachers. Teacher slot capacity does not limit booking.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active_student_date_time
  ON bookings (student_id, lesson_date, time_slot)
  WHERE status IN ('pending','confirmed') AND student_id IS NOT NULL;

-- ---------- REVIEWS ------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id           BIGSERIAL PRIMARY KEY,
  teacher_id   TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  booking_id   BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
  student_name TEXT,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(teacher_id);

-- ---------- FAVORITE TEACHERS --------------------------------
CREATE TABLE IF NOT EXISTS favorite_teachers (
  student_id TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, teacher_id)
);

-- ---------- STUDENT PROGRESS ---------------------------------
CREATE TABLE IF NOT EXISTS student_progress (
  student_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level_name        TEXT REFERENCES levels(name) ON UPDATE CASCADE ON DELETE SET NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  hours_studied     NUMERIC(6,1) NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS completed_surahs (
  id           BIGSERIAL PRIMARY KEY,
  student_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  name         TEXT,
  arabic_name  TEXT,
  completed_at DATE,
  UNIQUE (student_id, surah_number)
);

-- ---------- VIEWS --------------------------------------------
CREATE OR REPLACE VIEW teacher_review_summary AS
SELECT
  t.id                               AS teacher_id,
  COALESCE(AVG(r.rating)::NUMERIC(3,2), 0) AS calculated_rating,
  COUNT(r.id)::INTEGER               AS calculated_review_count
FROM teachers t
LEFT JOIN reviews r ON r.teacher_id = t.id
GROUP BY t.id;
