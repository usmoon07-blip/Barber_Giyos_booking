'use strict';

const cron = require('node-cron');
const AppointmentModel = require('../models/Appointment');
const SiteSettingModel = require('../models/SiteSetting');
const NotificationService = require('../services/notification.service');
const { todayStr, addDays, toInstant, fromDbDate } = require('../utils/time');

/**
 * Har 5 daqiqada bron vaqti yaqinlashgan mijozlarga eslatma yuboradi.
 * Bir bron uchun eslatma faqat bir marta yuboriladi (reminderSentAt).
 */
async function runReminderCheck() {
  const settings = await SiteSettingModel.get();
  if (!settings.reminderHours) return;

  const windowMillis = settings.reminderHours * 60 * 60 * 1000;
  const now = Date.now();

  const dates = [todayStr(), addDays(todayStr(), 1)];
  const candidates = (await Promise.all(dates.map((date) => AppointmentModel.findPendingReminders(date)))).flat();

  for (const appointment of candidates) {
    const startsAt = toInstant(fromDbDate(appointment.date), appointment.startTime).getTime();
    const diff = startsAt - now;

    if (diff > 0 && diff <= windowMillis) {
      await NotificationService.sendReminder(appointment, settings.reminderHours);
      await AppointmentModel.markReminderSent(appointment.id);
      console.log(`[eslatma] #${appointment.id} — ${appointment.user.firstName}`);
    }
  }
}

function startReminderJob() {
  const task = cron.schedule('*/5 * * * *', () => {
    runReminderCheck().catch((error) => console.error('[eslatma] xatolik:', error.message));
  });

  console.log('⏰ Eslatma xizmati ishga tushdi (har 5 daqiqada)');
  return task;
}

module.exports = { startReminderJob, runReminderCheck };
