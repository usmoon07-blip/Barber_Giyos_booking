'use strict';

const AppointmentModel = require('../models/Appointment');
const BarberModel = require('../models/Barber');
const ServiceModel = require('../models/Service');
const SiteSettingModel = require('../models/SiteSetting');
const UserModel = require('../models/User');
const BookingService = require('../services/booking.service');
const NotificationService = require('../services/notification.service');
const { AvailabilityService } = require('../services/availability.service');
const { ApiError, asyncHandler } = require('../utils/errors');
const { serializeAppointment, serializeUser } = require('../utils/serialize');
const { isValidDateStr } = require('../utils/time');

/** Mijozlar uchun (Mini App) API. */
const bookingController = {
  /** Profil + sartaroshxona sozlamalari. */
  getMe: asyncHandler(async (req, res) => {
    const settings = await SiteSettingModel.get();

    res.json({
      ok: true,
      data: {
        user: serializeUser(req.user),
        shop: {
          name: settings.shopName,
          phone: settings.phone,
          address: settings.address,
          addressRu: settings.addressRu,
          instagram: settings.instagram,
          telegramChannel: settings.telegramChannel,
          workingHoursText: settings.workingHoursText,
          workingHoursTextRu: settings.workingHoursTextRu,
          logoUrl: settings.logoUrl,
          about: settings.about,
          aboutRu: settings.aboutRu,
          locationLat: settings.locationLat,
          locationLng: settings.locationLng,
        },
        payment: {
          cashEnabled: settings.cashPaymentEnabled,
          cardEnabled: settings.cardPaymentEnabled,
          cardNumber: settings.cardPaymentEnabled ? settings.cardNumber : null,
          cardHolder: settings.cardPaymentEnabled ? settings.cardHolder : null,
          cardBank: settings.cardPaymentEnabled ? settings.cardBank : null,
        },
      },
    });
  }),

  /** Ism, telefon yoki tilni yangilash. */
  updateMe: asyncHandler(async (req, res) => {
    const { firstName, phone, language } = req.body || {};
    const data = {};

    if (firstName !== undefined) {
      const trimmed = String(firstName).trim();
      if (trimmed.length < 2) throw ApiError.badRequest('Ism juda qisqa', 'INVALID_NAME');
      data.firstName = trimmed.slice(0, 60);
    }

    if (phone !== undefined) {
      const digits = String(phone).replace(/[^\d+]/g, '');
      if (digits.replace(/\D/g, '').length < 9) {
        throw ApiError.badRequest('Telefon raqami noto\'g\'ri', 'INVALID_PHONE');
      }
      data.phone = digits.slice(0, 20);
    }

    if (language !== undefined) {
      if (!['uz', 'ru'].includes(language)) throw ApiError.badRequest('Til noto\'g\'ri', 'INVALID_LANG');
      data.language = language;
    }

    if (!Object.keys(data).length) {
      return res.json({ ok: true, data: { user: serializeUser(req.user) } });
    }

    const user = await UserModel.updateProfile(req.user.id, data);
    return res.json({ ok: true, data: { user: serializeUser(user) } });
  }),

  /** Barcha faol xizmatlar. */
  listServices: asyncHandler(async (_req, res) => {
    const services = await ServiceModel.listActive();
    res.json({ ok: true, data: services });
  }),

  /** Bitta xizmat. */
  getService: asyncHandler(async (req, res) => {
    const service = await ServiceModel.findById(req.params.id);
    if (!service || !service.isActive) throw ApiError.notFound('Xizmat topilmadi');
    res.json({ ok: true, data: service });
  }),

  /** Mashhur xizmatlar (bosh sahifa uchun). */
  listPopularServices: asyncHandler(async (_req, res) => {
    const services = await ServiceModel.listPopular(6);
    const fallback = services.length ? services : (await ServiceModel.listActive()).slice(0, 4);
    res.json({ ok: true, data: fallback });
  }),

  /** Barcha faol barberlar. */
  listBarbers: asyncHandler(async (_req, res) => {
    const barbers = await BarberModel.listActive();
    res.json({ ok: true, data: barbers });
  }),

  /** Bitta barber + ish jadvali. */
  getBarber: asyncHandler(async (req, res) => {
    const barber = await BarberModel.findById(req.params.id, { withHours: true });
    if (!barber || !barber.isActive) throw ApiError.notFound('Barber topilmadi');
    res.json({ ok: true, data: barber });
  }),

  /** Bo'sh sanalar. */
  getAvailableDates: asyncHandler(async (req, res) => {
    const { barberId, serviceId } = req.query;
    if (!barberId || !serviceId) throw ApiError.badRequest('barberId va serviceId kerak');

    const days = await AvailabilityService.getAvailableDates({ barberId, serviceId });
    res.json({ ok: true, data: days });
  }),

  /** Bo'sh vaqtlar. */
  getAvailableSlots: asyncHandler(async (req, res) => {
    const { barberId, serviceId, date } = req.query;
    if (!barberId || !serviceId || !date) throw ApiError.badRequest('barberId, serviceId va date kerak');
    if (!isValidDateStr(date)) throw ApiError.badRequest('Sana formati noto\'g\'ri', 'INVALID_DATE');

    const result = await AvailabilityService.getTimeSlots({ barberId, serviceId, date });
    res.json({ ok: true, data: result });
  }),

  /** Yangi bron yaratish. */
  createAppointment: asyncHandler(async (req, res) => {
    const { barberId, serviceId, date, startTime, note, name, phone, paymentMethod } = req.body || {};

    if (!barberId || !serviceId || !date || !startTime) {
      throw ApiError.badRequest('barberId, serviceId, date va startTime kerak');
    }

    // Birinchi bron bo'lsa, ism va telefonni saqlab qo'yamiz
    const profileUpdate = {};
    if (name && String(name).trim().length >= 2) profileUpdate.firstName = String(name).trim().slice(0, 60);
    if (phone) {
      const digits = String(phone).replace(/[^\d+]/g, '');
      if (digits.replace(/\D/g, '').length < 9) {
        throw ApiError.badRequest('Telefon raqami noto\'g\'ri', 'INVALID_PHONE');
      }
      profileUpdate.phone = digits.slice(0, 20);
    }

    if (Object.keys(profileUpdate).length) {
      req.user = await UserModel.updateProfile(req.user.id, profileUpdate);
    }

    if (!req.user.phone) {
      throw ApiError.badRequest('Telefon raqami kerak', 'PHONE_REQUIRED');
    }

    const appointment = await BookingService.createAppointment({
      userId: req.user.id,
      barberId,
      serviceId,
      date,
      startTime,
      note,
      paymentMethod,
    });

    // Xabarlarni javobni kutmasdan yuboramiz
    const settings = await SiteSettingModel.get();
    NotificationService.notifyClientBookingCreated(appointment, settings).catch(() => {});
    NotificationService.notifyAdminsNewBooking(appointment).catch(() => {});

    res.status(201).json({ ok: true, data: serializeAppointment(appointment) });
  }),

  /** Mijozning barcha bronlari. */
  listMyAppointments: asyncHandler(async (req, res) => {
    const appointments = await AppointmentModel.listByUser(req.user.id);
    res.json({ ok: true, data: appointments.map(serializeAppointment) });
  }),

  /** Bronni bekor qilish. */
  cancelAppointment: asyncHandler(async (req, res) => {
    const appointment = await BookingService.cancelByUser(req.params.id, req.user.id);
    NotificationService.notifyAdminsCancelled(appointment).catch(() => {});
    res.json({ ok: true, data: serializeAppointment(appointment) });
  }),

  /** "Yo'lga tushdim". */
  markOnTheWay: asyncHandler(async (req, res) => {
    const { appointment, alreadyMarked } = await BookingService.markOnTheWay(req.params.id, req.user.id);

    if (!alreadyMarked) {
      NotificationService.notifyAdminsOnTheWay(appointment).catch(() => {});
    }

    res.json({ ok: true, data: serializeAppointment(appointment), alreadyMarked });
  }),
};

module.exports = bookingController;
