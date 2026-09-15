'use strict';

const AppointmentModel = require('../models/Appointment');
const BarberModel = require('../models/Barber');
const ServiceModel = require('../models/Service');
const SiteSettingModel = require('../models/SiteSetting');
const TimeBlockModel = require('../models/TimeBlock');
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
function buildSlots({ workStart, workEnd, duration, step, busy, blocks = [], dateStr, minLeadMinutes }) {
  const slots = [];
  const openAt = toMinutes(workStart);
  const closeAt = toMinutes(workEnd);

  if (closeAt <= openAt) return slots;

  const isToday = dateStr === todayStr();
  const earliest = isToday ? nowMinutes() + minLeadMinutes : -1;

  // Band vaqtlar + bloklangan vaqtlar bir xil qaraladi
  const busyRanges = [
    ...busy.map((item) => ({ start: toMinutes(item.startTime), end: toMinutes(item.endTime) })),
    ...blocks.map((block) =>
      block.isFullDay
        ? { start: 0, end: 1440 }
        : { start: toMinutes(block.startTime), end: toMinutes(block.endTime) }
    ),
  ];

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

    const [busy, blocks] = await Promise.all([
      AppointmentModel.findBusySlots(barberId, date),
      TimeBlockModel.findForDate(date, barberId),
    ]);

    // Butun kun bloklangan bo'lsa — dam olish kuni kabi
    if (blocks.some((block) => block.isFullDay)) {
      return { date, slots: [], reason: 'BLOCKED' };
    }

    const slots = buildSlots({
      workStart: workingHour.startTime,
      workEnd: workingHour.endTime,
      duration: service.duration,
      step: settings.slotStep,
      busy,
      blocks,
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

    const [busyAll, blocksAll] = await Promise.all([
      AppointmentModel.findBusyInRange(barberId, today, lastDate),
      TimeBlockModel.findInRange(today, lastDate, barberId),
    ]);

    const busyByDate = new Map();
    for (const item of busyAll) {
      const key = fromDbDate(item.date);
      if (!busyByDate.has(key)) busyByDate.set(key, []);
      busyByDate.get(key).push(item);
    }

    const blocksByDate = new Map();
    for (const block of blocksAll) {
      const key = fromDbDate(block.date);
      if (!blocksByDate.has(key)) blocksByDate.set(key, []);
      blocksByDate.get(key).push(block);
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

      const dayBlocks = blocksByDate.get(date) || [];

      if (dayBlocks.some((block) => block.isFullDay)) {
        days.push({ date, weekday, available: false, slotCount: 0, reason: 'BLOCKED' });
        continue;
      }

      const slots = buildSlots({
        workStart: workingHour.startTime,
        workEnd: workingHour.endTime,
        duration: service.duration,
        step: settings.slotStep,
        busy: busyByDate.get(date) || [],
        blocks: dayBlocks,
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
