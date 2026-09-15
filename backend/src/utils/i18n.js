'use strict';

/**
 * Bot va server xabarlarining ikki tildagi matnlari.
 * Mini App o'z tarjimalarini alohida saqlaydi.
 */

const messages = {
  uz: {
    chooseLanguage: 'Tilni tanlang / Выберите язык',
    languageSet: 'Til o\'zbekchaga o\'zgartirildi ✅',
    welcome: (shop) =>
      `Assalomu alaykum! 💈\n\n<b>${shop}</b> sartaroshxonasiga xush kelibsiz.\n\nQuyidagi tugmalar orqali bron qilishingiz, narxlarni ko'rishingiz va bronlaringizni kuzatishingiz mumkin.`,
    menu: {
      book: '💈 Bron qilish',
      prices: '✂️ Narxlar',
      myBookings: '📅 Mening bronlarim',
      profile: '👤 Profil',
      location: '📍 Manzil',
      language: '🌐 Til',
    },
    miniAppNotReady:
      '⚠️ Mini App hali sozlanmagan.\n\nIltimos, administrator bilan bog\'laning yoki keyinroq urinib ko\'ring.',
    openMiniApp: 'Bron qilish uchun quyidagi tugmani bosing 👇',
    priceListTitle: '✂️ <b>XIZMATLAR VA NARXLAR</b>',
    priceListEmpty: 'Hozircha xizmatlar qo\'shilmagan.',
    noBookings: 'Sizda hozircha bron mavjud emas.\n\n«💈 Bron qilish» tugmasi orqali birinchi broningizni qiling!',
    myBookingsTitle: '📅 <b>MENING BRONLARIM</b>',
    profileTitle: '👤 <b>PROFIL</b>',
    profileName: 'Ism',
    profilePhone: 'Telefon',
    profileTotal: 'Jami bronlar',
    profileNoPhone: 'kiritilmagan',
    sharePhone: '📱 Telefon raqamni yuborish',
    phoneSaved: (phone) => `✅ Telefon raqamingiz saqlandi: <b>${phone}</b>`,
    askPhone: 'Telefon raqamingizni yuborish uchun quyidagi tugmani bosing 👇',
    locationTitle: '📍 <b>MANZIL</b>',
    noAddress: 'Manzil hali kiritilmagan.',
    categories: {
      HAIR: '💇 Soch',
      BEARD: '🧔 Soqol',
      COMBO: '⭐ Kompleks',
      STYLING: '💫 Styling',
      OTHER: '✨ Boshqa',
    },
    statuses: {
      PENDING: '🕐 Kutilmoqda',
      CONFIRMED: '✅ Tasdiqlangan',
      COMPLETED: '🎉 Yakunlangan',
      CANCELLED: '❌ Bekor qilingan',
    },
    duration: (min) => `${min} daqiqa`,
    bookingCreated: '✅ <b>Broningiz muvaffaqiyatli qabul qilindi!</b> 💈',
    bookingLine: {
      barber: 'Barber',
      service: 'Xizmat',
      date: 'Sana',
      time: 'Vaqt',
      price: 'Narx',
      status: 'Holat',
    },
    seeYouSoon: 'Sizni belgilangan vaqtda kutamiz!',
    onTheWayButton: '🚗 Yo\'lga tushdim',
    cancelButton: '❌ Bekor qilish',
    onTheWayDone: '✅ Rahmat! Barberga xabar berdik, sizni kutishmoqda.',
    onTheWayAlready: 'Siz allaqachon yo\'lga tushganingizni bildirgansiz ✅',
    cancelDone: '❌ Broningiz bekor qilindi.',
    cancelTooLate: 'Bu bronni bekor qilib bo\'lmaydi. Iltimos, sartaroshxonaga qo\'ng\'iroq qiling.',
    reminderTitle: (hours) => `⏰ <b>Eslatma:</b> ${hours} soatdan so'ng navbatingiz!`,
    statusChanged: {
      CONFIRMED: '✅ <b>Broningiz tasdiqlandi!</b>',
      COMPLETED: '🎉 <b>Tashrifingiz uchun rahmat!</b>\n\nYana kutamiz! 💈',
      CANCELLED: '❌ <b>Afsuski, broningiz bekor qilindi.</b>\n\nSavollar bo\'lsa biz bilan bog\'laning.',
    },
    unknownCommand: 'Quyidagi menyudan kerakli bo\'limni tanlang 👇',
    error: 'Xatolik yuz berdi. Birozdan so\'ng qayta urinib ko\'ring.',
  },

  ru: {
    chooseLanguage: 'Tilni tanlang / Выберите язык',
    languageSet: 'Язык изменён на русский ✅',
    welcome: (shop) =>
      `Здравствуйте! 💈\n\nДобро пожаловать в барбершоп <b>${shop}</b>.\n\nЗдесь вы можете записаться, посмотреть цены и следить за своими записями.`,
    menu: {
      book: '💈 Записаться',
      prices: '✂️ Цены',
      myBookings: '📅 Мои записи',
      profile: '👤 Профиль',
      location: '📍 Адрес',
      language: '🌐 Язык',
    },
    miniAppNotReady:
      '⚠️ Mini App пока не настроен.\n\nПожалуйста, свяжитесь с администратором или попробуйте позже.',
    openMiniApp: 'Нажмите кнопку ниже, чтобы записаться 👇',
    priceListTitle: '✂️ <b>УСЛУГИ И ЦЕНЫ</b>',
    priceListEmpty: 'Услуги пока не добавлены.',
    noBookings: 'У вас пока нет записей.\n\nНажмите «💈 Записаться», чтобы создать первую!',
    myBookingsTitle: '📅 <b>МОИ ЗАПИСИ</b>',
    profileTitle: '👤 <b>ПРОФИЛЬ</b>',
    profileName: 'Имя',
    profilePhone: 'Телефон',
    profileTotal: 'Всего записей',
    profileNoPhone: 'не указан',
    sharePhone: '📱 Отправить номер телефона',
    phoneSaved: (phone) => `✅ Ваш номер сохранён: <b>${phone}</b>`,
    askPhone: 'Нажмите кнопку ниже, чтобы отправить номер телефона 👇',
    locationTitle: '📍 <b>АДРЕС</b>',
    noAddress: 'Адрес пока не указан.',
    categories: {
      HAIR: '💇 Волосы',
      BEARD: '🧔 Борода',
      COMBO: '⭐ Комплекс',
      STYLING: '💫 Стайлинг',
      OTHER: '✨ Другое',
    },
    statuses: {
      PENDING: '🕐 В ожидании',
      CONFIRMED: '✅ Подтверждена',
      COMPLETED: '🎉 Завершена',
      CANCELLED: '❌ Отменена',
    },
    duration: (min) => `${min} минут`,
    bookingCreated: '✅ <b>Ваша запись успешно принята!</b> 💈',
    bookingLine: {
      barber: 'Барбер',
      service: 'Услуга',
      date: 'Дата',
      time: 'Время',
      price: 'Цена',
      status: 'Статус',
    },
    seeYouSoon: 'Ждём вас в назначенное время!',
    onTheWayButton: '🚗 Я в пути',
    cancelButton: '❌ Отменить',
    onTheWayDone: '✅ Спасибо! Мы предупредили барбера, вас ждут.',
    onTheWayAlready: 'Вы уже сообщили, что в пути ✅',
    cancelDone: '❌ Ваша запись отменена.',
    cancelTooLate: 'Эту запись отменить нельзя. Пожалуйста, позвоните в барбершоп.',
    reminderTitle: (hours) => `⏰ <b>Напоминание:</b> ваша запись через ${hours} ч.!`,
    statusChanged: {
      CONFIRMED: '✅ <b>Ваша запись подтверждена!</b>',
      COMPLETED: '🎉 <b>Спасибо за визит!</b>\n\nЖдём вас снова! 💈',
      CANCELLED: '❌ <b>К сожалению, ваша запись отменена.</b>\n\nПо вопросам свяжитесь с нами.',
    },
    unknownCommand: 'Выберите нужный раздел в меню ниже 👇',
    error: 'Произошла ошибка. Попробуйте ещё раз чуть позже.',
  },
};

/** Tanlangan tildagi matnlar to'plamini qaytaradi. */
function t(lang) {
  return messages[lang] || messages.uz;
}

/** Foydalanuvchining Telegram tilidan loyihaga mos tilni aniqlaydi. */
function detectLanguage(telegramLanguageCode) {
  return String(telegramLanguageCode || '').toLowerCase().startsWith('ru') ? 'ru' : 'uz';
}

module.exports = { messages, t, detectLanguage };
