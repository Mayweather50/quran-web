-- Fixed release teacher levels and weekly online schedule.
BEGIN;

CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE
  teacher_alimirza TEXT := 'demoTeacher00000000000000001';
  teacher_saadulla TEXT := 'demoTeacher00000000000000003';
  teacher_hasanafandi TEXT := 'demoTeacher00000000000000004';
  release_teacher_ids TEXT[] := ARRAY[teacher_alimirza, teacher_saadulla, teacher_hasanafandi];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_migrations WHERE name = '013_fixed_teacher_weekly_schedule') THEN
    DELETE FROM teacher_levels WHERE teacher_id = ANY(release_teacher_ids);

    INSERT INTO teacher_levels (teacher_id, level_name)
    VALUES
      (teacher_hasanafandi, 'Начальный'),
      (teacher_saadulla, 'Средний'),
      (teacher_alimirza, 'Продвинутый')
    ON CONFLICT DO NOTHING;

    DELETE FROM teacher_disciplines
    WHERE teacher_id = ANY(release_teacher_ids)
      AND lower(trim(discipline_name)) IN ('индивидуально', 'группа', 'офлайн');

    INSERT INTO app_migrations(name)
    VALUES ('013_fixed_teacher_weekly_schedule')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

DELETE FROM teacher_schedule_slots s
WHERE s.teacher_id = ANY(ARRAY[
  'demoTeacher00000000000000004',
  'demoTeacher00000000000000003',
  'demoTeacher00000000000000001'
]::text[])
  AND s.slot_date >= CURRENT_DATE
  AND NOT (
    EXTRACT(ISODOW FROM s.slot_date) IN (2, 4, 6)
    AND s.slot_time IN ('10:00'::time, '18:00'::time, '20:00'::time)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.teacher_id = s.teacher_id
      AND b.lesson_date = s.slot_date
      AND b.time_slot = s.slot_time
      AND b.status IN ('pending', 'confirmed')
  );

INSERT INTO teacher_schedule_slots (teacher_id, slot_date, slot_time, duration_minutes, capacity, is_available)
SELECT t.teacher_id, d::date, tm.slot_time, 60, 1, TRUE
FROM (VALUES
  ('demoTeacher00000000000000004'),
  ('demoTeacher00000000000000003'),
  ('demoTeacher00000000000000001')
) AS t(teacher_id)
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', INTERVAL '1 day') AS d
CROSS JOIN (VALUES ('10:00'::time), ('18:00'::time), ('20:00'::time)) AS tm(slot_time)
WHERE EXTRACT(ISODOW FROM d) IN (2, 4, 6)
ON CONFLICT (teacher_id, slot_date, slot_time) DO UPDATE
  SET duration_minutes = EXCLUDED.duration_minutes,
      capacity = EXCLUDED.capacity,
      is_available = TRUE;

COMMIT;
