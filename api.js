/* =========================================================
   Lightweight HTTP client for the backend API.

   - JWT token is read from / written to localStorage and
     attached as `Authorization: Bearer ...` to every call.
   - On 401 we clear the token and bounce to login.html
     (except for /auth/* itself — those return 401 on bad
     credentials, which the login form needs to handle).
========================================================= */
'use strict';

(function () {
  const TOKEN_KEY = 'authToken';
  const USER_KEY  = 'authUser';

  // The API base URL is configurable so the same frontend can be
  // served from the VPS and proxy requests to the backend through Nginx.
  // Resolution order:
  //   1. window.__API_BASE__   (set by an inline script before api.js)
  //   2. <meta name="api-base" content="…">
  //   3. http://localhost:3001/api  (sensible local-dev default)
  function resolveBase() {
    if (typeof window !== 'undefined' && window.__API_BASE__) {
      return String(window.__API_BASE__).replace(/\/+$/, '');
    }
    const meta = typeof document !== 'undefined'
      && document.querySelector('meta[name="api-base"]');
    if (meta && meta.content) return meta.content.replace(/\/+$/, '');
    return 'http://localhost:3001/api';
  }

  const API = {
    baseUrl: resolveBase(),

    // ─── token & cached user helpers ─────────────────────
    getToken() { return localStorage.getItem(TOKEN_KEY); },
    setToken(t) {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else   localStorage.removeItem(TOKEN_KEY);
    },
    getUser() {
      const raw = localStorage.getItem(USER_KEY);
      try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
    },
    setUser(u) {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else   localStorage.removeItem(USER_KEY);
    },
    clearAuth() {
      this.setToken(null);
      this.setUser(null);
    },

    async request(method, path, body) {
      const url = /^https?:\/\//.test(path) ? path : this.baseUrl + path;
      const opts = {
        method,
        headers: { Accept: 'application/json' },
      };
      if (method === 'GET') opts.cache = 'no-store';
      const tok = this.getToken();
      if (tok) opts.headers['Authorization'] = `Bearer ${tok}`;
      if (body !== undefined) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }

      let res;
      try {
        res = await fetch(url, opts);
      } catch (networkErr) {
        const e = new Error(
          `Не удалось подключиться к ${url}. ` +
          `Проверьте: 1) backend запущен, ` +
          `2) CORS разрешает origin ${typeof window !== 'undefined' ? window.location.origin : '?'}, ` +
          `3) если страница открыта как file://, backend запущен после последних правок и ALLOW_FILE_ORIGIN не равен false. (${networkErr.message})`
        );
        e.cause = networkErr;
        e.status = 0;
        throw e;
      }

      const text = await res.text();
      let data = null;
      if (text) {
        try { data = JSON.parse(text); } catch (_) { data = text; }
      }

      // 401 outside /auth/* means our token is dead. Just clear it and
      // let the page keep working as anonymous — no forced redirect now,
      // because the site is browseable without an account.
      if (res.status === 401 && !path.startsWith('/auth/')) {
        this.clearAuth();
      }

      if (!res.ok) {
        const msg =
          (data && typeof data === 'object' && data.error) ||
          `HTTP ${res.status} ${res.statusText}`;
        const e = new Error(msg);
        e.status = res.status;
        e.data = data;
        throw e;
      }
      return data;
    },

    get(path)         { return this.request('GET',    path); },
    post(path, body)  { return this.request('POST',   path, body); },
    patch(path, body) { return this.request('PATCH',  path, body); },
    del(path, body)   { return this.request('DELETE', path, body); },
  };

  window.API = API;
})();
