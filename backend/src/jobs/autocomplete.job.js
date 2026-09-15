'use strict';

const cron = require('node-cron');
const { prisma } = require('../database/connection');
const SiteSettingModel = require('../models/SiteSetting');
const { todayStr, addDays, toDbDate, toInstant, fromDbDate } = require('../utils/time');

// Tashrif tugaganidan keyin shuncha daqiqa kutamiz (sartarosh o'zi belgilashi uchun)
const GRACE_MINUTES = 30;

/**
 * Vaqti o'tib ketgan, lekin hali yakunlanmagan bronlarni avtomatik
 * "Yakunlangan" holatiga o'tkazadi.
 *
 * Bu hisobotdagi tushum raqamlari doim to'g'ri bo'lishini ta'minlaydi —
 * sartarosh har bir bronni qo'lda belgilashni unutsa ham.
 * Faqat TASDIQLANGAN bronlar avtomatik yakunlanadi; tasdiqlanmagani
 * (Kutilmoqda) sartaroshning o'zi hal qilishi uchun qoldiriladi.
 */
async function runAutoComplete() {
  const settings = await SiteSettingModel.get();
  if (!settings.autoComplete) return 0;

  const today = todayStr();

  const candidates = await prisma.appointment.findMany({
    where: {
      status: 'CONFIRMED',
      date: { gte: toDbDate(addDays(today, -3)), lte: toDbDate(today) },
    },
    select: { id: true, date: true, endTime: true },
  });

  const now = Date.now();
  const graceMillis = GRACE_MINUTES * 60 * 1000;

  const expired = candidates.filter((appointment) => {
    const endsAt = toInstant(fromDbDate(appointment.date), appointment.endTime).getTime();
    return now - endsAt > graceMillis;
  });

  if (!expired.length) return 0;

  await prisma.appointment.updateMany({
    where: { id: { in: expired.map((item) => item.id) } },
    data: { status: 'COMPLETED' },
  });

  console.log(`[avto-yakunlash] ${expired.length} ta bron yakunlandi`);
  return expired.length;
}

function startAutoCompleteJob() {
  const task = cron.schedule('*/15 * * * *', () => {
    runAutoComplete().catch((error) => console.error('[avto-yakunlash] xatolik:', error.message));
  });

  console.log('✅ Avtomatik yakunlash ishga tushdi (har 15 daqiqada)');
  return task;
}

module.exports = { startAutoCompleteJob, runAutoComplete };
