/* Set static photo paths for the three release teachers. */
BEGIN;

CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_migrations WHERE name = '011_teacher_photo_urls'
  ) THEN
    UPDATE teachers
       SET photo_url = '/assets/teachers/alimirza-gadjimusaev.jpg'
     WHERE id = 'demoTeacher00000000000000001';

    UPDATE teachers
       SET photo_url = '/assets/teachers/saadulla-gazimagomedov.jpg'
     WHERE id = 'demoTeacher00000000000000003';

    UPDATE teachers
       SET photo_url = '/assets/teachers/hasanafandi-gamidov.jpg'
     WHERE id = 'demoTeacher00000000000000004';

    INSERT INTO app_migrations (name)
    VALUES ('011_teacher_photo_urls')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
