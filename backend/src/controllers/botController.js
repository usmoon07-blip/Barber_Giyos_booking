'use strict';

const { Markup } = require('telegraf');
const { config } = require('../config/default');
const AppointmentModel = require('../models/Appointment');
const ServiceModel = require('../models/Service');
const SiteSettingModel = require('../models/SiteSetting');
const UserModel = require('../models/User');
const BookingService = require('../services/booking.service');
const NotificationService = require('../services/notification.service');
const { messages, t, detectLanguage } = require('../utils/i18n');
const { fromDbDate, formatDate, formatPrice } = require('../utils/time');

/** Har bir tildagi tugma matnini harakatga bog'laydigan jadval. */
const ACTION_BY_TEXT = new Map();
for (const [lang, pack] of Object.entries(messages)) {
  for (const [action, label] of Object.entries(pack.menu)) {
    ACTION_BY_TEXT.set(label, { action, lang });
  }
}

const hasMiniApp = () => config.bot.miniAppUrl.startsWith('https://');

/** Pastdagi asosiy menyu tugmalari. */
function mainKeyboard(lang) {
  const menu = t(lang).menu;

  const bookButton = hasMiniApp()
    ? Markup.button.webApp(menu.book, config.bot.miniAppUrl)
    : Markup.button.text(menu.book);

  return Markup.keyboard([
    [bookButton],
    [menu.prices, menu.myBookings],
    [menu.profile, menu.location],
    [menu.language],
  ])
    .resize()
    .persistent();
}

/** Til tanlash tugmalari. */
function languageKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🇺🇿 O'zbekcha", 'lang:uz'), Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
  ]);
}

/** Foydalanuvchini bazadan oladi yoki yaratadi. */
async function resolveUser(ctx) {
  const from = ctx.from;
  if (!from) return null;

  const user = await UserModel.upsertFromTelegram({
    id: from.id,
    first_name: from.first_name,
    last_name: from.last_name,
    username: from.username,
    language_code: from.language_code,
  });

  ctx.state.user = user;
  return user;
}

