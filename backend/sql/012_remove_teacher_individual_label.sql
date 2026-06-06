/* Hide "Индивидуально" from public teacher discipline labels. */
BEGIN;

CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_migrations WHERE name = '012_remove_teacher_individual_label'
  ) THEN
    DELETE FROM teacher_disciplines
     WHERE discipline_name = 'Индивидуально'
       AND teacher_id IN (
         'demoTeacher00000000000000001',
         'demoTeacher00000000000000003',
         'demoTeacher00000000000000004'
       );

    INSERT INTO app_migrations (name)
    VALUES ('012_remove_teacher_individual_label')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
