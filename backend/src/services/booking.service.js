'use strict';

const { prisma } = require('../database/connection');
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
  toDbDate,
  fromDbDate,
  weekdayOf,
  addDays,
  toInstant,
  isValidDateStr,
  isValidTimeStr,
} = require('../utils/time');

const BookingService = {
  /**
   * Yangi bron yaratadi.
   *
   * Ikki mijoz bir vaqtni bir paytda bron qilib yuborishining oldini olish uchun:
   *  1) tekshiruv va yozuv bitta Serializable tranzaksiyada bajariladi;
   *  2) bazada @@unique([barberId, date, startTime]) cheklovi qo'shimcha himoya beradi.
   */
  async createAppointment({
    userId,
    barberId,
    serviceId,
    date,
    startTime,
    note,
    paymentMethod,
    // Sartarosh qo'lda kiritganda bir nechta cheklov yumshatiladi
    byAdmin = false,
    isPaid = false,
    status,
  }) {
    if (!isValidDateStr(date)) throw ApiError.badRequest('Sana formati noto\'g\'ri', 'INVALID_DATE');
    if (!isValidTimeStr(startTime)) throw ApiError.badRequest('Vaqt formati noto\'g\'ri', 'INVALID_TIME');

    const [barber, service, settings] = await Promise.all([
      BarberModel.findById(barberId, { withHours: true }),
      ServiceModel.findById(serviceId),
      SiteSettingModel.get(),
    ]);

    if (!barber || !barber.isActive) throw ApiError.notFound('Barber topilmadi');
    if (!service || !service.isActive) throw ApiError.notFound('Xizmat topilmadi');

    const today = todayStr();
    if (date < today) throw ApiError.badRequest("O'tib ketgan sanaga bron qilib bo'lmaydi", 'PAST_DATE');
    if (!byAdmin && date > addDays(today, settings.maxAdvanceDays)) {
      throw ApiError.badRequest('Bu sana juda uzoq', 'TOO_FAR');
    }

    const workingHour = barber.workingHours.find((hour) => hour.weekday === weekdayOf(date));
    // Sartarosh o'zi kiritganda ish jadvalidan tashqarida ham yoza oladi
    if (!byAdmin && (!workingHour || !workingHour.isWorking)) {
      throw ApiError.conflict('Bu kuni barber ishlamaydi', 'DAY_OFF');
    }

    const startMinutes = toMinutes(startTime);
    const endMinutes = startMinutes + service.duration;
    const endTime = toTime(endMinutes);

    if (!byAdmin) {
      if (startMinutes < toMinutes(workingHour.startTime) || endMinutes > toMinutes(workingHour.endTime)) {
        throw ApiError.conflict('Tanlangan vaqt ish vaqtidan tashqarida', 'OUT_OF_HOURS');
      }

      if (date === today && startMinutes < nowMinutes() + settings.minLeadMinutes) {
        throw ApiError.conflict("Bu vaqt allaqachon o'tib ketgan", 'TOO_LATE');
      }

      if ((startMinutes - toMinutes(workingHour.startTime)) % settings.slotStep !== 0) {
        throw ApiError.badRequest("Vaqt noto'g'ri tanlangan", 'INVALID_SLOT');
      }

      // Bloklangan vaqtga mijoz yoza olmaydi
      const blocks = await TimeBlockModel.findForDate(date, barberId);
      const blocked = blocks.some((block) => {
        if (block.isFullDay) return true;
        return startMinutes < toMinutes(block.endTime) && endMinutes > toMinutes(block.startTime);
      });

      if (blocked) throw ApiError.conflict('Bu vaqt band qilingan', 'BLOCKED');
    }

    const method = paymentMethod === 'CARD' ? 'CARD' : 'CASH';

    if (method === 'CARD' && !settings.cardPaymentEnabled) {
      throw ApiError.badRequest("Karta orqali to'lov hozircha mavjud emas", 'CARD_DISABLED');
    }
    if (method === 'CASH' && !settings.cashPaymentEnabled) {
      throw ApiError.badRequest("Naqd to'lov hozircha mavjud emas", 'CASH_DISABLED');
    }

    const appointmentData = {
      userId: Number(userId),
      barberId: Number(barberId),
      serviceId: Number(serviceId),
      date: toDbDate(date),
      startTime,
      endTime,
      totalPrice: service.price,
      status: status || (byAdmin ? 'CONFIRMED' : 'PENDING'),
      source: byAdmin ? 'ADMIN' : 'MINIAPP',
      paymentMethod: method,
      isPaid: Boolean(isPaid),
      paidAt: isPaid ? new Date() : null,
      note: note ? String(note).slice(0, 300) : null,
    };

    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.appointment.findMany({
            where: {
              barberId: Number(barberId),
              date: toDbDate(date),
              status: { in: AppointmentModel.ACTIVE_STATUSES },
            },
            select: { startTime: true, endTime: true },
          });

          const conflict = existing.some((item) => {
            const busyStart = toMinutes(item.startTime);
            const busyEnd = toMinutes(item.endTime);
            return startMinutes < busyEnd && endMinutes > busyStart;
          });

          if (conflict) {
            throw ApiError.conflict('Bu vaqt allaqachon band qilingan', 'SLOT_TAKEN');
          }

          return tx.appointment.create({
            data: appointmentData,
            include: { user: true, barber: true, service: true },
          });
        },
        { isolationLevel: 'Serializable', timeout: 15000 }
      );
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // P2002 — unique cheklovi, P2034 — tranzaksiya to'qnashuvi
      if (error.code === 'P2002' || error.code === 'P2034') {
        throw ApiError.conflict('Bu vaqt allaqachon band qilingan', 'SLOT_TAKEN');
      }
      throw error;
    }
  },

  /**
   * Mijoz o'z bronini bekor qiladi.
   * Tashrifga juda oz vaqt qolgan bo'lsa, bekor qilish taqiqlanadi —
   * aks holda sartarosh o'sha vaqtni boshqa hech kimga bera olmaydi.
   */
  async cancelByUser(appointmentId, userId) {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) throw ApiError.notFound('Bron topilmadi');
    if (appointment.userId !== Number(userId)) throw ApiError.forbidden();

    if (appointment.status === 'CANCELLED') return appointment;
    if (appointment.status === 'COMPLETED' || appointment.status === 'NO_SHOW') {
      throw ApiError.conflict("Bu bronni bekor qilib bo'lmaydi", 'ALREADY_COMPLETED');
    }

    const settings = await SiteSettingModel.get();

    if (settings.cancelDeadlineHours > 0) {
      const startsAt = toInstant(fromDbDate(appointment.date), appointment.startTime).getTime();
      const hoursLeft = (startsAt - Date.now()) / 3600000;

      if (hoursLeft < settings.cancelDeadlineHours) {
        throw ApiError.conflict(
          `Bronni tashrifdan kamida ${settings.cancelDeadlineHours} soat oldin bekor qilish mumkin. Iltimos, sartaroshxonaga qo'ng'iroq qiling.`,
          'CANCEL_TOO_LATE'
        );
      }
    }

    return AppointmentModel.updateStatus(appointmentId, 'CANCELLED');
  },

  /** Mijoz "Yo'lga tushdim" tugmasini bosdi. */
  async markOnTheWay(appointmentId, userId) {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) throw ApiError.notFound('Bron topilmadi');
    if (appointment.userId !== Number(userId)) throw ApiError.forbidden();
    if (!AppointmentModel.ACTIVE_STATUSES.includes(appointment.status)) {
      throw ApiError.conflict('Bu bron faol emas', 'NOT_ACTIVE');
    }
    if (appointment.onTheWayAt) {
      return { appointment, alreadyMarked: true };
    }

    const updated = await AppointmentModel.markOnTheWay(appointmentId);
    return { appointment: updated, alreadyMarked: false };
  },
};

module.exports = BookingService;
