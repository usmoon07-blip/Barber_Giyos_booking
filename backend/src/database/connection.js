'use strict';

const { PrismaClient } = require('@prisma/client');
const { config } = require('../config/default');

/**
 * Prisma mijozining yagona nusxasi (singleton).
 * Nodemon qayta ishga tushirganda ulanishlar ko'payib ketmasligi uchun
 * global obyektda saqlanadi.
 */
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__barberPrisma ||
  new PrismaClient({
    log: config.env === 'development' ? ['warn', 'error'] : ['error'],
  });

if (config.env === 'development') {
  globalForPrisma.__barberPrisma = prisma;
}

async function connectDatabase() {
  await prisma.$connect();
  return prisma;
}

async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
