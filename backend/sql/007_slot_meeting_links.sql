-- Allow teachers to prepare an online lesson link on an empty schedule slot.
-- When a student books that slot, the backend copies the link to bookings.

ALTER TABLE teacher_schedule_slots
  ADD COLUMN IF NOT EXISTS meeting_provider TEXT;

ALTER TABLE teacher_schedule_slots
  ADD COLUMN IF NOT EXISTS meeting_url TEXT;
