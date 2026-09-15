'use strict';

const { prisma } = require('../database/connection');
const { detectLanguage } = require('../utils/i18n');

/** Mijozlar bilan ishlash. */
const UserModel = {
  findByTelegramId(telegramId) {
    if (!telegramId) return Promise.resolve(null);
    return prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  },

  /** Telefon raqami bo'yicha qidirish (qo'lda kiritishda takrorlanmaslik uchun). */
  findByPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 9) return Promise.resolve(null);

    // Oxirgi 9 raqam bo'yicha solishtiramiz (+998 bor-yo'qligidan qat'i nazar)
    return prisma.user.findFirst({
      where: { phone: { endsWith: digits.slice(-9) } },
      orderBy: { createdAt: 'asc' },
    });
  },

  /** Sartarosh qo'lda kiritgan mijoz (Telegram akkaunti yo'q). */
  createWalkIn({ firstName, phone, language = 'uz' }) {
    return prisma.user.create({
      data: {
        telegramId: null,
        source: 'WALK_IN',
        firstName: String(firstName).trim().slice(0, 60),
        phone: phone ? String(phone).trim().slice(0, 20) : null,
        language,
        nameCustom: true,
      },
    });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id: Number(id) } });
  },

  /** Telegram ma'lumotlari asosida mijozni yaratadi yoki yangilaydi. */
  async upsertFromTelegram(telegramUser) {
    const telegramId = String(telegramUser.id);

    const existing = await prisma.user.findUnique({ where: { telegramId } });

    if (existing) {
      return prisma.user.update({
        where: { telegramId },
        data: {
          // Mijoz ismini o'zi kiritgan bo'lsa, Telegram ismi bilan almashtirmaymiz
          firstName: existing.nameCustom ? existing.firstName : telegramUser.first_name || existing.firstName,
          lastName: telegramUser.last_name ?? existing.lastName,
          username: telegramUser.username ?? existing.username,
          photoUrl: telegramUser.photo_url ?? existing.photoUrl,
        },
      });
    }

    return prisma.user.create({
      data: {
        telegramId,
        firstName: telegramUser.first_name || 'Mijoz',
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        photoUrl: telegramUser.photo_url || null,
        language: detectLanguage(telegramUser.language_code),
      },
    });
  },

  updateProfile(id, data) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: data.firstName ? { ...data, nameCustom: true } : data,
    });
  },

  setLanguage(telegramId, language) {
    return prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: { language },
    });
  },

  countAll() {
    return prisma.user.count();
  },

  async list({ search = '', page = 1, pageSize = 20 } = {}) {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { username: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { appointments: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },
};

module.exports = UserModel;
