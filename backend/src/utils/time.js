'use strict';

const { config } = require('../config/default');

const TZ = config.timezone;

const WEEKDAY_NAMES = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

const WEEKDAY_SHORT = {
  uz: ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

const MONTH_NAMES = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};

/** Sartaroshxona vaqt mintaqasidagi bugungi sana: "YYYY-MM-DD" */
function todayStr() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Sartaroshxona vaqt mintaqasidagi hozirgi vaqt, yarim tundan beri daqiqada */
function nowMinutes() {
  const text = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  return toMinutes(text);
}

/** "HH:mm" -> daqiqa (masalan "09:30" -> 570) */
function toMinutes(time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/** daqiqa -> "HH:mm" (masalan 570 -> "09:30") */
function toTime(minutes) {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" -> Date (bazaga yozish uchun, UTC yarim tuni) */
function toDbDate(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Date -> "YYYY-MM-DD" */
function fromDbDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" -> hafta kuni raqami (0 = Yakshanba) */
function weekdayOf(dateStr) {
  return toDbDate(dateStr).getUTCDay();
}

/** "YYYY-MM-DD" ga N kun qo'shadi */
function addDays(dateStr, days) {
  const date = toDbDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return fromDbDate(date);
}

/** Sanani odam o'qiydigan ko'rinishga keltiradi: "20 sentabr, Shanba" */
function formatDate(dateStr, lang = 'uz') {
  const date = toDbDate(dateStr);
  const day = date.getUTCDate();
  const month = MONTH_NAMES[lang] ? MONTH_NAMES[lang][date.getUTCMonth()] : MONTH_NAMES.uz[date.getUTCMonth()];
  const weekday = (WEEKDAY_NAMES[lang] || WEEKDAY_NAMES.uz)[date.getUTCDay()];
  return `${day} ${month}, ${weekday}`;
}

/** Narxni chiroyli ko'rinishda: 120000 -> "120 000 so'm" */
function formatPrice(amount, lang = 'uz') {
  const formatted = Number(amount || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return lang === 'ru' ? `${formatted} сум` : `${formatted} so'm`;
}

/** "YYYY-MM-DD" + "HH:mm" -> haqiqiy Date (vaqt mintaqasi hisobga olinadi) */
function toInstant(dateStr, timeStr) {
  const offsetMinutes = timezoneOffsetMinutes(dateStr);
  const utcMillis = toDbDate(dateStr).getTime() + toMinutes(timeStr) * 60000 - offsetMinutes * 60000;
  return new Date(utcMillis);
}

/** Berilgan sanada vaqt mintaqasining UTC'dan farqi (daqiqada) */
function timezoneOffsetMinutes(dateStr) {
  const probe = new Date(`${dateStr}T12:00:00.000Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(probe);
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  const minute = Number(parts.find((p) => p.type === 'minute').value);
  return hour * 60 + minute - 12 * 60;
}

/** Sana formati to'g'riligini tekshiradi */
function isValidDateStr(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDbDate(value).getTime());
}

/** Vaqt formati to'g'riligini tekshiradi */
function isValidTimeStr(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

module.exports = {
  TZ,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT,
  MONTH_NAMES,
  todayStr,
  nowMinutes,
  toMinutes,
  toTime,
  toDbDate,
  fromDbDate,
  weekdayOf,
  addDays,
  formatDate,
  formatPrice,
  toInstant,
  isValidDateStr,
  isValidTimeStr,
};
