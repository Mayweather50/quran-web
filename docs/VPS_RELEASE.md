# Официальный релиз на VPS

Цель: один нормальный сайт на одном домене.

Схема:

- Nginx отдает статический frontend из `/var/www/quran-web`.
- Node.js backend работает локально на `127.0.0.1:3001`.
- Nginx проксирует `/api/*` в backend.
- PostgreSQL стоит на этом же VPS.
- После покупки домена DNS `A`-запись указывает на IP VPS.

## 1. Какой VPS брать

Минимально для старта:

- Ubuntu 24.04 LTS или 22.04 LTS.
- 1 vCPU.
- 1 GB RAM, лучше 2 GB если разница в цене небольшая.
- 15-20 GB SSD.
- IPv4 адрес.

Для первого релиза хватит самого дешевого тарифа с IPv4. Если будет много учеников, позже можно увеличить тариф без переписывания проекта.

## 2. Первичная настройка сервера

Зайдите на сервер по SSH:

```bash
ssh root@YOUR_SERVER_IP
```

Обновите систему:

```bash
apt update && apt upgrade -y
apt install -y git curl nginx postgresql postgresql-contrib ufw
```

Установите Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

Включите firewall:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 3. База данных PostgreSQL

Создайте пользователя и базу:

```bash
sudo -u postgres psql
```

Внутри `psql`:

```sql
CREATE USER quran_app WITH PASSWORD 'PUT_STRONG_DB_PASSWORD_HERE';
CREATE DATABASE quran_platform OWNER quran_app;
\q
```

Пароль сохраните в надежном месте. Он понадобится в `backend/.env`.

## 4. Код проекта

Склонируйте репозиторий:

```bash
mkdir -p /var/www
git clone https://github.com/Mayweather50/quran-web.git /var/www/quran-web
chown -R www-data:www-data /var/www/quran-web
cd /var/www/quran-web
```

Установите backend-зависимости:

```bash
cd /var/www/quran-web/backend
npm ci
```

## 5. Production `.env`

Создайте env-файл:

```bash
cp /var/www/quran-web/backend/.env.production.example /var/www/quran-web/backend/.env
nano /var/www/quran-web/backend/.env
```

Обязательно заменить:

- `DB_PASSWORD` на пароль PostgreSQL.
- `JWT_SECRET` на длинный случайный секрет.
- `FRONTEND_ORIGIN` на будущий домен.

Сгенерировать `JWT_SECRET`:

```bash
openssl rand -base64 48
```

На релизе должно быть:

```env
NODE_ENV=production
ALLOW_FILE_ORIGIN=false
CURRENT_USER_ID=
```

## 6. Frontend config для одного домена

На VPS frontend должен обращаться к backend через `/api`.

```bash
cp /var/www/quran-web/deploy/frontend/_config.vps.example.js /var/www/quran-web/_config.js
```

Это локальная настройка сервера. В официальном релизе `_config.js` должен использовать тот же домен и значение `window.__API_BASE__ = '/api';`.

## 7. Миграции и стартовые данные

```bash
cd /var/www/quran-web/backend
npm run migrate
npm run seed
npm run preflight
```

`npm run preflight` должен завершиться без `Release blockers`.

## 8. Systemd service для backend

Скопируйте service:

```bash
cp /var/www/quran-web/deploy/systemd/quran-backend.service.example /etc/systemd/system/quran-backend.service
systemctl daemon-reload
systemctl enable quran-backend
systemctl start quran-backend
systemctl status quran-backend
```

Проверка API на сервере:

```bash
curl http://127.0.0.1:3001/api/health
```

## 9. Nginx

Скопируйте конфиг:

```bash
cp /var/www/quran-web/deploy/nginx/quran-web.conf.example /etc/nginx/sites-available/quran-web
nano /etc/nginx/sites-available/quran-web
```

Замените:

```nginx
server_name hifz-center.ru www.hifz-center.ru;
```

на свой домен.

Включите сайт:

```bash
ln -s /etc/nginx/sites-available/quran-web /etc/nginx/sites-enabled/quran-web
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Пока домен не куплен, можно проверить по IP:

```bash
curl http://YOUR_SERVER_IP/api/health
```

## 10. Домен и SSL

После покупки домена:

1. В панели регистратора создайте `A`-запись:
   - `@` -> `YOUR_SERVER_IP`
   - `www` -> `YOUR_SERVER_IP`
2. Подождите обновления DNS.
3. Проверьте:

```bash
dig +short your-domain.ru
dig +short www.your-domain.ru
```

Установите SSL:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.ru -d www.your-domain.ru
```

После SSL обновите `FRONTEND_ORIGIN` в `backend/.env`:

```env
FRONTEND_ORIGIN=https://your-domain.ru,https://www.your-domain.ru
```

Перезапустите backend:

```bash
systemctl restart quran-backend
```

## 11. Финальная проверка перед открытием

```bash
cd /var/www/quran-web/backend
npm run preflight
curl https://your-domain.ru/api/health
```

В браузере проверить:

- Главная открывается.
- Регистрация требует согласие с политикой.
- Вход работает.
- Ученик может записаться.
- Повторная запись ученика на то же время показывает понятное сообщение.
- `schedule.html` открывается без входа и не падает.
- Админ входит и видит данные из БД.
- Преподаватель видит свои слоты.

## 12. Обновление после новых коммитов

```bash
cd /var/www/quran-web
git pull origin main
cp deploy/frontend/_config.vps.example.js _config.js
cd backend
npm ci
npm run migrate
npm run preflight
systemctl restart quran-backend
systemctl reload nginx
```

## 13. Полезные команды

Backend logs:

```bash
journalctl -u quran-backend -f
```

Nginx logs:

```bash
tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

PostgreSQL:

```bash
sudo -u postgres psql -d quran_platform
```

Перезапуск:

```bash
systemctl restart quran-backend
systemctl reload nginx
```
