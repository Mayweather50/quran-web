-- =============================================================
-- 004_simplify_lookups.sql
-- For existing installs: replace the legacy age_groups / levels
-- catalogue with the simplified set used by the UI:
--   age_groups: 11-15 лет / 15-20 лет / 20+
--   levels:     Начальный / Средний / Продвинутый
--
-- Idempotent: safe to re-run.
-- =============================================================

-- 1. Insert the new lookup values (no-op if already there).
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

-- 2. Migrate any teacher_age_groups / teacher_levels rows that still
--    reference the old labels into the new ones.
WITH age_map(old_name, new_name) AS (
  VALUES
    ('4-6 лет',   '11-15 лет'),
    ('7-10 лет',  '11-15 лет'),
    ('11-14 лет', '11-15 лет'),
    ('15-17 лет', '15-20 лет'),
    ('18+',       '20+')
)
INSERT INTO teacher_age_groups (teacher_id, age_group_name)
SELECT DISTINCT tag.teacher_id, m.new_name
  FROM teacher_age_groups tag
  JOIN age_map m ON m.old_name = tag.age_group_name
ON CONFLICT DO NOTHING;

WITH lvl_map(old_name, new_name) AS (
  VALUES
    ('Новичок',  'Начальный'),
    ('Базовый',  'Средний')
)
INSERT INTO teacher_levels (teacher_id, level_name)
SELECT DISTINCT tl.teacher_id, m.new_name
  FROM teacher_levels tl
  JOIN lvl_map m ON m.old_name = tl.level_name
ON CONFLICT DO NOTHING;

-- 3. Same migration for users.level_name (NULLable, single column).
UPDATE users SET level_name = 'Начальный' WHERE level_name = 'Новичок';
UPDATE users SET level_name = 'Средний'   WHERE level_name = 'Базовый';

-- And for any historical bookings that referenced legacy disciplines —
-- nothing to do here, dispine list is unchanged.

-- 4. Finally, drop the legacy lookup rows. The cascade-by-ON-DELETE
--    settings would lose data, so we remove only after step 2 copied
--    everything across.
DELETE FROM teacher_age_groups WHERE age_group_name IN ('4-6 лет','7-10 лет','11-14 лет','15-17 лет','18+');
DELETE FROM teacher_levels      WHERE level_name     IN ('Новичок','Базовый');
DELETE FROM age_groups          WHERE name           IN ('4-6 лет','7-10 лет','11-14 лет','15-17 лет','18+');
DELETE FROM levels              WHERE name           IN ('Новичок','Базовый');

-- 5. Quotes table — feeds the rotating citation card on the home page.
CREATE TABLE IF NOT EXISTS quotes (
  id         BIGSERIAL PRIMARY KEY,
  source     TEXT NOT NULL,
  text       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO quotes (source, text)
SELECT v.source, v.text
FROM (VALUES
  ('Коран 2:286', '«Аллах не возлагает на человека сверх его возможностей.»'),
  ('Коран 13:28', '«Воистину, в поминании Аллаха сердца находят покой.»'),
  ('Коран 94:6',  '«Воистину, за каждой тягостью наступает облегчение.»')
) AS v(source, text)
WHERE NOT EXISTS (SELECT 1 FROM quotes WHERE quotes.source = v.source AND quotes.text = v.text);
