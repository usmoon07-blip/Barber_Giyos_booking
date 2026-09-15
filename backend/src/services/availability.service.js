'use strict';

const AppointmentModel = require('../models/Appointment');
const BarberModel = require('../models/Barber');
const ServiceModel = require('../models/Service');
const SiteSettingModel = require('../models/SiteSetting');
const { ApiError } = require('../utils/errors');
const {
  todayStr,
  nowMinutes,
  toMinutes,
  toTime,
  fromDbDate,
  weekdayOf,
  addDays,
} = require('../utils/time');

/**
 * Bo'sh vaqtlarni hisoblash — loyihaning eng muhim mantig'i.
 *
 * Hisobga olinadi:
 *  - barberning shu hafta kunidagi ish jadvali;
 *  - dam olish kunlari;
 *  - tanlangan xizmatning davomiyligi;
 *  - allaqachon band qilingan bronlar (ustma-ust tushish tekshiriladi);
 *  - bugungi kun uchun o'tib ketgan va juda yaqin vaqtlar.
 */
function buildSlots({ workStart, workEnd, duration, step, busy, dateStr, minLeadMinutes }) {
  const slots = [];
  const openAt = toMinutes(workStart);
  const closeAt = toMinutes(workEnd);

  if (closeAt <= openAt) return slots;

  const isToday = dateStr === todayStr();
  const earliest = isToday ? nowMinutes() + minLeadMinutes : -1;

  const busyRanges = busy.map((item) => ({
    start: toMinutes(item.startTime),
    end: toMinutes(item.endTime),
  }));

  for (let start = openAt; start + duration <= closeAt; start += step) {
    const end = start + duration;

    if (start < earliest) continue;

    const overlaps = busyRanges.some((range) => start < range.end && end > range.start);
    if (overlaps) continue;

    slots.push(toTime(start));
  }

  return slots;
}

const AvailabilityService = {
  /** Tanlangan barber va xizmat uchun bitta kundagi bo'sh vaqtlar. */
  async getTimeSlots({ barberId, serviceId, date }) {
    const [barber, service, settings] = await Promise.all([
      BarberModel.findById(barberId, { withHours: true }),
      ServiceModel.findById(serviceId),
      SiteSettingModel.get(),
    ]);

    if (!barber || !barber.isActive) throw ApiError.notFound('Barber topilmadi');
    if (!service || !service.isActive) throw ApiError.notFound('Xizmat topilmadi');

    const today = todayStr();
    if (date < today) return { date, slots: [], reason: 'PAST_DATE' };

    const lastDate = addDays(today, settings.maxAdvanceDays);
    if (date > lastDate) return { date, slots: [], reason: 'TOO_FAR' };

    const weekday = weekdayOf(date);
    const workingHour = barber.workingHours.find((hour) => hour.weekday === weekday);

    if (!workingHour || !workingHour.isWorking) {
      return { date, slots: [], reason: 'DAY_OFF' };
    }

    const busy = await AppointmentModel.findBusySlots(barberId, date);

    const slots = buildSlots({
      workStart: workingHour.startTime,
      workEnd: workingHour.endTime,
      duration: service.duration,
      step: settings.slotStep,
      busy,
      dateStr: date,
      minLeadMinutes: settings.minLeadMinutes,
    });

    return {
      date,
      slots,
      workStart: workingHour.startTime,
      workEnd: workingHour.endTime,
      duration: service.duration,
      reason: slots.length ? null : 'FULL',
    };
  },

  /** Kalendar uchun: yaqin kunlarning qaysi biri bo'sh ekanligi. */
  async getAvailableDates({ barberId, serviceId }) {
    const [barber, service, settings] = await Promise.all([
      BarberModel.findById(barberId, { withHours: true }),
      ServiceModel.findById(serviceId),
      SiteSettingModel.get(),
    ]);

    if (!barber || !barber.isActive) throw ApiError.notFound('Barber topilmadi');
    if (!service || !service.isActive) throw ApiError.notFound('Xizmat topilmadi');

    const today = todayStr();
    const lastDate = addDays(today, settings.maxAdvanceDays);

    const busyAll = await AppointmentModel.findBusyInRange(barberId, today, lastDate);

    const busyByDate = new Map();
    for (const item of busyAll) {
      const key = fromDbDate(item.date);
      if (!busyByDate.has(key)) busyByDate.set(key, []);
      busyByDate.get(key).push(item);
    }

    const days = [];

    for (let offset = 0; offset <= settings.maxAdvanceDays; offset += 1) {
      const date = addDays(today, offset);
      const weekday = weekdayOf(date);
      const workingHour = barber.workingHours.find((hour) => hour.weekday === weekday);

      if (!workingHour || !workingHour.isWorking) {
        days.push({ date, weekday, available: false, slotCount: 0, reason: 'DAY_OFF' });
        continue;
      }

      const slots = buildSlots({
        workStart: workingHour.startTime,
        workEnd: workingHour.endTime,
        duration: service.duration,
        step: settings.slotStep,
        busy: busyByDate.get(date) || [],
        dateStr: date,
        minLeadMinutes: settings.minLeadMinutes,
      });

      days.push({
        date,
        weekday,
        available: slots.length > 0,
        slotCount: slots.length,
        reason: slots.length ? null : 'FULL',
      });
    }

    return days;
  },
};

module.exports = { AvailabilityService, buildSlots };
