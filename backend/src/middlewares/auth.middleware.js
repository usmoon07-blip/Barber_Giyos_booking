'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../config/default');
const UserModel = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/errors');
const { verifyInitData } = require('../utils/telegramAuth');

/**
 * Mijoz autentifikatsiyasi.
 * Mini App har bir so'rovda X-Telegram-Init-Data sarlavhasini yuboradi —
 * u Telegram tomonidan imzolangan va bot tokeni orqali tekshiriladi.
 */
const clientAuth = asyncHandler(async (req, _res, next) => {
  const initData = req.get('X-Telegram-Init-Data');

  let telegramUser = initData ? verifyInitData(initData, config.bot.token) : null;

  // Brauzerda (Telegramsiz) test qilish rejimi — faqat localhost uchun
  if (!telegramUser && config.dev.allowDevAuth) {
    telegramUser = {
      id: config.dev.telegramId,
      first_name: 'Test',
      last_name: 'Mijoz',
      username: 'test_user',
      language_code: 'uz',
    };
  }

  if (!telegramUser) {
    throw ApiError.unauthorized('Telegram ma\'lumotlari tasdiqlanmadi');
  }

  const user = await UserModel.upsertFromTelegram(telegramUser);

  if (user.isBlocked) {
    throw ApiError.forbidden('Hisobingiz bloklangan');
  }

  req.user = user;
  next();
});

/** Admin panel uchun JWT tekshiruvi. */
function adminAuth(req, _res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized('Token yuborilmadi'));
  }

  try {
    const payload = jwt.verify(token, config.admin.jwtSecret);
    if (payload.role !== 'admin') {
      return next(ApiError.forbidden());
    }
    req.admin = payload;
    return next();
  } catch (_error) {
    return next(ApiError.unauthorized('Token yaroqsiz yoki muddati tugagan'));
  }
}

module.exports = { clientAuth, adminAuth };
