'use strict';

const { prisma } = require('../database/connection');

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

/** Barberlar bilan ishlash. */
const BarberModel = {
  listActive() {
    return prisma.barber.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  },

  listAll() {
    return prisma.barber.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { workingHours: { orderBy: { weekday: 'asc' } } },
    });
  },

  findById(id, { withHours = false } = {}) {
    return prisma.barber.findUnique({
      where: { id: Number(id) },
      include: withHours ? { workingHours: { orderBy: { weekday: 'asc' } } } : undefined,
    });
  },

  /** Yangi barber yaratadi va unga standart ish jadvalini biriktiradi. */
  async create(data) {
    return prisma.barber.create({
      data: {
        ...data,
        workingHours: {
          create: WEEKDAYS.map((weekday) => ({
            weekday,
            startTime: '09:00',
            endTime: '20:00',
            isWorking: true,
          })),
        },
      },
      include: { workingHours: { orderBy: { weekday: 'asc' } } },
    });
  },

  update(id, data) {
    return prisma.barber.update({
      where: { id: Number(id) },
      data,
      include: { workingHours: { orderBy: { weekday: 'asc' } } },
    });
  },

  remove(id) {
    return prisma.barber.delete({ where: { id: Number(id) } });
  },

  countActive() {
    return prisma.barber.count({ where: { isActive: true } });
  },
};

module.exports = BarberModel;
