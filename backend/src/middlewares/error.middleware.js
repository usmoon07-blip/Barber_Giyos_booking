'use strict';

const { config } = require('../config/default');
const { ApiError } = require('../utils/errors');

/** Mavjud bo'lmagan yo'llar uchun. */
function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `Yo'l topilmadi: ${req.method} ${req.originalUrl}`));
}

/**
 * Prisma xatolari aks holda tushunarsiz "Serverda xatolik" bo'lib chiqadi,
 * shuning uchun eng ko'p uchraydiganlarini aniq javobga aylantiramiz.
 */
function translatePrismaError(error) {
  if (error.code === 'P2003') {
    return new ApiError(
      409,
      'IN_USE',
      "Bu yozuv boshqa ma'lumotlarga bog'langan, shuning uchun o'chirib bo'lmaydi. " +
        'Uni "faol emas" qilib qo\'ying yoki avval bog\'liq yozuvlarni o\'chiring.'
    );
  }

  if (error.code === 'P2025') {
    return new ApiError(404, 'NOT_FOUND', 'Yozuv topilmadi');
  }

  return error;
}

/** Barcha xatoliklarni bitta formatda qaytaradi. */
function errorHandler(rawError, _req, res, _next) {
  const error = translatePrismaError(rawError);
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
