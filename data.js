/* =========================================================
   UI strings only.

   No domain data here. Domain content lives in PostgreSQL
   and is loaded via the API.

   What's still here:
     • static labels / button text / page titles
========================================================= */

window.DB = {
  user: {
    name: 'Гость',
  },

  booking: {
    pageTitle: 'Запись на урок',
    pageSubtitle: 'Выберите дату и удобное время',

    stats: {
      slotsLabel: 'Свободных слотов',
      durationLabel: 'Длительность',
      durationUnit: 'мин',
      availabilityBadge: 'Доступно',
    },

    slotsTitle: 'Доступное время',
    teacherLabel: 'Преподаватель',

    cta: {
      label: 'Записаться',
      note: 'После подтверждения урок появится в расписании',
    },
  },

  teachersPage: {
    title: 'Преподаватели',
    subtitle: 'Выберите преподавателя для обучения',
    welcomeText: 'Добро пожаловать',
    welcomeUserName: 'Гость',
  },

  schedule: {
    title: 'Расписание',
    subtitle: 'Ваши ближайшие уроки и календарь',
    today: {
      label: 'Сегодня',
      quote: '«Лучший из вас тот, кто изучает Коран и обучает ему.»',
      quoteSource: '(Бухари)',
    },
    upcomingTitle: 'Ближайшие уроки',
    futureTitle: 'Предстоящие',
  },
};
