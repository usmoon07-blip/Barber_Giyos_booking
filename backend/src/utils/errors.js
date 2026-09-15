'use strict';

/** HTTP status kodi bilan birga tashlanadigan xatolik. */
class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new ApiError(400, code, message);
  }

  static unauthorized(message = 'Avtorizatsiya talab qilinadi') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Ruxsat yo\'q') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Topilmadi') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }
}

/** Async controller'larni try/catch'siz yozish uchun o'ram. */
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { ApiError, asyncHandler };
