/* =========================================================
   Quran Platform — Renderer + interactions
   Reads data from window.DB and populates [data-render]
========================================================= */

(function () {
  'use strict';

  const DB = window.DB || {};
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  // ====================================================
  // ICON LIBRARY
  // ====================================================
  const ICONS = {
    play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z" fill="currentColor"/></svg>`,
    moon: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2D5F3F"/><path d="M21 16.5a6.5 6.5 0 1 1-7-7 5 5 0 0 0 7 7Z" fill="#F2EBE0"/><circle cx="22.5" cy="11.5" r="0.9" fill="#F2EBE0"/></svg>`,
    quran: `<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z M5 17a3 3 0 0 1 3-3h11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    feather: `<svg viewBox="0 0 24 24"><path d="M20 4c-7 0-13 6-13 13v3h3c7 0 13-6 13-13V4h-3Z M6 18 18 6 M11 13h6 M9 16h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    video: `<svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 11l5-3v8l-5-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    'calendar-add': `<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17 M8 3v4 M16 3v4 M12 13v5 M9.5 15.5h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    route: `<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12v9 M9 14l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13V8Z M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    share: `<svg viewBox="0 0 24 24"><path d="M12 4v12 M7 9l5-5 5 5 M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="#D4A85F"/><g stroke="#D4A85F" stroke-width="1.6" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="7" y2="7"/><line x1="17" y1="17" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="7" y2="17"/><line x1="17" y1="7" x2="19.1" y2="4.9"/></g></svg>`,
    people: `<svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5 M14.5 18c.3-2.4 2-3.7 4.5-3.7s3.5 1.3 3.8 3.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    hourglass: `<svg viewBox="0 0 24 24"><path d="M7 3h10 M7 21h10 M7 3v3c0 3 5 4 5 6s-5 3-5 6v3 M17 3v3c0 3-5 4-5 6s5 3 5 6v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    calIcon: `<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17 M8 3v4 M16 3v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" fill="currentColor"/></svg>`,
    flower: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 2v4 M12 18v4 M2 12h4 M18 12h4 M5 5l3 3 M16 16l3 3 M19 5l-3 3 M8 16l-3 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    monitor: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 21h6 M12 17v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.4 5.9.6-4.5 4 1.4 5.8L12 16l-5.4 2.8L8 13l-4.5-4 5.9-.6Z" fill="#E8B95F"/></svg>`,
    starOutline: `<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.4 5.9.6-4.5 4 1.4 5.8L12 16l-5.4 2.8L8 13l-4.5-4 5.9-.6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    message: `<svg viewBox="0 0 24 24"><path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 3V6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="13" cy="10" r="1" fill="currentColor"/><circle cx="17" cy="10" r="1" fill="currentColor"/></svg>`,
    info: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v6 M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M16 16l4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24"><path d="M5 6h6 M15 6h4 M5 12h2 M11 12h8 M5 18h10 M19 18h0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="13" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
    person: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    language: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18 M12 3c2.5 3 4 6 4 9s-1.5 6-4 9 M12 3c-2.5 3-4 6-4 9s1.5 6 4 9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
    scales: `<svg viewBox="0 0 24 24"><path d="M12 4v16 M5 20h14 M5 7l-2 5h4l-2-5Z M19 7l-2 5h4l-2-5Z M5 7h14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
    sparkleSmall: `<svg viewBox="0 0 24 24"><path d="M12 4l1.4 3.6L17 9l-3.6 1.4L12 14l-1.4-3.6L7 9l3.6-1.4Z" fill="currentColor"/></svg>`,
  };

  function icon(name) {
    return ICONS[name] || '';
  }

  // ====================================================
  // RENDERERS — Home page
  // ====================================================
  async function renderCurrentCourse() {
    const slot = $('[data-render="current-course"]');
    if (!slot) return;

    // Pull live progress from the backend. If unauthenticated or the backend
    // is unreachable, keep the visual card visible with a gentle fallback.
    let p;
    try {
      p = await API.get('/student-progress/me');
    } catch (_) {
      p = {
        lessons_total: 30,
        lessons_completed: 0,
        level_name: 'Начните обучение',
        cta: 'Записаться',
        cta_href: 'booking.html',
      };
    }

    // The view returns lessons_completed, hours_studied, level_name,
    // plus an optional `next_step` summary that the API can include
    // later. We compute progress from completed/total when available,
    // otherwise from a 30-lesson default ladder.
    const total      = Number(p.lessons_total)     || 30;
    const completed  = Number(p.lessons_completed) || 0;
    const progress   = Math.max(0, Math.min(100, Math.round((completed * 100) / total)));
    const title      = p.level_name || 'Ваш текущий уровень';
    const cta        = p.cta || 'Продолжить';
    const ctaHref    = p.cta_href || 'schedule.html';
    const tag        = 'Текущий курс';

    slot.style.display = '';
    const offset = 326.7 - (326.7 * progress) / 100;
    slot.innerHTML = `
      <div class="path-card-bg"></div>
      <div class="path-card-content">
        <span class="path-tag">${tag}</span>
        <h3 class="path-title">${title}</h3>
        <div class="progress-bar">
          <div class="progress-fill" style="--progress: ${progress}%"></div>
        </div>
        <div class="path-foot">
          <span class="path-meta">${completed} из ${total} занятий пройдено</span>
          <a href="${ctaHref}" class="btn btn--gold">${cta}</a>
        </div>
      </div>
      <div class="progress-circle" aria-label="Прогресс ${progress}%">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#goldGrad)" stroke-width="8"
            stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="${offset}"
            transform="rotate(-90 60 60)"/>
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#E8C079"/>
              <stop offset="100%" stop-color="#C49A4F"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="progress-percent">${progress}<small>%</small></span>
      </div>
    `;
  }

  // ── Age groups: image lookup by exact lookup name ────
  // Adding a new group? Either add a matching key here, or rely on
  // the default fallback styling.
  const AGE_IMG = {
    '11-15 лет': 'boy-11-14',
    '15-20 лет': 'boy-15-17',
    '20+':       'boy-18plus',
    // legacy support — keeps older DBs functional during migration
    '4-6 лет':   'boy-4-6',
    '7-10 лет':  'boy-7-10',
    '11-14 лет': 'boy-11-14',
    '15-17 лет': 'boy-15-17',
    '18+':       'boy-18plus',
  };
  // URL key used by booking.html so users can deep-link to a group.
  const AGE_URL_KEY = {
    '11-15 лет': '11-15',
    '15-20 лет': '15-20',
    '20+':       '20plus',
    '4-6 лет':   '4-6',
    '7-10 лет':  '7-10',
    '11-14 лет': '11-14',
    '15-17 лет': '15-17',
    '18+':       '18+',
  };
  const AGE_NAME_BY_URL = Object.fromEntries(
    Object.entries(AGE_URL_KEY).map(([name, key]) => [key, name])
  );

  async function renderAgeGroups() {
    const slot = $('[data-render="age-groups"]');
    if (!slot) return;
    slot.innerHTML = '<p class="empty-state">Загрузка…</p>';

    let groups;
    try {
      groups = await API.get('/age-groups');
    } catch (err) {
      slot.innerHTML = `<p class="empty-state">Не удалось загрузить возрастные группы из БД</p>`;
      return;
    }
    if (!Array.isArray(groups) || !groups.length) {
      slot.innerHTML = `<p class="empty-state">В БД пока нет возрастных групп</p>`;
      return;
    }

    slot.innerHTML = groups
      .map((g) => {
        const name = g.name || g;
        const img = AGE_IMG[name] || 'boy-18plus';
        const urlKey = AGE_URL_KEY[name] || name;
        return `
          <a href="booking.html?age=${encodeURIComponent(urlKey)}" class="age-card">
            <div class="age-card-image" data-img="${img}"></div>
            <h3 class="age-card-title">${name}</h3>
          </a>
        `;
      })
      .join('');
  }

  // ── Levels: same approach. Картинки уровней не зависят от
  // языка интерфейса, поэтому держим их в локальной таблице.
  const LEVEL_IMG = {
    'Начальный':   'level-beginner',
    'Средний':     'level-medium',
    'Продвинутый': 'level-advanced',
    // legacy
    'Новичок':     'level-beginner',
    'Базовый':     'level-basic',
  };

  async function renderLevels() {
    const slot = $('[data-render="levels"]');
    if (!slot) return;
    slot.innerHTML = '<p class="empty-state">Загрузка…</p>';

    let levels;
    try {
      levels = await API.get('/levels');
    } catch (err) {
      slot.innerHTML = `<p class="empty-state">Не удалось загрузить уровни из БД</p>`;
      return;
    }

    slot.innerHTML = levels
      .map((l) => {
        const name = l.name || l;
        const img = LEVEL_IMG[name] || 'level-beginner';
        return `
          <a href="booking.html?level=${encodeURIComponent(name)}" class="level-card">
            <div class="level-card-image" data-img="${img}"></div>
            <h3 class="level-card-title">${name}</h3>
          </a>
        `;
      })
      .join('');
  }

  let _quoteIndex = 0;
  let _quotesCache = null;

  async function ensureQuotes() {
    if (_quotesCache) return _quotesCache;
    try {
      _quotesCache = await API.get('/quotes');
    } catch (err) {
      _quotesCache = [];
    }
    return _quotesCache;
  }

  async function renderQuote(index) {
    const slot = $('[data-render="quote"]');
    if (!slot) return;
    const quotes = await ensureQuotes();
    if (!quotes.length) {
      // Hide the quote section gracefully if there's nothing to show.
      const section = slot.closest('section');
      if (section) section.style.display = 'none';
      return;
    }
    if (typeof index !== 'number') index = _quoteIndex;
    if (index >= quotes.length) index = 0;
    _quoteIndex = index;
    const q = quotes[index];
    slot.innerHTML = `
      <div class="quote-card-bg"></div>
      <div class="quote-card-content">
        <div class="quote-head">
          <span class="quote-source">${icon('sun')}<span class="quote-source-text">${q.source}</span></span>
          <button class="share-btn" aria-label="Поделиться">${icon('share')}</button>
        </div>
        <p class="quote-text">${q.text}</p>
        <div class="dots" role="tablist">
          ${quotes
            .map(
              (_, i) =>
                `<button class="dot ${i === index ? 'active' : ''}" data-idx="${i}" aria-label="Аят ${i + 1}"></button>`
            )
            .join('')}
        </div>
      </div>
    `;
    bindQuoteEvents();
  }

  function bindQuoteEvents() {
    $$('.quote-card .dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        _quoteIndex = parseInt(dot.dataset.idx, 10);
        renderQuote(_quoteIndex);
        restartQuoteRotation();
      });
    });
    const shareBtn = $('.quote-card .share-btn');
    shareBtn?.addEventListener('click', async () => {
      const txt = $('.quote-text')?.textContent ?? '';
      const src = $('.quote-source-text')?.textContent ?? '';
      const payload = `${txt}\n— ${src}`;
      if (navigator.share) {
        try { await navigator.share({ title: src, text: payload }); } catch (_) {}
      } else if (navigator.clipboard) {
        try { await navigator.clipboard.writeText(payload); } catch (_) {}
      }
    });
  }

  let _quoteTimer = null;
  function restartQuoteRotation() {
    if (_quoteTimer) clearInterval(_quoteTimer);
    _quoteTimer = setInterval(() => {
      const total = _quotesCache?.length || 1;
      _quoteIndex = (_quoteIndex + 1) % total;
      renderQuote(_quoteIndex);
    }, 7000);
  }

  // ====================================================
  // RENDERERS — Schedule page
  // ====================================================
  function renderScheduleHero() {
    const t = $('[data-render="schedule-title"]');
    const s = $('[data-render="schedule-subtitle"]');
    const ut = $('[data-render="upcoming-title"]');
    const ft = $('[data-render="future-title"]');
    if (t && DB.schedule?.title) t.textContent = DB.schedule.title;
    if (s && DB.schedule?.subtitle) s.textContent = DB.schedule.subtitle;
    if (ut && DB.schedule?.upcomingTitle) ut.textContent = DB.schedule.upcomingTitle;
    if (ft && DB.schedule?.futureTitle) ft.textContent = DB.schedule.futureTitle;
  }

  // ─── Schedule renderers (data from /api/schedule/me) ───────────
  // Full-month calendar for schedule.html.
  // Reuses booking page's `.calfull-*` classes (already in style.css), so no
  // new CSS is needed. The lesson dots are derived from _scheduleData
  // (upcoming + future), not from /api/schedule/me's `week` field — that
  // gives us a real month view, not just 7 days.
  function renderCalendarFromAPI() {
    const slot = $('[data-render="calendar"]');
    if (!slot || !_scheduleData) return;

    // Initialize view month from selected date (or today) on first call.
    if (_scheduleViewYear === null || _scheduleViewMonth === null) {
      const seed = _selectedDate || todayIsoLocal();
      const p = dateParts(seed);
      if (p) {
        _scheduleViewYear  = p.year;
        _scheduleViewMonth = p.month;
      }
    }

    const cells = buildMonthGrid(_scheduleViewYear, _scheduleViewMonth);
    const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    // Build lesson-dot map: 'YYYY-MM-DD' -> 'green' | 'gold'.
    // gold wins when both a private and a public lesson land on the same day.
    const allLessons = [
      ...(_scheduleData.upcoming || []),
      ...(_scheduleData.future   || []),
    ];
    const eventsByDate = {};
    for (const l of allLessons) {
      if (!l?.date) continue;
      const color = l.is_public ? 'gold' : 'green';
      if (eventsByDate[l.date] !== 'gold') eventsByDate[l.date] = color;
    }

    slot.innerHTML = `
      <div class="calfull-head">
        <button class="cal-nav" data-nav="prev" aria-label="Предыдущий месяц">${icon('chevronLeft')}</button>
        <h3 class="calfull-month">${monthYearLabel(_scheduleViewYear, _scheduleViewMonth)}</h3>
        <button class="cal-nav" data-nav="next" aria-label="Следующий месяц">${icon('chevron')}</button>
      </div>
      <div class="calfull-weekdays">
        ${weekdayLabels.map((w, i) => `<span class="${i === 6 ? 'is-sun' : ''}">${w}</span>`).join('')}
      </div>
      <div class="calfull-grid">
        ${cells.map((c) => {
          const ev = eventsByDate[c.date];
          const isSel = c.date === _selectedDate;
          const cls = ['cal-cell'];
          if (c.other) cls.push('is-other');
          if (isSel)   cls.push('is-selected');
          return `
            <button class="${cls.join(' ')}" data-date="${c.date}">
              <span class="d">${c.day}</span>
              ${ev ? `<span class="dot dot--${ev}"></span>` : ''}
              ${isSel ? `<span class="cell-spark">${icon('sparkle')}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Day click — clicking an "other-month" cell jumps to that month too.
    $$('.cal-cell[data-date]', slot).forEach((btn) => {
      btn.addEventListener('click', () => {
        const date = btn.dataset.date;
        if (!date) return;
        const p = dateParts(date);
        if (!p) return;
        if (p.year !== _scheduleViewYear || p.month !== _scheduleViewMonth) {
          _scheduleViewYear  = p.year;
          _scheduleViewMonth = p.month;
        }
        if (date === _selectedDate) return;
        _selectedDate = date;
        renderCalendarFromAPI();
        renderScheduleForDate();
      });
    });

    // Month arrows — moving across months keeps a sensible selected day:
    // first day in the new month that has a lesson, else day 1.
    $$('.cal-nav[data-nav]', slot).forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.nav === 'prev' ? -1 : +1;
        const nx = shiftMonth(_scheduleViewYear, _scheduleViewMonth, dir);
        _scheduleViewYear  = nx.year;
        _scheduleViewMonth = nx.month;
        const prefix = `${_scheduleViewYear}-${pad2(_scheduleViewMonth)}-`;
        const firstLessonInMonth = allLessons
          .map((l) => l.date)
          .filter((d) => d && d.startsWith(prefix))
          .sort()[0];
        _selectedDate = firstLessonInMonth || `${prefix}01`;
        renderCalendarFromAPI();
        renderScheduleForDate();
      });
    });
  }

  function renderTodayCard() {
    const slot = $('[data-render="today"]');
    if (!slot || !DB.schedule?.today) return;
    const t = DB.schedule.today;
    const todayIso = todayIsoLocal();
    const isToday = !_selectedDate || _selectedDate === todayIso;
    const titleLabel = isToday ? t.label : 'Выбран день';
    const dateLabel = _selectedDate ? russianDateLong(_selectedDate) : todayDateRus();
    slot.innerHTML = `
      <div class="today-icon">${icon('moon')}</div>
      <div class="today-body">
        <h3 class="today-title">${titleLabel}</h3>
        <p class="today-date">${dateLabel}</p>
      </div>
      <div class="today-quote">
        <p>${t.quote}</p>
        <span class="today-quote-source">${t.quoteSource}</span>
      </div>
    `;
  }

  function renderUpcomingFromAPI(items, emptyMessage = 'Ближайших уроков пока нет') {
    const slot = $('[data-render="upcoming"]');
    if (!slot) return;

    if (!items || !items.length) {
      slot.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
      return;
    }

    const today = todayIsoLocal();

    slot.innerHTML = items
      .map((b, i) => {
        const fmt = pickFormat(b);
        const teacherName = b.teacher_name || 'Преподаватель';
        const initial = teacherName.trim().charAt(0).toUpperCase();
        const accent = i === 0 ? 'green' : 'gold';
        const timeBadge = b.date === today ? 'Сегодня' : null;
        const time = (b.time_slot || '').slice(0, 5);
        const discipline = b.discipline || 'Урок';
        const action = fmt.url
          ? { icon: 'video', label: 'Открыть', href: fmt.url }
          : { icon: 'calendar-add', label: 'Добавить', href: null };

        return `
          <article class="lesson-card" data-booking-id="${b.id}">
            <div class="lesson-time lesson-time--${accent}">
              <span class="lesson-time-icon">${icon('clock')}</span>
              <span class="lesson-time-value">${time}</span>
              <span class="lesson-time-divider"></span>
              ${timeBadge ? `<span class="lesson-time-badge">${timeBadge}</span>` : ''}
            </div>
            <div class="lesson-body">
              <div class="lesson-meta">
                <span class="lesson-category">${icon(categoryIconFor(discipline))}${discipline}</span>
                <span class="lesson-status status--${b.status}">${statusLabelFor(b.status)}</span>
              </div>
              <h3 class="lesson-title">${discipline}${b.is_public ? ' · Группа' : ''}</h3>
              <div class="lesson-teacher">
                <span class="avatar is-male">${initial}</span>
                <div>
                  <span class="lesson-teacher-name">${teacherName}</span>
                  <span class="lesson-teacher-topic">${discipline}</span>
                </div>
              </div>
              <div class="lesson-where">
                <span class="lesson-format">${icon(fmt.formatIcon)}${fmt.format}</span>
                <span class="lesson-dot"></span>
                <span class="lesson-location">${fmt.location}</span>
              </div>
            </div>
            <div class="lesson-action">
              <button class="lesson-action-btn" aria-label="${action.label}"
                      ${action.href ? `data-meeting-url="${action.href}"` : ''}>
                ${icon(action.icon)}
              </button>
              <span class="lesson-action-label">${action.label}</span>
            </div>
          </article>
        `;
      })
      .join('');

    // Open meeting URL when "Открыть" is clicked.
    $$('.lesson-action-btn[data-meeting-url]', slot).forEach((btn) => {
      btn.addEventListener('click', () => {
        window.open(btn.dataset.meetingUrl, '_blank', 'noopener');
      });
    });
  }

  function renderFutureFromAPI(items, emptyMessage = 'Предстоящих уроков нет') {
    const slot = $('[data-render="future"]');
    if (!slot) return;

    if (!items || !items.length) {
      slot.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
      return;
    }

    slot.innerHTML = items
      .map((b, i) => {
        const fmt = pickFormat(b);
        const accent = i % 2 === 0 ? 'green' : 'gold';
        const p = dateParts(b.date);
        const dowIdx = dowIndexFromDate(b.date);
        const wdLabel = WEEKDAYS_SHORT[dowIdx] || '';
        const monthShort = p ? MONTHS_SHORT[p.month - 1] : '';
        const time = (b.time_slot || '').slice(0, 5);
        const discipline = b.discipline || 'Урок';
        const teacherName = b.teacher_name || '';
        const statusLabel = statusLabelFor(b.status) || 'Запланирован';

        return `
          <a href="${fmt.url || '#'}" ${fmt.url ? 'target="_blank" rel="noopener"' : ''} class="future-card" data-booking-id="${b.id}">
            <div class="future-date future-date--${accent}">
              <span class="future-weekday">${wdLabel}</span>
              <span class="future-day">${p?.day ?? ''}</span>
              <span class="future-month">${monthShort}</span>
            </div>
            <div class="future-time">
              <span class="future-dot future-dot--${accent}"></span>
              <span class="future-time-value">${time}</span>
            </div>
            <div class="future-body">
              <h3 class="future-title">${discipline}${b.is_public ? ' · Группа' : ''}</h3>
              ${teacherName ? `<p class="future-meta">${teacherName}${discipline ? ` · ${discipline}` : ''}</p>` : ''}
              <p class="future-where">${icon(fmt.formatIcon)} ${fmt.format}${fmt.location && fmt.location !== '—' ? ` · ${fmt.location}` : ''}</p>
            </div>
            <div class="future-status">
              <span class="status-pill status-pill--planned">${statusLabel}</span>
              <span class="future-chevron">${icon('chevron')}</span>
            </div>
          </a>
        `;
      })
      .join('');
  }

  // ====================================================
  // RENDERERS — Booking page
  // ====================================================
  function getQueryParam(name) {
    const m = new URLSearchParams(window.location.search);
    return m.get(name);
  }

  function getBookingAgeKey() {
    const fromUrl = getQueryParam('age');
    return fromUrl || null;
  }

  function getBookingAgeName() {
    const key = getBookingAgeKey();
    if (!key) return null;
    return AGE_NAME_BY_URL[key] || key;
  }

  function getBookingLevelName() {
    const level = getQueryParam('level');
    return level || null;
  }

  function getBookingGroupMeta() {
    const level = getBookingLevelName();
    if (level) {
      return {
        title: level,
        label: level,
        categoryLabel: 'Уровень обучения',
        tags: [],
        image: LEVEL_IMG[level] || 'level-beginner',
      };
    }

    const ageName = getBookingAgeName();
    if (!ageName) {
      return {
        title: 'Запись на урок',
        label: 'Запись на урок',
        categoryLabel: 'Форма записи',
        tags: [],
        image: 'level-beginner',
      };
    }
    return {
      title: ageName,
      label: ageName,
      categoryLabel: 'Возрастная группа',
      tags: [],
      image: AGE_IMG[ageName] || 'boy-18plus',
    };
  }

  let _selectedDay = null;
  let _selectedSlotIndex = null;

  // SPA navigation state
  let _sharedInitDone = false;
  let _isPopNav = false;

  // ---- API caches (cleared on full page reload) ----
  let _teachersCache = null;        // full list from /api/teachers
  let _bookingTeacher = null;       // teacher currently shown on booking page

  // Schedule page state: full /api/schedule/me payload + currently selected
  // day ('YYYY-MM-DD') + currently displayed month in the calendar.
  let _scheduleData = null;
  let _selectedDate = null;
  let _scheduleViewYear = null;
  let _scheduleViewMonth = null;

  // Booking page calendar state: currently displayed month + fetched event
  // dots + cached slots for the selected day. Filled by API calls.
  let _bookingViewYear = null;
  let _bookingViewMonth = null;
  let _bookingMonthEvents = {};   // { day: 'green'|'gold' }
  let _bookingDaySlots = null;    // normalized [{ time, available, hot }]
  let _bookingOwnBookings = null; // active bookings of the logged-in student

  // Slots already booked in this browser session: blocks duplicate submits
  // before the server's unique index would 409. A student cannot book
  // the same date/time even with a different teacher.
  const _bookedSlots = new Set();
  function bookedKey(teacherId, dateIso, time) {
    return `${dateIso}|${String(time || '').slice(0, 5)}`;
  }

  function bookingDateOf(b) {
    return String(b?.date || b?.lesson_date || '').slice(0, 10);
  }

  function bookingTimeOf(b) {
    return String(b?.time_slot || b?.time || '').slice(0, 5);
  }

  async function loadOwnBookingConflicts() {
    _bookedSlots.clear();
    const user = API.getUser();
    if (!API.getToken() || user?.role !== 'student') {
      _bookingOwnBookings = [];
      return;
    }

    try {
      const bookings = await API.get(`/bookings?scope=mine&from=${todayIsoLocal()}`);
      _bookingOwnBookings = (bookings || []).filter((b) => (
        ['pending', 'confirmed'].includes(b.status) &&
        bookingDateOf(b) &&
        bookingTimeOf(b)
      ));
      for (const b of _bookingOwnBookings) {
        _bookedSlots.add(bookedKey(null, bookingDateOf(b), bookingTimeOf(b)));
      }
    } catch (err) {
      console.warn('Не удалось загрузить записи ученика:', err);
      _bookingOwnBookings = [];
    }
  }

  function findOwnBookingAt(dateIso, time) {
    const key = bookedKey(null, dateIso, time);
    return (_bookingOwnBookings || []).find((b) => (
      bookedKey(null, bookingDateOf(b), bookingTimeOf(b)) === key
    )) || null;
  }

  function findOwnBookingOnSelectedDay() {
    const dateIso = bookingDateIso(_selectedDay);
    if (!dateIso) return null;
    return (_bookingOwnBookings || []).find((b) => bookingDateOf(b) === dateIso) || null;
  }

  function ownBookingMessage(dateIso, time, booking) {
    const dateText = russianDateWithYear(dateIso);
    const teacherText = booking?.teacher_name ? ` у ${booking.teacher_name}` : '';
    return `Вы уже записаны на урок${teacherText}: ${dateText}, ${String(time || '').slice(0, 5)}. Посмотреть запись можно в разделе «Расписание».`;
  }

  function showOwnBookingNotice(dateIso, time, booking) {
    const shouldOpenSchedule = confirm(`${ownBookingMessage(dateIso, time, booking)}\n\nОткрыть расписание?`);
    if (shouldOpenSchedule) window.location.href = 'schedule.html';
  }

  // Day-of-month + currently viewed month  ->  'YYYY-MM-DD'
  function bookingDateIso(day) {
    const year  = _bookingViewYear  ?? DB.booking?.calendar?.year;
    const month = _bookingViewMonth ?? DB.booking?.calendar?.month;
    if (!year || !month || !day) return null;
    return formatDateYYYYMMDD(year, month, day);
  }

  async function ensureTeachers() {
    if (_teachersCache) return _teachersCache;
    try {
      _teachersCache = await API.get('/teachers');
      return _teachersCache;
    } catch (apiErr) {
      throw apiErr;
    }
  }

  function renderBookingHero() {
    const t = $('[data-render="booking-title"]');
    const s = $('[data-render="booking-subtitle"]');
    if (t && DB.booking?.pageTitle) t.textContent = DB.booking.pageTitle;
    if (s && DB.booking?.pageSubtitle) s.textContent = DB.booking.pageSubtitle;

    const slotsT = $('[data-render="slots-title"]');
    if (slotsT && DB.booking?.slotsTitle) slotsT.textContent = DB.booking.slotsTitle;

    const ctaLabel = $('[data-render="cta-label"]');
    if (ctaLabel && DB.booking?.cta?.label) ctaLabel.textContent = DB.booking.cta.label;
    const ctaNote = $('[data-render="cta-note"]');
    if (ctaNote && DB.booking?.cta?.note) ctaNote.textContent = DB.booking.cta.note;
  }

  function renderBookingGroup() {
    const slot = $('[data-render="booking-group"]');
    if (!slot || !DB.booking) return;
    const g = getBookingGroupMeta();
    if (!g) return;
    const badge = DB.booking.stats?.availabilityBadge || 'Доступно';
    const tags = g.tags || [];
    slot.innerHTML = `
      <div class="group-icon">${icon('people')}</div>
      <div class="group-info">
        <span class="group-eyebrow">${g.categoryLabel}</span>
        <h2 class="group-title">${g.title}</h2>
        ${tags.length ? `<p class="group-tags">${tags.map((t) => `<span>${t}</span>`).join('<i class="bullet"></i>')}</p>` : ''}
      </div>
      <div class="group-image" data-img="${g.image}"></div>
      <span class="group-badge">${badge}</span>
    `;
  }

  // Render the booking-page month calendar:
  //   - draws current view month grid + arrows
  //   - fetches event dots for (_bookingTeacher.id, view month) from API
  //   - day click selects day + reloads slots
  //   - arrows shift the month and refetch everything
  async function renderBookingCalendar() {
    const slot = $('[data-render="booking-calendar"]');
    if (!slot) return;

    // First-time init: take seed month from DB.booking.calendar
    if (_bookingViewYear === null || _bookingViewMonth === null) {
      const cal = DB.booking?.calendar;
      _bookingViewYear  = cal?.year  || new Date().getFullYear();
      _bookingViewMonth = cal?.month || (new Date().getMonth() + 1);
    }
    if (_selectedDay === null) {
      _selectedDay = DB.booking?.calendar?.selectedDay ?? null;
    }

    // Draw shell immediately (with whatever events are cached)
    drawBookingCalendarShell(slot);

    // Fetch dots for the current (teacher, year, month). If anything fails
    // we keep whatever was already cached and don't blow up the UI.
    if (_bookingTeacher?.id) {
      try {
        const data = await API.get(
          `/teachers/${encodeURIComponent(_bookingTeacher.id)}/calendar` +
          `?year=${_bookingViewYear}&month=${_bookingViewMonth}`
        );
        _bookingMonthEvents = {};
        const days = data?.days || data || [];
        for (const d of days) {
          if (d && typeof d === 'object' && d.day != null) {
            _bookingMonthEvents[d.day] = d.status || (d.is_public ? 'gold' : 'green');
          }
        }
        drawBookingCalendarShell(slot);
      } catch (err) {
        console.warn('Не удалось загрузить календарь преподавателя:', err);
        // Use seed dots ONLY when viewing the seed's own month — otherwise
        // April's dots would leak into May/June when backend is down.
        const seedCal = DB.booking?.calendar;
        if (seedCal &&
            _bookingViewYear === seedCal.year &&
            _bookingViewMonth === seedCal.month &&
            !Object.keys(_bookingMonthEvents).length) {
          _bookingMonthEvents = { ...(seedCal.eventsByDay || {}) };
          drawBookingCalendarShell(slot);
        }
      }
    }
  }

  function drawBookingCalendarShell(slot) {
    const cells = buildMonthGrid(_bookingViewYear, _bookingViewMonth);
    const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    slot.innerHTML = `
      <div class="calfull-head">
        <button class="cal-nav" data-nav="prev" aria-label="Предыдущий месяц">${icon('chevronLeft')}</button>
        <h3 class="calfull-month">${monthYearLabel(_bookingViewYear, _bookingViewMonth)}</h3>
        <button class="cal-nav" data-nav="next" aria-label="Следующий месяц">${icon('chevron')}</button>
      </div>
      <div class="calfull-weekdays">
        ${weekdayLabels.map((w, i) => `<span class="${i === 6 ? 'is-sun' : ''}">${w}</span>`).join('')}
      </div>
      <div class="calfull-grid">
        ${cells.map((c) => {
          if (c.other) {
            return `<button class="cal-cell is-other" disabled><span class="d">${c.day}</span></button>`;
          }
          const ev = _bookingMonthEvents[c.day];
          const status = ev === 'gold' || ev === 'green' ? ev : '';
          const isSel = c.day === _selectedDay;
          const cellClasses = ['cal-cell'];
          if (isSel) cellClasses.push('is-selected');
          if (status) cellClasses.push('has-event', `has-event--${status}`);
          const eventTitle = status === 'gold'
            ? 'Есть запись на этот день'
            : status === 'green'
              ? 'Есть свободные слоты'
              : '';
          return `
            <button class="${cellClasses.join(' ')}" data-day="${c.day}" ${eventTitle ? `title="${eventTitle}" aria-label="${c.day}. ${eventTitle}"` : ''}>
              <span class="d">${c.day}</span>
              ${status ? `<span class="dot dot--${status}"></span>` : ''}
              ${isSel ? `<span class="cell-spark">${icon('sparkle')}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
      <div class="booking-calendar-legend" aria-label="Обозначения календаря">
        <span><i class="legend-dot legend-dot--free"></i>Свободно</span>
        <span><i class="legend-dot legend-dot--booked"></i>Есть записи</span>
        <span><i class="legend-dot legend-dot--empty"></i>Нет слотов</span>
      </div>
    `;

    // Day clicks
    $$('.cal-cell[data-day]', slot).forEach((btn) => {
      btn.addEventListener('click', async () => {
        _selectedDay = parseInt(btn.dataset.day, 10);
        _selectedSlotIndex = null;
        _bookingDaySlots = null;
        drawBookingCalendarShell(slot);
        renderBookingStats();
        await renderBookingSlots();
        renderBookingStats();
        await renderBookingTeacher();
        syncBookingCtaState();
      });
    });

    // Month arrows
    $$('.cal-nav[data-nav]', slot).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const dir = btn.dataset.nav === 'prev' ? -1 : +1;
        const nx = shiftMonth(_bookingViewYear, _bookingViewMonth, dir);
        _bookingViewYear  = nx.year;
        _bookingViewMonth = nx.month;
        // Drop selected day if it's no longer valid in the new month
        const daysInNew = new Date(_bookingViewYear, _bookingViewMonth, 0).getDate();
        if (_selectedDay && _selectedDay > daysInNew) _selectedDay = null;
        _selectedSlotIndex = null;
        _bookingDaySlots = null;
        _bookingMonthEvents = {};
        await renderBookingCalendar();
        renderBookingStats();
        await renderBookingSlots();
        renderBookingStats();
        await renderBookingTeacher();
        syncBookingCtaState();
      });
    });
  }

  function renderBookingStats() {
    const slot = $('[data-render="booking-stats"]');
    if (!slot || !DB.booking) return;
    const daySlots = _bookingDaySlots || [];
    const bookableSlots = getBookableBookingSlots();
    const slotsCount = bookableSlots.length;
    const dur = bookableSlots[0]?.duration_minutes
      || daySlots[0]?.duration_minutes
      || '—';
    const labels = DB.booking.stats || {};
    slot.innerHTML = `
      <div class="stat">
        <span class="stat-ic stat-ic--green">${icon('calIcon')}</span>
        <div class="stat-body">
          <small>${labels.slotsLabel}</small>
          <strong>${slotsCount}</strong>
        </div>
      </div>
      <span class="stat-divider">${icon('flower')}</span>
      <div class="stat">
        <span class="stat-ic stat-ic--gold">${icon('hourglass')}</span>
        <div class="stat-body">
          <small>${labels.durationLabel}</small>
          <strong>${dur} <span>${dur === '—' ? '' : labels.durationUnit}</span></strong>
        </div>
      </div>
    `;
  }

  // True if (current teacher, current selected day, slot.time) is already
  // booked in this session.
  function isSlotBooked(s) {
    const tId = _bookingTeacher?.id;
    const dateIso = bookingDateIso(_selectedDay);
    if (!tId || !dateIso) return false;
    return _bookedSlots.has(bookedKey(tId, dateIso, s.time));
  }

  function getBookableBookingSlots() {
    return (_bookingDaySlots || []).filter((s) => s.available && !isSlotBooked(s));
  }

  function getSelectedBookingSlot() {
    const slots = _bookingDaySlots || [];
    const selected = slots[_selectedSlotIndex];
    if (selected && selected.available && !isSlotBooked(selected)) return selected;
    return getBookableBookingSlots()[0] || null;
  }

  function syncBookingCtaState() {
    const cta = $('.booking-cta');
    if (!cta) return;

    const note = $('[data-render="cta-note"]');
    const user = API.getUser();
    const hasBookableSlot = !!getSelectedBookingSlot();

    if (API.getToken() && user && user.role !== 'student') {
      cta.disabled = true;
      if (note) note.textContent = 'Только ученики могут записываться на уроки';
      return;
    }

    if (!hasBookableSlot) {
      const own = findOwnBookingOnSelectedDay();
      cta.disabled = true;
      if (note) {
        note.textContent = own
          ? `Уже записаны: ${russianDateWithYear(bookingDateOf(own))}, ${bookingTimeOf(own)}`
          : 'Выберите дату со свободным временем';
      }
      return;
    }

    cta.disabled = false;
    if (note && DB.booking?.cta?.note) note.textContent = DB.booking.cta.note;
  }

  async function renderBookingSlots() {
    const slot = $('[data-render="booking-slots"]');
    if (!slot) return;

    // 1. Fetch slots for (teacher, selectedDay) from API; cache on _bookingDaySlots.
    if (_bookingDaySlots === null && _bookingTeacher?.id && _selectedDay) {
      const dateIso = bookingDateIso(_selectedDay);
      try {
        const data = await API.get(
          `/teachers/${encodeURIComponent(_bookingTeacher.id)}/schedule?date=${dateIso}`
        );
        const arr = data?.slots || data || [];
        _bookingDaySlots = arr.map(normalizeApiSlot).filter((s) => s.time);
      } catch (err) {
        console.warn('Не удалось загрузить слоты дня:', err);
        _bookingDaySlots = [];
      }
    }

    let slots = (_bookingDaySlots && _bookingDaySlots.length)
      ? _bookingDaySlots
      : [];

    const hasBookableSlot = slots.some((s) => s.available && !isSlotBooked(s));

    if (!slots.length || !hasBookableSlot) {
      const own = findOwnBookingOnSelectedDay();
      slot.innerHTML = own
        ? `<p class="empty-state">${ownBookingMessage(bookingDateOf(own), bookingTimeOf(own), own)}</p>`
        : `<p class="empty-state">На этот день нет свободных слотов</p>`;
      _selectedSlotIndex = null;
      return;
    }

    if (_selectedSlotIndex === null) {
      let idx = slots.findIndex((s) => s.hot && s.available && !isSlotBooked(s));
      if (idx < 0) idx = slots.findIndex((s) => s.available && !isSlotBooked(s));
      _selectedSlotIndex = idx >= 0 ? idx : 0;
    }

    slot.innerHTML = slots
      .map((s, i) => {
        const booked = isSlotBooked(s);
        const isActive = i === _selectedSlotIndex && !booked;
        const cls = ['slot-btn'];
        if (!s.available || booked) cls.push('is-disabled');
        if (isActive) cls.push('is-active');
        if (s.hot && !isActive && !booked) cls.push('is-hot');
        if (s.is_group) cls.push('is-group');

        // Just a "Группа" hint for group slots — the platform allows
        // unlimited students per (teacher, date, time), so a numeric
        // "free/total" badge would be misleading.
        const badge = booked
          ? `<span class="slot-cap" title="Вы уже записаны на это время">Ваша запись</span>`
          : s.is_group
            ? `<span class="slot-cap" title="Групповой урок">Группа</span>`
            : '';

        return `
          <button class="${cls.join(' ')}" data-slot="${i}" ${s.available && !booked ? '' : 'disabled'}>
            <span class="slot-time">${s.time}</span>
            ${badge}
            ${isActive || s.hot ? `<span class="slot-spark">${icon('sparkle')}</span>` : ''}
          </button>
        `;
      })
      .join('');

    $$('.slot-btn[data-slot]', slot).forEach((btn) => {
      btn.addEventListener('click', () => {
        _selectedSlotIndex = parseInt(btn.dataset.slot, 10);
        renderBookingSlots();
        syncBookingCtaState();
      });
    });
  }

  async function renderBookingTeacher() {
    const slot = $('[data-render="booking-teacher"]');
    if (!slot || !DB.booking) return;

    if (Array.isArray(_bookingDaySlots) && !getBookableBookingSlots().length) {
      const own = findOwnBookingOnSelectedDay();
      slot.innerHTML = own
        ? `<p class="empty-state">${ownBookingMessage(bookingDateOf(own), bookingTimeOf(own), own)}</p>`
        : `<p class="empty-state">На выбранную дату у преподавателя нет доступного времени</p>`;
      return;
    }

    let teachers;
    try {
      teachers = await ensureTeachers();
    } catch (err) {
      console.error('Не удалось загрузить преподавателей:', err);
      slot.innerHTML = `<p class="empty-state">Не удалось загрузить преподавателя</p>`;
      return;
    }
    if (!teachers || !teachers.length) {
      slot.innerHTML = `<p class="empty-state">Преподаватели пока не добавлены</p>`;
      return;
    }

    const level = getBookingLevelName();
    const ageLabel = getBookingAgeName();
    const t = teachers.find((teacher) => (
      level && (teacher.levels || []).includes(level)
    )) || teachers.find((teacher) => (
      !level && ageLabel && (teacher.age_groups || []).includes(ageLabel)
    )) || teachers[0];
    _bookingTeacher = t;

    const teacherLabel = DB.booking.teacherLabel || 'Преподаватель';
    const initial = (t.name || '?').trim().charAt(0).toUpperCase();
    const subtitle = [t.bio, t.experience && `Опыт: ${t.experience}`]
      .filter(Boolean)
      .join(' · ');

    slot.innerHTML = `
      <div class="teacher-avatar avatar-lg is-male">
        ${initial}
      </div>
      <div class="teacher-body">
        <span class="teacher-eyebrow">${teacherLabel}</span>
        <h3 class="teacher-name">${t.name}</h3>
        <p class="teacher-subtitle">${subtitle}</p>
        <div class="teacher-formats">
          <span class="format-pill format-pill--green">${icon('monitor')} Онлайн</span>
          <span class="format-pill format-pill--gold">${icon('pin')} Офлайн</span>
        </div>
      </div>
    `;
  }

  // ====================================================
  // SPA NAVIGATION
  // ====================================================
  async function navigateTo(href) {
    if (!href || href === '#') return;

    // Stop quote auto-rotation when leaving home
    if (_quoteTimer) { clearInterval(_quoteTimer); _quoteTimer = null; }

    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error('fetch failed');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Swap <main>
      const newMain = doc.querySelector('main');
      const curMain = document.querySelector('main');
      if (newMain && curMain) curMain.replaceWith(newMain);

      // Update body class, title, header actions
      document.body.className = doc.body.className;
      document.title = doc.title;
      const newAct = doc.querySelector('.header-actions');
      const curAct = document.querySelector('.header-actions');
      if (newAct && curAct) curAct.innerHTML = newAct.innerHTML;

      // Sync active state in nav + tabs
      const file = href.split('?')[0].split('/').pop() || 'index.html';
      $$('.main-nav .nav-link, .mobile-tabs .tab').forEach(el => {
        const elFile = (el.getAttribute('href') || '').split('?')[0].split('/').pop() || 'index.html';
        el.classList.toggle('active', elFile === file);
      });

      // Push history (but not on browser back/forward)
      if (!_isPopNav) history.pushState({ href }, doc.title, href);

      // Scroll to top instantly
      window.scrollTo(0, 0);

      // Reset per-page transient state
      if (doc.body.classList.contains('page-booking')) {
        _selectedDay = null;
        _selectedSlotIndex = null;
        _bookingTeacher = null;
        _bookingViewYear = null;
        _bookingViewMonth = null;
        _bookingMonthEvents = {};
        _bookingDaySlots = null;
        _bookingOwnBookings = null;
      }
      if (doc.body.classList.contains('page-schedule')) {
        _scheduleData = null;
        _selectedDate = null;
        _scheduleViewYear = null;
        _scheduleViewMonth = null;
      }
      if (doc.body.classList.contains('page-teachers')) {
        _activeFilter = 'all';
      }

      // Re-init shared utilities + page
      initShared();
      const bc = doc.body.classList;

      // Re-run auth guard: if logged-in user navigates to login/register
      // via SPA, send them to home. Same effect as on hard reload.
      if ((bc.contains('page-login') || bc.contains('page-register')) && API.getToken()) {
        window.location.replace('index.html');
        return;
      }

      if      (bc.contains('page-home'))     initHome();
      else if (bc.contains('page-schedule')) initSchedule();
      else if (bc.contains('page-booking'))  initBooking();
      else if (bc.contains('page-teachers')) initTeachers();
      else if (bc.contains('page-login'))    initLogin();
      else if (bc.contains('page-register')) initRegister();
      else if (bc.contains('page-profile'))  initProfile();
      else if (bc.contains('page-teacher'))  initTeacher();
      else if (bc.contains('page-admin'))    initAdmin();

    } catch (_) {
      // Fallback: hard navigation
      window.location.href = href;
    }
  }

  async function initBooking() {
    if (!DB.booking) return;

    // Reset booking-page transient state on every entry.
    _bookingViewYear = null;
    _bookingViewMonth = null;
    _bookingMonthEvents = {};
    _bookingDaySlots = null;
    _bookingOwnBookings = null;
    _selectedDay = null;
    _selectedSlotIndex = null;

    renderBookingHero();
    renderBookingGroup();
    await loadOwnBookingConflicts();
    renderBookingStats();

    // Teacher must be loaded before the calendar fetches event dots —
    // both API endpoints below depend on _bookingTeacher.id.
    await renderBookingTeacher();
    await renderBookingCalendar();
    await renderBookingSlots();
    renderBookingStats();
    await renderBookingTeacher();

    const cta = $('.booking-cta');
    const ctaLabelEl = cta ? $('[data-render="cta-label"]', cta) : null;
    const ctaBaseLabel = ctaLabelEl?.textContent || 'Записаться';

    // Visually disable the CTA + change the note for non-student users.
    // Anonymous users keep the normal-looking button (click handler shows
    // "Войдите, чтобы записаться на урок" alert).
    syncBookingCtaState();

    cta?.addEventListener('click', async () => {
      if (cta.disabled) return;

      // ── Auth gate ────────────────────────────────────────────
      const user = API.getUser();
      if (!API.getToken() || !user) {
        alert('Войдите, чтобы записаться на урок');
        return;
      }
      if (user.role !== 'student') {
        alert('Только ученики могут записываться на уроки');
        return;
      }

      const t = _bookingTeacher;
      const activeSlots = _bookingDaySlots || [];
      const slotData = activeSlots[_selectedSlotIndex];
      const day = _selectedDay;

      // ── Validate before sending ──────────────────────────────
      if (!t || !t.id) { alert('Преподаватель ещё не загружен.');         return; }
      if (!day)        { alert('Выберите день в календаре.');             return; }
      if (!slotData)   { alert('Выберите время.');                        return; }

      const lessonDate = bookingDateIso(day);
      if (!lessonDate) { alert('Не удалось сформировать дату.');          return; }

      if (_bookedSlots.has(bookedKey(t.id, lessonDate, slotData.time))) {
        const existing = findOwnBookingAt(lessonDate, slotData.time);
        showOwnBookingNotice(lessonDate, slotData.time, existing);
        return;
      }

      // ── Discipline: prefer overlap of selected card tags ∩ teacher disciplines ──
      const ageKey = getBookingAgeKey();
      const groupMeta = getBookingGroupMeta();
      const selectedTags = groupMeta?.tags || [];
      const teacherDiscs = t.disciplines || [];
      const discipline =
        selectedTags.find((tag) => teacherDiscs.includes(tag)) ||
        teacherDiscs[0] ||
        'Таджвид';

      // ── Disable CTA while POSTing ────────────────────────────
      cta.disabled = true;
      if (ctaLabelEl) ctaLabelEl.textContent = 'Запись…';

      try {
        // Backend resolves student_id from the JWT user and fills
        // teacher_name from teachers.name by teacher_id — we don't send those.
        const result = await API.post('/bookings', {
          teacher_id: t.id,
          lesson_date: lessonDate,
          time_slot: slotData.time,
          discipline_name: discipline,
        });

        // Block this slot in the UI so re-clicking can't double-submit
        _bookedSlots.add(bookedKey(t.id, lessonDate, slotData.time));
        _selectedSlotIndex = null;
        renderBookingSlots();
        renderBookingStats();
        await renderBookingTeacher();
        syncBookingCtaState();

        showBookingSuccessModal({
          ageGroup: groupMeta?.label || getBookingAgeName() || ageKey || 'Запись',
          groupLabel: groupMeta?.categoryLabel || 'Группа',
          dateIso: lessonDate,
          time: slotData.time,
          teacherName: result?.teacher_name || t.name,
          meetingUrl: result?.meeting_url || result?.zoom_link || '',
          isGroup: !!slotData.is_group,
        });
      } catch (err) {
        console.error('Booking failed:', err);
        if (err.status === 409) {
          // Server says the slot is taken — sync UI to that truth.
          await loadOwnBookingConflicts();
          const existing = err.data?.booking || findOwnBookingAt(lessonDate, slotData.time);
          _bookedSlots.add(bookedKey(t.id, lessonDate, slotData.time));
          _selectedSlotIndex = null;
          renderBookingSlots();
          renderBookingStats();
          await renderBookingTeacher();
          syncBookingCtaState();
          showOwnBookingNotice(lessonDate, slotData.time, existing);
        } else if (err.status === 400) {
          alert(`Ошибка данных: ${err.message}`);
        } else {
          alert(`Не удалось записаться: ${err.message}`);
        }
      } finally {
        if (ctaLabelEl) ctaLabelEl.textContent = ctaBaseLabel;
        syncBookingCtaState();
      }
    });
  }

  // ====================================================
  // RENDERERS — Teachers page
  // ====================================================
  function pluralLessons(n) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'урок';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'урока';
    return 'уроков';
  }

  function pluralReviews(n) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'отзыв';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'отзыва';
    return 'отзывов';
  }

  // Map a discipline name to one of the existing icon keys.
  function categoryIconFor(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('арабск'))   return 'language';
    if (n.includes('фикх'))     return 'scales';
    if (n.includes('таджвид'))  return 'feather';
    return 'quran';
  }

  // ── Date / status helpers used by the schedule renderers ───────
  const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const WEEKDAYS_FULL  = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
  const MONTHS_SHORT   = ['янв.','фев.','мар.','апр.','мая','июн.','июл.','авг.','сен.','окт.','ноя.','дек.'];
  const MONTHS_FULL    = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const MONTHS_TITLE   = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  // Index used by both `dow` (1=Mon..7=Sun) and JS Date.getDay() (0=Sun..6=Sat).
  function dowIndexFromDate(iso) {
    if (!iso) return 0;
    const d = new Date(iso + 'T12:00:00');
    const js = d.getDay(); // 0=Sun..6=Sat
    return js === 0 ? 6 : js - 1; // -> 0=Mon..6=Sun
  }

  function dateParts(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return { year: y, month: m, day: d };
  }

  function todayDateRus() {
    const d = new Date();
    const wd = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return `${WEEKDAYS_FULL[wd]}, ${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
  }

  // 'YYYY-MM-DD' → 'Четверг, 30 апреля'
  function russianDateLong(iso) {
    const p = dateParts(iso);
    if (!p) return iso || '';
    const wd = WEEKDAYS_FULL[dowIndexFromDate(iso)] || '';
    return `${wd}, ${p.day} ${MONTHS_FULL[p.month - 1]}`;
  }

  // Russian date in the style "29 Апрель 2026" — used in the
  // booking-success modal where we want a year + capitalized month
  // (different from russianDateLong which is meant for headings).
  function russianDateWithYear(iso) {
    const p = dateParts(iso);
    if (!p) return iso || '';
    return `${p.day} ${MONTHS_TITLE[p.month - 1]} ${p.year}`;
  }

  /* =========================================================
     BOOKING SUCCESS MODAL
     Shows after a successful POST /api/bookings. Replaces the
     plain alert() that used to ship the same info.
  ========================================================= */
  function showBookingSuccessModal({
    ageGroup, groupLabel = 'Группа', dateIso, time, teacherName,
    meetingUrl, isGroup,
  } = {}) {
    // Avoid stacking multiple modals.
    document.querySelectorAll('.success-modal').forEach((n) => n.remove());

    const dateText = russianDateWithYear(dateIso);
    const seatsText = isGroup
      ? `<span class="success-seats">Групповой урок</span>`
      : '';
    const linkBlock = meetingUrl
      ? `
        <div class="success-link">
          <span class="success-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M10.5 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.4 1.4M13.5 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <div class="success-link-body">
            <small>Ссылка на урок:</small>
            <span class="success-link-url" title="${meetingUrl}">${meetingUrl}</span>
          </div>
          <div class="success-link-actions">
            <a class="btn btn--primary success-link-btn" href="${meetingUrl}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M14 4h6v6 M20 4 12 12 M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Открыть
            </a>
            <button class="btn btn--ghost success-link-btn" data-action="copy-link" data-url="${meetingUrl}">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              Скопировать
            </button>
          </div>
        </div>`
      : `
        <div class="success-link is-pending">
          <span class="success-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M10.5 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.4 1.4M13.5 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <div class="success-link-body">
            <small>Ссылка на урок:</small>
            <span class="success-link-url muted">появится после подтверждения преподавателем</span>
          </div>
        </div>`;

    const html = `
      <div class="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
        <div class="success-modal__backdrop" data-action="close"></div>
        <div class="success-modal__card" role="document">
          <button class="success-modal__close" aria-label="Закрыть" data-action="close">×</button>

          <div class="success-modal__hero">
            <span class="success-modal__leaf success-modal__leaf--left" aria-hidden="true">
              <svg viewBox="0 0 80 60"><path d="M5 30 C 25 5, 50 5, 75 28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M14 28 C 18 18, 28 14, 38 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M28 24 C 32 16, 42 14, 50 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="14" cy="29" r="1.6" fill="currentColor"/><circle cx="40" cy="20" r="1.6" fill="currentColor"/></svg>
            </span>
            <span class="success-modal__leaf success-modal__leaf--right" aria-hidden="true">
              <svg viewBox="0 0 80 60"><path d="M75 30 C 55 5, 30 5, 5 28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M66 28 C 62 18, 52 14, 42 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M52 24 C 48 16, 38 14, 30 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="66" cy="29" r="1.6" fill="currentColor"/><circle cx="40" cy="20" r="1.6" fill="currentColor"/></svg>
            </span>
            <span class="success-modal__check" aria-hidden="true">
              <img src="assets/images/logo.png" alt="" class="success-modal__logo" />
              <span class="success-modal__check-overlay">
                <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#2D5F3F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </span>
            <span class="success-modal__sparkle s1">✦</span>
            <span class="success-modal__sparkle s2">✦</span>
            <span class="success-modal__sparkle s3">✦</span>
          </div>

          <h2 id="success-modal-title" class="success-modal__title">Записан!</h2>
          <div class="success-modal__divider" aria-hidden="true">
            <span></span><svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 1 L9.4 6.6 L15 8 L9.4 9.4 L8 15 L6.6 9.4 L1 8 L6.6 6.6 Z" fill="currentColor"/></svg><span></span>
          </div>

          <ul class="success-modal__rows">
            <li class="success-row">
              <span class="success-row__icon">
                <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 19c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5 M14.5 18c.3-2.2 2-3.4 4.5-3.4s3.5 1.2 3.7 3.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              </span>
              <span class="success-row__label">${groupLabel}:</span>
              <span class="success-row__value">${ageGroup} ${seatsText}</span>
            </li>
            <li class="success-row">
              <span class="success-row__icon">
                <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 10h17 M8 3v4 M16 3v4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              </span>
              <span class="success-row__label">Дата:</span>
              <span class="success-row__value">${dateText}</span>
            </li>
            <li class="success-row">
              <span class="success-row__icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5.2L15.5 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              </span>
              <span class="success-row__label">Время:</span>
              <span class="success-row__value">${time}</span>
            </li>
            <li class="success-row">
              <span class="success-row__icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 21c0-3.6 3.6-5.4 8-5.4s8 1.8 8 5.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              </span>
              <span class="success-row__label">Преподаватель:</span>
              <span class="success-row__value">${teacherName || ''}</span>
            </li>
          </ul>

          ${linkBlock}

          <button class="btn btn--primary success-modal__cta" data-action="close">Закрыть</button>
        </div>
      </div>
    `;

    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const modal = wrap.firstElementChild;
    document.body.appendChild(modal);
    document.body.classList.add('no-scroll');

    function close() {
      modal.classList.add('is-leaving');
      setTimeout(() => {
        modal.remove();
        document.body.classList.remove('no-scroll');
      }, 180);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    modal.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const action = t.dataset.action;
      if (action === 'close') close();
      if (action === 'copy-link') {
        const url = t.dataset.url || '';
        navigator.clipboard?.writeText(url).then(
          () => { t.classList.add('is-copied'); t.lastChild.textContent = ' Скопировано!'; },
          () => { /* clipboard not granted, ignore */ }
        );
      }
    });
    document.addEventListener('keydown', onKey);

    // Trigger entrance animation on next frame.
    requestAnimationFrame(() => modal.classList.add('is-open'));
  }

  // ── Month-grid helpers (shared by booking + schedule calendars) ────
  function pad2(n) { return String(n).padStart(2, '0'); }

  function formatDateYYYYMMDD(year, month, day) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  function monthYearLabel(year, month) {
    return `${MONTHS_TITLE[month - 1]} ${year}`;
  }

  function shiftMonth(year, month, delta) {
    let m = month + delta, y = year;
    while (m < 1)  { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    return { year: y, month: m };
  }

  // Always returns 42 cells (6 rows × 7 cols) for stable month nav.
  // Each cell: { day, date: 'YYYY-MM-DD', other: bool }
  function buildMonthGrid(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysInPrev  = new Date(year, month - 1, 0).getDate();
    let firstWeekday = new Date(year, month - 1, 1).getDay() - 1; // 0 = Mon
    if (firstWeekday < 0) firstWeekday = 6;

    const prev = shiftMonth(year, month, -1);
    const next = shiftMonth(year, month, +1);

    const cells = [];
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      cells.push({ day: d, date: formatDateYYYYMMDD(prev.year, prev.month, d), other: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, date: formatDateYYYYMMDD(year, month, d), other: false });
    }
    let nd = 1;
    while (cells.length < 42) {
      cells.push({ day: nd, date: formatDateYYYYMMDD(next.year, next.month, nd), other: true });
      nd++;
    }
    return cells;
  }

  // Normalize /api/teachers/:id/schedule payload (server may return
  // { slots: [...] } or a bare array, with `slot_time` or `time`).
  // Availability is decided by the server (slot's own `is_available`
  // flag); we don't gate on counts here because many students may
  // book the same (teacher, date, time).
  function normalizeApiSlot(s) {
    const capacity = Number.isFinite(s.capacity) ? Math.max(1, s.capacity) : 1;
    const booked   = Number.isFinite(s.booked)   ? Math.max(0, s.booked)   : 0;
    return {
      time: (s.time || s.slot_time || '').toString().slice(0, 5),
      available: s.available !== false && s.is_available !== false,
      hot: !!(s.hot ?? s.is_hot),
      duration_minutes: s.duration_minutes,
      capacity,
      booked,
      is_group: capacity > 1 || !!s.is_group,
    };
  }

  function todayIsoLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Resize an image File to a max edge of `maxSize` px and return
  // a data: URL (JPEG, given quality 0..1). Used for avatar uploads
  // so we can stay well under the 1 MB JSON limit on /users/me/avatar.
  function resizeImageToDataURL(file, maxSize = 512, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Не удалось декодировать изображение'));
        img.onload = () => {
          let { width: w, height: h } = img;
          const k = Math.min(1, maxSize / Math.max(w, h));
          w = Math.round(w * k);
          h = Math.round(h * k);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (err) {
            reject(err);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Resize an image File/Blob to a square data:image/jpeg URL.
  // Used for avatar uploads — keeps the row in postgres compact.
  function resizeImageToDataUrl(file, size = 400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Файл не похож на изображение'));
        img.onload = () => {
          // Draw centered cover-fit crop into a square canvas.
          const c = document.createElement('canvas');
          c.width = size; c.height = size;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, size, size);
          const scale = Math.max(size / img.width, size / img.height);
          const w = img.width * scale, h = img.height * scale;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function statusLabelFor(status) {
    return ({
      pending:   'Ожидает',
      confirmed: 'Подтверждён',
      cancelled: 'Отменён',
      completed: 'Завершён',
    })[status] || status || '';
  }

  function pickFormat(b) {
    const url = b.meeting_url || b.zoom_link;
    if (url) {
      let provider = b.meeting_provider;
      if (!provider) {
        if (/zoom/i.test(url))         provider = 'Zoom';
        else if (/meet\.google/i.test(url)) provider = 'Google Meet';
        else if (/teams/i.test(url))   provider = 'MS Teams';
        else                           provider = 'Онлайн';
      }
      return { formatIcon: 'video', format: 'Онлайн', location: provider, url };
    }
    return { formatIcon: 'pin', format: 'Офлайн', location: '—', url: null };
  }

  let _activeFilter = 'all';

  function renderWelcomeCard() {
    const slot = $('[data-render="welcome-card"]');
    if (!slot || !DB.teachersPage) return;
    const t = DB.teachersPage;
    const cur = (typeof API !== 'undefined' && API.getUser) ? API.getUser() : null;
    const userName = cur?.name || t.welcomeUserName || 'Гость';
    slot.innerHTML = `
      <div class="welcome-avatar">${icon('person')}</div>
      <div class="welcome-text">
        <span class="welcome-greet">${t.welcomeText} <span class="welcome-spark">${icon('sparkleSmall')}</span></span>
        <strong class="welcome-name">${userName}</strong>
      </div>
      <div class="welcome-actions">
        <button class="icon-btn" aria-label="Поиск">${icon('search')}</button>
        <button class="icon-btn" aria-label="Фильтры">${icon('sliders')}</button>
      </div>
    `;
  }

  function renderTeachersHero() {
    const t = $('[data-render="teachers-title"]');
    const s = $('[data-render="teachers-subtitle"]');
    if (t && DB.teachersPage?.title) t.textContent = DB.teachersPage.title;
    if (s && DB.teachersPage?.subtitle) s.textContent = DB.teachersPage.subtitle;
  }

  // Keep the public teachers page simple: only the all-teachers chip is shown.
  function renderFilters() {
    const slot = $('[data-render="teachers-filters"]');
    if (!slot) return;

    const filters = [{ key: 'all', label: 'Все' }];

    slot.innerHTML = filters
      .map(
        (f) => `
        <button class="chip ${f.key === _activeFilter ? 'is-active' : ''}" data-filter="${f.key}">
          ${f.label}
        </button>
      `
      )
      .join('');

    $$('.chip[data-filter]', slot).forEach((btn) => {
      btn.addEventListener('click', () => {
        _activeFilter = btn.dataset.filter;
        renderFilters();
        renderTeachersList();
      });
    });
  }

  // Optional level filter (set by ?level=… in the URL when arriving
  // from a level card). When present, the list is filtered both by
  // the active discipline chip *and* by this level.
  let _activeLevel = null;

  function renderTeachersList() {
    const slot = $('[data-render="teachers-list"]');
    if (!slot) return;
    const teachers = _teachersCache || [];

    let list = teachers;
    if (_activeFilter !== 'all') {
      list = list.filter((t) => (t.disciplines || []).includes(_activeFilter));
    }
    if (_activeLevel) {
      list = list.filter((t) => (t.levels || []).includes(_activeLevel));
    }

    if (!list.length) {
      const note = _activeLevel
        ? `Нет преподавателей с уровнем «${_activeLevel}»${_activeFilter !== 'all' ? ` и дисциплиной «${_activeFilter}»` : ''}.`
        : 'Нет преподавателей по выбранной категории';
      slot.innerHTML = `<p class="empty-state">${note}</p>`;
      return;
    }

    slot.innerHTML = list
      .map((t) => {
        const initial = (t.name || '?').trim().charAt(0).toUpperCase();
        const cat = (t.disciplines && t.disciplines[0]) || 'Коран';
        const catIcon = categoryIconFor(cat);
        const rating = Number(t.rating) || 0;
        const reviews = Number(t.review_count) || 0;
        // Show only the experience line ("Опыт: 8 лет"), not the bio.
        // Skip the row entirely when no experience is set.
        const expLine = t.experience
          ? `<p class="teacher-row-desc">Опыт: ${t.experience}</p>`
          : '';
        const photo = t.photo_url
          ? `<img src="${t.photo_url}" alt="${t.name}" onerror="this.style.display='none'"/>`
          : '';
        return `
        <article class="teacher-row" data-teacher-id="${t.id}">
          <div class="teacher-row-photo is-male">
            ${photo}
            <span class="teacher-row-initial">${initial}</span>
            ${t.is_active ? `<span class="teacher-verified">${icon('sparkleSmall')}</span>` : ''}
          </div>
          <div class="teacher-row-body">
            <div class="teacher-row-head">
              <h3 class="teacher-row-name">${t.name}</h3>
              <div class="teacher-row-stats">
                <span class="teacher-row-rating">${icon('star')} ${rating.toFixed(1)}</span>
                <span class="teacher-row-lessons">${reviews} ${pluralReviews(reviews)}</span>
              </div>
            </div>
            <span class="cat-pill">${icon(catIcon)} ${cat}</span>
            ${expLine}
            <div class="teacher-row-actions">
              <button class="btn-outline" type="button">${icon('info')} Подробнее</button>
              <button class="btn-solid" type="button"
                      data-action="message-teacher"
                      data-peer-id="${escapeAttr(t.user_id || t.id)}"
                      data-teacher-name="${escapeAttr(t.name || 'преподаватель')}">
                ${icon('message')} Написать
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    bindTeacherMessageActions(slot);
  }

  function teacherChatLoginUrl() {
    const current =
      (window.location.pathname.split('/').pop() || 'teachers.html') +
      window.location.search;
    return `login.html?next=${encodeURIComponent(current)}`;
  }

  async function bindTeacherMessageActions(root) {
    root.querySelectorAll('[data-action="message-teacher"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!API.getToken()) {
          alert('Войдите как ученик, чтобы написать преподавателю');
          window.location.href = teacherChatLoginUrl();
          return;
        }

        let user = API.getUser();
        try {
          if (!user?.role) {
            user = await API.get('/auth/me');
            API.setUser(user);
          }
        } catch (_) {
          API.clearAuth();
          alert('Войдите как ученик, чтобы написать преподавателю');
          window.location.href = teacherChatLoginUrl();
          return;
        }

        if (user.role !== 'student') {
          alert('Написать преподавателю может только авторизованный ученик');
          return;
        }

        const peerId = btn.dataset.peerId;
        if (!peerId) {
          alert('У преподавателя не привязан аккаунт для сообщений');
          return;
        }

        const oldHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `${icon('message')} Открываем…`;
        try {
          const created = await API.post('/chats', { peer_id: peerId });
          _chatList = await API.get('/chats');
          await openChatModal(created.id);
        } catch (err) {
          alert(`Не удалось открыть чат: ${err.message}`);
        } finally {
          btn.disabled = false;
          btn.innerHTML = oldHtml;
        }
      });
    });
  }

  async function initTeachers() {
    if (!DB.teachersPage) return;
    _activeFilter = _activeFilter || 'all';

    // ?level=Базовый etc. → filter the list to that level + show a banner.
    const lvlFromUrl = getQueryParam('level');
    _activeLevel = lvlFromUrl ? decodeURIComponent(lvlFromUrl) : null;

    renderWelcomeCard();
    renderTeachersHero();

    // Skeleton while loading
    const listSlot = $('[data-render="teachers-list"]');
    if (listSlot && !_teachersCache) {
      listSlot.innerHTML = `<p class="empty-state">Загрузка преподавателей…</p>`;
    }

    try {
      await ensureTeachers();
    } catch (err) {
      console.error('Не удалось загрузить список преподавателей:', err);
      if (listSlot) {
        listSlot.innerHTML = `<p class="empty-state">Не удалось подключиться к серверу. Проверьте, запущен ли backend на ${API.baseUrl}.</p>`;
      }
      return;
    }

    renderFilters();
    renderLevelBanner();
    renderTeachersList();
  }

  // Renders a small "filtering by level X — clear ✕" banner above the
  // teacher list when ?level= is set.
  function renderLevelBanner() {
    const heroSlot = $('[data-render="teachers-filters"]');
    if (!heroSlot) return;
    let banner = document.querySelector('.level-banner');
    if (!_activeLevel) {
      if (banner) banner.remove();
      return;
    }
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'level-banner';
      heroSlot.parentNode.insertBefore(banner, heroSlot);
    }
    banner.innerHTML = `
      <span class="level-banner__label">Уровень:</span>
      <strong class="level-banner__value">${_activeLevel}</strong>
      <button class="level-banner__close" aria-label="Снять фильтр">×</button>
    `;
    banner.querySelector('.level-banner__close').onclick = () => {
      _activeLevel = null;
      const url = new URL(window.location.href);
      url.searchParams.delete('level');
      window.history.replaceState({}, '', url);
      renderLevelBanner();
      renderTeachersList();
    };
  }

  // ====================================================
  // PAGE INIT
  // ====================================================
  function initHome() {
    // The reflection card was removed from the hero; renderReflection
    // is no longer called.
    renderCurrentCourse();
    renderAgeGroups();
    renderLevels();
    renderQuote(_quoteIndex);
    restartQuoteRotation();

    // Pause rotation on hover
    const card = $('.section--quote');
    card?.addEventListener('mouseenter', () => clearInterval(_quoteTimer));
    card?.addEventListener('mouseleave', restartQuoteRotation);
  }

  async function initSchedule() {
    renderScheduleHero();

    const upcomingSlot = $('[data-render="upcoming"]');
    const futureSlot = $('[data-render="future"]');
    if (upcomingSlot) upcomingSlot.innerHTML = `<p class="empty-state">Загрузка…</p>`;
    if (futureSlot)   futureSlot.innerHTML   = '';

    // Seed the visible date even before the API responds — so the
    // calendar renders right away and stays usable when the backend
    // is unreachable.
    _selectedDate = todayIsoLocal();
    const seed = dateParts(_selectedDate);
    if (seed) {
      _scheduleViewYear  = seed.year;
      _scheduleViewMonth = seed.month;
    }
    _scheduleData = { week: [], upcoming: [], future: [] };
    renderCalendarFromAPI();

    let payload;
    try {
      payload = await API.get('/schedule/me');
    } catch (err) {
      console.error('Не удалось загрузить расписание:', err);
      const msg = `<p class="empty-state">Не удалось загрузить расписание из БД (${err.status || 'сеть'}).</p>`;
      if (upcomingSlot) upcomingSlot.innerHTML = msg;
      if (futureSlot)   futureSlot.innerHTML   = '';
      return;
    }

    _scheduleData = payload;

    // If backend marked a different "today", switch to it.
    const todayInWeek = (payload.week || []).find((d) => d.is_today);
    if (todayInWeek?.date)            _selectedDate = todayInWeek.date;
    else if (payload.week?.[0]?.date) _selectedDate = payload.week[0].date;

    const p = dateParts(_selectedDate);
    if (p) {
      _scheduleViewYear  = p.year;
      _scheduleViewMonth = p.month;
    }

    renderCalendarFromAPI();
    renderScheduleForDate();
  }

  // Re-renders the today card + upcoming + future blocks based on _selectedDate.
  // Called on initial load and on every calendar day click.
  function renderScheduleForDate() {
    if (!_scheduleData) return;

    const all = [
      ...(_scheduleData.upcoming || []),
      ...(_scheduleData.future || []),
    ];
    const onSelectedDay = all
      .filter((l) => l.date === _selectedDate)
      .sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));
    const afterSelectedDay = all
      .filter((l) => l.date > _selectedDate)
      .sort((a, b) =>
        ((a.date || '') + (a.time_slot || '')).localeCompare(
          (b.date || '') + (b.time_slot || '')
        )
      );

    renderTodayCard();
    renderUpcomingFromAPI(
      onSelectedDay,
      _selectedDate === todayIsoLocal()
        ? 'На сегодня уроков нет'
        : 'На этот день уроков нет'
    );
    renderFutureFromAPI(afterSelectedDay, 'Дальше уроков нет');
  }

  // ====================================================
  // SHARED INTERACTIONS
  // ====================================================
  function initShared() {
    // ── One-time setup (runs only on first call) ─────────────
    if (!_sharedInitDone) {
      _sharedInitDone = true;

      // Sticky header scroll effect
      window.addEventListener('scroll', () => {
        const h = $('#siteHeader');
        if (h) h.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });

      // Play button micro-animation (delegated, never duplicates)
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.play-btn');
        if (!btn) return;
        btn.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(0.9)' },
           { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
          { duration: 320, easing: 'ease-out' }
        );
      });

      // SPA: intercept all internal link clicks on the whole document
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href === '#' || /^(https?:|\/\/)/.test(href)) return;
        e.preventDefault();
        navigateTo(href);
      });

      // "Профиль" tab/nav link → go to profile.html (anon → login.html)
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href="#"]');
        if (!a) return;
        if (!a.classList.contains('nav-link') && !a.classList.contains('tab')) return;
        const label =
          a.querySelector('.tab-label')?.textContent?.trim() ||
          a.textContent.trim();
        if (label !== 'Профиль') return;
        e.preventDefault();
        if (API.getToken()) window.location.href = 'profile.html';
        else                window.location.href = 'login.html';
      });

      // SPA: browser back / forward
      window.addEventListener('popstate', () => {
        _isPopNav = true;
        const href =
          (window.location.pathname.split('/').pop() || 'index.html') +
          window.location.search;
        navigateTo(href).finally(() => { _isPopNav = false; });
      });

      // Save initial history entry so popstate can navigate back to it
      const initHref =
        (window.location.pathname.split('/').pop() || 'index.html') +
        window.location.search;
      history.replaceState({ href: initHref }, document.title);
    }

    // ── Per-navigation: update header scroll state ────────────
    const h = $('#siteHeader');
    if (h) h.classList.toggle('scrolled', window.scrollY > 20);

    // ── Per-navigation: scroll-reveal new sections ────────────
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.style.opacity = '1';
              e.target.style.transform = 'translateY(0)';
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
      );
      $$('.section').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        io.observe(el);
      });
    }
  }

  // ====================================================
  // BOOT
  // ====================================================
  // ====================================================
  // AUTH GUARD + FORM HANDLERS
  // ====================================================
  function isAuthPage() {
    return document.body.classList.contains('page-login') ||
           document.body.classList.contains('page-register');
  }

  // Returns false only when a redirect was triggered (caller stops init).
  // Anonymous browsing is allowed everywhere — only login/register pages
  // bounce a logged-in user to the home page.
  function authGuard() {
    if (isAuthPage() && API.getToken()) {
      window.location.replace(safeNextTarget() || 'index.html');
      return false;
    }
    return true;
  }

  function logout() {
    API.clearAuth();
    window.location.replace('login.html');
  }
  window.logout = logout; // accessible from console / future UI

  function showAuthError(msg) {
    const el = document.getElementById('authError');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-on', !!msg);
  }

  function bindAuthForm(formId, submitHandler) {
    const form = document.getElementById(formId);
    if (!form) return;
    const submitBtn = document.getElementById('authSubmit');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showAuthError('');
      if (submitBtn) submitBtn.disabled = true;
      try {
        await submitHandler(new FormData(form));
      } catch (err) {
        console.error('[auth]', err);
        showAuthError(err?.message || 'Что-то пошло не так');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function safeNextTarget() {
    const next = getQueryParam('next');
    if (!next || /^(?:[a-z]+:)?\/\//i.test(next) || next.includes('\\')) return null;
    const page = (next.split('?')[0] || 'index.html').split('/').pop();
    const allowed = new Set([
      'index.html',
      'teachers.html',
      'booking.html',
      'schedule.html',
      'profile.html',
    ]);
    return allowed.has(page) ? next : null;
  }

  function initLogin() {
    bindAuthForm('loginForm', async (fd) => {
      const email    = (fd.get('email')    || '').toString().trim();
      const password = (fd.get('password') || '').toString();
      if (!email || !password) {
        throw new Error('Заполните email и пароль');
      }
      const res = await API.post('/auth/login', { email, password });
      API.setToken(res.token);
      API.setUser(res.user);
      const next = safeNextTarget();
      const target = res.user?.role === 'teacher' ? 'teacher.html' : (next || 'index.html');
      window.location.replace(target);
    });
  }

  function initRegister() {
    bindAuthForm('registerForm', async (fd) => {
      const name     = (fd.get('name')     || '').toString().trim();
      const email    = (fd.get('email')    || '').toString().trim();
      const password = (fd.get('password') || '').toString();
      if (!name || !email || !password) {
        throw new Error('Заполните все поля');
      }
      if (password.length < 6) {
        throw new Error('Пароль должен быть не меньше 6 символов');
      }
      const res = await API.post('/auth/register', { name, email, password });
      API.setToken(res.token);
      API.setUser(res.user);
      window.location.replace('index.html');
    });
  }

  // ====================================================
  // TEACHER DASHBOARD
  // ====================================================
  let _teacherProfile = null;
  let _teacherSchedule = null;
  let _teacherSlotDate = null;        // 'YYYY-MM-DD' currently picked in slots-calendar
  let _teacherSlotsViewYear  = null;
  let _teacherSlotsViewMonth = null;

  function detectMeetingProvider(url) {
    if (!url) return null;
    if (/zoom\./i.test(url))           return 'Zoom';
    if (/meet\.google/i.test(url))     return 'Google Meet';
    if (/teams\.(microsoft|live)/i.test(url)) return 'MS Teams';
    return 'Online';
  }

  async function initTeacher() {
    const root = $('[data-render="teacher-dashboard"]');
    if (!root) return;

    if (!API.getToken()) {
      root.innerHTML = `<p class="teacher-empty">Войдите как преподаватель</p>`;
      return;
    }
    const cachedUser = API.getUser();
    if (cachedUser && cachedUser.role !== 'teacher') {
      root.innerHTML = `<p class="teacher-empty">У вас нет доступа</p>`;
      return;
    }

    try {
      const [profile, schedule] = await Promise.all([
        API.get('/teacher/me'),
        API.get('/teacher/me/schedule'),
      ]);
      _teacherProfile  = profile;
      _teacherSchedule = schedule;
    } catch (err) {
      if (err.status === 401) {
        root.innerHTML = `<p class="teacher-empty">Войдите как преподаватель</p>`;
        return;
      }
      if (err.status === 403) {
        root.innerHTML = `<p class="teacher-empty">У вас нет доступа</p>`;
        return;
      }
      root.innerHTML = `<p class="teacher-empty">Ошибка загрузки: ${err.message}</p>`;
      return;
    }

    // Prep slots-calendar default selection: today
    if (!_teacherSlotDate) _teacherSlotDate = todayIsoLocal();
    const p0 = dateParts(_teacherSlotDate);
    if (p0) { _teacherSlotsViewYear = p0.year; _teacherSlotsViewMonth = p0.month; }

    root.innerHTML = `
      <header class="teacher-hello">
        <h1>Кабинет преподавателя</h1>
        <p>Здравствуйте, ${_teacherProfile.name || 'преподаватель'}</p>
      </header>
      <section class="teacher-section">
        <h2>Мои уроки</h2>
        <div data-render="teacher-bookings"></div>
      </section>
      <section class="teacher-section">
        <h2>Мои слоты</h2>
        <div data-render="teacher-slots-calendar"></div>
        <div class="t-slots-day">
          <h3 class="teacher-block-title" data-render="teacher-slots-day-title"></h3>
          <div class="t-slots-list" data-render="teacher-slots-list">
            <p class="empty-state">Загрузка…</p>
          </div>
          <div class="t-add-slot">
            <input type="time" id="t-new-slot-time" />
            <input type="number" id="t-new-slot-cap" min="1" max="50" value="1"
                   title="1 — индивидуальный слот, 2+ — групповой слот"
                   aria-label="Формат слота" />
            <button class="btn-action" id="t-add-slot-btn">Добавить слот</button>
          </div>
          <p class="t-add-slot-hint">Поле формата: <strong>1</strong> — индивидуальный урок, <strong>2+</strong> — групповой. Это не ограничивает запись учеников.</p>
        </div>
      </section>
    `;

    renderTeacherBookings();
    renderTeacherSlotsCalendar();
    await reloadTeacherSlotsForDay();

    $('#t-add-slot-btn')?.addEventListener('click', addTeacherSlot);
  }

  // ─── Bookings list ───────────────────────────────────
  function renderTeacherBookings() {
    const slot = $('[data-render="teacher-bookings"]');
    if (!slot || !_teacherSchedule) return;

    const sections = [
      { title: 'Сегодня',     items: _teacherSchedule.today    || [], accent: 'green' },
      { title: 'Предстоящие', items: _teacherSchedule.upcoming || [], accent: 'gold'  },
      { title: 'Прошедшие',   items: _teacherSchedule.past     || [], accent: 'muted' },
    ];

    slot.innerHTML = sections.map((s) => `
      <div class="teacher-bookings-block">
        <h3 class="teacher-block-title">${s.title}</h3>
        ${
          s.items.length
            ? s.items.map((b) => bookingRowHtml(b, s.accent)).join('')
            : '<p class="empty-state">Нет уроков</p>'
        }
      </div>
    `).join('');

    bindTeacherBookingActions(slot);
  }

  function bookingRowHtml(b, accent) {
    const studentName = b.student_name || 'Ученик';
    const initial = studentName.trim().charAt(0).toUpperCase();
    const avatarImg = b.student_avatar_url
      ? `<img src="${b.student_avatar_url}" alt="" onerror="this.style.display='none'"/>`
      : '';
    const dateRu = russianDateLong(b.date);
    const time = (b.time_slot || '').slice(0, 5);
    const meetingUrl = b.meeting_url || '';

    const canConfirm = b.status === 'pending';
    const canCancel  = b.status !== 'cancelled' && b.status !== 'completed';
    const canEditLink = b.status !== 'cancelled' && b.status !== 'completed';

    return `
      <article class="t-booking" data-id="${b.id}">
        <div class="t-booking-time t-booking-time--${accent}">
          <span class="t-time">${time}</span>
          <span class="t-date">${dateRu}</span>
        </div>
        <div class="t-booking-student">
          <span class="t-avatar">${avatarImg}<span>${initial}</span></span>
          <div>
            <strong>${studentName}</strong>
            <small>${b.discipline_name || ''}${b.is_public ? ' · Группа' : ''}</small>
          </div>
        </div>
        <div class="t-booking-status">
          <span class="status-pill status-pill--${b.status}">${statusLabelFor(b.status)}</span>
        </div>
        <div class="t-booking-actions">
          ${canConfirm  ? `<button class="btn-action"               data-action="confirm">Подтвердить</button>` : ''}
          ${canCancel   ? `<button class="btn-action btn-action--danger" data-action="cancel">Отменить</button>` : ''}
          ${canEditLink ? `<button class="btn-action btn-action--ghost" data-action="link-toggle">${meetingUrl ? 'Изменить ссылку' : 'Добавить ссылку'}</button>` : ''}
          ${meetingUrl  ? `<a class="btn-action btn-action--ghost" href="${meetingUrl}" target="_blank" rel="noopener">Открыть</a>` : ''}
        </div>
        ${canEditLink ? `
          <div class="t-booking-link" hidden>
            <input type="url" placeholder="https://zoom.us/j/..." value="${meetingUrl}" />
            <button class="btn-action" data-action="link-save">Сохранить</button>
          </div>
        ` : ''}
      </article>
    `;
  }

  function bindTeacherBookingActions(root) {
    root.querySelectorAll('.t-booking').forEach((card) => {
      const id = card.dataset.id;

      card.querySelector('[data-action="confirm"]')?.addEventListener('click', async () => {
        try {
          await API.patch(`/bookings/${id}`, { status: 'confirmed' });
          await reloadTeacherSchedule();
        } catch (err) { alert(err.message); }
      });

      card.querySelector('[data-action="cancel"]')?.addEventListener('click', async () => {
        if (!confirm('Отменить урок?')) return;
        try {
          await API.patch(`/bookings/${id}`, { status: 'cancelled' });
          await reloadTeacherSchedule();
        } catch (err) { alert(err.message); }
      });

      const linkRow = card.querySelector('.t-booking-link');
      card.querySelector('[data-action="link-toggle"]')?.addEventListener('click', () => {
        if (linkRow) linkRow.hidden = !linkRow.hidden;
      });
      card.querySelector('[data-action="link-save"]')?.addEventListener('click', async () => {
        const input = linkRow?.querySelector('input');
        const url = (input?.value || '').trim();
        try {
          await API.patch(`/bookings/${id}`, {
            meeting_url: url || null,
            meeting_provider: url ? detectMeetingProvider(url) : null,
          });
          await reloadTeacherSchedule();
        } catch (err) { alert(err.message); }
      });
    });
  }

  async function reloadTeacherSchedule() {
    try {
      _teacherSchedule = await API.get('/teacher/me/schedule');
      renderTeacherBookings();
    } catch (err) {
      console.error('reloadTeacherSchedule', err);
    }
  }

  // ─── Slots calendar + per-day list ───────────────────
  function renderTeacherSlotsCalendar() {
    const slot = $('[data-render="teacher-slots-calendar"]');
    if (!slot) return;

    const cells = buildMonthGrid(_teacherSlotsViewYear, _teacherSlotsViewMonth);
    const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    slot.innerHTML = `
      <div class="calfull-head">
        <button class="cal-nav" data-nav="prev" aria-label="Предыдущий месяц">${icon('chevronLeft')}</button>
        <h3 class="calfull-month">${monthYearLabel(_teacherSlotsViewYear, _teacherSlotsViewMonth)}</h3>
        <button class="cal-nav" data-nav="next" aria-label="Следующий месяц">${icon('chevron')}</button>
      </div>
      <div class="calfull-weekdays">
        ${weekdayLabels.map((w, i) => `<span class="${i === 6 ? 'is-sun' : ''}">${w}</span>`).join('')}
      </div>
      <div class="calfull-grid">
        ${cells.map((c) => {
          const isSel = c.date === _teacherSlotDate;
          const cls = ['cal-cell'];
          if (c.other) cls.push('is-other');
          if (isSel)   cls.push('is-selected');
          return `
            <button class="${cls.join(' ')}" data-date="${c.date}">
              <span class="d">${c.day}</span>
              ${isSel ? `<span class="cell-spark">${icon('sparkle')}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    slot.querySelectorAll('.cal-cell[data-date]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const date = btn.dataset.date;
        if (!date) return;
        const p = dateParts(date);
        if (p && (p.year !== _teacherSlotsViewYear || p.month !== _teacherSlotsViewMonth)) {
          _teacherSlotsViewYear  = p.year;
          _teacherSlotsViewMonth = p.month;
        }
        _teacherSlotDate = date;
        renderTeacherSlotsCalendar();
        await reloadTeacherSlotsForDay();
      });
    });

    slot.querySelectorAll('.cal-nav[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.nav === 'prev' ? -1 : +1;
        const nx = shiftMonth(_teacherSlotsViewYear, _teacherSlotsViewMonth, dir);
        _teacherSlotsViewYear  = nx.year;
        _teacherSlotsViewMonth = nx.month;
        renderTeacherSlotsCalendar();
      });
    });

    const titleEl = $('[data-render="teacher-slots-day-title"]');
    if (titleEl) titleEl.textContent = `Слоты на ${russianDateLong(_teacherSlotDate)}`;
  }

  async function reloadTeacherSlotsForDay() {
    const slot = $('[data-render="teacher-slots-list"]');
    const titleEl = $('[data-render="teacher-slots-day-title"]');
    if (titleEl) titleEl.textContent = `Слоты на ${russianDateLong(_teacherSlotDate)}`;
    if (!slot) return;

    slot.innerHTML = `<p class="empty-state">Загрузка…</p>`;

    let slots = [];
    try {
      const data = await API.get(`/teacher/me/slots?date=${_teacherSlotDate}`);
      slots = data?.slots || [];
    } catch (err) {
      slot.innerHTML = `<p class="empty-state">Не удалось загрузить (${err.status || 'сеть'})</p>`;
      return;
    }

    if (!slots.length) {
      slot.innerHTML = `<p class="empty-state">На этот день нет слотов</p>`;
      return;
    }

    slot.innerHTML = slots.map((s) => {
      const time = String(s.slot_time || '').slice(0, 5);
      const cap = s.capacity || 1;
      const booked = s.booked || 0;
      const isGroup = cap > 1;
      const hasBookings = booked > 0;

      const chipCls = ['t-slot-chip'];
      if (isGroup)      chipCls.push('is-group');
      if (hasBookings)  chipCls.push('has-bookings');

      const badges = [
        isGroup ? `<span class="t-slot-cap" title="Групповой слот">Группа</span>` : '',
        hasBookings ? `<span class="t-slot-cap" title="Записано учеников">${booked} запис.</span>` : '',
      ].filter(Boolean).join('');

      // Allow deletion only when nothing is booked yet.
      const delBtn = hasBookings
        ? ''
        : `<button class="t-slot-delete" data-action="delete-slot" aria-label="Удалить слот">×</button>`;

      const editBtn = `<button class="t-slot-edit" data-action="edit-cap"
                              aria-label="Изменить формат" title="Изменить формат">⚙</button>`;

      return `
        <span class="${chipCls.join(' ')}" data-time="${time}" data-cap="${cap}" data-booked="${booked}">
          <span class="t-slot-time">${time}</span>
          ${badges}
          ${editBtn}
          ${delBtn}
        </span>
      `;
    }).join('');

    slot.querySelectorAll('.t-slot-chip').forEach((chip) => {
      chip.querySelector('[data-action="delete-slot"]')?.addEventListener('click', async () => {
        const time = chip.dataset.time;
        if (!time || !confirm(`Удалить слот ${time}?`)) return;
        try {
          await API.del(
            `/teachers/${encodeURIComponent(_teacherProfile.id)}/slots`,
            { date: _teacherSlotDate, time }
          );
          await reloadTeacherSlotsForDay();
        } catch (err) { alert(err.message); }
      });

      chip.querySelector('[data-action="edit-cap"]')?.addEventListener('click', async () => {
        const time   = chip.dataset.time;
        const curCap = parseInt(chip.dataset.cap, 10) || 1;
        const booked = parseInt(chip.dataset.booked, 10) || 0;
        const raw = prompt(
          `Слот ${time}\nЗаписано учеников: ${booked}\nФормат (1 = индивидуально, 2+ = группа, не лимит мест):`,
          String(curCap)
        );
        if (raw === null) return;
        const newCap = Math.max(1, parseInt(raw, 10) || 0);
        if (newCap === curCap) return;
        try {
          await API.patch(
            `/teachers/${encodeURIComponent(_teacherProfile.id)}/slots`,
            { date: _teacherSlotDate, time, capacity: newCap }
          );
          await reloadTeacherSlotsForDay();
        } catch (err) { alert(err.message); }
      });
    });
  }

  async function addTeacherSlot() {
    const input = $('#t-new-slot-time');
    const capInput = $('#t-new-slot-cap');
    const time = (input?.value || '').trim();
    const capacity = Math.max(1, parseInt(capInput?.value, 10) || 1);
    if (!time) { alert('Выберите время'); return; }
    try {
      await API.post(
        `/teachers/${encodeURIComponent(_teacherProfile.id)}/slots`,
        { date: _teacherSlotDate, time, capacity }
      );
      if (input) input.value = '';
      if (capInput) capInput.value = '1';
      await reloadTeacherSlotsForDay();
    } catch (err) {
      alert(err.message);
    }
  }

  // ====================================================
  // PROFILE PAGE
  // ====================================================
  function panelMsg(elId, kind, text) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.className = `panel-msg is-on is-${kind}`;
    el.textContent = text;
    if (kind === 'success') {
      setTimeout(() => { el.className = 'panel-msg'; el.textContent = ''; }, 2500);
    }
  }

  // Resize an image File down to maxSide×maxSide (preserving aspect)
  // and return a JPEG data URL. We do this client-side so the API
  // never has to handle multipart uploads or megabyte-large bodies.
  function resizeImageToDataUrl(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Файл не похож на изображение'));
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxSide / Math.max(width, height));
          width  = Math.round(width  * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality || 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Client-side image resize before upload — keeps payload small,
  // crops to a square so the avatar circle looks consistent.
  function resizeImageToDataUrl(file, size = 320, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Center-crop to square then scale down.
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width  - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const out = canvas.toDataURL('image/jpeg', quality);
        resolve(out);
      };
      img.onerror = () => reject(new Error('Не удалось декодировать изображение'));
      reader.readAsDataURL(file);
    });
  }

  function renderProfileBookingsCard(bookings, loadError) {
    const list = (bookings || [])
      .filter((b) => ['pending', 'confirmed'].includes(b.status))
      .sort((a, b) => {
        const ad = `${bookingDateOf(a)} ${bookingTimeOf(a)}`;
        const bd = `${bookingDateOf(b)} ${bookingTimeOf(b)}`;
        return ad.localeCompare(bd);
      })
      .slice(0, 8);

    let body;
    if (loadError) {
      body = `
        <div class="profile-bookings-empty">
          <strong>Не удалось загрузить записи</strong>
          <span>Обновите страницу или откройте расписание.</span>
        </div>`;
    } else if (!list.length) {
      body = `
        <div class="profile-bookings-empty">
          <strong>Активных записей пока нет</strong>
          <span>Когда вы запишетесь на урок, дата и время появятся здесь.</span>
          <a class="btn btn--primary" href="booking.html">Записаться</a>
        </div>`;
    } else {
      body = `
        <div class="profile-bookings-list">
          ${list.map((b) => {
            const dateIso = bookingDateOf(b);
            const time = bookingTimeOf(b) || '—';
            const teacher = b.teacher_name || 'Преподаватель';
            const discipline = b.discipline || 'Урок';
            const format = b.is_public ? 'Группа' : 'Индивидуально';
            const status = b.status || 'pending';
            const meeting = b.meeting_url
              ? `<a href="${escapeAttr(b.meeting_url)}" target="_blank" rel="noopener">Ссылка на урок</a>`
              : `<span>Ссылка появится после подтверждения</span>`;

            return `
              <article class="profile-booking-card">
                <div class="profile-booking-time">
                  <strong>${escapeHTML(time)}</strong>
                  <span>${escapeHTML(russianDateWithYear(dateIso))}</span>
                </div>
                <div class="profile-booking-main">
                  <h3>${escapeHTML(teacher)}</h3>
                  <p>${escapeHTML(discipline)} · ${escapeHTML(format)}</p>
                  <div class="profile-booking-link">${meeting}</div>
                </div>
                <span class="profile-booking-status profile-booking-status--${escapeAttr(status)}">
                  ${escapeHTML(statusLabelFor(status))}
                </span>
              </article>`;
          }).join('')}
        </div>`;
    }

    return `
      <section class="panel-card profile-bookings-card">
        <div class="panel-card-head">
          <h2>Мои записи</h2>
          <a href="schedule.html">Расписание</a>
        </div>
        ${body}
      </section>`;
  }

  async function initProfile() {
    const root = $('[data-render="profile-page"]');
    if (!root) return;

    if (!API.getToken()) {
      root.innerHTML = `<p class="empty-state">Войдите, чтобы открыть профиль</p>`;
      return;
    }

    let me;
    try {
      me = await API.get('/auth/me');
      API.setUser(me);
    } catch (err) {
      root.innerHTML = `<p class="empty-state">Не удалось загрузить профиль (${err.status || 'сеть'})</p>`;
      return;
    }

    let myBookings = [];
    let myBookingsError = null;
    if (me.role === 'student') {
      try {
        const rows = await API.get(`/bookings?scope=mine&from=${todayIsoLocal()}`);
        myBookings = Array.isArray(rows) ? rows : [];
      } catch (err) {
        myBookingsError = err;
        console.warn('Не удалось загрузить записи профиля:', err);
      }
    }

    const roleLabel = ({ student: 'Ученик', teacher: 'Преподаватель', admin: 'Администратор' })[me.role] || me.role;
    const initial = (me.name || '?').trim().charAt(0).toUpperCase();
    const avatarBlock = me.avatar_url
      ? `<img src="${escapeAttr(me.avatar_url)}" alt="" />`
      : `<span class="profile-photo__initial">${initial}</span>`;

    root.innerHTML = `
      <section class="panel-card profile-photo-card">
        <h2>Фото профиля</h2>
        <div class="profile-photo">
          <div class="profile-photo__circle" id="profilePhotoView">${avatarBlock}</div>
          <div class="profile-photo__actions">
            <label class="btn btn--primary" for="profilePhotoInput">Загрузить фото</label>
            <input type="file" id="profilePhotoInput" accept="image/*" hidden />
            ${me.avatar_url ? `<button class="btn" id="profilePhotoRemove">Убрать</button>` : ''}
            <p class="panel-msg" id="photoMsg"></p>
          </div>
        </div>
      </section>

      <section class="panel-card">
        <h2>Мои данные</h2>
        <div class="panel-row">
          <span class="panel-label">Имя</span>
          <input class="panel-input" id="profileName" value="${(me.name || '').replace(/"/g, '&quot;')}" />
        </div>
        <div class="panel-row">
          <span class="panel-label">Email</span>
          <span class="panel-value">${me.email || '—'}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Роль</span>
          <span class="panel-value">${roleLabel}</span>
        </div>
        <div class="panel-actions">
          <button class="btn btn--primary" id="saveNameBtn">Сохранить</button>
        </div>
        <p class="panel-msg" id="nameMsg"></p>
      </section>

      ${me.role === 'student' ? renderProfileBookingsCard(myBookings, myBookingsError) : ''}

      <section class="panel-card">
        <h2>Сменить пароль</h2>
        <div class="panel-row">
          <span class="panel-label">Текущий пароль</span>
          <input class="panel-input" id="currentPwd" type="password" autocomplete="current-password" />
        </div>
        <div class="panel-row">
          <span class="panel-label">Новый пароль</span>
          <input class="panel-input" id="newPwd" type="password" autocomplete="new-password" minlength="6" />
        </div>
        <div class="panel-row">
          <span class="panel-label">Повтор</span>
          <input class="panel-input" id="newPwd2" type="password" autocomplete="new-password" minlength="6" />
        </div>
        <div class="panel-actions">
          <button class="btn btn--primary" id="savePwdBtn">Сменить пароль</button>
        </div>
        <p class="panel-msg" id="pwdMsg"></p>
      </section>

      <section class="panel-card">
        <h2>Аккаунт</h2>
        <div class="panel-link-row">
          ${me.role === 'teacher' ? `<a href="teacher.html">Кабинет преподавателя →</a>` : ''}
          ${me.role === 'admin'   ? `<a href="admin.html">Открыть админ-панель →</a>` : ''}
        </div>
        <div class="panel-actions" style="margin-top:14px">
          <button class="btn btn--primary" id="logoutBtn"
                  style="background:#c25d7a">Выйти из аккаунта</button>
        </div>
      </section>
    `;

    $('#saveNameBtn').addEventListener('click', async () => {
      const name = $('#profileName').value.trim();
      if (name.length < 2) { panelMsg('nameMsg', 'error', 'Имя должно быть не меньше 2 символов'); return; }
      try {
        const updated = await API.patch('/auth/me', { name });
        API.setUser(updated);
        panelMsg('nameMsg', 'success', 'Сохранено');
      } catch (err) { panelMsg('nameMsg', 'error', err.message); }
    });

    $('#savePwdBtn').addEventListener('click', async () => {
      const current = $('#currentPwd').value;
      const next1 = $('#newPwd').value;
      const next2 = $('#newPwd2').value;
      if (!current || !next1) { panelMsg('pwdMsg', 'error', 'Заполните все поля'); return; }
      if (next1.length < 6)   { panelMsg('pwdMsg', 'error', 'Пароль должен быть не меньше 6 символов'); return; }
      if (next1 !== next2)    { panelMsg('pwdMsg', 'error', 'Новые пароли не совпадают'); return; }
      try {
        await API.post('/auth/change-password', { currentPassword: current, newPassword: next1 });
        $('#currentPwd').value = ''; $('#newPwd').value = ''; $('#newPwd2').value = '';
        panelMsg('pwdMsg', 'success', 'Пароль обновлён');
      } catch (err) { panelMsg('pwdMsg', 'error', err.message); }
    });

    // ── Photo upload ─────────────────────────────────────────
    $('#profilePhotoInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        panelMsg('photoMsg', 'error', 'Это не изображение');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        panelMsg('photoMsg', 'error', 'Файл слишком большой (макс. 8 МБ)');
        return;
      }
      panelMsg('photoMsg', 'success', 'Обработка…');
      try {
        const dataUrl = await resizeImageToDataUrl(file, 320, 0.85);
        const res = await API.patch('/users/me/avatar', { avatar_url: dataUrl });
        const view = $('#profilePhotoView');
        if (view) view.innerHTML = `<img src="${escapeAttr(res.avatar_url)}" alt="" />`;
        // Refresh cached user so other pages see the new avatar.
        try { API.setUser(await API.get('/auth/me')); } catch (_) {}
        panelMsg('photoMsg', 'success', 'Фото обновлено');
      } catch (err) {
        panelMsg('photoMsg', 'error', err.message || 'Не удалось загрузить');
      }
    });

    $('#profilePhotoRemove')?.addEventListener('click', async () => {
      if (!confirm('Убрать фото профиля?')) return;
      try {
        await API.patch('/users/me/avatar', { avatar_url: null });
        const view = $('#profilePhotoView');
        const init = (me.name || '?').trim().charAt(0).toUpperCase();
        if (view) view.innerHTML = `<span class="profile-photo__initial">${init}</span>`;
        $('#profilePhotoRemove')?.remove();
        try { API.setUser(await API.get('/auth/me')); } catch (_) {}
        panelMsg('photoMsg', 'success', 'Фото удалено');
      } catch (err) { panelMsg('photoMsg', 'error', err.message); }
    });

    // ── Avatar upload ──────────────────────────────────────
    // We resize the chosen image client-side to a 400×400 square JPEG
    // (~50–100 KB) before sending. This keeps the row small in Postgres
    // and avoids paying for object storage. The DB stores a data: URL.
    const photoInput  = $('#profilePhotoInput');
    const photoView   = $('#profilePhotoView');
    const photoRemove = $('#profilePhotoRemove');
    const photoMsg    = (kind, text) => panelMsg('photoMsg', kind, text);

    photoInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        photoMsg('error', 'Выберите файл-картинку');
        return;
      }
      try {
        const dataUrl = await resizeImageToDataUrl(file, 400, 0.85);
        // Use a fairly conservative cap on the encoded size — most
        // photos compressed to 400×400 jpeg @ 0.85 quality come out
        // around 30-80 KB, well under our 700 KB server limit.
        if (dataUrl.length > 600_000) {
          photoMsg('error', 'Картинка слишком большая. Попробуйте другую.');
          return;
        }
        const r = await API.patch('/users/me/avatar', { avatar_url: dataUrl });
        if (photoView) {
          photoView.innerHTML = `<img src="${escapeAttr(r.avatar_url)}" alt="" />`;
        }
        // Update cached user so the rest of the app sees the new avatar
        // without having to refetch.
        const cur = API.getUser();
        if (cur) { cur.avatar_url = r.avatar_url; API.setUser(cur); }
        photoMsg('success', 'Фото обновлено');
        // Show "Убрать" button if it wasn't there
        if (!$('#profilePhotoRemove')) {
          const rmBtn = document.createElement('button');
          rmBtn.className = 'btn'; rmBtn.id = 'profilePhotoRemove'; rmBtn.textContent = 'Убрать';
          rmBtn.addEventListener('click', removeAvatar);
          photoInput.parentNode.insertBefore(rmBtn, photoInput.nextSibling);
        }
      } catch (err) {
        photoMsg('error', err.message || 'Не удалось обновить фото');
      } finally {
        photoInput.value = '';   // allow re-uploading the same file
      }
    });

    async function removeAvatar() {
      try {
        await API.patch('/users/me/avatar', { avatar_url: null });
        const cur = API.getUser();
        if (cur) { cur.avatar_url = null; API.setUser(cur); }
        const initialCh = (cur?.name || '?').trim().charAt(0).toUpperCase();
        if (photoView) photoView.innerHTML = `<span class="profile-photo__initial">${initialCh}</span>`;
        $('#profilePhotoRemove')?.remove();
        photoMsg('success', 'Фото удалено');
      } catch (err) { photoMsg('error', err.message); }
    }
    photoRemove?.addEventListener('click', removeAvatar);

    // ── Photo upload ────────────────────────────────────────
    // Resize the picked image client-side to max 512px on the long
    // edge and ~80% JPEG quality before sending — keeps the data URL
    // under ~150 KB and the express.json limit happy.
    $('#profilePhotoInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      panelMsg('photoMsg', 'success', 'Подготовка…');
      try {
        const dataUrl = await resizeImageToDataURL(file, 512, 0.82);
        await API.patch('/users/me/avatar', { avatar_url: dataUrl });
        const view = $('#profilePhotoView');
        if (view) view.innerHTML = `<img src="${dataUrl}" alt="" />`;
        const me2 = API.getUser() || {};
        API.setUser({ ...me2, avatar_url: dataUrl });
        panelMsg('photoMsg', 'success', 'Фото обновлено');
      } catch (err) {
        panelMsg('photoMsg', 'error', err.message || 'Не удалось загрузить фото');
      }
    });

    $('#profilePhotoRemove')?.addEventListener('click', async () => {
      if (!confirm('Убрать фото?')) return;
      try {
        await API.patch('/users/me/avatar', { avatar_url: null });
        const view = $('#profilePhotoView');
        if (view) view.innerHTML = `<span class="profile-photo__initial">${initial}</span>`;
        const me2 = API.getUser() || {};
        API.setUser({ ...me2, avatar_url: null });
        $('#profilePhotoRemove')?.remove();
        panelMsg('photoMsg', 'success', 'Фото удалено');
      } catch (err) {
        panelMsg('photoMsg', 'error', err.message);
      }
    });

    // ── Photo upload ─────────────────────────────────────────
    // Resize the picked image to ≤512px on each side (JPEG q=0.85)
    // before encoding to data URL — keeps the payload under ~150 KB
    // even for big phone photos.
    $('#profilePhotoInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        panelMsg('photoMsg', 'error', 'Файл должен быть изображением');
        return;
      }
      panelMsg('photoMsg', 'success', 'Подготовка фото…');
      try {
        const dataUrl = await resizeImageToDataUrl(file, 512, 0.85);
        await API.patch('/users/me/avatar', { avatar_url: dataUrl });
        // Refresh cached user + UI without full reload.
        const me2 = await API.get('/auth/me');
        API.setUser(me2);
        const view = $('#profilePhotoView');
        if (view) view.innerHTML = `<img src="${escapeAttr(dataUrl)}" alt="" />`;
        panelMsg('photoMsg', 'success', 'Фото обновлено');
        // Re-render to surface the «Убрать» button if it wasn't there.
        if (!$('#profilePhotoRemove')) initProfile();
      } catch (err) {
        panelMsg('photoMsg', 'error', err.message || 'Не удалось загрузить фото');
      }
    });

    $('#profilePhotoRemove')?.addEventListener('click', async () => {
      if (!confirm('Убрать фото профиля?')) return;
      try {
        await API.patch('/users/me/avatar', { avatar_url: null });
        const me2 = await API.get('/auth/me');
        API.setUser(me2);
        initProfile();
      } catch (err) {
        panelMsg('photoMsg', 'error', err.message);
      }
    });

    $('#logoutBtn').addEventListener('click', () => {
      if (confirm('Выйти из аккаунта?')) logout();
    });
  }

  // Resize a File/Blob image to fit within maxSide × maxSide and
  // re-encode it as JPEG at the given quality. Returns a data: URL.
  // Keeps avatar payloads under ~150 KB even when the user picks a 4MB photo.
  async function resizeImageToDataUrl(file, maxSide = 480, quality = 0.85) {
    const bmp = await (window.createImageBitmap
      ? createImageBitmap(file)
      : new Promise((resolve, reject) => {
          const img = new Image();
          img.onload  = () => resolve(img);
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        }));
    const w = bmp.width, h = bmp.height;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d').drawImage(bmp, 0, 0, cw, ch);
    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(mime, quality);
  }

  // ====================================================
  // ADMIN PAGE
  // Dashboard hero with hero-greeting, metric cards, quick
  // actions and live cards for pending bookings, today's
  // lessons and recent activity. Sub-pages (Users / Bookings /
  // Teachers) keep the full CRUD admin tooling.
  // ====================================================
  let _adminView = 'dashboard';     // 'dashboard' | 'users' | 'bookings' | 'teachers'
  let _adminUsers = null;
  let _adminBookings = null;
  let _adminTeachers = null;
  let _adminUserFilter = { q: '', role: '' };
  let _adminBookingFilter = { q: '', status: '' };
  let _adminDisciplines = null;
  const ADMIN_VIEWS = new Set([
    'dashboard', 'students', 'catalog', 'groups', 'attendance',
    'chats', 'reports', 'users', 'bookings', 'teachers',
  ]);

  async function initAdmin() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;

    if (!API.getToken()) {
      root.innerHTML = `<p class="empty-state">Войдите как администратор</p>`;
      return;
    }

    // Probe role on the server.
    try {
      const me = await API.get('/auth/me');
      API.setUser(me);
      if (me.role !== 'admin') {
        root.innerHTML = `<p class="empty-state">У вас нет доступа</p>`;
        return;
      }
    } catch (_) {
      root.innerHTML = `<p class="empty-state">Войдите как администратор</p>`;
      return;
    }

    // Pre-load disciplines once for the booking-edit dropdown.
    try { _adminDisciplines = await API.get('/disciplines'); }
    catch (_) { _adminDisciplines = []; }

    const fromHash = (window.location.hash || '').replace(/^#/, '');
    if (ADMIN_VIEWS.has(fromHash)) _adminView = fromHash;
    bindAdminChrome();
    await renderAdminView();
  }

  async function switchAdminView(name) {
    if (!ADMIN_VIEWS.has(name)) name = 'dashboard';
    _adminView = name;
    const hash = `#${name}`;
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
    await renderAdminView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function renderAdminView() {
    if      (_adminView === 'dashboard')  await renderAdminDashboard();
    else if (_adminView === 'students')   await renderAdminStudentsPage();
    else if (_adminView === 'catalog')    await renderAdminCatalogPage();
    else if (_adminView === 'groups')     await renderAdminGroupsPage();
    else if (_adminView === 'attendance') await renderAdminAttendancePage();
    else if (_adminView === 'chats')      await renderAdminChatsPage();
    else if (_adminView === 'reports')    await renderAdminReportsPage();
    else if (_adminView === 'users')      await renderAdminUsersPage();
    else if (_adminView === 'bookings')   await renderAdminBookingsPage();
    else if (_adminView === 'teachers')   await renderAdminTeachersPage();
    syncAdminChrome();
  }

  function bindAdminChrome() {
    window.onhashchange = () => {
      const next = (window.location.hash || '').replace(/^#/, '') || 'dashboard';
      if (ADMIN_VIEWS.has(next) && next !== _adminView) {
        _adminView = next;
        renderAdminView();
      }
    };
    document.querySelectorAll('[data-admin-nav]').forEach((btn) => {
      btn.onclick = () => switchAdminView(btn.dataset.adminNav);
    });
    const goBookings = () => {
      _adminBookingFilter = { q: '', status: '' };
      switchAdminView('bookings');
    };
    const searchBtn = document.querySelector('[data-admin-action="search"]');
    if (searchBtn) searchBtn.onclick = () => {
      _adminUserFilter = { q: '', role: '' };
      switchAdminView('users');
    };
    const bookingsBtn = document.querySelector('[data-admin-action="bookings"]');
    if (bookingsBtn) bookingsBtn.onclick = goBookings;
    const pendingBtn = document.querySelector('[data-admin-action="pending"]');
    if (pendingBtn) pendingBtn.onclick = () => {
      _adminBookingFilter = { q: '', status: 'pending' };
      switchAdminView('bookings');
    };
  }

  function syncAdminChrome() {
    document.querySelectorAll('[data-admin-nav]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.adminNav === _adminView);
    });
  }

  function renderAdminScreenTop(title, { bell = false } = {}) {
    return `
      <section class="adm-screen-top">
        <button class="adm-screen-top__back" type="button" data-go="dashboard" aria-label="Назад">
          ${adminIcon('back')}
        </button>
        <h1 class="adm-screen-top__title">${escapeHTML(title)}</h1>
        <div class="adm-screen-top__actions">
          <button class="admin-round-btn" type="button" data-action="screen-search" aria-label="Поиск">
            ${adminIcon('search')}
          </button>
          <button class="admin-round-btn" type="button" data-action="screen-filter" aria-label="Фильтры">
            ${adminIcon('sliders')}
          </button>
          ${bell ? `<button class="admin-round-btn admin-round-btn--notify" type="button" data-go="bookings-pending" aria-label="Заявки">${adminIcon('bell')}</button>` : ''}
        </div>
      </section>
    `;
  }

  function bindAdminScreenTop(root, searchSelector) {
    root.querySelectorAll('.adm-screen-top [data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dest = btn.dataset.go;
        if (dest === 'bookings-pending') {
          _adminBookingFilter = { q: '', status: 'pending' };
          switchAdminView('bookings');
        } else {
          switchAdminView(dest || 'dashboard');
        }
      });
    });
    root.querySelector('[data-action="screen-search"]')?.addEventListener('click', () => {
      const input = searchSelector ? root.querySelector(searchSelector) : null;
      if (input) input.focus();
    });
    root.querySelector('[data-action="screen-filter"]')?.addEventListener('click', () => {
      const chips = root.querySelector('.adm-chip-tabs');
      if (chips) chips.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function renderAdminMetricsBand(metrics) {
    return `<section class="adm-metrics adm-metrics--standalone">
      ${metrics.map((m) => metricCard(m.kind, m.label, m.value, m.delta)).join('')}
    </section>`;
  }

  // ─────────── DASHBOARD (hero, cards, quick actions) ───────
  async function renderAdminDashboard() {
    const slot = $('[data-render="admin-page"]');
    if (!slot) return;
    slot.innerHTML = `<p class="empty-state">Загрузка…</p>`;

    let stats, pending, today, weekSeries, reportSummary;
    try {
      [stats, pending, today, weekSeries, reportSummary] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/pending-bookings?limit=5'),
        API.get('/admin/today-lessons?limit=6'),
        API.get('/admin/reports/lessons-by-day?days=7'),
        API.get('/admin/reports/summary'),
      ]);
    } catch (err) {
      slot.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    const me = API.getUser();
    const wd = stats.week_deltas || {};
    const yesterdayDelta = (stats.today_lessons || 0) - (wd.lessons_yesterday || 0);

    slot.innerHTML = `
      <div class="adm-page">

        <!-- ───────── Hero greeting + metrics ───────── -->
        <section class="adm-hero">
          <div class="adm-hero__bg" aria-hidden="true"></div>
          <div class="adm-hero__inner">
            <h1 class="adm-hero__greet">Ассаламу алейкум,</h1>
            <h2 class="adm-hero__name">${me?.name || 'Администратор'}</h2>
            <p  class="adm-hero__sub">Обзор и управление центром за сегодня.</p>

            <div class="adm-metrics">
              ${metricCard('users',     'Ученики',         stats.users.students,                              fmtDelta(wd.students_week, 'за неделю'))}
              ${metricCard('teachers',  'Преподаватели',   stats.users.teachers,                              fmtDelta(wd.teachers_week, 'за неделю'))}
              ${metricCard('bookings',  'Активные записи', (stats.today_lessons||0) + (stats.pending_bookings||0), fmtDelta(wd.bookings_week, 'за неделю'))}
              ${metricCard('lessons',   'Сегодня уроков',  stats.today_lessons,                               fmtDelta(yesterdayDelta, 'к вчерашнему'))}
            </div>
          </div>
        </section>

        <!-- ───────── Quick actions ───────── -->
        <section class="adm-quick">
          <div class="adm-section-head">
            <h3 class="adm-section-title">Быстрые действия</h3>
            <button class="adm-card__more" data-go="admin-users">Настроить</button>
          </div>
          <div class="adm-quick__grid">
            <button class="adm-quick__tile" data-go="users">
              <span class="adm-quick__icon">${adminIcon('users')}</span>
              <span class="adm-quick__label">Ученики</span>
            </button>
            <button class="adm-quick__tile" data-go="users-teachers">
              <span class="adm-quick__icon">${adminIcon('teacher')}</span>
              <span class="adm-quick__label">Преподаватели</span>
            </button>
            <button class="adm-quick__tile" data-go="groups">
              <span class="adm-quick__icon">${adminIcon('users')}</span>
              <span class="adm-quick__label">Группы</span>
            </button>
            <button class="adm-quick__tile" data-go="bookings">
              <span class="adm-quick__icon">${adminIcon('calendar')}</span>
              <span class="adm-quick__label">Записи</span>
            </button>
            <button class="adm-quick__tile" data-go="schedule">
              <span class="adm-quick__icon">${adminIcon('lessons')}</span>
              <span class="adm-quick__label">Расписание</span>
            </button>
            <button class="adm-quick__tile" data-go="attendance">
              <span class="adm-quick__icon">${adminIcon('check')}</span>
              <span class="adm-quick__label">Посещаемость</span>
            </button>
            <button class="adm-quick__tile" data-go="chats">
              <span class="adm-quick__icon">${adminIcon('chat')}</span>
              <span class="adm-quick__label">Чаты</span>
            </button>
            <button class="adm-quick__tile" data-go="reports">
              <span class="adm-quick__icon">${adminIcon('chart')}</span>
              <span class="adm-quick__label">Отчёты</span>
            </button>
            <button class="adm-quick__tile" data-go="admin-users">
              <span class="adm-quick__icon">${adminIcon('user-plus')}</span>
              <span class="adm-quick__label">Пользователи</span>
            </button>
          </div>
        </section>

        <!-- ───────── Two-column live cards ───────── -->
        <section class="adm-grid-2">

          <!-- Pending bookings -->
          <article class="adm-card">
            <header class="adm-card__head">
              <h3 class="adm-card__title">Заявки на подтверждение</h3>
              ${pending.length ? `<button class="adm-card__more" data-go="bookings-pending">Смотреть все</button>` : ''}
            </header>
            <div class="adm-card__body">
              ${pending.length === 0
                ? `<p class="empty-state">Нет ожидающих заявок</p>`
                : pending.map((p) => {
                    const date = String(p.lesson_date || '').slice(0, 10);
                    const time = String(p.time_slot || '').slice(0, 5);
                    const isToday = date === todayIsoLocal();
                    return `
                    <div class="adm-row" data-id="${p.id}">
                      <div class="adm-row__avatar">${initialsCircle(p.student_name)}</div>
                      <div class="adm-row__main">
                        <p class="adm-row__name">${escapeHTML(p.student_name || 'Группа')}</p>
                        <p class="adm-row__meta">Преподаватель: ${escapeHTML(p.teacher_name || '—')}</p>
                        <p class="adm-row__meta">Предмет: ${escapeHTML(p.discipline_name || '—')}</p>
                      </div>
                      <div class="adm-row__when">
                        <span class="adm-row__time">${time}</span>
                        <span class="adm-row__date">${isToday ? 'Сегодня' : russianShortDate(date)}</span>
                      </div>
                      <div class="adm-row__actions">
                        <button class="adm-pill adm-pill--ok"   data-action="confirm" title="Подтвердить">✓</button>
                        <button class="adm-pill adm-pill--no"   data-action="reject"  title="Отменить">✕</button>
                      </div>
                    </div>
                  `;
                  }).join('')}
            </div>
          </article>

          <!-- Today's lessons -->
          <article class="adm-card">
            <header class="adm-card__head">
              <h3 class="adm-card__title">Ближайшие уроки</h3>
              ${today.length ? `<button class="adm-card__more" data-go="bookings">Смотреть все</button>` : ''}
            </header>
            <div class="adm-card__body">
              ${today.length === 0
                ? `<p class="empty-state">На сегодня нет уроков</p>`
                : today.map((l) => {
                    const time = String(l.time_slot || '').slice(0, 5);
                    const provider = l.meeting_url ? 'Онлайн' : 'Офлайн';
                    const studentLabel = l.is_public
                      ? `<strong>Группа</strong>`
                      : `Ученик: <strong>${escapeHTML(l.student_name || '—')}</strong>`;
                    return `
                    <div class="adm-lesson" data-id="${l.id}">
                      <div class="adm-lesson__when ${l.status === 'confirmed' ? 'is-confirmed' : ''}">
                        <span class="adm-lesson__time">${time}</span>
                        <span class="adm-lesson__day">Сегодня</span>
                        <span class="adm-lesson__loc">${provider}</span>
                      </div>
                      <div class="adm-lesson__main">
                        <p class="adm-lesson__teacher">${escapeHTML(l.teacher_name || '—')}</p>
                        <p class="adm-lesson__sub">${studentLabel}</p>
                        <p class="adm-lesson__sub">${escapeHTML(l.discipline_name || '—')} · ${l.is_public ? 'Группа' : 'Индивидуально'}</p>
                        <span class="adm-status adm-status--${l.status}">${statusLabel(l.status)}</span>
                      </div>
                    </div>
                  `;
                  }).join('')}
            </div>
          </article>

        </section>

        <section class="adm-grid-2 adm-grid-2--lower">
          <article class="adm-card">
            <header class="adm-card__head">
              <h3 class="adm-card__title">Статистика за неделю</h3>
              <button class="adm-card__more" data-go="reports">Смотреть отчёты</button>
            </header>
            <div class="adm-card__body">
              ${dashboardWeekStats(weekSeries)}
            </div>
          </article>

          <article class="adm-card">
            <header class="adm-card__head">
              <h3 class="adm-card__title">Последние действия</h3>
              <button class="adm-card__more" data-go="admin-users">Смотреть все</button>
            </header>
            <div class="adm-card__body adm-activity">
              ${(stats.recent_activity || []).length === 0
                ? `<p class="empty-state">Нет недавних событий</p>`
                : stats.recent_activity.map((ev) => `
                  <div class="adm-activity__row">
                    <span class="adm-activity__icon">${activityIcon(ev.kind)}</span>
                    <div class="adm-activity__text">
                      <p class="adm-activity__title">${activityTitle(ev)}</p>
                      <p class="adm-activity__sub">${escapeHTML(ev.title)}${ev.subtitle ? ' · ' + escapeHTML(ev.subtitle) : ''}</p>
                    </div>
                    <div class="adm-activity__when">
                      <span>${shortTimeOfDay(ev.happened_at)}</span>
                      <small>${shortRelativeDate(ev.happened_at)}</small>
                    </div>
                  </div>
                `).join('')}
            </div>
          </article>
        </section>

        <section class="adm-summary-strip">
          <div class="adm-summary-strip__media" aria-hidden="true"></div>
          <div class="adm-summary-strip__item">
            <span>Новые ученики</span>
            <strong>${reportSummary.students_new_30d || 0}</strong>
            <small>за 30 дней</small>
          </div>
          <div class="adm-summary-strip__item">
            <span>Проведено уроков</span>
            <strong>${reportSummary.lessons_done_30d || 0}</strong>
            <small>за 30 дней</small>
          </div>
          <div class="adm-summary-strip__item">
            <span>Посещаемость</span>
            <strong>${reportSummary.attendance_pct_30d != null ? reportSummary.attendance_pct_30d + '%' : '—'}</strong>
            <small>по отмеченным урокам</small>
          </div>
          <div class="adm-summary-strip__item">
            <span>Отмены уроков</span>
            <strong>${reportSummary.lessons_cancelled_30d || 0}</strong>
            <small>за 30 дней</small>
          </div>
        </section>
      </div>
    `;

    // Wire up quick-action and "see more" buttons
    slot.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dest = btn.dataset.go;
        if      (dest === 'users-teachers')   { switchAdminView('catalog'); }
        else if (dest === 'bookings-pending') { _adminBookingFilter = { q: '', status: 'pending' }; switchAdminView('bookings'); }
        else if (dest === 'users')            { _studentsFilter = { q: '', status: '' }; switchAdminView('students'); }
        else if (dest === 'bookings')         { _adminBookingFilter = { q: '', status: '' }; switchAdminView('bookings'); }
        else if (dest === 'schedule')         { _adminBookingFilter = { q: '', status: 'confirmed' }; switchAdminView('bookings'); }
        else if (dest === 'admin-users')      { _adminUserFilter = { q: '', role: '' }; switchAdminView('users'); }
        else if (dest === 'teachers')         { switchAdminView('catalog'); }
        else if (dest === 'groups')           { switchAdminView('groups'); }
        else if (dest === 'attendance')       { switchAdminView('attendance'); }
        else if (dest === 'chats')            { switchAdminView('chats'); }
        else if (dest === 'reports')          { switchAdminView('reports'); }
      });
    });

    // Pending bookings inline confirm/reject
    slot.querySelectorAll('.adm-row[data-id]').forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('[data-action="confirm"]')?.addEventListener('click', async () => {
        try { await API.patch(`/admin/bookings/${encodeURIComponent(id)}`, { status: 'confirmed' }); await renderAdminDashboard(); }
        catch (err) { alert(err.message); }
      });
      row.querySelector('[data-action="reject"]')?.addEventListener('click', async () => {
        if (!confirm('Отменить заявку?')) return;
        try { await API.patch(`/admin/bookings/${encodeURIComponent(id)}`, { status: 'cancelled' }); await renderAdminDashboard(); }
        catch (err) { alert(err.message); }
      });
    });
  }

  // ─────── Small helpers used by the dashboard render ──────
  function metricCard(kind, label, value, delta) {
    return `
      <div class="adm-metric adm-metric--${kind}">
        <span class="adm-metric__icon">${adminIcon(kind)}</span>
        <span class="adm-metric__label">${label}</span>
        <span class="adm-metric__value">${value ?? 0}</span>
        <span class="adm-metric__delta">${delta}</span>
      </div>
    `;
  }
  function dashboardWeekStats(series) {
    const rows = Array.isArray(series) ? series : [];
    if (!rows.length) return `<p class="empty-state">Нет данных за неделю</p>`;
    const max = Math.max(1, ...rows.map((d) => Number(d.total) || 0));
    const total = rows.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
    const completed = rows.reduce((sum, d) => sum + (Number(d.completed) || 0), 0);
    const attendance = total > 0 ? Math.round((completed * 100) / total) : null;
    return `
      <div class="adm-week-summary">
        <div>
          <span>Активность занятий</span>
          <strong>${total}</strong>
          <small>записей за 7 дней</small>
        </div>
        <div>
          <span>Проведено</span>
          <strong>${completed}</strong>
          <small>${attendance != null ? attendance + '% от записей' : 'нет отметок'}</small>
        </div>
      </div>
      <div class="adm-week-bars" aria-label="Уроки за неделю">
        ${rows.map((d) => {
          const date = String(d.date || '').slice(0, 10);
          const day = date ? new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short' }) : '';
          const value = Number(d.total) || 0;
          const height = Math.max(8, Math.round((value / max) * 100));
          return `
            <span class="adm-week-bars__bar" style="--h:${height}%">
              <i title="${escapeAttr(russianShortDate(date))}: ${value}"></i>
              <small>${escapeHTML(day.replace('.', ''))}</small>
            </span>
          `;
        }).join('')}
      </div>
    `;
  }
  function fmtDelta(n, suffix) {
    if (n == null || isNaN(n)) return '';
    const sign = n > 0 ? '+' : '';
    const arrow = n > 0 ? '↗' : n < 0 ? '↘' : '·';
    const cls = n > 0 ? 'adm-delta--up' : n < 0 ? 'adm-delta--down' : '';
    return `<span class="adm-delta ${cls}">${sign}${n} ${suffix} ${arrow}</span>`;
  }
  function adminIcon(kind) {
    const icons = {
      users:    '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 19.5c0-3 2.7-4.6 6-4.6s6 1.6 6 4.6 M14.5 18c.3-2.2 2-3.4 4.5-3.4s3.5 1.2 3.7 3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      teachers: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 4l7-2 7 2v1.5L12 8 5 5.5z M4 21c0-3.6 3.6-5.4 8-5.4s8 1.8 8 5.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      teacher:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 4l7-2 7 2v1.5L12 8 5 5.5z M4 21c0-3.6 3.6-5.4 8-5.4s8 1.8 8 5.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      bookings: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17 M8 3v4 M16 3v4 M8 14h-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17 M8 3v4 M16 3v4 M8 14h-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      lessons:  '<svg viewBox="0 0 24 24"><path d="M4 5.5c0-.6.6-1 1.2-.9C8.5 5 11 6 12 7 13 6 15.5 5 18.8 4.6c.6-.1 1.2.3 1.2.9V18c0 .6-.5 1-1.1.9C16 18.5 13.5 19.5 12 21c-1.5-1.5-4-2.5-6.9-2.1C4.5 19 4 18.6 4 18z M12 7v14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      book:     '<svg viewBox="0 0 24 24"><path d="M4 5.5c0-.6.6-1 1.2-.9C8.5 5 11 6 12 7 13 6 15.5 5 18.8 4.6c.6-.1 1.2.3 1.2.9V18c0 .6-.5 1-1.1.9C16 18.5 13.5 19.5 12 21c-1.5-1.5-4-2.5-6.9-2.1C4.5 19 4 18.6 4 18z M12 7v14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      check:    '<svg viewBox="0 0 24 24"><path d="M20 7L9.5 17.5 4.5 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      chat:     '<svg viewBox="0 0 24 24"><path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 3V6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="9"  cy="10" r="1.1" fill="currentColor"/><circle cx="13" cy="10" r="1.1" fill="currentColor"/><circle cx="17" cy="10" r="1.1" fill="currentColor"/></svg>',
      chart:    '<svg viewBox="0 0 24 24"><rect x="3.5" y="13" width="3.5" height="7"  fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><rect x="10.2" y="9" width="3.5" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><rect x="17"   y="5" width="3.5" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      'user-plus': '<svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 19.5c0-3 2.7-4.6 7-4.6s7 1.6 7 4.6 M19 6v6 M16 9h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      search:   '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      sliders:  '<svg viewBox="0 0 24 24"><path d="M5 7h14M8 12h8M10 17h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      bell:     '<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13V8Z M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
      back:     '<svg viewBox="0 0 24 24"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      clock:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      more:     '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/></svg>',
    };
    return icons[kind] || icons.users;
  }
  function initialsCircle(name, avatarUrl) {
    const ch = (String(name || '').trim().charAt(0) || '?').toUpperCase();
    if (avatarUrl) {
      return `<span class="adm-initial adm-initial--photo">
        <img src="${escapeAttr(avatarUrl)}" alt="" />
      </span>`;
    }
    return `<span class="adm-initial">${ch}</span>`;
  }

  // Lightweight HTML attribute escape (separate from text-content one
  // because data: URLs contain &; we only need to escape quotes/<>).
  function escapeAttr(s) {
    return String(s ?? '').replace(/[<>"']/g, (c) =>
      ({ '<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' })[c]);
  }
  function statusLabel(s) {
    return ({ pending:'Ожидает', confirmed:'Подтверждено', cancelled:'Отменён', completed:'Проведён' }[s] || s);
  }
  function activityIcon(kind) {
    if (kind === 'user_added')      return adminIcon('users');
    if (kind === 'booking_created') return adminIcon('calendar');
    return adminIcon('bookings');
  }
  function activityTitle(ev) {
    if (ev.kind === 'user_added')      return 'Добавлен новый пользователь';
    if (ev.kind === 'booking_created') return 'Создана запись на урок';
    return 'Событие';
  }
  function shortTimeOfDay(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toTimeString().slice(0, 5);
  }
  function shortRelativeDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const today = todayIsoLocal();
    const di = d.toISOString().slice(0, 10);
    if (di === today) return 'Сегодня';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (di === y.toISOString().slice(0, 10)) return 'Вчера';
    return russianShortDate(di);
  }
  function russianShortDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
    if (!m) return iso || '';
    const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    return `${parseInt(m[3], 10)} ${months[parseInt(m[2], 10) - 1]}`;
  }
  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' })[c]);
  }

  // =====================================================
  //                    SUB-PAGES
  // =====================================================
  // Each sub-page renders a full-width panel. Two of them — Students
  // and Catalog — have a hero-style layout matching the design mock-up
  // (mosque background, hero metrics, action tiles, filter chips,
  // search box, item cards). Bookings and the legacy Users/Teachers
  // tables stay as straightforward admin tables.

  // ─── shared shell with chip-tabs at the top ─────────────────────
  function renderAdminShell(activeTab, body) {
    return `
      <div class="adm-page">
        ${body}
      </div>
    `;
  }
  function bindShellNav(root) {
    root.querySelectorAll('.adm-subnav [data-go]').forEach((btn) => {
      btn.addEventListener('click', () => switchAdminView(btn.dataset.go));
    });
  }

  // ─── Hero header used by Students and Catalog pages ─────────────
  function renderAdmHeroHeader({ title, subtitle, metrics, actions }) {
    return `
      <section class="adm-hero adm-hero--page">
        <div class="adm-hero__bg" aria-hidden="true"></div>
        <div class="adm-hero__inner">
          <h1 class="adm-hero__greet">Ассаламу алейкум,</h1>
          <h2 class="adm-hero__name">${escapeHTML(title)}</h2>
          <p  class="adm-hero__sub">${escapeHTML(subtitle)}</p>
          <div class="adm-metrics">
            ${metrics.map((m) => metricCard(m.kind, m.label, m.value, m.delta)).join('')}
          </div>
        </div>
      </section>

      <section class="adm-action-tiles">
        ${actions.map((a) => `
          <button class="adm-action-tile" data-action="${a.action}">
            <span class="adm-action-tile__icon">${adminIcon(a.icon)}</span>
            <span class="adm-action-tile__label">${escapeHTML(a.label)}</span>
            <span class="adm-action-tile__chev">›</span>
          </button>
        `).join('')}
      </section>
    `;
  }

  // ───────────────── STUDENTS PAGE ─────────────────────────────────
  let _studentsFilter = { q: '', status: '' };  // status: '' | 'active' | 'new' | 'archived'

  async function renderAdminStudentsPage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('students', `<div data-render="adm-sub-body"><p class="empty-state">Загрузка…</p></div>`);
    bindShellNav(root);
    const body = root.querySelector('[data-render="adm-sub-body"]');

    let summary, students;
    try {
      const params = new URLSearchParams({ role: 'student' });
      if (_studentsFilter.q)      params.set('q', _studentsFilter.q);
      if (_studentsFilter.status) params.set('status', _studentsFilter.status);
      [summary, students] = await Promise.all([
        API.get('/admin/students-summary'),
        API.get(`/admin/users?${params}`),
      ]);
    } catch (err) {
      body.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    const attDelta = (summary.attendance_pct == null || summary.attendance_pct_prev == null)
      ? null
      : summary.attendance_pct - summary.attendance_pct_prev;

    const heroHTML = renderAdmHeroHeader({
      title: API.getUser()?.name || 'Администратор',
      subtitle: 'Управление учениками медресе',
      metrics: [
        { kind: 'users',     label: 'Всего учеников',    value: summary.total,         delta: fmtDelta(summary.new_this_week, 'за неделю') },
        { kind: 'teachers',  label: 'Активных учеников', value: summary.active,        delta: '' },
        { kind: 'lessons',   label: 'Новых за неделю',   value: summary.new_this_week, delta: fmtDelta((summary.new_this_week||0) - (summary.new_last_week||0), 'к прошлой неделе') },
        { kind: 'bookings',  label: 'Посещаемость',
          value: summary.attendance_pct != null ? summary.attendance_pct + '%' : '—',
          delta: attDelta != null ? fmtDelta(attDelta, 'к прошлой неделе') : '' },
      ],
      actions: [
        { action: 'create-student',  icon: 'user-plus',  label: 'Добавить ученика' },
        { action: 'open-bookings',   icon: 'calendar',   label: 'Открыть записи' },
        { action: 'open-attendance', icon: 'calendar',   label: 'Посещаемость' },
      ],
    });

    body.innerHTML = `
      ${renderAdminScreenTop('Ученики')}
      ${heroHTML}

      <section class="adm-card adm-card--full">
        <div class="adm-card__body">

          <div class="adm-chip-tabs" role="tablist">
            ${[
              ['',         'Все'],
              ['active',   'Активные'],
              ['new',      'Новые'],
              ['archived', 'Архив'],
            ].map(([v, lbl]) => `
              <button class="adm-chip ${_studentsFilter.status === v ? 'is-active' : ''}"
                      data-chip="${v}">${lbl}</button>
            `).join('')}
          </div>

          <div class="adm-search-row">
            <span class="adm-search-row__icon">${adminIcon('search')}</span>
            <input type="search" class="adm-search-row__input"
                   placeholder="Поиск ученика по имени…"
                   value="${escapeHTML(_studentsFilter.q || '')}" data-action="stu-search" />
          </div>

          <div class="adm-stu-list">
            ${students.length === 0
              ? `<p class="empty-state" style="padding:32px 0">Учеников не найдено</p>`
              : students.map((u) => renderStudentCard(u)).join('')}
          </div>

        </div>
      </section>
    `;

    bindAdminScreenTop(body, '[data-action="stu-search"]');
    bindAdminStudentsActions(body);
  }

  function renderStudentCard(u) {
    const completed = Number(u.lessons_completed) || 0;
    const progress  = u.attendance_pct != null ? Number(u.attendance_pct) : null;
    const isArchived= !u.is_active;
    const created   = String(u.created_at || '').slice(0, 10);
    const joinedTxt = created ? joinedDate(created) : '';
    const progressBar = progress == null
      ? `<p class="adm-stu-card__meta">Пока нет отметок посещаемости</p>`
      : `<div class="adm-progress">
          <div class="adm-progress__bar" style="--p:${Math.max(0, Math.min(100, progress))}%"></div>
          <span class="adm-progress__pct">${progress}%</span>
        </div>`;

    return `
      <article class="adm-stu-card" data-id="${u.id}">
        <div class="adm-stu-card__avatar">${initialsCircle(u.name, u.avatar_url)}</div>

        <div class="adm-stu-card__head">
          <h4 class="adm-stu-card__name">${escapeHTML(u.name || '—')}</h4>
          <p class="adm-stu-card__meta">${u.age_text ? 'Возраст: ' + escapeHTML(u.age_text) : 'Email: ' + escapeHTML(u.email || '—')}</p>
          <p class="adm-stu-card__meta">Курс: ${escapeHTML(u.current_course || u.progress_level || u.level_name || '—')}</p>
        </div>

        <div class="adm-stu-card__teacher">
          <p class="adm-stu-card__meta-label">Преподаватель</p>
          <p class="adm-stu-card__meta-value">${escapeHTML(u.current_teacher || '—')}</p>
          <p class="adm-stu-card__meta-label" style="margin-top:8px">Посещаемость</p>
          ${progressBar}
        </div>

        <div class="adm-stu-card__status">
          <span class="adm-status-dot adm-status-dot--${isArchived ? 'off' : 'on'}">
            ${isArchived ? '● Архив' : '● Активный'}
          </span>
          <p class="adm-stu-card__group">${u.group_name ? 'Группа: ' + escapeHTML(u.group_name) : ''}</p>
          <p class="adm-stu-card__joined">${isArchived ? 'Архивирован' : 'Присоединился'}<br>${joinedTxt}</p>
        </div>

        <button class="adm-stu-card__menu" data-action="stu-menu" aria-label="Меню действий">⋮</button>
      </article>
    `;
  }

  function bindAdminStudentsActions(root) {
    // Filter chips
    root.querySelectorAll('.adm-chip').forEach((c) => {
      c.addEventListener('click', () => {
        _studentsFilter.status = c.dataset.chip;
        renderAdminStudentsPage();
      });
    });

    // Search
    let timer = null;
    root.querySelector('[data-action="stu-search"]')?.addEventListener('input', (e) => {
      clearTimeout(timer);
      const v = e.target.value;
      timer = setTimeout(() => { _studentsFilter.q = v; renderAdminStudentsPage(); }, 250);
    });

    // Action tiles
    root.querySelector('[data-action="create-student"]')?.addEventListener('click', async () => {
      const name = prompt('Имя ученика:');
      if (!name) return;
      const email = prompt('Email:');
      if (!email) return;
      const password = prompt('Пароль (мин. 6 символов):');
      if (!password) return;
      try {
        await API.post('/admin/users', { name, email, password, role: 'student' });
        await renderAdminStudentsPage();
      } catch (err) { alert(err.message); }
    });
    root.querySelector('[data-action="open-bookings"]')?.addEventListener('click', () => {
      _adminBookingFilter = { q: '', status: '' }; switchAdminView('bookings');
    });
    root.querySelector('[data-action="open-attendance"]')?.addEventListener('click', () => {
      _adminBookingFilter = { q: '', status: 'completed' }; switchAdminView('bookings');
    });

    // Per-card kebab menu — opens a small action sheet with block/unblock,
    // reset password, delete.
    root.querySelectorAll('.adm-stu-card[data-id]').forEach((card) => {
      const id = card.dataset.id;
      card.querySelector('[data-action="stu-menu"]')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const u = await API.get(`/admin/users?q=${encodeURIComponent(card.querySelector('.adm-stu-card__name').textContent.trim())}&role=student`)
          .then((arr) => arr.find((x) => x.id === id))
          .catch(() => null);
        if (!u) return alert('Ученик не найден');
        const choice = prompt(
          `Действия для ${u.name}:\n` +
          `1 — ${u.is_active ? 'Заблокировать' : 'Разблокировать'}\n` +
          `2 — Сбросить пароль\n` +
          `3 — Удалить\n\n` +
          `Введите номер действия:`
        );
        if (!choice) return;
        try {
          if (choice === '1') {
            await API.patch(`/admin/users/${encodeURIComponent(id)}`, { is_active: !u.is_active });
            await renderAdminStudentsPage();
          } else if (choice === '2') {
            const pw = prompt(`Новый пароль для ${u.email}:`);
            if (!pw) return;
            if (pw.length < 6) return alert('Минимум 6 символов');
            await API.patch(`/admin/users/${encodeURIComponent(id)}`, { password: pw });
            alert('Пароль обновлён');
          } else if (choice === '3') {
            if (!confirm(`Удалить ${u.name}? Это действие необратимо.`)) return;
            await API.del(`/admin/users/${encodeURIComponent(id)}`);
            await renderAdminStudentsPage();
          }
        } catch (err) { alert(err.message); }
      });
    });
  }

  function joinedDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    return `${m[3]}.${m[2]}.${m[1]}`;
  }

  // ───────────────── CATALOG (Teachers as cards) ──────────────────
  let _catalogFilter = { q: '', status: '' };

  async function renderAdminCatalogPage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('catalog', `<div data-render="adm-sub-body"><p class="empty-state">Загрузка…</p></div>`);
    bindShellNav(root);
    const body = root.querySelector('[data-render="adm-sub-body"]');

    let summary, teachers;
    try {
      [summary, teachers] = await Promise.all([
        API.get('/admin/teachers-summary'),
        API.get('/admin/teachers'),
      ]);
    } catch (err) {
      body.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    // Filter client-side (we don't yet have q/status query support
    // on /admin/teachers, but the lists are short).
    const q = _catalogFilter.q.trim().toLowerCase();
    const filtered = teachers.filter((t) => {
      if (q && !(t.name || '').toLowerCase().includes(q)) return false;
      if (_catalogFilter.status === 'active'   && !t.is_active) return false;
      if (_catalogFilter.status === 'archived' &&  t.is_active) return false;
      return true;
    });

    const heroHTML = renderAdmHeroHeader({
      title: 'Преподаватели',
      subtitle: 'Каталог преподавателей медресе',
      metrics: [
        { kind: 'teachers', label: 'Всего',         value: summary.total,           delta: fmtDelta(summary.new_this_week, 'за неделю') },
        { kind: 'users',    label: 'Активные',      value: summary.active,          delta: '' },
        { kind: 'lessons',  label: 'Ведут группы',  value: summary.group_teachers,  delta: '' },
        { kind: 'bookings', label: 'Скрытых',
          value: (summary.total || 0) - (summary.active || 0),
          delta: '' },
      ],
      actions: [
        { action: 'open-users-teachers', icon: 'user-plus', label: 'Добавить преподавателя' },
        { action: 'open-bookings-confirmed', icon: 'calendar', label: 'Расписание уроков' },
      ],
    });

    body.innerHTML = `
      ${heroHTML}

      <section class="adm-card adm-card--full">
        <div class="adm-card__body">

          <div class="adm-chip-tabs" role="tablist">
            ${[
              ['',         'Все'],
              ['active',   'В каталоге'],
              ['archived', 'Скрытые'],
            ].map(([v, lbl]) => `
              <button class="adm-chip ${_catalogFilter.status === v ? 'is-active' : ''}"
                      data-chip="${v}">${lbl}</button>
            `).join('')}
          </div>

          <div class="adm-search-row">
            <span class="adm-search-row__icon">🔍</span>
            <input type="search" class="adm-search-row__input"
                   placeholder="Поиск преподавателя по имени…"
                   value="${escapeHTML(_catalogFilter.q || '')}" data-action="cat-search" />
          </div>

          <div class="adm-cat-list">
            ${filtered.length === 0
              ? `<p class="empty-state" style="padding:32px 0">Преподавателей не найдено</p>`
              : filtered.map((t) => renderCatalogCard(t)).join('')}
          </div>

        </div>
      </section>
    `;

    bindAdminCatalogActions(body);
  }

  function renderCatalogCard(t) {
    const reviews = Number(t.review_count) || 0;
    const rating  = Number(t.rating) || 0;
    const cap     = Math.min(100, reviews * 10);   // cosmetic activity bar
    return `
      <article class="adm-cat-card" data-id="${t.id}">
        <div class="adm-cat-card__avatar">${initialsCircle(t.name, t.photo_url)}</div>

        <div class="adm-cat-card__main">
          <h4 class="adm-cat-card__name">${escapeHTML(t.name || '—')}</h4>
          <p class="adm-cat-card__meta">${rating.toFixed(1)} ★ · ${reviews} ${pluralReviews(reviews)}</p>
          <p class="adm-cat-card__meta">Опыт: ${escapeHTML(t.experience || '—')}</p>
          <p class="adm-cat-card__meta">${escapeHTML(t.email || '')}</p>
          <div class="adm-progress" style="margin-top:6px">
            <div class="adm-progress__bar" style="--p:${cap}%"></div>
            <span class="adm-progress__pct">${rating.toFixed(1)}</span>
          </div>
        </div>

        <div class="adm-cat-card__side">
          <span class="adm-status-dot adm-status-dot--${t.is_active ? 'on' : 'off'}">
            ${t.is_active ? '● В каталоге' : '● Скрыт'}
          </span>
          <button class="admin-btn ${t.is_active ? 'admin-btn--warn' : ''}" data-action="cat-toggle">
            ${t.is_active ? 'Скрыть' : 'Показать'}
          </button>
          <button class="admin-btn" data-action="cat-edit">Изменить</button>
        </div>
      </article>
    `;
  }

  function bindAdminCatalogActions(root) {
    root.querySelectorAll('.adm-chip').forEach((c) => {
      c.addEventListener('click', () => {
        _catalogFilter.status = c.dataset.chip;
        renderAdminCatalogPage();
      });
    });

    let timer = null;
    root.querySelector('[data-action="cat-search"]')?.addEventListener('input', (e) => {
      clearTimeout(timer);
      const v = e.target.value;
      timer = setTimeout(() => { _catalogFilter.q = v; renderAdminCatalogPage(); }, 250);
    });

    root.querySelector('[data-action="open-users-teachers"]')?.addEventListener('click', () => {
      _adminUserFilter = { q: '', role: 'teacher' }; switchAdminView('users');
    });
    root.querySelector('[data-action="open-bookings-confirmed"]')?.addEventListener('click', () => {
      _adminBookingFilter = { q: '', status: 'confirmed' }; switchAdminView('bookings');
    });

    root.querySelectorAll('.adm-cat-card[data-id]').forEach((card) => {
      const id = card.dataset.id;
      card.querySelector('[data-action="cat-toggle"]')?.addEventListener('click', async () => {
        try {
          const all = await API.get('/admin/teachers');
          const t = all.find((x) => x.id === id);
          if (!t) return;
          await API.patch(`/admin/teachers/${encodeURIComponent(id)}`, { is_active: !t.is_active });
          await renderAdminCatalogPage();
        } catch (err) { alert(err.message); }
      });
      card.querySelector('[data-action="cat-edit"]')?.addEventListener('click', async () => {
        try {
          const all = await API.get('/admin/teachers');
          const t = all.find((x) => x.id === id);
          if (!t) return;
          const newName = prompt('Имя:', t.name || '');           if (newName === null) return;
          const newExp  = prompt('Опыт:', t.experience || '');     if (newExp  === null) return;
          const newBio  = prompt('Описание:', t.bio || '');        if (newBio  === null) return;
          const updates = {};
          if (newName !== t.name)       updates.name       = newName;
          if (newExp  !== t.experience) updates.experience = newExp;
          if (newBio  !== t.bio)        updates.bio        = newBio;
          if (!Object.keys(updates).length) return;
          await API.patch(`/admin/teachers/${encodeURIComponent(id)}`, updates);
          await renderAdminCatalogPage();
        } catch (err) { alert(err.message); }
      });
    });
  }

  function pluralReviews(n) {
    const n10 = Math.abs(n) % 10, n100 = Math.abs(n) % 100;
    if (n10 === 1 && n100 !== 11) return 'отзыв';
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 'отзыва';
    return 'отзывов';
  }

  // ───────────────── USERS table (legacy view, all roles) ─────────
  async function renderAdminUsersPage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('users', `<section class="adm-card adm-card--full"><div data-render="adm-sub-body"><p class="empty-state">Загрузка…</p></div></section>`);
    bindShellNav(root);
    const body = root.querySelector('[data-render="adm-sub-body"]');
    try {
      const params = new URLSearchParams();
      if (_adminUserFilter.q)    params.set('q', _adminUserFilter.q);
      if (_adminUserFilter.role) params.set('role', _adminUserFilter.role);
      const qs = params.toString() ? `?${params}` : '';
      _adminUsers = await API.get(`/admin/users${qs}`);
    } catch (err) {
      body.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    const cur = API.getUser();
    body.innerHTML = `
      <div class="admin-toolbar">
        <input type="search" class="admin-search" placeholder="Поиск по имени или email…"
               value="${_adminUserFilter.q || ''}" data-action="user-search" />
        <select class="admin-filter" data-action="user-role-filter">
          <option value=""        ${_adminUserFilter.role === ''        ? 'selected' : ''}>Все роли</option>
          <option value="student" ${_adminUserFilter.role === 'student' ? 'selected' : ''}>Ученики</option>
          <option value="teacher" ${_adminUserFilter.role === 'teacher' ? 'selected' : ''}>Преподаватели</option>
          <option value="admin"   ${_adminUserFilter.role === 'admin'   ? 'selected' : ''}>Админы</option>
        </select>
        <button class="admin-btn admin-btn--primary" data-action="user-create">+ Добавить пользователя</button>
      </div>

      ${_adminUsers.length === 0
        ? `<p class="empty-state">Пользователей не найдено</p>`
        : `<div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Имя</th><th>Email</th><th>Роль</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            ${_adminUsers.map((u) => {
              const isMe = cur?.id === u.id;
              return `
              <tr data-id="${u.id}">
                <td><div class="admin-name"><span>${escapeHTML(u.name || '—')}</span>${isMe ? '<span class="admin-self-tag">это вы</span>' : ''}</div></td>
                <td>${escapeHTML(u.email || '—')}</td>
                <td>
                  <select data-action="role" ${isMe ? 'disabled' : ''}>
                    <option value="student" ${u.role === 'student' ? 'selected' : ''}>student</option>
                    <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>teacher</option>
                    <option value="admin"   ${u.role === 'admin'   ? 'selected' : ''}>admin</option>
                  </select>
                </td>
                <td><span class="admin-flag admin-flag--${u.is_active ? 'on' : 'off'}">${u.is_active ? 'Активен' : 'Заблокирован'}</span></td>
                <td class="admin-actions">
                  <button class="admin-btn ${u.is_active ? 'admin-btn--warn' : ''}" data-action="toggle-active" ${isMe ? 'disabled' : ''}>${u.is_active ? 'Заблокировать' : 'Разблокировать'}</button>
                  <button class="admin-btn" data-action="reset-password">Пароль</button>
                  <button class="admin-btn admin-btn--danger" data-action="delete-user" ${isMe ? 'disabled' : ''}>Удалить</button>
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    `;
    bindAdminUserActions(body);
  }

  function bindAdminUserActions(root) {
    let searchTimer = null;
    root.querySelector('[data-action="user-search"]')?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const v = e.target.value;
      searchTimer = setTimeout(() => { _adminUserFilter.q = v; renderAdminUsersPage(); }, 250);
    });
    root.querySelector('[data-action="user-role-filter"]')?.addEventListener('change', (e) => {
      _adminUserFilter.role = e.target.value; renderAdminUsersPage();
    });
    root.querySelector('[data-action="user-create"]')?.addEventListener('click', adminCreateUser);

    root.querySelectorAll('tr[data-id]').forEach((tr) => {
      const id = tr.dataset.id;
      const u = _adminUsers.find((x) => x.id === id);
      tr.querySelector('select[data-action="role"]')?.addEventListener('change', async (e) => {
        try { await API.patch(`/admin/users/${encodeURIComponent(id)}`, { role: e.target.value }); await renderAdminUsersPage(); }
        catch (err) { alert(err.message); await renderAdminUsersPage(); }
      });
      tr.querySelector('[data-action="toggle-active"]')?.addEventListener('click', async () => {
        if (!u) return;
        try { await API.patch(`/admin/users/${encodeURIComponent(id)}`, { is_active: !u.is_active }); await renderAdminUsersPage(); }
        catch (err) { alert(err.message); }
      });
      tr.querySelector('[data-action="reset-password"]')?.addEventListener('click', async () => {
        const pw = prompt(`Введите новый пароль для ${u.email}:`, '');
        if (pw === null) return;
        if (pw.length < 6) return alert('Пароль должен быть не короче 6 символов');
        try { await API.patch(`/admin/users/${encodeURIComponent(id)}`, { password: pw }); alert('Пароль обновлён'); }
        catch (err) { alert(err.message); }
      });
      tr.querySelector('[data-action="delete-user"]')?.addEventListener('click', async () => {
        if (!confirm(`Удалить пользователя ${u.name} (${u.email})?\n\nЭто также удалит все связанные записи. Действие необратимо.`)) return;
        try { await API.del(`/admin/users/${encodeURIComponent(id)}`); await renderAdminUsersPage(); }
        catch (err) { alert(err.message); }
      });
    });
  }

  async function adminCreateUser() {
    const name = prompt('Имя нового пользователя:');
    if (!name) return;
    const email = prompt('Email:');
    if (!email) return;
    const role = prompt('Роль (student / teacher / admin):', 'student');
    if (!role) return;
    const password = prompt('Пароль (мин. 6 символов):');
    if (!password) return;
    try { await API.post('/admin/users', { name, email, role, password }); await renderAdminUsersPage(); }
    catch (err) { alert(err.message); }
  }

  // ───────────────── BOOKINGS table ───────────────────────────────
  async function renderAdminBookingsPage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('bookings', `<section class="adm-card adm-card--full"><div data-render="adm-sub-body"><p class="empty-state">Загрузка…</p></div></section>`);
    bindShellNav(root);
    const body = root.querySelector('[data-render="adm-sub-body"]');
    try {
      const params = new URLSearchParams();
      if (_adminBookingFilter.q)      params.set('q', _adminBookingFilter.q);
      if (_adminBookingFilter.status) params.set('status', _adminBookingFilter.status);
      const qs = params.toString() ? `?${params}` : '';
      _adminBookings = await API.get(`/admin/bookings${qs}`);
    } catch (err) {
      body.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }
    body.innerHTML = `
      <div class="admin-toolbar">
        <input type="search" class="admin-search" placeholder="Поиск (ученик, учитель, дисциплина)…"
               value="${_adminBookingFilter.q || ''}" data-action="bk-search" />
        <select class="admin-filter" data-action="bk-status-filter">
          <option value=""          ${_adminBookingFilter.status === ''          ? 'selected' : ''}>Все статусы</option>
          <option value="pending"   ${_adminBookingFilter.status === 'pending'   ? 'selected' : ''}>Ожидает</option>
          <option value="confirmed" ${_adminBookingFilter.status === 'confirmed' ? 'selected' : ''}>Подтверждён</option>
          <option value="cancelled" ${_adminBookingFilter.status === 'cancelled' ? 'selected' : ''}>Отменён</option>
          <option value="completed" ${_adminBookingFilter.status === 'completed' ? 'selected' : ''}>Проведён</option>
        </select>
      </div>
      ${_adminBookings.length === 0
        ? `<p class="empty-state">Уроков не найдено</p>`
        : `<div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Дата</th><th>Время</th><th>Учитель</th><th>Ученик</th><th>Дисциплина</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            ${_adminBookings.map((b) => {
              const date = String(b.lesson_date || '').slice(0, 10);
              const time = String(b.time_slot   || '').slice(0, 5);
              const link = b.meeting_url ? `<a href="${escapeHTML(b.meeting_url)}" target="_blank" rel="noopener" class="admin-link">ссылка</a>` : '';
              return `
              <tr data-id="${b.id}">
                <td>${date}</td>
                <td>${time} ${link}</td>
                <td>${escapeHTML(b.teacher_name || '—')}</td>
                <td>${escapeHTML(b.student_name || (b.is_public ? 'Группа' : '—'))}</td>
                <td><span class="admin-mono">${escapeHTML(b.discipline_name || '')}</span></td>
                <td>
                  <select data-action="status">
                    <option value="pending"   ${b.status === 'pending'   ? 'selected' : ''}>Ожидает</option>
                    <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Подтверждён</option>
                    <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Отменён</option>
                    <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Проведён</option>
                  </select>
                </td>
                <td class="admin-actions">
                  <button class="admin-btn"               data-action="bk-edit">Изменить</button>
                  <button class="admin-btn admin-btn--warn"   data-action="bk-remove-student" ${b.is_public ? 'disabled' : ''}>Убрать ученика</button>
                  <button class="admin-btn admin-btn--danger" data-action="bk-delete">Удалить</button>
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    `;
    bindAdminBookingActions(body);
  }

  function bindAdminBookingActions(root) {
    let timer = null;
    root.querySelector('[data-action="bk-search"]')?.addEventListener('input', (e) => {
      clearTimeout(timer);
      const v = e.target.value;
      timer = setTimeout(() => { _adminBookingFilter.q = v; renderAdminBookingsPage(); }, 250);
    });
    root.querySelector('[data-action="bk-status-filter"]')?.addEventListener('change', (e) => {
      _adminBookingFilter.status = e.target.value; renderAdminBookingsPage();
    });
    root.querySelectorAll('tr[data-id]').forEach((tr) => {
      const id = tr.dataset.id;
      const b = _adminBookings.find((x) => String(x.id) === String(id));
      tr.querySelector('select[data-action="status"]')?.addEventListener('change', async (e) => {
        try { await API.patch(`/admin/bookings/${encodeURIComponent(id)}`, { status: e.target.value }); await renderAdminBookingsPage(); }
        catch (err) { alert(err.message); await renderAdminBookingsPage(); }
      });
      tr.querySelector('[data-action="bk-edit"]')?.addEventListener('click', () => adminEditBooking(b));
      tr.querySelector('[data-action="bk-remove-student"]')?.addEventListener('click', async () => {
        if (!confirm(`Убрать ${b.student_name} из записи? Запись станет общей (групповой).`)) return;
        try { await API.patch(`/admin/bookings/${encodeURIComponent(id)}`, { student_id: null }); await renderAdminBookingsPage(); }
        catch (err) { alert(err.message); }
      });
      tr.querySelector('[data-action="bk-delete"]')?.addEventListener('click', async () => {
        if (!confirm('Удалить запись полностью?\n\nЭто действие необратимо. Для отмены урока используйте смену статуса на «Отменён».')) return;
        try { await API.del(`/admin/bookings/${encodeURIComponent(id)}`); await renderAdminBookingsPage(); }
        catch (err) { alert(err.message); }
      });
    });
  }

  async function adminEditBooking(b) {
    if (!b) return;
    const date = String(b.lesson_date || '').slice(0, 10);
    const time = String(b.time_slot   || '').slice(0, 5);
    const newDate = prompt(`Дата урока (YYYY-MM-DD):`, date); if (newDate === null) return;
    const newTime = prompt(`Время (HH:MM):`, time);            if (newTime === null) return;
    const disciplineList = (_adminDisciplines || []).map((d) => d.name).join(', ');
    const newDisc = prompt(`Дисциплина (${disciplineList}):`, b.discipline_name || ''); if (newDisc === null) return;
    const newLink = prompt(`Ссылка на видео-встречу. Оставьте пустым, чтобы не менять:`, b.meeting_url || ''); if (newLink === null) return;
    const updates = {};
    if (newDate && newDate !== date) updates.lesson_date = newDate;
    if (newTime && newTime !== time) updates.time_slot = newTime;
    if (newDisc && newDisc !== b.discipline_name) updates.discipline_name = newDisc;
    if (newLink !== (b.meeting_url || '')) {
      updates.meeting_url = newLink;
      const lc = newLink.toLowerCase();
      if      (lc.includes('zoom.us'))         updates.meeting_provider = 'zoom';
      else if (lc.includes('meet.google.com')) updates.meeting_provider = 'meet';
      else if (lc.includes('teams.microsoft')) updates.meeting_provider = 'teams';
      else                                     updates.meeting_provider = newLink ? 'other' : null;
    }
    if (!Object.keys(updates).length) return;
    try { await API.patch(`/admin/bookings/${encodeURIComponent(b.id)}`, updates); await renderAdminBookingsPage(); }
    catch (err) { alert(err.message); }
  }

  // ───────────────── CHATS PAGE ────────────────────────────────
  let _chatList    = null;
  let _activeChat  = null;
  let _chatFilter  = 'all'; // 'all' | 'students' | 'teachers' | 'unread'
  let _chatSearch  = '';
  let _chatPollT   = null;

  async function renderAdminChatsPage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('chats',
      `<div data-render="adm-sub-body"><p class="empty-state">Загрузка чатов…</p></div>`);
    bindShellNav(root);

    try {
      _chatList = await API.get('/chats');
    } catch (err) {
      root.querySelector('[data-render="adm-sub-body"]').innerHTML =
        `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    drawChatsView(root);
  }

  function drawChatsView(root) {
    const body = root.querySelector('[data-render="adm-sub-body"]');
    if (!body) return;

    let list = _chatList || [];
    if (_chatFilter === 'students') list = list.filter((c) => c.peer_role === 'student');
    if (_chatFilter === 'teachers') list = list.filter((c) => c.peer_role === 'teacher');
    if (_chatFilter === 'unread')   list = list.filter((c) => c.unread > 0);
    if (_chatSearch.trim()) {
      const q = _chatSearch.trim().toLowerCase();
      list = list.filter((c) =>
        (c.peer_name || '').toLowerCase().includes(q) ||
        (c.last_body || '').toLowerCase().includes(q)
      );
    }

    body.innerHTML = `
      ${renderAdminScreenTop('Чаты', { bell: true })}

      <section class="adm-card adm-card--full">
        <div class="adm-card__body">
          <div class="adm-chip-tabs">
            ${[
              ['all',      'Все'],
              ['students', 'Ученики'],
              ['teachers', 'Преподаватели'],
              ['unread',   'Непрочитанные'],
            ].map(([k, lbl]) => `
              <button class="adm-chip ${_chatFilter === k ? 'is-active' : ''}" data-chip="${k}">${lbl}</button>
            `).join('')}
          </div>

          <div class="adm-search-row adm-search-row--compact">
            <span class="adm-search-row__icon">${adminIcon('search')}</span>
            <input type="search" class="adm-search-row__input"
                   placeholder="Поиск по чатам…"
                   value="${escapeHTML(_chatSearch)}" data-action="chat-search" />
          </div>

          <div class="chat-list">
            ${list.length === 0
              ? `<p class="empty-state" style="padding:32px 0">Чатов нет</p>`
              : list.map((c) => renderChatRow(c)).join('')}
          </div>
          <button class="adm-floating-action" type="button" data-action="chat-new">
            ${adminIcon('user-plus')}
            <span>Новый чат</span>
          </button>
        </div>
      </section>
    `;

    bindAdminScreenTop(body, '[data-action="chat-search"]');
    body.querySelectorAll('.adm-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        _chatFilter = btn.dataset.chip;
        drawChatsView(root);
      });
    });
    let searchTimer = null;
    body.querySelector('[data-action="chat-search"]')?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        _chatSearch = e.target.value;
        drawChatsView(root);
      }, 180);
    });
    body.querySelectorAll('.chat-row[data-id]').forEach((row) => {
      row.addEventListener('click', () => openChatModal(row.dataset.id));
    });
    body.querySelector('[data-action="chat-new"]')?.addEventListener('click', startAdminChat);
  }

  async function startAdminChat() {
    const q = prompt('Введите имя или email пользователя:');
    if (!q) return;
    try {
      const users = await API.get(`/admin/users?q=${encodeURIComponent(q.trim())}`);
      const candidates = users.filter((u) => u.role !== 'admin' || u.id !== API.getUser()?.id);
      if (!candidates.length) return alert('Пользователь не найден');
      const picked = candidates.length === 1
        ? candidates[0]
        : candidates[0];
      const created = await API.post('/chats', { peer_id: picked.id });
      _chatList = await API.get('/chats');
      const root = $('[data-render="admin-page"]');
      if (root) drawChatsView(root);
      await openChatModal(created.id);
    } catch (err) {
      alert(`Не удалось создать чат: ${err.message}`);
    }
  }

  function renderChatRow(c) {
    const last = c.last_body
      ? escapeHTML(c.last_body.length > 80 ? c.last_body.slice(0, 80) + '…' : c.last_body)
      : '<em>Нет сообщений</em>';
    const when = c.last_at ? shortRelativeDate(c.last_at) : '';
    const time = c.last_at ? shortTimeOfDay(c.last_at) : '';
    const unread = c.unread > 0
      ? `<span class="chat-row__unread">${c.unread}</span>` : '';
    const pinned = c.pinned ? `<span class="chat-row__pin">Закреплено</span>` : '';
    return `
      <article class="chat-row ${c.pinned ? 'is-pinned' : ''}" data-id="${c.id}">
        <div class="chat-row__avatar">${initialsCircle(c.peer_name, c.peer_avatar)}</div>
        <div class="chat-row__main">
          ${pinned}
          <p class="chat-row__name">${escapeHTML(c.peer_name)} <span class="chat-row__role">${roleLabelShort(c.peer_role)}</span></p>
          <p class="chat-row__last">${last}</p>
        </div>
        <div class="chat-row__meta">
          <span class="chat-row__time">${time}</span>
          <span class="chat-row__date">${when}</span>
          ${unread}
        </div>
      </article>
    `;
  }

  function roleLabelShort(role) {
    return ({ student: 'ученик', teacher: 'преподаватель', admin: 'админ' })[role] || role || '';
  }

  async function openChatModal(chatId) {
    _activeChat = (_chatList || []).find((c) => String(c.id) === String(chatId));
    if (!_activeChat) return;

    let messages = [];
    try {
      messages = await API.get(`/chats/${chatId}/messages?limit=200`);
      // Mark read
      try { await API.post(`/chats/${chatId}/read`); } catch (_) {}
    } catch (err) { alert(err.message); return; }

    document.querySelectorAll('.chat-modal').forEach((n) => n.remove());

    const me = API.getUser();
    const html = `
      <div class="chat-modal" role="dialog" aria-modal="true">
        <div class="chat-modal__backdrop" data-action="close"></div>
        <div class="chat-modal__card">
          <header class="chat-modal__head">
            <button class="chat-modal__close" data-action="close" aria-label="Закрыть">←</button>
            <div class="chat-modal__avatar">${initialsCircle(_activeChat.peer_name, _activeChat.peer_avatar)}</div>
            <div class="chat-modal__title">
              <strong>${escapeHTML(_activeChat.peer_name)}</strong>
              <small>${roleLabelShort(_activeChat.peer_role)}</small>
            </div>
          </header>
          <div class="chat-modal__body" data-render="chat-messages">
            ${renderMessages(messages, me?.id)}
          </div>
          <footer class="chat-modal__send">
            <textarea id="chatSendInput" placeholder="Написать сообщение…" rows="1"></textarea>
            <button class="admin-btn admin-btn--primary" id="chatSendBtn">Отправить</button>
          </footer>
        </div>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const modal = wrap.firstElementChild;
    document.body.appendChild(modal);
    document.body.classList.add('no-scroll');

    modal.querySelectorAll('[data-action="close"]').forEach((el) => {
      el.addEventListener('click', () => closeChatModal(modal));
    });
    document.addEventListener('keydown', escCloseChat);

    function escCloseChat(e) { if (e.key === 'Escape') closeChatModal(modal); }
    modal._escHandler = escCloseChat;

    const input = $('#chatSendInput');
    const btn   = $('#chatSendBtn');
    input?.focus();
    // Auto-grow textarea
    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(140, input.scrollHeight) + 'px';
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        btn.click();
      }
    });
    btn?.addEventListener('click', async () => {
      const body = (input?.value || '').trim();
      if (!body) return;
      btn.disabled = true;
      try {
        const sent = await API.post(`/chats/${chatId}/messages`, { body });
        // Append to UI
        const view = $('[data-render="chat-messages"]');
        if (view) {
          view.insertAdjacentHTML('beforeend', renderOneMessage(sent, me?.id));
          view.scrollTop = view.scrollHeight;
        }
        input.value = '';
        input.style.height = 'auto';
      } catch (err) { alert(err.message); }
      btn.disabled = false;
    });

    // Scroll to bottom on open
    setTimeout(() => {
      const view = $('[data-render="chat-messages"]');
      if (view) view.scrollTop = view.scrollHeight;
    }, 50);
  }

  function closeChatModal(modal) {
    modal.classList.add('is-leaving');
    setTimeout(() => {
      modal.remove();
      document.body.classList.remove('no-scroll');
    }, 180);
    document.removeEventListener('keydown', modal._escHandler || (() => {}));
    _activeChat = null;
    // Refresh list so unread counters drop
    if (_adminView === 'chats') {
      API.get('/chats').then((data) => { _chatList = data; const r = $('[data-render="admin-page"]'); if (r) drawChatsView(r); }).catch(() => {});
    }
  }

  function renderMessages(messages, myId) {
    if (!messages.length) {
      return `<p class="empty-state" style="padding:48px 0">Сообщений пока нет — напишите первое</p>`;
    }
    let prevDay = '';
    return messages.map((m) => {
      const d = String(m.created_at || '').slice(0, 10);
      let dayHeader = '';
      if (d !== prevDay) {
        prevDay = d;
        dayHeader = `<div class="chat-day">${shortRelativeDate(m.created_at)}</div>`;
      }
      return dayHeader + renderOneMessage(m, myId);
    }).join('');
  }

  function renderOneMessage(m, myId) {
    const mine = m.sender_id === myId;
    const time = shortTimeOfDay(m.created_at);
    return `
      <div class="chat-msg ${mine ? 'chat-msg--mine' : ''}">
        <div class="chat-msg__bubble">${escapeHTML(m.body)}</div>
        <span class="chat-msg__time">${time}</span>
      </div>
    `;
  }

  // ───────────────── GROUPS PAGE ───────────────────────────────
  let _groupsFilter = 'all';

  async function renderAdminGroupsPage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('groups',
      `<div data-render="adm-sub-body"><p class="empty-state">Загрузка групп…</p></div>`);
    bindShellNav(root);
    const body = root.querySelector('[data-render="adm-sub-body"]');

    let summary, groups;
    try {
      [summary, groups] = await Promise.all([
        API.get('/admin/groups/summary'),
        API.get('/admin/groups'),
      ]);
    } catch (err) {
      body.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    const metricsHTML = renderAdminMetricsBand([
      { kind: 'users',     label: 'Всего групп',         value: summary.total,        delta: '' },
      { kind: 'teachers',  label: 'Детские',              value: summary.kids_groups,  delta: '' },
      { kind: 'lessons',   label: 'Подростки и молодёжь', value: summary.teen_groups,  delta: '' },
      { kind: 'bookings',  label: 'Взрослые',             value: summary.adult_groups, delta: '' },
    ]);

    const filtered = groups.filter((g) => {
      const age = groupAge(g).toLowerCase();
      const level = groupLevel(g).toLowerCase();
      if (_groupsFilter === 'kids')   return /(дет|4-6|7-10|6-12)/.test(age);
      if (_groupsFilter === 'teens')  return /(подрост|молод|11-14|11-15|13-17|15-17|15-20|18-25)/.test(age);
      if (_groupsFilter === 'adults') return /(взрос|стар|20\+|26|45)/.test(age);
      if (_groupsFilter === 'hifz')   return /(хифз|hifz|продвин)/.test(level);
      return true;
    });

    body.innerHTML = `
      ${renderAdminScreenTop('Группы', { bell: true })}
      ${metricsHTML}

      <section class="adm-card adm-card--full">
        <div class="adm-card__body">
          <div class="adm-chip-tabs adm-chip-tabs--with-side" role="tablist">
            <div class="adm-chip-tabs__main">
              ${[
                ['all',    'Все'],
                ['kids',   'Дети'],
                ['teens',  'Подростки'],
                ['adults', 'Взрослые'],
                ['hifz',   'Хифз'],
              ].map(([v, lbl]) => `
                <button class="adm-chip ${_groupsFilter === v ? 'is-active' : ''}" data-chip="${v}">${lbl}</button>
              `).join('')}
            </div>
            <button class="adm-card__more" data-action="open-bookings-public">Расписание</button>
          </div>
          <div class="grp-list">
            ${filtered.length === 0
              ? `<p class="empty-state" style="padding:32px 0">Активных групп пока нет</p>`
              : filtered.map(renderGroupCard).join('')}
          </div>
        </div>
      </section>
    `;

    bindAdminScreenTop(body, null);
    body.querySelectorAll('.adm-chip[data-chip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        _groupsFilter = btn.dataset.chip;
        renderAdminGroupsPage();
      });
    });
    body.querySelector('[data-action="open-bookings-public"]')?.addEventListener('click', () => {
      _adminBookingFilter = { q: '', status: '' }; switchAdminView('bookings');
    });
    body.querySelector('[data-action="open-teachers"]')?.addEventListener('click', () => {
      switchAdminView('catalog');
    });
  }

  function renderGroupCard(g) {
    const age = groupAge(g);
    const level = groupLevel(g);
    const students = Number(g.students_count ?? g.enrolled) || 0;
    const lessons = Number(g.group_lessons ?? g.lessons_count) || 0;
    const teacher = g.teacher_name || '—';
    const weekdays = g.weekdays || '';
    const timeWindow = g.time_window ? String(g.time_window) : '';
    const title = g.course_name || [level, age].filter(Boolean).join(' · ') || 'Группа';
    return `
      <article class="grp-card">
        <div class="grp-card__icon">${groupGlyph(age || level)}</div>
        <div class="grp-card__main">
          <div class="grp-card__row1">
            <h4 class="grp-card__title">${escapeHTML(title)}</h4>
            ${age ? `<span class="grp-card__pill">${escapeHTML(age)}</span>` : ''}
          </div>
          <p class="grp-card__meta"><span>Уровень: ${escapeHTML(level || '—')}</span></p>
          <p class="grp-card__meta"><span>Преподаватель: ${escapeHTML(teacher)}</span></p>
          <div class="grp-card__facts">
            <span>${adminIcon('users')} ${students} учеников</span>
            <span>${adminIcon('calendar')} ${lessons} занятий</span>
            ${weekdays ? `<span>${adminIcon('calendar')} ${escapeHTML(weekdays)}</span>` : ''}
            ${timeWindow ? `<span>${adminIcon('clock')} ${escapeHTML(timeWindow)}</span>` : ''}
          </div>
        </div>
        <button class="grp-card__more" type="button" aria-label="Действия">${adminIcon('more')}</button>
      </article>
    `;
  }

  function groupAge(g) {
    return String(g.age_name || g.age_group || '');
  }
  function groupLevel(g) {
    return String(g.level_name || g.level || '');
  }

  function groupGlyph(ageGroup) {
    // Pick a small Arabic glyph by group — purely cosmetic.
    const map = {
      '11-15 лет': 'الْ',
      '15-20 лет': 'تَجْ',
      '20+':       'فِقْ',
    };
    return `<span class="grp-glyph">${map[ageGroup] || '۞'}</span>`;
  }

  // ───────────────── ATTENDANCE PAGE ───────────────────────────
  async function renderAdminAttendancePage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('attendance',
      `<div data-render="adm-sub-body"><p class="empty-state">Загрузка посещаемости…</p></div>`);
    bindShellNav(root);
    const body = root.querySelector('[data-render="adm-sub-body"]');

    let summary, recent;
    try {
      [summary, recent] = await Promise.all([
        API.get('/admin/attendance/summary'),
        API.get('/admin/attendance/recent?limit=40'),
      ]);
    } catch (err) {
      body.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    const heroHTML = renderAdmHeroHeader({
      title: 'Посещаемость',
      subtitle: 'Отметки явки на проведённые уроки',
      metrics: [
        { kind: 'lessons',  label: 'Посещено',     value: summary.attended,                 delta: '' },
        { kind: 'bookings', label: 'Пропущено',    value: summary.missed,                   delta: '' },
        { kind: 'users',    label: 'Без отметки',  value: summary.pending,                  delta: '' },
        { kind: 'teachers', label: 'За неделю %',
          value: summary.attendance_pct_week != null ? summary.attendance_pct_week + '%' : '—',
          delta: '' },
      ],
      actions: [],
    });

    body.innerHTML = `
      ${heroHTML}

      <section class="adm-card adm-card--full">
        <div class="adm-card__head">
          <h3 class="adm-card__title">Уроки за прошедший период</h3>
        </div>
        <div class="adm-card__body">
          <div class="att-list">
            ${recent.length === 0
              ? `<p class="empty-state" style="padding:32px 0">Уроков пока нет</p>`
              : recent.map(renderAttRow).join('')}
          </div>
        </div>
      </section>
    `;

    body.querySelectorAll('.att-row[data-id]').forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('[data-mark="yes"]')?.addEventListener('click', async () => {
        try { await API.patch(`/admin/bookings/${id}`, { attended: true }); await renderAdminAttendancePage(); }
        catch (err) { alert(err.message); }
      });
      row.querySelector('[data-mark="no"]')?.addEventListener('click', async () => {
        try { await API.patch(`/admin/bookings/${id}`, { attended: false }); await renderAdminAttendancePage(); }
        catch (err) { alert(err.message); }
      });
      row.querySelector('[data-mark="reset"]')?.addEventListener('click', async () => {
        try { await API.patch(`/admin/bookings/${id}`, { attended: null }); await renderAdminAttendancePage(); }
        catch (err) { alert(err.message); }
      });
    });
  }

  function renderAttRow(b) {
    const date = String(b.lesson_date || '').slice(0, 10);
    const time = String(b.time_slot || '').slice(0, 5);
    const isMarked = b.attended != null;
    const stateCls = b.attended === true ? 'is-yes'
                   : b.attended === false ? 'is-no'
                   : 'is-pending';
    return `
      <article class="att-row ${stateCls}" data-id="${b.id}">
        <div class="att-row__time">
          <span class="att-row__date">${russianShortDate(date)}</span>
          <span class="att-row__hour">${time}</span>
        </div>
        <div class="att-row__main">
          <p class="att-row__title">${escapeHTML(b.student_name || (b.is_public ? 'Группа' : '—'))}</p>
          <p class="att-row__meta">${escapeHTML(b.teacher_name || '—')} · ${escapeHTML(b.discipline_name || '—')}</p>
        </div>
        <div class="att-row__actions">
          ${isMarked
            ? `<span class="att-badge att-badge--${b.attended ? 'yes' : 'no'}">${b.attended ? '✓ Был' : '✕ Нет'}</span>
               <button class="admin-btn" data-mark="reset">Сбросить</button>`
            : `<button class="admin-btn admin-btn--primary" data-mark="yes">Был</button>
               <button class="admin-btn admin-btn--warn"    data-mark="no">Пропустил</button>`
          }
        </div>
      </article>
    `;
  }

  // ───────────────── REPORTS PAGE ──────────────────────────────
  async function renderAdminReportsPage() {
    const root = $('[data-render="admin-page"]');
    if (!root) return;
    root.innerHTML = renderAdminShell('reports',
      `<div data-render="adm-sub-body"><p class="empty-state">Загрузка отчётов…</p></div>`);
    bindShellNav(root);
    const body = root.querySelector('[data-render="adm-sub-body"]');

    let summary, series, byDisc, teachers;
    try {
      [summary, series, byDisc, teachers] = await Promise.all([
        API.get('/admin/reports/summary'),
        API.get('/admin/reports/lessons-by-day?days=30'),
        API.get('/admin/reports/by-discipline'),
        API.get('/admin/reports/teacher-load'),
      ]);
    } catch (err) {
      body.innerHTML = `<p class="empty-state">Ошибка: ${err.message}</p>`;
      return;
    }

    const heroHTML = renderAdmHeroHeader({
      title: 'Отчёты',
      subtitle: 'Аналитика медресе за последние 30 дней',
      metrics: [
        { kind: 'lessons',  label: 'Уроков за 30 дней',     value: summary.bookings_30d,        delta: '' },
        { kind: 'users',    label: 'Активных учеников',     value: summary.students_total,      delta: fmtDelta(summary.students_new_30d, 'новых за месяц') },
        { kind: 'teachers', label: 'Проведено',             value: summary.lessons_done_30d,    delta: '' },
        { kind: 'bookings', label: 'Посещаемость',
          value: summary.attendance_pct_30d != null ? summary.attendance_pct_30d + '%' : '—',
          delta: '' },
      ],
      actions: [],
    });

    // Synthesize a status distribution from the summary
    const statusDist = [
      { status: 'completed', n: summary.lessons_done_30d || 0 },
      { status: 'cancelled', n: summary.lessons_cancelled_30d || 0 },
      { status: 'pending',   n: Math.max(0,
            (summary.bookings_30d || 0)
            - (summary.lessons_done_30d || 0)
            - (summary.lessons_cancelled_30d || 0)) },
    ].filter((x) => x.n > 0);

    body.innerHTML = `
      ${heroHTML}

      <section class="adm-grid-2">
        <article class="adm-card">
          <header class="adm-card__head">
            <h3 class="adm-card__title">Уроки за 30 дней</h3>
            <span class="adm-card__more" style="cursor:default">${series.reduce((a, b) => a + b.total, 0)} всего</span>
          </header>
          <div class="adm-card__body">
            ${renderLessonsChart(series)}
          </div>
        </article>

        <article class="adm-card">
          <header class="adm-card__head">
            <h3 class="adm-card__title">По дисциплинам</h3>
          </header>
          <div class="adm-card__body">
            ${renderDisciplineDonut(byDisc)}
          </div>
        </article>
      </section>

      <section class="adm-grid-2">
        <article class="adm-card">
          <header class="adm-card__head">
            <h3 class="adm-card__title">Топ преподавателей</h3>
          </header>
          <div class="adm-card__body">
            ${renderTopTeachersBars(teachers)}
          </div>
        </article>

        <article class="adm-card">
          <header class="adm-card__head">
            <h3 class="adm-card__title">Статусы записей (30 дней)</h3>
          </header>
          <div class="adm-card__body">
            ${renderStatusBreakdown(statusDist)}
          </div>
        </article>
      </section>
    `;
  }

  // ── Charts (pure SVG, no library deps) ───────────────────────
  function renderLessonsChart(series) {
    if (!series || series.length === 0) {
      return `<p class="empty-state" style="padding:32px 0">Нет данных</p>`;
    }
    // Normalize series: each entry has { date | day, lessons | total | ... }
    const normalized = series.map((s) => ({
      date: String(s.date || s.day || '').slice(0, 10),
      lessons: s.lessons != null ? s.lessons : (s.total || 0),
    }));
    const W = 600, H = 220, P = 28;
    const max = Math.max(1, ...normalized.map((d) => d.lessons));
    const stepX = (W - P * 2) / Math.max(1, normalized.length - 1);

    const pts = normalized.map((d, i) => {
      const x = P + i * stepX;
      const y = H - P - (d.lessons / max) * (H - P * 2);
      return [x, y, d];
    });

    const polyLine = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const areaPath = `M ${P},${H - P} L ${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ')} L ${(W - P).toFixed(1)},${H - P} Z`;

    const labelEvery = Math.ceil(normalized.length / 6);
    const xLabels = pts.map(([x, , d], i) => i % labelEvery === 0
      ? `<text x="${x}" y="${H - 4}" class="cx-axis">${russianShortDate(d.date)}</text>`
      : '').join('');

    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const y = H - P - f * (H - P * 2);
      const v = Math.round(max * f);
      return `<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" class="cx-grid"/>
              <text x="${P - 6}" y="${y + 3}" class="cx-axis cx-axis--y">${v}</text>`;
    }).join('');

    const dots = pts.map(([x, y, d]) => `
      <circle cx="${x}" cy="${y}" r="3.5" class="cx-dot">
        <title>${russianShortDate(d.date)}: ${d.lessons} ур.</title>
      </circle>
    `).join('');

    return `
      <svg class="cx-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cxArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#2D5F3F" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#2D5F3F" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${areaPath}" fill="url(#cxArea)"/>
        <polyline points="${polyLine}" class="cx-line"/>
        ${dots}
        ${xLabels}
      </svg>
    `;
  }

  function renderDisciplineDonut(items) {
    if (!items || items.length === 0) {
      return `<p class="empty-state" style="padding:32px 0">Нет данных</p>`;
    }
    // Normalize: { name, count | value }
    const normalized = items.map((it) => ({
      name: it.name || '—',
      value: it.count != null ? it.count : (it.value || 0),
    }));
    const total = normalized.reduce((s, x) => s + x.value, 0) || 1;
    const palette = ['#2D5F3F', '#C49A4F', '#7AA67F', '#D6A57F', '#A5C7AE', '#E8B95F'];
    const R = 60, r = 36, cx = 80, cy = 80;
    let acc = 0;
    const segs = normalized.map((it, i) => {
      const v = it.value;
      const frac = v / total;
      const a0 = acc * 2 * Math.PI - Math.PI / 2;
      const a1 = (acc + frac) * 2 * Math.PI - Math.PI / 2;
      acc += frac;
      const lf = frac > 0.5 ? 1 : 0;
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
      const xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
      const path = `M ${x0},${y0} A ${R},${R} 0 ${lf} 1 ${x1},${y1}
                    L ${xi1},${yi1} A ${r},${r} 0 ${lf} 0 ${xi0},${yi0} Z`;
      return `<path d="${path}" fill="${palette[i % palette.length]}"><title>${escapeHTML(it.name)}: ${v}</title></path>`;
    }).join('');

    const legend = normalized.map((it, i) => `
      <li><span class="cx-leg-dot" style="background:${palette[i % palette.length]}"></span>
        ${escapeHTML(it.name)} <strong>${it.value}</strong></li>
    `).join('');

    return `
      <div class="cx-donut-wrap">
        <svg class="cx-donut" viewBox="0 0 160 160">
          ${segs}
          <text x="80" y="78" class="cx-donut-num">${total}</text>
          <text x="80" y="96" class="cx-donut-lbl">всего</text>
        </svg>
        <ul class="cx-legend">${legend}</ul>
      </div>
    `;
  }

  function renderTopTeachersBars(items) {
    if (!items || items.length === 0) {
      return `<p class="empty-state" style="padding:32px 0">Нет данных</p>`;
    }
    // Normalize: { name, lessons | lessons_30d }
    const normalized = items.map((x) => ({
      name: x.name || '—',
      lessons: x.lessons != null ? x.lessons : (x.lessons_30d || 0),
    }));
    const max = Math.max(1, ...normalized.map((x) => x.lessons));
    return `
      <ul class="cx-bars">
        ${normalized.map((x) => {
          const pct = (x.lessons / max) * 100;
          return `
            <li class="cx-bar">
              <span class="cx-bar__name">${escapeHTML(x.name)}</span>
              <span class="cx-bar__track">
                <span class="cx-bar__fill" style="width:${pct.toFixed(1)}%"></span>
              </span>
              <strong class="cx-bar__num">${x.lessons}</strong>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  function renderStatusBreakdown(items) {
    if (!items || items.length === 0) {
      return `<p class="empty-state" style="padding:32px 0">Нет данных</p>`;
    }
    const total = items.reduce((s, x) => s + (x.n || 0), 0) || 1;
    const labels = { pending:'Ожидает', confirmed:'Подтверждён', cancelled:'Отменён', completed:'Проведён' };
    const colors = { pending:'#C49A4F', confirmed:'#2D5F3F', cancelled:'#D67A8E', completed:'#7AA67F' };
    return `
      <ul class="cx-bars cx-bars--status">
        ${items.map((x) => {
          const pct = ((x.n || 0) / total) * 100;
          return `
            <li class="cx-bar">
              <span class="cx-bar__name">${labels[x.status] || x.status}</span>
              <span class="cx-bar__track">
                <span class="cx-bar__fill" style="width:${pct.toFixed(1)}%; background:${colors[x.status] || '#888'}"></span>
              </span>
              <strong class="cx-bar__num">${x.n}</strong>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  // ───────────────── TEACHERS legacy table ────────────────────────
  async function renderAdminTeachersPage() {
    // Forwards to the new catalog-style page.
    return renderAdminCatalogPage();
  }

  // Fire-and-forget: confirm the token is still valid and refresh
  // the cached user. If the token is dead, api.js will redirect to login.
  async function verifyAuth() {
    if (isAuthPage()) return;
    if (!API.getToken()) return;
    try {
      const me = await API.get('/auth/me');
      API.setUser(me);
    } catch (_) { /* 401 → already handled by api.js */ }
  }

  // ====================================================
  // BOOT
  // ====================================================
  function boot() {
    if (!authGuard()) return; // a redirect happened — stop here.

    initShared();
    if (document.body.classList.contains('page-home'))     initHome();
    if (document.body.classList.contains('page-schedule')) initSchedule();
    if (document.body.classList.contains('page-booking'))  initBooking();
    if (document.body.classList.contains('page-teachers')) initTeachers();
    if (document.body.classList.contains('page-login'))    initLogin();
    if (document.body.classList.contains('page-register')) initRegister();
    if (document.body.classList.contains('page-teacher'))  initTeacher();
    if (document.body.classList.contains('page-profile'))  initProfile();
    if (document.body.classList.contains('page-admin'))    initAdmin();

    // Wire the dedicated logout icon-btn used on teacher.html.
    document.getElementById('teacherLogoutBtn')?.addEventListener('click', () => {
      if (confirm('Выйти из аккаунта?')) logout();
    });

    verifyAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
