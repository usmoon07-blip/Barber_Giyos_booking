/** Mini App matnlari: o'zbekcha va ruscha. */

export const translations = {
  uz: {
    code: 'uz',
    label: "O'zbekcha",

    onboarding: {
      slides: [
        {
          title: 'Mukammal ko’rinish shu yerdan boshlanadi',
          text: 'Professional barberlar va sifatli xizmatlar siz uchun.',
        },
        {
          title: 'O’zingizga qulay barber va vaqtni tanlang',
          text: 'Barberni tanlang, bo’sh vaqtni belgilang va oldindan bron qiling.',
        },
        {
          title: 'Vaqtingizni navbatda o’tkazmang',
          text: 'Oldindan bron qiling va belgilangan vaqtda keling.',
        },
      ],
      next: 'Keyingisi',
      skip: "O'tkazib yuborish",
      start: 'Boshla',
      chooseLanguage: 'Tilni tanlang',
    },

    nav: { home: 'Bosh sahifa', services: 'Xizmatlar', booking: 'Bron', profile: 'Profil' },

    home: {
      greeting: (name) => `Salom, ${name} 👋`,
      subtitle: 'Bugun qanday xizmat kerak?',
      barbers: 'Bizning barberlar',
      heroTitle: 'Keyingi tashrifingizni hoziroq bron qiling',
      heroText: "Bor-yo'g'i bir necha qadam — va vaqtingiz siznikidir.",
      book: 'Bron qilish',
      popular: 'Mashhur xizmatlar',
      seeAll: 'Barchasi',
      upcoming: 'Yaqin broningiz',
    },

    services: {
      title: 'Xizmatlar va narxlar',
      all: 'Barchasi',
      categories: { HAIR: 'Soch', BEARD: 'Soqol', COMBO: 'Kompleks', STYLING: 'Styling', OTHER: 'Boshqa' },
      empty: 'Bu kategoriyada xizmat yo’q',
      book: 'Bron qilish',
    },

    booking: {
      title: 'Bron qilish',
      steps: ['Xizmat', 'Barber', 'Sana', 'Vaqt', 'Tasdiqlash'],
      chooseService: 'Xizmatni tanlang',
      chooseBarber: 'Barberni tanlang',
      chooseDate: 'Sanani tanlang',
      chooseTime: 'Vaqtni tanlang',
      confirm: 'Ma’lumotlarni tekshiring',
      anyBarber: 'Farqi yo’q',
      noSlots: 'Bu kunda bo’sh vaqt qolmagan',
      dayOff: 'Bu kuni barber dam oladi',
      loadingSlots: 'Bo’sh vaqtlar yuklanmoqda...',
      today: 'Bugun',
      tomorrow: 'Ertaga',
      next: 'Davom etish',
      back: 'Orqaga',
      submit: 'Bronni tasdiqlash',
      yourData: 'Ma’lumotlaringiz',
      name: 'Ismingiz',
      namePlaceholder: 'Ismingizni kiriting',
      phone: 'Telefon raqamingiz',
      phonePlaceholder: '+998 __ ___ __ __',
      note: 'Izoh (ixtiyoriy)',
      notePlaceholder: 'Qo’shimcha so’rovingiz bo’lsa yozing',
      barber: 'Barber',
      service: 'Xizmat',
      date: 'Sana',
      time: 'Vaqt',
      price: 'Narx',
      duration: 'Davomiyligi',
      payment: "To'lov turi",
      paymentTitle: "To'lov turini tanlang",
      cash: 'Naqd pul',
      cashHint: 'Sartaroshxonada o\u2019zingiz to\u2019laysiz',
      card: 'Karta orqali',
      cardHint: 'Karta raqamiga o\u2019tkazasiz',
      cardNumber: 'Karta raqami',
      cardHolder: 'Karta egasi',
      copy: 'Nusxa olish',
      copied: 'Nusxa olindi ✓',
      cardNote: 'To\u2019lovni tashrif oldidan yoki sartaroshxonada amalga oshirishingiz mumkin. Karta ma\u2019lumotlari botga ham yuboriladi.',
      successTitle: 'Broningiz qabul qilindi!',
      successText: 'Tafsilotlarni botga ham yubordik. Sizni belgilangan vaqtda kutamiz!',
      myBookings: 'Bronlarimni ko’rish',
      close: 'Yopish',
      errors: {
        SLOT_TAKEN: 'Afsuski, bu vaqtni allaqachon band qilishdi. Boshqa vaqtni tanlang.',
        PHONE_REQUIRED: 'Telefon raqamingizni kiriting',
        INVALID_PHONE: 'Telefon raqami noto’g’ri',
        INVALID_NAME: 'Ismingizni kiriting',
        TOO_LATE: 'Bu vaqt o’tib ketdi. Boshqa vaqtni tanlang.',
        DAY_OFF: 'Bu kuni barber ishlamaydi',
      },
    },

    profile: {
      title: 'Profil',
      myBookings: 'Mening bronlarim',
      upcoming: 'Kelgusi',
      past: 'O’tgan',
      empty: 'Hozircha bronlaringiz yo’q',
      emptyText: 'Birinchi broningizni qiling — bu bir daqiqa vaqtingizni oladi.',
      bookAgain: 'Yana bron qilish',
      repeat: 'Takrorlash',
      onTheWay: 'Yo’lga tushdim',
      onTheWayDone: 'Yo’lga tushdingiz ✓',
      cancel: 'Bekor qilish',
      cancelConfirm: 'Bronni bekor qilishni tasdiqlaysizmi?',
      language: 'Til',
      shopInfo: 'Sartaroshxona',
      editName: 'Ismni o’zgartirish',
      save: 'Saqlash',
      statuses: {
        PENDING: 'Kutilmoqda',
        CONFIRMED: 'Tasdiqlangan',
        COMPLETED: 'Yakunlangan',
        CANCELLED: 'Bekor qilingan',
      },
    },

    common: {
      loading: 'Yuklanmoqda...',
      error: 'Xatolik yuz berdi',
      retry: 'Qayta urinish',
      minutes: (n) => `${n} daqiqa`,
      currency: 'so’m',
      weekdaysShort: ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'],
      months: [
        'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
        'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
      ],
    },
  },

  ru: {
    code: 'ru',
    label: 'Русский',

    onboarding: {
      slides: [
        {
          title: 'Безупречный образ начинается здесь',
          text: 'Профессиональные барберы и качественный сервис для вас.',
        },
        {
          title: 'Выберите барбера и удобное время',
          text: 'Выберите мастера, свободное время и запишитесь заранее.',
        },
        {
          title: 'Не тратьте время в очереди',
          text: 'Записывайтесь заранее и приходите к назначенному времени.',
        },
      ],
      next: 'Далее',
      skip: 'Пропустить',
      start: 'Начать',
      chooseLanguage: 'Выберите язык',
    },

    nav: { home: 'Главная', services: 'Услуги', booking: 'Запись', profile: 'Профиль' },

    home: {
      greeting: (name) => `Здравствуйте, ${name} 👋`,
      subtitle: 'Какая услуга нужна сегодня?',
      barbers: 'Наши барберы',
      heroTitle: 'Запишитесь на следующий визит прямо сейчас',
      heroText: 'Всего несколько шагов — и ваше время принадлежит вам.',
      book: 'Записаться',
      popular: 'Популярные услуги',
      seeAll: 'Все',
      upcoming: 'Ближайшая запись',
    },

    services: {
      title: 'Услуги и цены',
      all: 'Все',
      categories: { HAIR: 'Волосы', BEARD: 'Борода', COMBO: 'Комплекс', STYLING: 'Стайлинг', OTHER: 'Другое' },
      empty: 'В этой категории пока нет услуг',
      book: 'Записаться',
    },

    booking: {
      title: 'Запись',
      steps: ['Услуга', 'Барбер', 'Дата', 'Время', 'Подтверждение'],
      chooseService: 'Выберите услугу',
      chooseBarber: 'Выберите барбера',
      chooseDate: 'Выберите дату',
      chooseTime: 'Выберите время',
      confirm: 'Проверьте данные',
      anyBarber: 'Не важно',
      noSlots: 'На этот день свободного времени не осталось',
      dayOff: 'В этот день барбер отдыхает',
      loadingSlots: 'Загружаем свободное время...',
      today: 'Сегодня',
      tomorrow: 'Завтра',
      next: 'Продолжить',
      back: 'Назад',
      submit: 'Подтвердить запись',
      yourData: 'Ваши данные',
      name: 'Ваше имя',
      namePlaceholder: 'Введите имя',
      phone: 'Номер телефона',
      phonePlaceholder: '+998 __ ___ __ __',
      note: 'Комментарий (необязательно)',
      notePlaceholder: 'Напишите, если есть особые пожелания',
      barber: 'Барбер',
      service: 'Услуга',
      date: 'Дата',
      time: 'Время',
      price: 'Цена',
      duration: 'Длительность',
      payment: 'Способ оплаты',
      paymentTitle: 'Выберите способ оплаты',
      cash: 'Наличные',
      cashHint: 'Оплата в барбершопе',
      card: 'Картой',
      cardHint: 'Перевод на карту',
      cardNumber: 'Номер карты',
      cardHolder: 'Владелец карты',
      copy: 'Копировать',
      copied: 'Скопировано ✓',
      cardNote: 'Оплатить можно заранее или в барбершопе. Реквизиты также отправим в бот.',
      successTitle: 'Запись принята!',
      successText: 'Детали отправили в бот. Ждём вас в назначенное время!',
      myBookings: 'Мои записи',
      close: 'Закрыть',
      errors: {
        SLOT_TAKEN: 'К сожалению, это время уже заняли. Выберите другое.',
        PHONE_REQUIRED: 'Укажите номер телефона',
        INVALID_PHONE: 'Неверный номер телефона',
        INVALID_NAME: 'Укажите ваше имя',
        TOO_LATE: 'Это время уже прошло. Выберите другое.',
        DAY_OFF: 'В этот день барбер не работает',
        CARD_DISABLED: 'Оплата картой пока недоступна',
        CASH_DISABLED: 'Оплата наличными пока недоступна',
      },
    },

    profile: {
      title: 'Профиль',
      myBookings: 'Мои записи',
      upcoming: 'Предстоящие',
      past: 'Прошедшие',
      empty: 'Записей пока нет',
      emptyText: 'Создайте первую запись — это займёт минуту.',
      bookAgain: 'Записаться снова',
      repeat: 'Повторить',
      payment: 'Оплата',
      paid: 'Оплачено',
      unpaid: 'Не оплачено',
      onTheWay: 'Я в пути',
      onTheWayDone: 'Вы в пути ✓',
      cancel: 'Отменить',
      cancelConfirm: 'Точно отменить запись?',
      language: 'Язык',
      shopInfo: 'Барбершоп',
      editName: 'Изменить имя',
      save: 'Сохранить',
      statuses: {
        PENDING: 'В ожидании',
        CONFIRMED: 'Подтверждена',
        COMPLETED: 'Завершена',
        CANCELLED: 'Отменена',
      },
    },

    common: {
      loading: 'Загрузка...',
      error: 'Произошла ошибка',
      retry: 'Повторить',
      minutes: (n) => `${n} мин`,
      currency: 'сум',
      weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      months: [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
      ],
    },
  },
};

export function getTranslation(language) {
  return translations[language] || translations.uz;
}

/** 120000 -> "120 000 so'm" */
export function formatPrice(amount, language = 'uz') {
  const text = getTranslation(language);
  const formatted = Number(amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${text.common.currency}`;
}

/** "2026-09-20" -> "20 sentabr" */
export function formatDate(dateStr, language = 'uz', withWeekday = false) {
  const text = getTranslation(language);
  const date = new Date(`${dateStr}T00:00:00Z`);
  const day = date.getUTCDate();
  const month = text.common.months[date.getUTCMonth()];
  const weekday = text.common.weekdaysShort[date.getUTCDay()];
  return withWeekday ? `${day} ${month}, ${weekday}` : `${day} ${month}`;
}

/** Xizmat/barber nomini tilga qarab tanlaydi. */
export function localized(item, field, language) {
  if (!item) return '';
  const ruField = `${field}Ru`;
  return language === 'ru' && item[ruField] ? item[ruField] : item[field] || '';
}