const botController = {
  mainKeyboard,
  resolveUser,

  /** /start */
  async handleStart(ctx) {
    const existing = await UserModel.findByTelegramId(ctx.from.id);
    const user = await resolveUser(ctx);
    const settings = await SiteSettingModel.get();

    // Birinchi marta kirgan foydalanuvchidan tilni so'raymiz
    if (!existing) {
      await ctx.reply(t(user.language).chooseLanguage, languageKeyboard());
    }

    const text = t(user.language);
    await ctx.replyWithHTML(text.welcome(settings.shopName), mainKeyboard(user.language));

    if (hasMiniApp()) {
      await ctx.reply(text.openMiniApp, mainKeyboard(user.language));
    }
  },

  /** Til tanlandi */
  async handleLanguageCallback(ctx, lang) {
    await UserModel.setLanguage(ctx.from.id, lang);
    const text = t(lang);
    const settings = await SiteSettingModel.get();

    await ctx.answerCbQuery(text.languageSet);
    await ctx.editMessageText(text.languageSet).catch(() => {});
    await ctx.replyWithHTML(text.welcome(settings.shopName), mainKeyboard(lang));
  },

  /** 🌐 Til tugmasi */
  async handleLanguageMenu(ctx) {
    const user = await resolveUser(ctx);
    await ctx.reply(t(user.language).chooseLanguage, languageKeyboard());
  },

  /** 💈 Bron qilish (Mini App sozlanmagan holat uchun) */
  async handleBook(ctx) {
    const user = await resolveUser(ctx);
    const text = t(user.language);

    if (!hasMiniApp()) {
      await ctx.replyWithHTML(text.miniAppNotReady);
      return;
    }

    await ctx.reply(text.openMiniApp, mainKeyboard(user.language));
  },

  /** ✂️ Narxlar */
  async handlePriceList(ctx) {
    const user = await resolveUser(ctx);
    const text = t(user.language);
    const services = await ServiceModel.listActive();

    if (!services.length) {
      await ctx.replyWithHTML(text.priceListEmpty);
      return;
    }

    const grouped = new Map();
    for (const service of services) {
      if (!grouped.has(service.category)) grouped.set(service.category, []);
      grouped.get(service.category).push(service);
    }

    const lines = [text.priceListTitle, ''];

    for (const [category, items] of grouped) {
      lines.push(`<b>${text.categories[category] || category}</b>`);

      for (const service of items) {
        const name = user.language === 'ru' && service.nameRu ? service.nameRu : service.name;
        const price = formatPrice(service.price, user.language);
        const old = service.oldPrice ? ` <s>${formatPrice(service.oldPrice, user.language)}</s>` : '';
        lines.push(`  • ${name} — <b>${price}</b>${old}  <i>(${text.duration(service.duration)})</i>`);
      }

      lines.push('');
    }

    await ctx.replyWithHTML(lines.join('\n'), mainKeyboard(user.language));
  },

  /** 📅 Mening bronlarim */
  async handleMyBookings(ctx) {
    const user = await resolveUser(ctx);
    const text = t(user.language);
    const appointments = await AppointmentModel.listByUser(user.id);

    if (!appointments.length) {
      await ctx.replyWithHTML(text.noBookings, mainKeyboard(user.language));
      return;
    }

    await ctx.replyWithHTML(text.myBookingsTitle);

    const recent = appointments.slice(0, 10);

    for (const appointment of recent) {
      const dateStr = fromDbDate(appointment.date);
      const serviceName =
        user.language === 'ru' && appointment.service.nameRu
          ? appointment.service.nameRu
          : appointment.service.name;

      const payment = text.payments[appointment.paymentMethod] || text.payments.CASH;

      const body = [
        `${text.statuses[appointment.status]}`,
        '',
        `💈 <b>${text.bookingLine.barber}:</b> ${appointment.barber.name}`,
        `✂️ <b>${text.bookingLine.service}:</b> ${serviceName}`,
        `📅 <b>${text.bookingLine.date}:</b> ${formatDate(dateStr, user.language)}`,
        `🕐 <b>${text.bookingLine.time}:</b> ${appointment.startTime} — ${appointment.endTime}`,
        `💰 <b>${text.bookingLine.price}:</b> ${formatPrice(appointment.totalPrice, user.language)}`,
        `${payment.slice(0, 2)} <b>${text.bookingLine.payment}:</b> ${payment.slice(2).trim()}` +
          (appointment.isPaid ? ` — ${text.paid}` : ''),
      ].join('\n');

      const isActive = AppointmentModel.ACTIVE_STATUSES.includes(appointment.status);

      const buttons = [];
      if (isActive && !appointment.onTheWayAt) {
        buttons.push([Markup.button.callback(text.onTheWayButton, `otw:${appointment.id}`)]);
      }
      if (isActive) {
        buttons.push([Markup.button.callback(text.cancelButton, `cancel:${appointment.id}`)]);
      }

      await ctx.replyWithHTML(body, buttons.length ? Markup.inlineKeyboard(buttons) : undefined);
    }
  },

  /** 👤 Profil */
  async handleProfile(ctx) {
    const user = await resolveUser(ctx);
    const text = t(user.language);
    const appointments = await AppointmentModel.listByUser(user.id);

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    const body = [
      text.profileTitle,
      '',
      `<b>${text.profileName}:</b> ${fullName}`,
      `<b>${text.profilePhone}:</b> ${user.phone || text.profileNoPhone}`,
      `<b>${text.profileTotal}:</b> ${appointments.length}`,
    ].join('\n');

    await ctx.replyWithHTML(body);

    if (!user.phone) {
      await ctx.reply(
        text.askPhone,
        Markup.keyboard([[Markup.button.contactRequest(text.sharePhone)]])
          .resize()
          .oneTime()
      );
    }
  },

  /** Telefon raqami yuborildi */
  async handleContact(ctx) {
    const user = await resolveUser(ctx);
    const text = t(user.language);
    const contact = ctx.message.contact;

    if (String(contact.user_id) !== String(ctx.from.id)) {
      await ctx.reply(text.error, mainKeyboard(user.language));
      return;
    }

    const phone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
    await UserModel.updateProfile(user.id, { phone });

    await ctx.replyWithHTML(text.phoneSaved(phone), mainKeyboard(user.language));
  },

  /** 📍 Manzil */
  async handleLocation(ctx) {
    const user = await resolveUser(ctx);
    const text = t(user.language);
    const settings = await SiteSettingModel.get();

    const address = user.language === 'ru' && settings.addressRu ? settings.addressRu : settings.address;
    const hours =
      user.language === 'ru' && settings.workingHoursTextRu
        ? settings.workingHoursTextRu
        : settings.workingHoursText;

    const lines = [text.locationTitle, ''];
    lines.push(`🏠 <b>${settings.shopName}</b>`);
    if (address) lines.push(`📍 ${address}`);
    else lines.push(text.noAddress);
    if (settings.phone) lines.push(`📞 ${settings.phone}`);
    if (hours) lines.push(`🕐 ${hours}`);
    if (settings.instagram) {
      const handle = settings.instagram.replace(/^@/, '');
      lines.push(`📷 <a href="https://instagram.com/${handle}">@${handle}</a>`);
    }

    if (settings.cardPaymentEnabled && settings.cardNumber) {
      const card = NotificationService.formatCardDetails(settings, user.language);
      if (card) lines.push('', card);
    }

    await ctx.replyWithHTML(lines.join('\n'), mainKeyboard(user.language));

    if (settings.locationLat && settings.locationLng) {
      await ctx.replyWithLocation(settings.locationLat, settings.locationLng).catch(() => {});
    }
  },

  /** 🚗 "Yo'lga tushdim" tugmasi */
  async handleOnTheWay(ctx, appointmentId) {
    const user = await resolveUser(ctx);
    const text = t(user.language);

    try {
      const { appointment, alreadyMarked } = await BookingService.markOnTheWay(appointmentId, user.id);

      if (alreadyMarked) {
        await ctx.answerCbQuery(text.onTheWayAlready, { show_alert: true });
        return;
      }

      await ctx.answerCbQuery(text.onTheWayDone, { show_alert: true });
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [[{ text: text.cancelButton, callback_data: `cancel:${appointment.id}` }]],
      }).catch(() => {});

      NotificationService.notifyAdminsOnTheWay(appointment).catch(() => {});
    } catch (error) {
      await ctx.answerCbQuery(error.message || text.error, { show_alert: true });
    }
  },

  /** ❌ Bronni bekor qilish tugmasi */
  async handleCancel(ctx, appointmentId) {
    const user = await resolveUser(ctx);
    const text = t(user.language);

    try {
      const appointment = await BookingService.cancelByUser(appointmentId, user.id);

      await ctx.answerCbQuery(text.cancelDone, { show_alert: true });
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});

      NotificationService.notifyAdminsCancelled(appointment).catch(() => {});
    } catch (error) {
      const settings = await SiteSettingModel.get();
      const message =
        error.code === 'CANCEL_TOO_LATE'
          ? text.cancelTooLate(settings.cancelDeadlineHours)
          : error.message || text.error;

      await ctx.answerCbQuery(message, { show_alert: true });
    }
  },

  /** Menyu tugmalarini matni bo'yicha yo'naltiradi. */
  async handleText(ctx) {
    const entry = ACTION_BY_TEXT.get(ctx.message.text);

    if (!entry) {
      const user = await resolveUser(ctx);
      await ctx.reply(t(user.language).unknownCommand, mainKeyboard(user.language));
      return;
    }

    switch (entry.action) {
      case 'book':
        return botController.handleBook(ctx);
      case 'prices':
        return botController.handlePriceList(ctx);
      case 'myBookings':
        return botController.handleMyBookings(ctx);
      case 'profile':
        return botController.handleProfile(ctx);
      case 'location':
        return botController.handleLocation(ctx);
      case 'language':
        return botController.handleLanguageMenu(ctx);
      default:
        return undefined;
    }
  },

  detectLanguage,
};

module.exports = botController;
