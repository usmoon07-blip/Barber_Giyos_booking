'use strict';

const { prisma } = require('../database/connection');

/** Xizmatlar bilan ishlash. */
const ServiceModel = {
  listActive() {
    return prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  },

  listPopular(limit = 4) {
    return prisma.service.findMany({
      where: { isActive: true, isPopular: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: limit,
    });
  },

  listAll() {
    return prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  },

  findById(id) {
    return prisma.service.findUnique({ where: { id: Number(id) } });
  },

  create(data) {
    return prisma.service.create({ data });
  },

  update(id, data) {
    return prisma.service.update({ where: { id: Number(id) }, data });
  },

  remove(id) {
    return prisma.service.delete({ where: { id: Number(id) } });
  },
};

module.exports = ServiceModel;
