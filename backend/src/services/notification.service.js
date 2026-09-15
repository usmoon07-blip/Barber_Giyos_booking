'use strict';

const { config } = require('../config/default');
const { t } = require('../utils/i18n');
const { fromDbDate, formatDate, formatPrice } = require('../utils/time');

/**
 * Telegram orqali xabar yuborish.
 * bot.js bilan aylanma bog'liqlik bo'lmasligi uchun bot nusxasi
 * ishga tushish paytida shu yerga "biriktiriladi".
 */
let botInstance = null;

function attachBot(bot) {
  botInstance = bot;
}

async function sendMessage(chatId, text, extra = {}) {
  // Qo'lda kiritilgan mijozning Telegram akkaunti bo'lmaydi
  if (!botInstance || !chatId) return null;
  try {
    return await botInstance.telegram.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra,
    });
  } catch (error) {
    console.error(`[notify] ${chatId} ga xabar yuborilmadi:`, error.message);
    return null;
  }
}

/** Bron ma'lumotlarini chiroyli matnga aylantiradi. */
function formatAppointment(appointment, lang = 'uz') {
  const text = t(lang);
  const dateStr = fromDbDate(appointment.date);
  const serviceName =
    lang === 'ru' && appointment.service.nameRu ? appointment.service.nameRu : appointment.service.name;

  const payment = text.payments[appointment.paymentMethod] || text.payments.CASH;

  return [
    `💈 <b>${text.bookingLine.barber}:</b> ${appointment.barber.name}`,
    `✂️ <b>${text.bookingLine.service}:</b> ${serviceName}`,
    `📅 <b>${text.bookingLine.date}:</b> ${formatDate(dateStr, lang)}`,
    `🕐 <b>${text.bookingLine.time}:</b> ${appointment.startTime} — ${appointment.endTime}`,
    `💰 <b>${text.bookingLine.price}:</b> ${formatPrice(appointment.totalPrice, lang)}`,
    `${payment.slice(0, 2)} <b>${text.bookingLine.payment}:</b> ${payment.slice(2).trim()}` +
      (appointment.isPaid ? ` — ${text.paid}` : ''),
  ].join('\n');
}

/** Karta orqali to'lamoqchi mijozga karta ma'lumotlarini beradi. */
function formatCardDetails(settings, lang = 'uz') {
  const text = t(lang);
  if (!settings.cardNumber) return null;

  const lines = [text.cardDetails, ''];
  lines.push(`<code>${settings.cardNumber}</code>`);
  if (settings.cardHolder) lines.push(`👤 ${settings.cardHolder}`);
  if (settings.cardBank) lines.push(`🏦 ${settings.cardBank}`);
  lines.push('', `<i>${text.cardHint}</i>`);

  return lines.join('\n');
}

const NotificationService = {
  attachBot,
  sendMessage,
  formatAppointment,
  formatCardDetails,

  /** Mijozga bron qabul qilingani haqida xabar + "Yo'lga tushdim" tugmasi. */
  async notifyClientBookingCreated(appointment, settings = null) {
    const lang = appointment.user.language || 'uz';
    const text = t(lang);

    const cardBlock =
      appointment.paymentMethod === 'CARD' && settings ? formatCardDetails(settings, lang) : null;

    const body = [
      text.bookingCreated,
      '',
      formatAppointment(appointment, lang),
      ...(cardBlock ? ['', cardBlock] : []),
      '',
      text.seeYouSoon,
    ].join('\n');

    return sendMessage(appointment.user.telegramId, body, {
      reply_markup: {
        inline_keyboard: [
          [{ text: text.onTheWayButton, callback_data: `otw:${appointment.id}` }],
          [{ text: text.cancelButton, callback_data: `cancel:${appointment.id}` }],
        ],
      },
    });
  },

  /** Sartaroshxona adminlariga yangi bron haqida xabar. */
  async notifyAdminsNewBooking(appointment) {
    if (!config.bot.adminIds.length) return;

    const clientName = [appointment.user.firstName, appointment.user.lastName].filter(Boolean).join(' ');
    const username = appointment.user.username ? `\n🔗 @${appointment.user.username}` : '';

    const body = [
      '🔔 <b>YANGI BRON</b>',
      '',
      `👤 <b>Mijoz:</b> ${clientName}`,
      `📱 <b>Telefon:</b> ${appointment.user.phone || 'kiritilmagan'}${username}`,
      '',
      formatAppointment(appointment, 'uz'),
    ].join('\n');

    await Promise.all(config.bot.adminIds.map((chatId) => sendMessage(chatId, body)));
  },

  /** Mijoz "Yo'lga tushdim" bosganda adminlarga xabar. */
  async notifyAdminsOnTheWay(appointment) {
    if (!config.bot.adminIds.length) return;

    const clientName = [appointment.user.firstName, appointment.user.lastName].filter(Boolean).join(' ');

    const body = [
      '🚗 <b>MIJOZ YO\'LGA TUSHDI</b>',
      '',
      `👤 <b>${clientName}</b>`,
      `📱 ${appointment.user.phone || 'telefon kiritilmagan'}`,
      '',
      formatAppointment(appointment, 'uz'),
    ].join('\n');

    await Promise.all(config.bot.adminIds.map((chatId) => sendMessage(chatId, body)));
  },

  /** Mijoz bronni bekor qilganda adminlarga xabar. */
  async notifyAdminsCancelled(appointment) {
    if (!config.bot.adminIds.length) return;

    const clientName = [appointment.user.firstName, appointment.user.lastName].filter(Boolean).join(' ');

    const body = [
      '❌ <b>BRON BEKOR QILINDI</b>',
      '',
      `👤 <b>${clientName}</b>`,
      `📱 ${appointment.user.phone || '—'}`,
      '',
      formatAppointment(appointment, 'uz'),
    ].join('\n');

    await Promise.all(config.bot.adminIds.map((chatId) => sendMessage(chatId, body)));
  },

  /** Admin bron holatini o'zgartirganda mijozga xabar. */
  async notifyClientStatusChanged(appointment) {
    const lang = appointment.user.language || 'uz';
    const text = t(lang);
    const headline = text.statusChanged[appointment.status];
    if (!headline) return null;

    const showActions = appointment.status === 'CONFIRMED';
    const body = [headline, '', formatAppointment(appointment, lang)].join('\n');

    return sendMessage(appointment.user.telegramId, body, {
      reply_markup: showActions
        ? {
            inline_keyboard: [
              [{ text: text.onTheWayButton, callback_data: `otw:${appointment.id}` }],
              [{ text: text.cancelButton, callback_data: `cancel:${appointment.id}` }],
            ],
          }
        : undefined,
    });
  },

  /** Bron vaqtidan oldin mijozga eslatma. */
  async sendReminder(appointment, hours) {
    const lang = appointment.user.language || 'uz';
    const text = t(lang);

    const body = [
      text.reminderTitle(hours),
      '',
      formatAppointment(appointment, lang),
    ].join('\n');

    return sendMessage(appointment.user.telegramId, body, {
      reply_markup: {
        inline_keyboard: [
          [{ text: text.onTheWayButton, callback_data: `otw:${appointment.id}` }],
          [{ text: text.cancelButton, callback_data: `cancel:${appointment.id}` }],
        ],
      },
    });
  },
};

module.exports = NotificationService;
