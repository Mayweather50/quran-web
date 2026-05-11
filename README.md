# Учебная платформа Корана

Статичный фронтенд (HTML/CSS/JS) + Node.js/Express + PostgreSQL.

```
quran-web/
├── backend/         API (Node.js + PostgreSQL)
└── (корень)         статичный фронтенд
```

---

## ⚡ Быстрый запуск

### 1. PostgreSQL

Создайте базу. Например через psql:

```sql
CREATE DATABASE quran_platform;
```

или через `createdb quran_platform`.

### 2. Backend

```bash
cd backend
cp .env.example .env       # если файла нет — отредактируйте DB_*
npm install
npm run migrate            # применяет sql/*.sql (схема + capacity)
npm run seed               # добавляет демо-пользователей и слоты
npm start                  # API на http://localhost:3001
```

### 3. Frontend

В новом терминале, из корня проекта (там где `index.html`):

```bash
# Любой статический сервер на порту 5500
npx http-server -p 5500
# или
python3 -m http.server 5500
```

Затем открыть в браузере: **http://localhost:5500/index.html**

> Расширение **Live Server** в VS Code тоже работает — главное, чтобы порт был 5500 (или допишите свой в `FRONTEND_ORIGIN` в `backend/.env`).

### 4. (Опционально) задать пароли вручную

Если в БД есть пользователи без паролей (status `NO_PASSWORD`) или нужно сменить:

```bash
cd backend
node scripts/set-user-password.js student@quran.com admin12345
node scripts/set-user-password.js abdullah.teacher@quran.com admin12345
node scripts/set-user-password.js admin@quran.com admin12345
```

---

## 🔑 Демо-аккаунты

Все с паролем `password123` после `npm run seed`:

| Роль | Email |
|---|---|
| Админ | `admin@example.com` |
| Преподаватель | `teacher1@example.com`, `teacher3@example.com`, `teacher4@example.com` |
| Ученик | `student1@example.com`, `student2@example.com`, `student3@example.com` |

---

## 📄 Страницы

| Файл | Кто | Что |
|---|---|---|
| `index.html` | все | Главная |
| `booking.html` | ученик | Запись на урок |
| `schedule.html` | ученик | Своё расписание |
| `teachers.html` | все | Каталог преподавателей (поддерживает `?level=…`) |
| `login.html` / `register.html` | анонимы | Авторизация |
| `profile.html` | любой залогиненный | Имя, смена пароля |
| `teacher.html` | преподаватель | Свои уроки + слоты |
| `admin.html` | админ | Пользователи / Уроки / Преподаватели |

Карточки уровней на главной ведут на страницу записи `booking.html?level=…`, а карточка записи показывает выбранный уровень.

Расписание (`schedule.html`) теперь рендерит календарь даже если backend недоступен — работает оффлайн с пустым списком уроков.

---

## 🌐 Эндпоинты API

| Метод | Маршрут | Доступ |
|---|---|---|
| GET | `/api/health` | все |
| **Auth** ||
| POST | `/api/auth/register` | анон |
| POST | `/api/auth/login` | анон |
| GET, PATCH | `/api/auth/me` | любой |
| POST | `/api/auth/change-password` | любой |
| **Lookups** ||
| GET | `/api/age-groups`, `/api/levels`, `/api/disciplines` | все |
| GET | `/api/booking-info?age_group=…` | все |
| **Teachers** ||
| GET | `/api/teachers` (фильтры: discipline, age_group, level, q, active) | все |
| GET | `/api/teachers/:id`, `/:id/schedule?date=…`, `/:id/calendar?year=&month=`, `/:id/reviews` | все |
| POST, PATCH, DELETE | `/api/teachers/:id/slots` | владелец/админ |
| **Teacher dashboard** ||
| GET | `/api/teacher/me`, `/api/teacher/me/schedule`, `/api/teacher/me/slots?date=…` | teacher |
| **Bookings** ||
| GET, POST | `/api/bookings` (фильтры: scope=mine, student_id, teacher_id, status, from, to) | автор/админ |
| GET, PATCH | `/api/bookings/:id` | админ/преподаватель/ученик-владелец |
| **Schedule / Progress / Reviews / Favorites** ||
| GET | `/api/schedule/me` | любой |
| GET, POST | `/api/student-progress/...`, `/api/reviews?...`, `/api/users/:id/favorite-teachers/...` | любой |
| **Admin** ||
| GET, PATCH | `/api/admin/users/:id`, `/api/admin/bookings/:id`, `/api/admin/teachers/:id` | admin |

---

## 👥 Групповые уроки

У каждого слота есть `capacity` (по умолчанию 1):

| capacity | смысл |
|---|---|
| 1 | индивидуальный урок |
| 2+ | групповой формат |

`capacity` не ограничивает запись. Много учеников могут записаться к одному преподавателю на одну дату и время. Один ученик не может записаться на два урока в одну дату и время, даже к разным преподавателям.

В кабинете преподавателя поле формата: `1` — индивидуальный урок, `2+` — групповой. Кнопка ⚙ меняет только формат слота, а не лимит мест.

---

## 🔧 Заметки

* В production обязательно поставьте свой `JWT_SECRET` в `.env`.
* `CURRENT_USER_ID` в `.env` — dev-fallback. Если пустой и нет токена — запрос анонимный (главная, каталог, расписание работают).
* После того как вы сделали `npm run seed` и залогинились через UI, `CURRENT_USER_ID` можно оставить пустым.
* Если `/api/schedule/me` падает — календарь всё равно рисуется, но данные не подменяются локальным демо.

---

## ☁️ Деплой

Frontend можно хостить на GitHub Pages или другом статическом хостинге. Express + PostgreSQL туда не зальются: backend и база нужны отдельно или на своём VPS.

Для официального релиза на одном VPS используйте готовую инструкцию:

* [docs/VPS_RELEASE.md](docs/VPS_RELEASE.md) — установка Ubuntu/Node/PostgreSQL/Nginx, домен, SSL, systemd.
* [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) — короткий чеклист перед открытием сайта.
* `backend/.env.production.example` — шаблон production-переменных.
* `npm run preflight` в папке `backend/` — автоматическая проверка env, БД, таблиц и индекса бронирований.

1. Задеплойте папку `backend/` на VPS или любой хостинг с поддержкой Node.js + PostgreSQL.
   - Установите переменные окружения: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_ORIGIN=https://hifz-center.site,https://www.hifz-center.site`.
   - Запустите `npm run migrate` и `npm run seed` (большинство хостингов дают одноразовый shell или job hooks).
2. Во frontend-файле `_config.js` укажите адрес backend API:
   ```
   window.__API_BASE__ = 'https://your-api-domain.example/api';
   ```
3. Для GitHub Pages в репозитории уже есть `CNAME` и `.nojekyll`.

### Как это устроено

| Файл | Роль |
|---|---|
| `netlify.toml` | старый вариант деплоя на Netlify, можно не использовать при GitHub Pages/VPS |
| `_config.js` | содержит `window.__API_BASE__ = '...'` |
| `api.js` | Читает `window.__API_BASE__` или `<meta name="api-base">`, иначе по умолчанию `http://localhost:3001/api` |
| `script.js` | Загружает возрастные группы, уровни, преподавателей, цитаты, слоты и расписание через API |
