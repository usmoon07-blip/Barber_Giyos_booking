'use strict';

const { prisma } = require('../database/connection');

/** Barberlarning ish jadvali bilan ishlash. */
const WorkingHourModel = {
  listByBarber(barberId) {
    return prisma.workingHour.findMany({
      where: { barberId: Number(barberId) },
      orderBy: { weekday: 'asc' },
    });
  },

  findOne(barberId, weekday) {
    return prisma.workingHour.findUnique({
      where: { barberId_weekday: { barberId: Number(barberId), weekday: Number(weekday) } },
    });
  },

  upsert(barberId, weekday, data) {
    return prisma.workingHour.upsert({
      where: { barberId_weekday: { barberId: Number(barberId), weekday: Number(weekday) } },
      update: data,
      create: {
        barberId: Number(barberId),
        weekday: Number(weekday),
        startTime: data.startTime || '09:00',
        endTime: data.endTime || '20:00',
        isWorking: data.isWorking !== undefined ? data.isWorking : true,
      },
    });
  },

  /** Bir barberning butun haftalik jadvalini bir marotabada saqlaydi. */
  async replaceForBarber(barberId, hours) {
    return prisma.$transaction(
      hours.map((hour) =>
        prisma.workingHour.upsert({
          where: { barberId_weekday: { barberId: Number(barberId), weekday: Number(hour.weekday) } },
          update: {
            startTime: hour.startTime,
            endTime: hour.endTime,
            isWorking: Boolean(hour.isWorking),
          },
          create: {
            barberId: Number(barberId),
            weekday: Number(hour.weekday),
            startTime: hour.startTime,
            endTime: hour.endTime,
            isWorking: Boolean(hour.isWorking),
          },
        })
      )
    );
  },
};

module.exports = WorkingHourModel;
