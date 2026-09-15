'use strict';

const { prisma } = require('../database/connection');
const { toDbDate } = require('../utils/time');

/**
 * Vaqtinchalik bloklash — tanaffus, dam olish kuni, bayram.
 * barberId bo'sh bo'lsa, blok barcha barberlarga tegishli.
 */
const TimeBlockModel = {
  /** Bitta kundagi bloklar (shu barberga tegishli va umumiy). */
  findForDate(dateStr, barberId = null) {
    return prisma.timeBlock.findMany({
      where: {
        date: toDbDate(dateStr),
        ...(barberId ? { OR: [{ barberId: Number(barberId) }, { barberId: null }] } : {}),
      },
      orderBy: { startTime: 'asc' },
    });
  },

  /** Sana oralig'idagi bloklar (kalendar uchun). */
  findInRange(fromDateStr, toDateStr, barberId = null) {
    return prisma.timeBlock.findMany({
      where: {
        date: { gte: toDbDate(fromDateStr), lte: toDbDate(toDateStr) },
        ...(barberId ? { OR: [{ barberId: Number(barberId) }, { barberId: null }] } : {}),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },

  /** Admin panel uchun to'liq ro'yxat. */
  list({ from, to } = {}) {
    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = toDbDate(from);
      if (to) where.date.lte = toDbDate(to);
    }

    return prisma.timeBlock.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { barber: { select: { id: true, name: true } } },
    });
  },

  create(data) {
    return prisma.timeBlock.create({
      data,
      include: { barber: { select: { id: true, name: true } } },
    });
  },

  remove(id) {
    return prisma.timeBlock.delete({ where: { id: Number(id) } });
  },

  findById(id) {
    return prisma.timeBlock.findUnique({ where: { id: Number(id) } });
  },
};

module.exports = TimeBlockModel;
