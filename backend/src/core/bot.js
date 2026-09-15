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

/** Botni polling rejimida ishga tushiradi. */
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

  try {
    const me = await instance.telegram.getMe();

    instance
      .launch({ dropPendingUpdates: true })
      .catch((error) => console.error('[bot] ishga tushmadi:', error.message));

    console.log(`🤖 Bot ishga tushdi: @${me.username}`);
  } catch (error) {
    console.error('⚠️  Bot ishga tushmadi:', error.message);
    console.error('    .env faylidagi BOT_TOKEN ni tekshiring. Server baribir ishlayapti.');
  }

  return instance;
}

async function stopBot(signal = 'SIGTERM') {
  if (bot) {
    bot.stop(signal);
  }
}

function getBot() {
  return bot;
}

module.exports = { createBot, startBot, stopBot, getBot };
