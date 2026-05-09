-- =============================================================
-- 003_group_capacity.sql
-- Keep legacy capacity metadata, but do not use it as a booking limit.
-- Many students may book the same teacher/date/time; only per-student
-- date/time conflicts are unique. Idempotent.
-- =============================================================

-- 1. Per-slot capacity remains informational for existing UI/admin data.
ALTER TABLE teacher_schedule_slots
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1
    CHECK (capacity >= 1);

-- 2. Drop old uniqueness rules that involved teacher slot/capacity.
DROP INDEX IF EXISTS uq_bookings_active_teacher_slot;
DROP INDEX IF EXISTS uq_bookings_student_slot_active;

-- 3. A single student still cannot double-book the same date/time,
--    even across different teachers.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active_student_date_time
  ON bookings (student_id, lesson_date, time_slot)
  WHERE status IN ('pending','confirmed') AND student_id IS NOT NULL;
