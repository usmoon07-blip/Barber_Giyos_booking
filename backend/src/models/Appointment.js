'use strict';

const { prisma } = require('../database/connection');
const { toDbDate } = require('../utils/time');

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];

const FULL_INCLUDE = {
  user: true,
  barber: true,
  service: true,
};

/** Bronlar bilan ishlash. */
const AppointmentModel = {
  ACTIVE_STATUSES,

  findById(id) {
    return prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: FULL_INCLUDE,
    });
  },

  /** Bir barberning ma'lum sanadagi band vaqtlari. */
  findBusySlots(barberId, dateStr) {
    return prisma.appointment.findMany({
      where: {
        barberId: Number(barberId),
        date: toDbDate(dateStr),
        status: { in: ACTIVE_STATUSES },
      },
      select: { startTime: true, endTime: true },
    });
  },

  /** Sana oralig'idagi band vaqtlar (kalendar uchun). */
  findBusyInRange(barberId, fromDateStr, toDateStr) {
    return prisma.appointment.findMany({
      where: {
        barberId: Number(barberId),
        date: { gte: toDbDate(fromDateStr), lte: toDbDate(toDateStr) },
        status: { in: ACTIVE_STATUSES },
      },
      select: { date: true, startTime: true, endTime: true },
    });
  },

  listByUser(userId) {
    return prisma.appointment.findMany({
      where: { userId: Number(userId) },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      include: { barber: true, service: true },
    });
  },

  listByDate(dateStr) {
    return prisma.appointment.findMany({
      where: { date: toDbDate(dateStr) },
      orderBy: { startTime: 'asc' },
      include: FULL_INCLUDE,
    });
  },

  create(data) {
    return prisma.appointment.create({ data, include: FULL_INCLUDE });
  },

  updateStatus(id, status) {
    return prisma.appointment.update({
      where: { id: Number(id) },
      data: { status },
      include: FULL_INCLUDE,
    });
  },

  markOnTheWay(id) {
    return prisma.appointment.update({
      where: { id: Number(id) },
      data: { onTheWayAt: new Date() },
      include: FULL_INCLUDE,
    });
  },

  markReminderSent(id) {
    return prisma.appointment.update({
      where: { id: Number(id) },
      data: { reminderSentAt: new Date() },
    });
  },

  remove(id) {
    return prisma.appointment.delete({ where: { id: Number(id) } });
  },

  /** Admin panel uchun filtrlangan ro'yxat. */
  async listForAdmin({ status, barberId, date, from, to, search, page = 1, pageSize = 30 } = {}) {
    const where = {};

    if (status) where.status = status;
    if (barberId) where.barberId = Number(barberId);

    if (date) {
      where.date = toDbDate(date);
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = toDbDate(from);
      if (to) where.date.lte = toDbDate(to);
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: FULL_INCLUDE,
      }),
      prisma.appointment.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  /** Eslatma yuborilishi kerak bo'lgan bronlar. */
  findPendingReminders(dateStr) {
    return prisma.appointment.findMany({
      where: {
        date: toDbDate(dateStr),
        status: { in: ACTIVE_STATUSES },
        reminderSentAt: null,
      },
      include: FULL_INCLUDE,
    });
  },
};

module.exports = AppointmentModel;
