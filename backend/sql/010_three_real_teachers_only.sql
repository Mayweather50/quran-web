/* =============================================================
   Keep only the three real release teachers.

   The local migrator runs every SQL file on every deploy, so this
   cleanup is guarded by an application-level marker.
============================================================= */
BEGIN;

CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE
  release_teacher_ids TEXT[] := ARRAY[
    'demoTeacher00000000000000001',
    'demoTeacher00000000000000003',
    'demoTeacher00000000000000004'
  ];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_migrations WHERE name = '010_three_real_teachers_only'
  ) THEN
    INSERT INTO users (id, role, name, email, password_hash, is_active)
    VALUES
      (
        'demoTeacher00000000000000001',
        'teacher',
        'Гаджимусаев Алимирза',
        'teacher1@example.com',
        '$2a$10$Wp17n9Thw1YJDAfSMJMIuOYH85.ezubpRgrtl8BkYLWauhaKohbnS',
        TRUE
      ),
      (
        'demoTeacher00000000000000003',
        'teacher',
        'Газимагомедов Саадулла Газимагомедович',
        'teacher3@example.com',
        '$2a$10$Wp17n9Thw1YJDAfSMJMIuOYH85.ezubpRgrtl8BkYLWauhaKohbnS',
        TRUE
      ),
      (
        'demoTeacher00000000000000004',
        'teacher',
        'Хасанафанди Гамидов',
        'teacher4@example.com',
        '$2a$10$Wp17n9Thw1YJDAfSMJMIuOYH85.ezubpRgrtl8BkYLWauhaKohbnS',
        TRUE
      )
    ON CONFLICT (id) DO UPDATE
      SET role = 'teacher',
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          is_active = TRUE;

    DELETE FROM chats
     WHERE user_a IN (
       SELECT id FROM users
        WHERE role = 'teacher' AND NOT (id = ANY(release_teacher_ids))
     )
        OR user_b IN (
       SELECT id FROM users
        WHERE role = 'teacher' AND NOT (id = ANY(release_teacher_ids))
     );

    DELETE FROM teacher_schedule_slots
     WHERE NOT (teacher_id = ANY(release_teacher_ids));
    DELETE FROM bookings
     WHERE NOT (teacher_id = ANY(release_teacher_ids));
    DELETE FROM reviews
     WHERE NOT (teacher_id = ANY(release_teacher_ids));
    DELETE FROM favorite_teachers
     WHERE NOT (teacher_id = ANY(release_teacher_ids));
    DELETE FROM teacher_disciplines
     WHERE NOT (teacher_id = ANY(release_teacher_ids));
    DELETE FROM teacher_age_groups
     WHERE NOT (teacher_id = ANY(release_teacher_ids));
    DELETE FROM teacher_levels
     WHERE NOT (teacher_id = ANY(release_teacher_ids));
    DELETE FROM teachers
     WHERE NOT (id = ANY(release_teacher_ids));
    DELETE FROM users
     WHERE role = 'teacher'
       AND NOT (id = ANY(release_teacher_ids));

    INSERT INTO teachers (
      id,
      user_id,
      name,
      bio,
      experience,
      photo_url,
      rating,
      review_count,
      is_active
    )
    VALUES
      (
        'demoTeacher00000000000000001',
        'demoTeacher00000000000000001',
        'Гаджимусаев Алимирза',
        'Выпускник Центра заучивания Корана. Победитель республиканского конкурса хафизов, призер Всероссийского конкурса и участник международных конкурсов.',
        'Выпускник Центра заучивания Корана',
        NULL,
        0,
        0,
        TRUE
      ),
      (
        'demoTeacher00000000000000003',
        'demoTeacher00000000000000003',
        'Газимагомедов Саадулла Газимагомедович',
        'Окончил Дагестанский Исламский университет. Преподаватель Хифз центра им. Хасмухаммада Абубакарова.',
        'Окончил Дагестанский Исламский университет',
        NULL,
        0,
        0,
        TRUE
      ),
      (
        'demoTeacher00000000000000004',
        'demoTeacher00000000000000004',
        'Хасанафанди Гамидов',
        'Выпускник Центра по заучиванию Корана имени Хасмухаммада Абубакарова. 2х кратный победитель республиканского конкурса хафизов, участник всероссийских и международных конкурсов.',
        'Выпускник Центра по заучиванию Корана имени Хасмухаммада Абубакарова',
        NULL,
        0,
        0,
        TRUE
      )
    ON CONFLICT (id) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          name = EXCLUDED.name,
          bio = EXCLUDED.bio,
          experience = EXCLUDED.experience,
          photo_url = COALESCE(teachers.photo_url, EXCLUDED.photo_url),
          is_active = TRUE;

    DELETE FROM teacher_disciplines
     WHERE teacher_id = ANY(release_teacher_ids);
    DELETE FROM teacher_age_groups
     WHERE teacher_id = ANY(release_teacher_ids);
    DELETE FROM teacher_levels
     WHERE teacher_id = ANY(release_teacher_ids);

    INSERT INTO teacher_disciplines (teacher_id, discipline_name)
    VALUES
      ('demoTeacher00000000000000001', 'Хифз'),
      ('demoTeacher00000000000000001', 'Таджвид'),
      ('demoTeacher00000000000000001', 'Чтение'),
      ('demoTeacher00000000000000001', 'Индивидуально'),
      ('demoTeacher00000000000000003', 'Хифз'),
      ('demoTeacher00000000000000003', 'Таджвид'),
      ('demoTeacher00000000000000003', 'Чтение'),
      ('demoTeacher00000000000000003', 'Индивидуально'),
      ('demoTeacher00000000000000004', 'Хифз'),
      ('demoTeacher00000000000000004', 'Таджвид'),
      ('demoTeacher00000000000000004', 'Чтение'),
      ('demoTeacher00000000000000004', 'Индивидуально')
    ON CONFLICT DO NOTHING;

    INSERT INTO teacher_age_groups (teacher_id, age_group_name)
    VALUES
      ('demoTeacher00000000000000001', '11-15 лет'),
      ('demoTeacher00000000000000001', '15-20 лет'),
      ('demoTeacher00000000000000001', '20+'),
      ('demoTeacher00000000000000003', '11-15 лет'),
      ('demoTeacher00000000000000003', '15-20 лет'),
      ('demoTeacher00000000000000003', '20+'),
      ('demoTeacher00000000000000004', '11-15 лет'),
      ('demoTeacher00000000000000004', '15-20 лет'),
      ('demoTeacher00000000000000004', '20+')
    ON CONFLICT DO NOTHING;

    INSERT INTO teacher_levels (teacher_id, level_name)
    VALUES
      ('demoTeacher00000000000000001', 'Начальный'),
      ('demoTeacher00000000000000001', 'Средний'),
      ('demoTeacher00000000000000001', 'Продвинутый'),
      ('demoTeacher00000000000000003', 'Начальный'),
      ('demoTeacher00000000000000003', 'Средний'),
      ('demoTeacher00000000000000003', 'Продвинутый'),
      ('demoTeacher00000000000000004', 'Начальный'),
      ('demoTeacher00000000000000004', 'Средний'),
      ('demoTeacher00000000000000004', 'Продвинутый')
    ON CONFLICT DO NOTHING;

    INSERT INTO app_migrations (name)
    VALUES ('010_three_real_teachers_only')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
