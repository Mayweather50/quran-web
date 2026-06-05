/* =============================================================
   Seed a usable demo dataset:
     • 1 admin
     • 2 teachers (with profiles + slots for the next 14 days)
     • 3 students
     • a few sample bookings + reviews
   Usage: npm run seed
   Idempotent: re-running is safe (uses ON CONFLICT DO NOTHING).
============================================================= */
'use strict';

const { query, shutdown } = require('../db');
const { genId, hashPassword } = require('../auth');

const DEMO_PASSWORD = 'password123';

// Stable IDs so re-running the seed doesn't multiply rows.
const IDS = {
  admin:    'demoAdmin000000000000000001',
  teacher1: 'demoTeacher00000000000000001',
  teacher3: 'demoTeacher00000000000000003',
  teacher4: 'demoTeacher00000000000000004',
  student1: '3yEiPJ71hbPxaLyVbLyFcFdjY0b2',  // matches existing CURRENT_USER_ID
  student2: 'demoStudent00000000000000001',
  student3: 'demoStudent00000000000000002',
};

// Returns 'YYYY-MM-DD' for today + offsetDays.
function dateOffset(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function upsertUser({ id, role, name, email }) {
  const hash = await hashPassword(DEMO_PASSWORD);
  await query(
    `INSERT INTO users (id, role, name, email, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     ON CONFLICT (id) DO UPDATE
       SET role = EXCLUDED.role,
           name = EXCLUDED.name,
           email = EXCLUDED.email`,
    [id, role, name, email, hash]
  );
}

async function upsertTeacher({ id, user_id, name, bio, experience }) {
  await query(
    `INSERT INTO teachers (id, user_id, name, bio, experience, is_active, rating, review_count)
     VALUES ($1, $2, $3, $4, $5, TRUE, 0, 0)
     ON CONFLICT (id) DO UPDATE
       SET user_id    = EXCLUDED.user_id,
           name       = EXCLUDED.name,
           bio        = EXCLUDED.bio,
           experience = EXCLUDED.experience`,
    [id, user_id, name, bio, experience]
  );
}

async function attach(teacher_id, table, column, values) {
  for (const v of values) {
    await query(
      `INSERT INTO ${table} (teacher_id, ${column}) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [teacher_id, v]
    );
  }
}

async function seedSlots(teacher_id, times, capacity = 1) {
  // 14 future days × given times list, all with the same capacity.
  for (let d = 0; d < 14; d++) {
    const date = dateOffset(d);
    for (const t of times) {
      await query(
        `INSERT INTO teacher_schedule_slots
            (teacher_id, slot_date, slot_time, is_available, duration_minutes, capacity)
         VALUES ($1, $2, $3, TRUE, 45, $4)
         ON CONFLICT (teacher_id, slot_date, slot_time) DO UPDATE
           SET capacity = EXCLUDED.capacity`,
        [teacher_id, date, t, capacity]
      );
    }
  }
}

async function replaceDemoTeachersForRelease() {
  const releaseTeachers = [
    {
      id: IDS.teacher1,
      name: 'Гаджимусаев Алимирза',
      email: 'teacher1@example.com',
      bio: 'Выпускник Центра заучивания Корана. Победитель республиканского конкурса хафизов, призер Всероссийского конкурса и участник международных конкурсов.',
      experience: 'Выпускник Центра заучивания Корана',
      disciplines: ['Хифз', 'Таджвид', 'Чтение', 'Индивидуально'],
      ageGroups: ['11-15 лет', '15-20 лет', '20+'],
      levels: ['Начальный', 'Средний', 'Продвинутый'],
    },
    {
      id: IDS.teacher3,
      name: 'Газимагомедов Саадулла Газимагомедович',
      email: 'teacher3@example.com',
      bio: 'Окончил Дагестанский Исламский университет. Преподаватель Хифз центра им. Хасмухаммада Абубакарова.',
      experience: 'Окончил Дагестанский Исламский университет',
      disciplines: ['Хифз', 'Таджвид', 'Чтение', 'Индивидуально'],
      ageGroups: ['11-15 лет', '15-20 лет', '20+'],
      levels: ['Начальный', 'Средний', 'Продвинутый'],
    },
  ];
  const releaseTeacherIds = releaseTeachers.map((teacher) => teacher.id);

  await upsertUser({
    id: IDS.admin,
    role: 'admin',
    name: 'Администратор',
    email: 'admin@example.com',
  });
  await upsertUser({
    id: IDS.student1,
    role: 'student',
    name: 'Ахмад',
    email: 'student1@example.com',
  });
  await upsertUser({
    id: IDS.student2,
    role: 'student',
    name: 'Умар',
    email: 'student2@example.com',
  });
  await upsertUser({
    id: IDS.student3,
    role: 'student',
    name: 'Ибрагим',
    email: 'student3@example.com',
  });

  for (const teacher of releaseTeachers) {
    await upsertUser({
      id: teacher.id,
      role: 'teacher',
      name: teacher.name,
      email: teacher.email,
    });
  }

  await query('DELETE FROM teacher_schedule_slots WHERE teacher_id = ANY($1::text[])', [releaseTeacherIds]);
  await query('DELETE FROM bookings WHERE teacher_id = ANY($1::text[])', [releaseTeacherIds]);
  await query('DELETE FROM reviews WHERE teacher_id = ANY($1::text[])', [releaseTeacherIds]);
  await query('DELETE FROM chats WHERE user_a = ANY($1::text[]) OR user_b = ANY($1::text[])', [releaseTeacherIds]);
  await query('DELETE FROM teachers WHERE NOT (id = ANY($1::text[]))', [releaseTeacherIds]);
  await query("DELETE FROM users WHERE role = 'teacher' AND NOT (id = ANY($1::text[]))", [releaseTeacherIds]);

  for (const teacher of releaseTeachers) {
    await upsertTeacher({
      id: teacher.id,
      user_id: teacher.id,
      name: teacher.name,
      bio: teacher.bio,
      experience: teacher.experience,
    });
  }

  await query('DELETE FROM teacher_disciplines WHERE teacher_id = ANY($1::text[])', [releaseTeacherIds]);
  await query('DELETE FROM teacher_age_groups WHERE teacher_id = ANY($1::text[])', [releaseTeacherIds]);
  await query('DELETE FROM teacher_levels WHERE teacher_id = ANY($1::text[])', [releaseTeacherIds]);

  for (const teacher of releaseTeachers) {
    await attach(teacher.id, 'teacher_disciplines', 'discipline_name', teacher.disciplines);
    await attach(teacher.id, 'teacher_age_groups', 'age_group_name', teacher.ageGroups);
    await attach(teacher.id, 'teacher_levels', 'level_name', teacher.levels);
  }
}

(async () => {
  try {
    console.log('[seed] users …');
    await upsertUser({ id: IDS.admin,    role: 'admin',   name: 'Администратор',   email: 'admin@example.com'    });
    await upsertUser({ id: IDS.teacher1, role: 'teacher', name: 'Мухаммад Идрисов', email: 'teacher1@example.com' });
    await upsertUser({ id: IDS.teacher3, role: 'teacher', name: 'Устаз Ахмад',      email: 'teacher3@example.com' });
    await upsertUser({ id: IDS.teacher4, role: 'teacher', name: 'Устаз Юсуф',       email: 'teacher4@example.com' });
    await upsertUser({ id: IDS.student1, role: 'student', name: 'Ахмад',            email: 'student1@example.com' });
    await upsertUser({ id: IDS.student2, role: 'student', name: 'Умар',             email: 'student2@example.com' });
    await upsertUser({ id: IDS.student3, role: 'student', name: 'Ибрагим',          email: 'student3@example.com' });

    console.log('[seed] teachers …');
    await upsertTeacher({
      id: IDS.teacher1, user_id: IDS.teacher1,
      name: 'Мухаммад Идрисов',
      bio: 'Дипломированный преподаватель Корана. Терпеливо работаю с детьми и подростками.',
      experience: '8 лет',
    });
    await upsertTeacher({
      id: IDS.teacher3, user_id: IDS.teacher3,
      name: 'Устаз Ахмад',
      bio: 'Преподаватель таджвида и хифза. Работаю по программе «Нурания», большой опыт работы с подростками.',
      experience: '10 лет',
    });
    await upsertTeacher({
      id: IDS.teacher4, user_id: IDS.teacher4,
      name: 'Устаз Юсуф',
      bio: 'Хафиз Корана, преподаватель арабского языка. Индивидуальные занятия для всех уровней подготовки.',
      experience: '15 лет',
    });

    await attach(IDS.teacher1, 'teacher_disciplines', 'discipline_name',
      ['Таджвид', 'Чтение', 'Хифз', 'Игры', 'Группа']);
    await attach(IDS.teacher1, 'teacher_age_groups',  'age_group_name',
      ['11-15 лет']);
    await attach(IDS.teacher1, 'teacher_levels',      'level_name',
      ['Начальный']);

    await attach(IDS.teacher3, 'teacher_disciplines', 'discipline_name',
      ['Таджвид', 'Хифз', 'Чтение', 'Группа', 'Индивидуально']);
    await attach(IDS.teacher3, 'teacher_age_groups',  'age_group_name',
      ['11-15 лет', '15-20 лет']);
    await attach(IDS.teacher3, 'teacher_levels',      'level_name',
      ['Начальный', 'Средний']);

    await attach(IDS.teacher4, 'teacher_disciplines', 'discipline_name',
      ['Хифз', 'Арабский', 'Таджвид', 'Тафсир', 'Индивидуально']);
    await attach(IDS.teacher4, 'teacher_age_groups',  'age_group_name',
      ['15-20 лет', '20+']);
    await attach(IDS.teacher4, 'teacher_levels',      'level_name',
      ['Средний', 'Продвинутый']);

    console.log('[seed] schedule slots …');
    // teacher1: mix of individual and group lessons
    await seedSlots(IDS.teacher1, ['09:00', '12:00', '18:00'], 1);          // individual
    await seedSlots(IDS.teacher1, ['10:30', '16:30'], 6);                   // group of up to 6
    await seedSlots(IDS.teacher1, ['14:00'], 10);                           // big group
    // teacher3: balanced morning + afternoon, with mid-size groups
    await seedSlots(IDS.teacher3, ['08:30', '11:00', '17:30'], 1);          // individual
    await seedSlots(IDS.teacher3, ['13:30', '16:00'], 5);                   // group of up to 5
    // teacher4: heavy individual schedule + one big group lesson
    await seedSlots(IDS.teacher4, ['09:30', '12:30', '14:30', '18:30', '20:00'], 1);
    await seedSlots(IDS.teacher4, ['11:30'], 8);                            // group of up to 8

    console.log('[seed] student progress …');
    for (const sid of [IDS.student1, IDS.student2, IDS.student3]) {
      await query(
        `INSERT INTO student_progress (student_id, level_name, lessons_completed, hours_studied)
         VALUES ($1, 'Начальный', 4, 6.5)
         ON CONFLICT (student_id) DO NOTHING`,
        [sid]
      );
    }

    console.log('[seed] sample bookings …');
    await query(
      `INSERT INTO bookings
         (student_id, teacher_id, student_name, teacher_name, lesson_date, time_slot,
          status, discipline_name, is_public)
       SELECT $1, $2, 'Ахмад', 'Мухаммад Идрисов', $3::date, '10:30'::time,
              'confirmed', 'Таджвид', FALSE
       WHERE NOT EXISTS (
         SELECT 1 FROM bookings
          WHERE teacher_id = $2 AND lesson_date = $3 AND time_slot = '10:30'
       )`,
      [IDS.student1, IDS.teacher1, dateOffset(1)]
    );
    await query(
      `INSERT INTO bookings
         (student_id, teacher_id, student_name, teacher_name, lesson_date, time_slot,
          status, discipline_name, is_public)
       SELECT $1, $2, 'Умар', 'Устаз Ахмад', $3::date, '11:00'::time,
              'pending', 'Таджвид', FALSE
       WHERE NOT EXISTS (
         SELECT 1 FROM bookings
          WHERE teacher_id = $2 AND lesson_date = $3 AND time_slot = '11:00'
       )`,
      [IDS.student2, IDS.teacher3, dateOffset(3)]
    );

    console.log('[seed] sample reviews …');
    await query(
      `INSERT INTO reviews (teacher_id, student_id, student_name, rating, comment)
       SELECT $1, $2, 'Ахмад', 5, 'Прекрасный преподаватель, всё объясняет понятно.'
       WHERE NOT EXISTS (
         SELECT 1 FROM reviews WHERE teacher_id = $1 AND student_id = $2
       )`,
      [IDS.teacher1, IDS.student1]
    );
    await query(
      `INSERT INTO reviews (teacher_id, student_id, student_name, rating, comment)
       SELECT $1, $2, 'Умар', 5, 'Очень внимательный преподаватель, занятия проходят на высоком уровне.'
       WHERE NOT EXISTS (
         SELECT 1 FROM reviews WHERE teacher_id = $1 AND student_id = $2
       )`,
      [IDS.teacher3, IDS.student2]
    );
    await query(
      `INSERT INTO reviews (teacher_id, student_id, student_name, rating, comment)
       SELECT $1, $2, 'Ибрагим', 5, 'Отличный устаз, занятия проходят интересно и продуктивно.'
       WHERE NOT EXISTS (
         SELECT 1 FROM reviews WHERE teacher_id = $1 AND student_id = $2
       )`,
      [IDS.teacher3, IDS.student3]
    );
    await query(
      `INSERT INTO reviews (teacher_id, student_id, student_name, rating, comment)
       SELECT $1, $2, 'Ахмад', 5, 'Помог поставить произношение и улучшил мой хифз. Рекомендую всем.'
       WHERE NOT EXISTS (
         SELECT 1 FROM reviews WHERE teacher_id = $1 AND student_id = $2
       )`,
      [IDS.teacher4, IDS.student1]
    );

    // Sync teachers.rating / review_count from the live view.
    await query(
      `UPDATE teachers t
          SET rating       = trs.calculated_rating,
              review_count = trs.calculated_review_count
         FROM teacher_review_summary trs
        WHERE trs.teacher_id = t.id`
    );

    // ── Demo attendance: a few past completed/cancelled lessons so
    // the Reports & Attendance pages have something to show. ──
    console.log('[seed] sample past lessons (attendance)…');
    const pastBookings = [
      { sid: IDS.student1, tid: IDS.teacher1, sn: 'Ахмад',  tn: 'Мухаммад Идрисов', day: -3, time: '10:30', disc: 'Таджвид',     attended: true  },
      { sid: IDS.student1, tid: IDS.teacher1, sn: 'Ахмад',  tn: 'Мухаммад Идрисов', day: -10, time: '10:30', disc: 'Таджвид',    attended: true  },
      { sid: IDS.student1, tid: IDS.teacher1, sn: 'Ахмад',  tn: 'Мухаммад Идрисов', day: -17, time: '10:30', disc: 'Таджвид',    attended: false },
      { sid: IDS.student2, tid: IDS.teacher3, sn: 'Умар',   tn: 'Устаз Ахмад',      day: -2, time: '11:00', disc: 'Таджвид',     attended: true  },
      { sid: IDS.student2, tid: IDS.teacher3, sn: 'Умар',   tn: 'Устаз Ахмад',      day: -9, time: '11:00', disc: 'Хифз',        attended: true  },
      { sid: IDS.student3, tid: IDS.teacher4, sn: 'Ибрагим',tn: 'Устаз Юсуф',       day: -1, time: '15:00', disc: 'Таджвид', attended: true  },
      { sid: IDS.student3, tid: IDS.teacher4, sn: 'Ибрагим',tn: 'Устаз Юсуф',       day: -8, time: '15:00', disc: 'Таджвид', attended: false },
      { sid: IDS.student3, tid: IDS.teacher4, sn: 'Ибрагим',tn: 'Устаз Юсуф',       day: -15, time: '15:00', disc: 'Таджвид',attended: true  },
    ];
    for (const b of pastBookings) {
      await query(
        `INSERT INTO bookings
           (student_id, teacher_id, student_name, teacher_name, lesson_date, time_slot,
            status, discipline_name, is_public, attended)
         SELECT $1, $2, $3, $4, $5::date, $6::time,
                $7, $8, FALSE, $9
         WHERE NOT EXISTS (
           SELECT 1 FROM bookings
            WHERE teacher_id = $2 AND lesson_date = $5::date AND time_slot = $6::time
         )`,
        [b.sid, b.tid, b.sn, b.tn, dateOffset(b.day), b.time,
         b.attended ? 'completed' : 'cancelled', b.disc, b.attended]
      );
    }

    // ── Demo chats with a few messages ──
    console.log('[seed] sample chats…');
    // student1 ↔ teacher1
    const chatA = await query(
      `INSERT INTO chats (user_a, user_b)
       SELECT LEAST($1::text, $2::text), GREATEST($1::text, $2::text)
       ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a
       RETURNING id`,
      [IDS.student1, IDS.teacher1]
    );
    const chatAId = chatA.rows[0].id;
    await query(
      `INSERT INTO messages (chat_id, sender_id, body, read_at, created_at)
       VALUES
         ($1, $2, 'Ассаламу алейкум! У меня вопрос по домашнему заданию.', now() - interval '3 hours', now() - interval '5 hours'),
         ($1, $3, 'Ва алейкум ассалам, Ахмад. Чем могу помочь?',         now() - interval '2 hours', now() - interval '4 hours'),
         ($1, $2, 'Не могу разобраться с правилом Идгам.',                now() - interval '1 hour',  now() - interval '3 hours'),
         ($1, $3, 'Завтра разберём подробно на уроке. Ин ша Аллах.',     null,                       now() - interval '30 minutes')
       ON CONFLICT DO NOTHING`,
      [chatAId, IDS.student1, IDS.teacher1]
    );

    // student2 ↔ teacher3
    const chatB = await query(
      `INSERT INTO chats (user_a, user_b)
       SELECT LEAST($1::text, $2::text), GREATEST($1::text, $2::text)
       ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a
       RETURNING id`,
      [IDS.student2, IDS.teacher3]
    );
    const chatBId = chatB.rows[0].id;
    await query(
      `INSERT INTO messages (chat_id, sender_id, body, read_at, created_at)
       VALUES
         ($1, $2, 'Спасибо за урок, было очень полезно!',                  now() - interval '1 hour',  now() - interval '4 hours'),
         ($1, $3, 'Барака Аллаху фики. Продолжай в том же духе.',          null,                       now() - interval '15 minutes')
       ON CONFLICT DO NOTHING`,
      [chatBId, IDS.student2, IDS.teacher3]
    );

    // admin pinned support chat with teacher1
    const chatC = await query(
      `INSERT INTO chats (user_a, user_b, pinned)
       SELECT LEAST($1::text, $2::text), GREATEST($1::text, $2::text), TRUE
       ON CONFLICT (user_a, user_b) DO UPDATE SET pinned = TRUE
       RETURNING id`,
      [IDS.admin, IDS.teacher1]
    );
    await query(
      `INSERT INTO messages (chat_id, sender_id, body, read_at, created_at)
       VALUES ($1, $2, 'Мы обновили систему уведомлений. Если у вас возникнут вопросы — напишите нам.', now(), now() - interval '2 days')
       ON CONFLICT DO NOTHING`,
      [chatC.rows[0].id, IDS.admin]
    );

    console.log('[seed] replacing demo teachers with real profile...');
    await replaceDemoTeachersForRelease();

    console.log('[seed] done.');
    console.log('[seed] demo logins (password = password123):');
    console.log('  admin:    admin@example.com');
    console.log('  teachers: teacher1@example.com (Гаджимусаев Алимирза), teacher3@example.com (Газимагомедов Саадулла Газимагомедович)');
    console.log('  students: student1@example.com, student2@example.com, student3@example.com');
  } catch (err) {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  } finally {
    await shutdown();
  }
})();
