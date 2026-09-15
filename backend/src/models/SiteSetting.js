'use strict';

const { prisma } = require('../database/connection');

const DEFAULTS = {
  id: 1,
  shopName: 'Barbershop',
  slotStep: 30,
  minLeadMinutes: 30,
  maxAdvanceDays: 21,
  reminderHours: 2,
};

/** Sartaroshxona sozlamalari (bazada har doim bitta qator: id = 1). */
const SiteSettingModel = {
  async get() {
    const existing = await prisma.siteSetting.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return prisma.siteSetting.create({ data: DEFAULTS });
  },

  async update(data) {
    await SiteSettingModel.get();
    return prisma.siteSetting.update({ where: { id: 1 }, data });
  },
};

module.exports = SiteSettingModel;
