'use strict';

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Loyihaning barcha sozlamalari shu yerda jamlangan.
 * Qiymatlar .env faylidan o'qiladi.
 */

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  timezone: process.env.TIMEZONE || 'Asia/Tashkent',

  database: {
    url: process.env.DATABASE_URL,
  },

  bot: {
    token: process.env.BOT_TOKEN,
    adminIds: parseList(process.env.ADMIN_TELEGRAM_IDS),
    miniAppUrl: (process.env.MINIAPP_URL || '').trim().replace(/\/+$/, ''),
    // Bulutga joylashtirilganda (Render, Railway va h.k.) o'rnatiladi.
    // Bo'sh bo'lsa bot localhostdagidek polling rejimida ishlayveradi.
    webhookUrl: (process.env.WEBHOOK_URL || '').trim().replace(/\/+$/, ''),
    webhookPath: '',
  },

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '',
    jwtSecret: process.env.JWT_SECRET || '',
    tokenTtl: '12h',
  },

  cors: {
    origins: parseList(process.env.CORS_ORIGINS).length
      ? parseList(process.env.CORS_ORIGINS)
      : ['http://localhost:5173', 'http://localhost:5174'],
  },

  dev: {
    allowDevAuth: String(process.env.ALLOW_DEV_AUTH).toLowerCase() === 'true',
    telegramId: process.env.DEV_TELEGRAM_ID || '999000111',
  },
};

// Webhook manzili taxmin qilib bo'lmaydigan, lekin bot tokenidan
// deterministik hosil qilinadi — alohida maxfiy sozlama kerak emas.
if (config.bot.token) {
  const hash = crypto.createHash('sha256').update(config.bot.token).digest('hex').slice(0, 32);
  config.bot.webhookPath = `/api/bot/webhook/${hash}`;
}

/** Ishga tushishdan oldin majburiy sozlamalarni tekshiradi. */
function validateConfig() {
  const missing = [];

  if (!config.database.url) missing.push('DATABASE_URL');
  if (!config.bot.token) missing.push('BOT_TOKEN');
  if (!config.admin.password) missing.push('ADMIN_PASSWORD');
  if (!config.admin.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length) {
    throw new Error(
      `.env faylida quyidagi sozlamalar yetishmayapti: ${missing.join(', ')}`
    );
  }

  if (config.admin.jwtSecret.length < 16) {
    throw new Error('JWT_SECRET kamida 16 ta belgidan iborat bo\'lishi kerak.');
  }
}

module.exports = { config, validateConfig };
