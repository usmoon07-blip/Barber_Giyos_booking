'use strict';

const { Telegraf } = require('telegraf');
const { config } = require('../config/default');
const botController = require('../controllers/botController');
const NotificationService = require('../services/notification.service');

let bot = null;

/** Telegraf nusxasini yaratadi va barcha hodisalarni bog'laydi. */
function createBot() {
  if (bot) return bot;

  bot = new Telegraf(config.bot.token, { handlerTimeout: 30000 });

  bot.use(async (ctx, next) => {
    ctx.state = ctx.state || {};
    await next();
  });

  bot.start((ctx) => botController.handleStart(ctx));

  bot.command('help', (ctx) => botController.handleStart(ctx));
  bot.command('prices', (ctx) => botController.handlePriceList(ctx));
  bot.command('bookings', (ctx) => botController.handleMyBookings(ctx));
  bot.command('profile', (ctx) => botController.handleProfile(ctx));
  bot.command('location', (ctx) => botController.handleLocation(ctx));
  bot.command('language', (ctx) => botController.handleLanguageMenu(ctx));

  bot.on('contact', (ctx) => botController.handleContact(ctx));

  bot.action(/^lang:(uz|ru)$/, (ctx) => botController.handleLanguageCallback(ctx, ctx.match[1]));
  bot.action(/^otw:(\d+)$/, (ctx) => botController.handleOnTheWay(ctx, Number(ctx.match[1])));
  bot.action(/^cancel:(\d+)$/, (ctx) => botController.handleCancel(ctx, Number(ctx.match[1])));

  bot.on('text', (ctx) => botController.handleText(ctx));

  bot.catch((error, ctx) => {
    console.error(`[bot] xatolik (${ctx.updateType}):`, error.message);
  });

  NotificationService.attachBot(bot);

  return bot;
}

/**
 * Botni ishga tushiradi.
 *
 * WEBHOOK_URL sozlangan bo'lsa — webhook rejimi (bulutga joylashtirilganda
 * kerak: Telegram xabarni o'zi yuboradi, uzluksiz ulanish shart emas).
 * Aks holda — polling rejimi (localhost uchun standart).
 *
 * Webhook rejimida Express marshruti `index.js` da `createApp()` ichida,
 * `mountWebhookRoute()` orqali oldindan ulanган bo'lishi kerak — shu
 * funksiya faqat Telegram tomonini (setWebhook / launch) sozlaydi.
 */
async function startBot() {
  const instance = createBot();

  await instance.telegram.setMyCommands([
    { command: 'start', description: "Boshlash / Начать" },
    { command: 'prices', description: "Narxlar / Цены" },
    { command: 'bookings', description: "Mening bronlarim / Мои записи" },
    { command: 'profile', description: "Profil / Профиль" },
    { command: 'location', description: "Manzil / Адрес" },
    { command: 'language', description: "Tilni o'zgartirish / Сменить язык" },
  ]).catch((error) => console.warn('[bot] buyruqlar o\'rnatilmadi:', error.message));

  // Mini App tugmasini Telegram menyusiga qo'shamiz
  if (config.bot.miniAppUrl.startsWith('https://')) {
    await instance.telegram
      .setChatMenuButton({
        menuButton: {
          type: 'web_app',
          text: 'Bron qilish',
          web_app: { url: config.bot.miniAppUrl },
        },
      })
      .catch((error) => console.warn('[bot] menyu tugmasi o\'rnatilmadi:', error.message));
  }

  const useWebhook = config.bot.webhookUrl.startsWith('https://');

  try {
    const me = await instance.telegram.getMe();

    if (useWebhook) {
      const fullUrl = `${config.bot.webhookUrl}${config.bot.webhookPath}`;
      await instance.telegram.setWebhook(fullUrl, { drop_pending_updates: true });

      console.log(`🤖 Bot ishga tushdi (webhook): @${me.username}`);
    } else {
      // Avvalgi webhook o'rnatilgan bo'lishi mumkin (masalan localhostga
      // qaytilganda) — polling bilan ziddiyat bo'lmasligi uchun o'chiramiz.
      await instance.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});

      instance
        .launch({ dropPendingUpdates: true })
        .catch((error) => console.error('[bot] ishga tushmadi:', error.message));

      console.log(`🤖 Bot ishga tushdi (polling): @${me.username}`);
    }
  } catch (error) {
    console.error('⚠️  Bot ishga tushmadi:', error.message);
    console.error('    .env faylidagi BOT_TOKEN ni tekshiring. Server baribir ishlayapti.');
  }

  return instance;
}

async function stopBot(signal = 'SIGTERM') {
  if (bot && !config.bot.webhookUrl) {
    bot.stop(signal);
  }
}

function getBot() {
  return bot;
}

/**
 * Webhook marshrutini Express ilovasiga ulaydi.
 * `createApp()` ichida, notFoundHandler'dan OLDIN chaqirilishi shart —
 * aks holda so'rov webhook'ga yetib bormay, 404 bilan tugaydi.
 * WEBHOOK_URL sozlanmagan bo'lsa hech narsa qilmaydi (localhost holati).
 */
function mountWebhookRoute(app) {
  if (!config.bot.webhookUrl.startsWith('https://')) return;

  const instance = createBot();
  app.use(instance.webhookCallback(config.bot.webhookPath));
}

module.exports = { createBot, startBot, stopBot, getBot, mountWebhookRoute };
