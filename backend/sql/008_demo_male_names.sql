-- Keep demo student names male-only in admin recent activity.
-- This only touches the seeded demo account, not real users.
UPDATE users
   SET name = 'Умар'
 WHERE email = 'student2@example.com'
   AND name = 'Айша';

UPDATE bookings
   SET student_name = 'Умар'
 WHERE student_id = (SELECT id FROM users WHERE email = 'student2@example.com')
   AND student_name = 'Айша';

UPDATE reviews
   SET student_name = 'Умар'
 WHERE student_id = (SELECT id FROM users WHERE email = 'student2@example.com')
   AND student_name = 'Айша';
