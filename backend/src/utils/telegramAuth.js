'use strict';

const crypto = require('crypto');

/**
 * Telegram Mini App'dan kelgan initData'ni tekshiradi.
 * Telegram rasmiy algoritmi: HMAC-SHA256.
 * Hujjat: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * @returns {object|null} tekshiruvdan o'tgan foydalanuvchi yoki null
 */
function verifyInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || typeof initData !== 'string' || !botToken) return null;

  let params;
  try {
    params = new URLSearchParams(initData);
  } catch (_error) {
    return null;
  }

  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  params.delete('signature');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const expected = Buffer.from(computedHash, 'hex');
  const received = Buffer.from(hash, 'hex');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return null;
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) {
    return null;
  }

  const rawUser = params.get('user');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    if (!user || !user.id) return null;
    return user;
  } catch (_error) {
    return null;
  }
}

/** Ikki maxfiy satrni vaqt hujumlaridan himoyalangan holda solishtiradi. */
function safeCompare(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

module.exports = { verifyInitData, safeCompare };
