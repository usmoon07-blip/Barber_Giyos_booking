'use strict';

const { config } = require('../config/default');
const { ApiError } = require('../utils/errors');

/** Mavjud bo'lmagan yo'llar uchun. */
function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `Yo'l topilmadi: ${req.method} ${req.originalUrl}`));
}

/** Barcha xatoliklarni bitta formatda qaytaradi. */
function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';

  if (status >= 500) {
    console.error('[xatolik]', error);
  }

  res.status(status).json({
    ok: false,
    error: {
      code,
      message: status >= 500 && config.env !== 'development'
        ? 'Serverda xatolik yuz berdi'
        : error.message,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
