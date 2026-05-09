-- =============================================================
-- 002_lookup_seed.sql — fill the small lookup tables.
-- Idempotent: ON CONFLICT DO NOTHING.
-- =============================================================

INSERT INTO age_groups (name) VALUES
  ('11-15 лет'),
  ('15-20 лет'),
  ('20+')
ON CONFLICT DO NOTHING;

INSERT INTO levels (name) VALUES
  ('Начальный'),
  ('Средний'),
  ('Продвинутый')
ON CONFLICT DO NOTHING;

INSERT INTO disciplines (name) VALUES
  ('Таджвид'),
  ('Хифз'),
  ('Тафсир'),
  ('Чтение'),
  ('Арабский'),
  ('Фикх'),
  ('Игры'),
  ('Группа'),
  ('Индивидуально')
ON CONFLICT DO NOTHING;
