'use strict';

const express = require('express');
const { config } = require('../config/default');
const { getBot } = require('../core/bot');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

/** Bot holati — sozlash to'g'ri ketayotganini tekshirish uchun. */
router.get(
  '/info',
  asyncHandler(async (_req, res) => {
    const bot = getBot();

    if (!bot) {
      return res.json({ ok: true, data: { running: false } });
    }

    const me = await bot.telegram.getMe();

    return res.json({
      ok: true,
      data: {
        running: true,
        username: me.username,
        miniAppUrl: config.bot.miniAppUrl || null,
        miniAppReady: config.bot.miniAppUrl.startsWith('https://'),
        adminCount: config.bot.adminIds.length,
      },
    });
  })
);

module.exports = router;
