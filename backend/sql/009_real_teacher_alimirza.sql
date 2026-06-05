/* =============================================================
   Replace demo teacher profiles with real release teachers.

   The local migrator runs every SQL file on every deploy, so this
   destructive cleanup is guarded by an application-level marker.
============================================================= */
BEGIN;

CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_migrations WHERE name = '009_real_teachers_release'
  ) THEN
    UPDATE users
       SET name = CASE id
         WHEN 'demoAdmin000000000000000001' THEN 'Администратор'
         WHEN '3yEiPJ71hbPxaLyVbLyFcFdjY0b2' THEN 'Ахмад'
         WHEN 'demoStudent00000000000000001' THEN 'Умар'
         WHEN 'demoStudent00000000000000002' THEN 'Ибрагим'
         ELSE name
       END
     WHERE id IN (
       'demoAdmin000000000000000001',
       '3yEiPJ71hbPxaLyVbLyFcFdjY0b2',
       'demoStudent00000000000000001',
       'demoStudent00000000000000002'
     );

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
      )
    ON CONFLICT (id) DO UPDATE
      SET role = 'teacher',
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          is_active = TRUE;

    DELETE FROM teacher_schedule_slots
     WHERE teacher_id IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );

    DELETE FROM bookings
     WHERE teacher_id IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );

    DELETE FROM reviews
     WHERE teacher_id IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );

    DELETE FROM chats
     WHERE user_a IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     )
        OR user_b IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );

    DELETE FROM teachers
     WHERE id NOT IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );

    DELETE FROM users
     WHERE role = 'teacher'
       AND id NOT IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );

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
      )
    ON CONFLICT (id) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          name = EXCLUDED.name,
          bio = EXCLUDED.bio,
          experience = EXCLUDED.experience,
          photo_url = EXCLUDED.photo_url,
          rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          is_active = TRUE;

    DELETE FROM teacher_disciplines
     WHERE teacher_id IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );
    DELETE FROM teacher_age_groups
     WHERE teacher_id IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );
    DELETE FROM teacher_levels
     WHERE teacher_id IN (
       'demoTeacher00000000000000001',
       'demoTeacher00000000000000003'
     );

    INSERT INTO teacher_disciplines (teacher_id, discipline_name)
    VALUES
      ('demoTeacher00000000000000001', 'Хифз'),
      ('demoTeacher00000000000000001', 'Таджвид'),
      ('demoTeacher00000000000000001', 'Чтение'),
      ('demoTeacher00000000000000001', 'Индивидуально'),
      ('demoTeacher00000000000000003', 'Хифз'),
      ('demoTeacher00000000000000003', 'Таджвид'),
      ('demoTeacher00000000000000003', 'Чтение'),
      ('demoTeacher00000000000000003', 'Индивидуально')
    ON CONFLICT DO NOTHING;

    INSERT INTO teacher_age_groups (teacher_id, age_group_name)
    VALUES
      ('demoTeacher00000000000000001', '11-15 лет'),
      ('demoTeacher00000000000000001', '15-20 лет'),
      ('demoTeacher00000000000000001', '20+'),
      ('demoTeacher00000000000000003', '11-15 лет'),
      ('demoTeacher00000000000000003', '15-20 лет'),
      ('demoTeacher00000000000000003', '20+')
    ON CONFLICT DO NOTHING;

    INSERT INTO teacher_levels (teacher_id, level_name)
    VALUES
      ('demoTeacher00000000000000001', 'Начальный'),
      ('demoTeacher00000000000000001', 'Средний'),
      ('demoTeacher00000000000000001', 'Продвинутый'),
      ('demoTeacher00000000000000003', 'Начальный'),
      ('demoTeacher00000000000000003', 'Средний'),
      ('demoTeacher00000000000000003', 'Продвинутый')
    ON CONFLICT DO NOTHING;

    INSERT INTO app_migrations (name)
    VALUES ('009_real_teachers_release')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
