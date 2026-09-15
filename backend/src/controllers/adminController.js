'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../config/default');
const { prisma } = require('../database/connection');
const AppointmentModel = require('../models/Appointment');
const BarberModel = require('../models/Barber');
const ServiceModel = require('../models/Service');
const SiteSettingModel = require('../models/SiteSetting');
const UserModel = require('../models/User');
const TimeBlockModel = require('../models/TimeBlock');
const WorkingHourModel = require('../models/WorkingHour');
const NotificationService = require('../services/notification.service');
const ReportService = require('../services/report.service');
const BookingService = require('../services/booking.service');
const { AvailabilityService } = require('../services/availability.service');
const { ApiError, asyncHandler } = require('../utils/errors');
const { safeCompare } = require('../utils/telegramAuth');
const { serializeAppointment } = require('../utils/serialize');
const {
  todayStr,
  toDbDate,
  fromDbDate,
  addDays,
  weekdayOf,
  isValidTimeStr,
  isValidDateStr,
  toMinutes,
} = require('../utils/time');

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const PAYMENT_METHODS = ['CASH', 'CARD'];
const CATEGORIES = ['HAIR', 'BEARD', 'COMBO', 'STYLING', 'OTHER'];

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback = undefined) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

const adminController = {
  // ─── Autentifikatsiya ─────────────────────────────────────────────
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};

    const usernameOk = safeCompare(String(username || ''), config.admin.username);
    const passwordOk = safeCompare(String(password || ''), config.admin.password);

    if (!usernameOk || !passwordOk) {
      throw ApiError.unauthorized('Login yoki parol noto\'g\'ri');
    }

    const token = jwt.sign({ role: 'admin', username: config.admin.username }, config.admin.jwtSecret, {
      expiresIn: config.admin.tokenTtl,
    });

    res.json({ ok: true, data: { token, username: config.admin.username } });
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ ok: true, data: { username: req.admin.username, role: req.admin.role } });
  }),

  // ─── Dashboard ────────────────────────────────────────────────────
  getDashboard: asyncHandler(async (_req, res) => {
    const today = todayStr();
    const todayDate = toDbDate(today);
    const monthStart = toDbDate(`${today.slice(0, 7)}-01`);

    const [
      todayAppointments,
      pendingCount,
      totalUsers,
      activeBarbers,
      todayRevenueRows,
      monthRevenueRows,
      topServices,
      upcoming,
    ] = await Promise.all([
      prisma.appointment.count({ where: { date: todayDate, status: { not: 'CANCELLED' } } }),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      UserModel.countAll(),
      BarberModel.countActive(),
      prisma.appointment.aggregate({
        where: { date: todayDate, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.appointment.aggregate({
        where: { date: { gte: monthStart }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { status: { not: 'CANCELLED' } },
        _count: { serviceId: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5,
      }),
      prisma.appointment.findMany({
        where: { date: { gte: todayDate }, status: { in: ['PENDING', 'CONFIRMED'] } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 8,
        include: { user: true, barber: true, service: true },
      }),
    ]);

    const services = await ServiceModel.listAll();
    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const quick = await ReportService.quickTotals();

    res.json({
      ok: true,
      data: {
        todayAppointments,
        pendingCount,
        totalUsers,
        activeBarbers,
        todayRevenue: todayRevenueRows._sum.totalPrice || 0,
        monthRevenue: monthRevenueRows._sum.totalPrice || 0,
        payments: quick,
        topServices: topServices.map((row) => ({
          serviceId: row.serviceId,
          name: serviceMap.get(row.serviceId)?.name || '—',
          count: row._count.serviceId,
        })),
        upcoming: upcoming.map(serializeAppointment),
      },
    });
  }),

  // ─── Bronlar ──────────────────────────────────────────────────────
  listAppointments: asyncHandler(async (req, res) => {
    const { status, barberId, date, from, to, search, paymentMethod, isPaid } = req.query;

    if (status && !STATUSES.includes(status)) {
      throw ApiError.badRequest('Holat noto\'g\'ri', 'INVALID_STATUS');
    }
    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      throw ApiError.badRequest('To\'lov turi noto\'g\'ri', 'INVALID_PAYMENT_METHOD');
    }

    const result = await AppointmentModel.listForAdmin({
      status,
      barberId: barberId ? toInt(barberId) : undefined,
      date,
      from,
      to,
      search,
      paymentMethod,
      isPaid: toBool(isPaid, undefined),
      page: toInt(req.query.page, 1),
      pageSize: Math.min(toInt(req.query.pageSize, 30), 100),
    });

    res.json({
      ok: true,
      data: { ...result, items: result.items.map(serializeAppointment) },
    });
  }),

  /**
   * Sartarosh qo'lda bron qo'shadi (telefon orqali yoki eshikdan kelgan mijoz).
   * Mijozning Telegram akkaunti bo'lishi shart emas.
   */
  createAppointment: asyncHandler(async (req, res) => {
    const {
      userId,
      name,
      phone,
      barberId,
      serviceId,
      date,
      startTime,
      note,
      paymentMethod,
      isPaid,
      status,
    } = req.body || {};

    if (!barberId || !serviceId || !date || !startTime) {
      throw ApiError.badRequest('barberId, serviceId, date va startTime kerak');
    }
    if (status && !STATUSES.includes(status)) {
      throw ApiError.badRequest('Holat noto\'g\'ri', 'INVALID_STATUS');
    }

    let client = null;

    if (userId) {
      client = await UserModel.findById(userId);
      if (!client) throw ApiError.notFound('Mijoz topilmadi');
    } else {
      if (!name || String(name).trim().length < 2) {
        throw ApiError.badRequest('Mijoz ismini kiriting', 'INVALID_NAME');
      }

      // Telefon bo'yicha avval yozilgan mijozni topamiz — takrorlanmasin
      if (phone) client = await UserModel.findByPhone(phone);

      if (!client) {
        client = await UserModel.createWalkIn({ firstName: name, phone });
      } else if (phone && !client.phone) {
        client = await UserModel.updateProfile(client.id, { phone: String(phone).trim().slice(0, 20) });
      }
    }

    const appointment = await BookingService.createAppointment({
      userId: client.id,
      barberId,
      serviceId,
      date,
      startTime,
      note,
      paymentMethod,
      isPaid,
      status,
      byAdmin: true,
    });

    // Mijozning Telegrami bo'lsa, unga ham xabar boradi
    if (appointment.user.telegramId) {
      const settings = await SiteSettingModel.get();
      NotificationService.notifyClientBookingCreated(appointment, settings).catch(() => {});
    }

    res.status(201).json({ ok: true, data: serializeAppointment(appointment) });
  }),

  /** Qo'lda bron qo'shishda bo'sh vaqtlarni ko'rsatish uchun. */
  getAvailability: asyncHandler(async (req, res) => {
    const { barberId, serviceId, date } = req.query;
    if (!barberId || !serviceId || !date) {
      throw ApiError.badRequest('barberId, serviceId va date kerak');
    }

    const result = await AvailabilityService.getTimeSlots({ barberId, serviceId, date });
    res.json({ ok: true, data: result });
  }),

  /** Mijozlarni tezkor qidirish (qo'lda bron qo'shishda). */
  searchUsers: asyncHandler(async (req, res) => {
    const search = String(req.query.q || '').trim();
    if (search.length < 2) return res.json({ ok: true, data: [] });

    const result = await UserModel.list({ search, page: 1, pageSize: 8 });
    return res.json({ ok: true, data: result.items });
  }),

  updateAppointmentStatus: asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) throw ApiError.badRequest('Holat noto\'g\'ri', 'INVALID_STATUS');

    const existing = await AppointmentModel.findById(req.params.id);
    if (!existing) throw ApiError.notFound('Bron topilmadi');

    const appointment = await AppointmentModel.updateStatus(req.params.id, status);

    if (existing.status !== status) {
      NotificationService.notifyClientStatusChanged(appointment).catch(() => {});
    }

    res.json({ ok: true, data: serializeAppointment(appointment) });
  }),

  /** To'landi / to'lanmadi deb belgilash. */
  setAppointmentPayment: asyncHandler(async (req, res) => {
    const { isPaid, paymentMethod } = req.body || {};

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      throw ApiError.badRequest('To\'lov turi noto\'g\'ri', 'INVALID_PAYMENT_METHOD');
    }

    const existing = await AppointmentModel.findById(req.params.id);
    if (!existing) throw ApiError.notFound('Bron topilmadi');

    const appointment =
      isPaid === undefined
        ? await AppointmentModel.setPaymentMethod(req.params.id, paymentMethod)
        : await AppointmentModel.setPaid(req.params.id, Boolean(isPaid), paymentMethod);

    res.json({ ok: true, data: serializeAppointment(appointment) });
  }),

  deleteAppointment: asyncHandler(async (req, res) => {
    const existing = await AppointmentModel.findById(req.params.id);
    if (!existing) throw ApiError.notFound('Bron topilmadi');

    await AppointmentModel.remove(req.params.id);
    res.json({ ok: true });
  }),

  // ─── Barberlar ────────────────────────────────────────────────────
  listBarbers: asyncHandler(async (_req, res) => {
    const barbers = await BarberModel.listAll();
    res.json({ ok: true, data: barbers });
  }),

  createBarber: asyncHandler(async (req, res) => {
    const { name, photoUrl, bio, bioRu, phone, isActive, sortOrder } = req.body || {};

    if (!name || String(name).trim().length < 2) {
      throw ApiError.badRequest('Barber ismi kerak', 'INVALID_NAME');
    }

    const barber = await BarberModel.create({
      name: String(name).trim().slice(0, 80),
      photoUrl: photoUrl ? String(photoUrl).trim() : null,
      bio: bio ? String(bio).trim().slice(0, 500) : null,
      bioRu: bioRu ? String(bioRu).trim().slice(0, 500) : null,
      phone: phone ? String(phone).trim().slice(0, 20) : null,
      isActive: toBool(isActive, true),
      sortOrder: toInt(sortOrder, 0),
    });

    res.status(201).json({ ok: true, data: barber });
  }),

  updateBarber: asyncHandler(async (req, res) => {
    const { name, photoUrl, bio, bioRu, phone, isActive, sortOrder } = req.body || {};
    const data = {};

    if (name !== undefined) {
      if (String(name).trim().length < 2) throw ApiError.badRequest('Barber ismi kerak', 'INVALID_NAME');
      data.name = String(name).trim().slice(0, 80);
    }
    if (photoUrl !== undefined) data.photoUrl = photoUrl ? String(photoUrl).trim() : null;
    if (bio !== undefined) data.bio = bio ? String(bio).trim().slice(0, 500) : null;
    if (bioRu !== undefined) data.bioRu = bioRu ? String(bioRu).trim().slice(0, 500) : null;
    if (phone !== undefined) data.phone = phone ? String(phone).trim().slice(0, 20) : null;
    if (isActive !== undefined) data.isActive = toBool(isActive, true);
    if (sortOrder !== undefined) data.sortOrder = toInt(sortOrder, 0);

    const barber = await BarberModel.update(req.params.id, data);
    res.json({ ok: true, data: barber });
  }),

  deleteBarber: asyncHandler(async (req, res) => {
    const activeCount = await prisma.appointment.count({
      where: { barberId: toInt(req.params.id), status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    if (activeCount > 0) {
      throw ApiError.conflict(
        'Bu barberda faol bronlar bor. Avval ularni yakunlang yoki bekor qiling.',
        'HAS_ACTIVE_APPOINTMENTS'
      );
    }

    await BarberModel.remove(req.params.id);
    res.json({ ok: true });
  }),

  // ─── Ish jadvali ──────────────────────────────────────────────────
  getWorkingHours: asyncHandler(async (req, res) => {
    const barber = await BarberModel.findById(req.params.id);
    if (!barber) throw ApiError.notFound('Barber topilmadi');

    const hours = await WorkingHourModel.listByBarber(req.params.id);
    res.json({ ok: true, data: hours });
  }),

  updateWorkingHours: asyncHandler(async (req, res) => {
    const { hours } = req.body || {};
    if (!Array.isArray(hours) || !hours.length) {
      throw ApiError.badRequest('hours massivi kerak', 'INVALID_HOURS');
    }

    for (const hour of hours) {
      const weekday = toInt(hour.weekday, -1);
      if (weekday < 0 || weekday > 6) throw ApiError.badRequest('Hafta kuni noto\'g\'ri', 'INVALID_WEEKDAY');
      if (!isValidTimeStr(hour.startTime) || !isValidTimeStr(hour.endTime)) {
        throw ApiError.badRequest('Vaqt formati noto\'g\'ri (HH:mm)', 'INVALID_TIME');
      }
      if (toMinutes(hour.endTime) <= toMinutes(hour.startTime)) {
        throw ApiError.badRequest('Tugash vaqti boshlanish vaqtidan keyin bo\'lishi kerak', 'INVALID_RANGE');
      }
    }

    await WorkingHourModel.replaceForBarber(req.params.id, hours);
    const updated = await WorkingHourModel.listByBarber(req.params.id);

    res.json({ ok: true, data: updated });
  }),

  // ─── Vaqt bloklash ────────────────────────────────────────────────
  listTimeBlocks: asyncHandler(async (req, res) => {
    const today = todayStr();
    const from = req.query.from || today;
    const to = req.query.to || addDays(today, 60);

    const blocks = await TimeBlockModel.list({ from, to });
    res.json({ ok: true, data: blocks.map((block) => ({ ...block, date: fromDbDate(block.date) })) });
  }),

  createTimeBlock: asyncHandler(async (req, res) => {
    const { barberId, date, startTime, endTime, isFullDay, reason } = req.body || {};

    if (!isValidDateStr(date)) throw ApiError.badRequest('Sana formati noto\'g\'ri', 'INVALID_DATE');

    const fullDay = toBool(isFullDay, false);

    if (!fullDay) {
      if (!isValidTimeStr(startTime) || !isValidTimeStr(endTime)) {
        throw ApiError.badRequest('Vaqt formati noto\'g\'ri (HH:mm)', 'INVALID_TIME');
      }
      if (toMinutes(endTime) <= toMinutes(startTime)) {
        throw ApiError.badRequest('Tugash vaqti boshlanishdan keyin bo\'lishi kerak', 'INVALID_RANGE');
      }
    }

    if (barberId) {
      const barber = await BarberModel.findById(barberId);
      if (!barber) throw ApiError.notFound('Barber topilmadi');
    }

    // Shu vaqtga tushib qolgan faol bronlar borligini aytamiz
    const affected = await prisma.appointment.findMany({
      where: {
        date: toDbDate(date),
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(barberId ? { barberId: toInt(barberId) } : {}),
      },
      include: { user: true, barber: true, service: true },
    });

    const conflicting = fullDay
      ? affected
      : affected.filter(
          (item) =>
            toMinutes(item.startTime) < toMinutes(endTime) && toMinutes(item.endTime) > toMinutes(startTime)
        );

    const block = await TimeBlockModel.create({
      barberId: barberId ? toInt(barberId) : null,
      date: toDbDate(date),
      startTime: fullDay ? '00:00' : startTime,
      endTime: fullDay ? '23:59' : endTime,
      isFullDay: fullDay,
      reason: reason ? String(reason).trim().slice(0, 200) : null,
    });

    res.status(201).json({
      ok: true,
      data: {
        ...block,
        date: fromDbDate(block.date),
        // Shu blok ostida qolib ketgan bronlar — admin panel ogohlantiradi
        conflicting: conflicting.map(serializeAppointment),
      },
    });
  }),

  deleteTimeBlock: asyncHandler(async (req, res) => {
    const block = await TimeBlockModel.findById(req.params.id);
    if (!block) throw ApiError.notFound('Blok topilmadi');

    await TimeBlockModel.remove(req.params.id);
    res.json({ ok: true });
  }),

  // ─── Xizmatlar ────────────────────────────────────────────────────
  listServices: asyncHandler(async (_req, res) => {
    const services = await ServiceModel.listAll();
    res.json({ ok: true, data: services });
  }),

  createService: asyncHandler(async (req, res) => {
    const data = adminController._buildServiceData(req.body || {}, true);
    const service = await ServiceModel.create(data);
    res.status(201).json({ ok: true, data: service });
  }),

  updateService: asyncHandler(async (req, res) => {
    const data = adminController._buildServiceData(req.body || {}, false);
    const service = await ServiceModel.update(req.params.id, data);
    res.json({ ok: true, data: service });
  }),

  deleteService: asyncHandler(async (req, res) => {
    const activeCount = await prisma.appointment.count({
      where: { serviceId: toInt(req.params.id), status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    if (activeCount > 0) {
      throw ApiError.conflict(
        'Bu xizmatda faol bronlar bor. Uni o\'chirish o\'rniga "faol emas" qiling.',
        'HAS_ACTIVE_APPOINTMENTS'
      );
    }

    await ServiceModel.remove(req.params.id);
    res.json({ ok: true });
  }),

  /** Xizmat maydonlarini tekshirib, tozalab beradi. */
  _buildServiceData(body, isCreate) {
    const data = {};

    if (isCreate || body.name !== undefined) {
      if (!body.name || String(body.name).trim().length < 2) {
        throw ApiError.badRequest('Xizmat nomi kerak', 'INVALID_NAME');
      }
      data.name = String(body.name).trim().slice(0, 100);
    }

    if (isCreate || body.price !== undefined) {
      const price = toInt(body.price, -1);
      if (price < 0) throw ApiError.badRequest('Narx noto\'g\'ri', 'INVALID_PRICE');
      data.price = price;
    }

    if (isCreate || body.duration !== undefined) {
      const duration = toInt(body.duration, 0);
      if (duration < 5 || duration > 480) {
        throw ApiError.badRequest('Davomiyligi 5–480 daqiqa oralig\'ida bo\'lishi kerak', 'INVALID_DURATION');
      }
      data.duration = duration;
    }

    if (body.nameRu !== undefined) data.nameRu = body.nameRu ? String(body.nameRu).trim().slice(0, 100) : null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    if (body.description !== undefined) {
      data.description = body.description ? String(body.description).trim().slice(0, 500) : null;
    }
    if (body.descriptionRu !== undefined) {
      data.descriptionRu = body.descriptionRu ? String(body.descriptionRu).trim().slice(0, 500) : null;
    }
    if (body.oldPrice !== undefined) {
      data.oldPrice = body.oldPrice === null || body.oldPrice === '' ? null : toInt(body.oldPrice, null);
    }
    if (body.category !== undefined) {
      if (!CATEGORIES.includes(body.category)) throw ApiError.badRequest('Kategoriya noto\'g\'ri', 'INVALID_CATEGORY');
      data.category = body.category;
    }
    if (body.isPopular !== undefined) data.isPopular = toBool(body.isPopular, false);
    if (body.isActive !== undefined) data.isActive = toBool(body.isActive, true);
    if (body.sortOrder !== undefined) data.sortOrder = toInt(body.sortOrder, 0);

    return data;
  },

  // ─── Mijozlar ─────────────────────────────────────────────────────
  listUsers: asyncHandler(async (req, res) => {
    const result = await UserModel.list({
      search: req.query.search || '',
      page: toInt(req.query.page, 1),
      pageSize: Math.min(toInt(req.query.pageSize, 30), 100),
    });

    res.json({ ok: true, data: result });
  }),

  // ─── Sozlamalar ───────────────────────────────────────────────────
  getSettings: asyncHandler(async (_req, res) => {
    const settings = await SiteSettingModel.get();
    res.json({ ok: true, data: settings });
  }),

  updateSettings: asyncHandler(async (req, res) => {
    const body = req.body || {};
    const data = {};

    const textFields = [
      'shopName',
      'phone',
      'address',
      'addressRu',
      'instagram',
      'telegramChannel',
      'workingHoursText',
      'workingHoursTextRu',
      'logoUrl',
      'about',
      'aboutRu',
      'cardNumber',
      'cardHolder',
      'cardBank',
    ];

    for (const field of textFields) {
      if (body[field] !== undefined) {
        data[field] = body[field] ? String(body[field]).trim().slice(0, 500) : null;
      }
    }

    if (body.shopName !== undefined && !data.shopName) {
      throw ApiError.badRequest('Sartaroshxona nomi kerak', 'INVALID_NAME');
    }

    if (body.locationLat !== undefined) {
      data.locationLat = body.locationLat === null || body.locationLat === '' ? null : Number(body.locationLat);
    }
    if (body.locationLng !== undefined) {
      data.locationLng = body.locationLng === null || body.locationLng === '' ? null : Number(body.locationLng);
    }

    if (body.cardPaymentEnabled !== undefined) {
      data.cardPaymentEnabled = toBool(body.cardPaymentEnabled, true);
    }
    if (body.cashPaymentEnabled !== undefined) {
      data.cashPaymentEnabled = toBool(body.cashPaymentEnabled, true);
    }

    if (body.slotStep !== undefined) {
      const step = toInt(body.slotStep, 30);
      if (![10, 15, 20, 30, 60].includes(step)) {
        throw ApiError.badRequest('Vaqt oralig\'i 10, 15, 20, 30 yoki 60 bo\'lishi kerak', 'INVALID_STEP');
      }
      data.slotStep = step;
    }

    if (body.minLeadMinutes !== undefined) {
      const lead = toInt(body.minLeadMinutes, 30);
      if (lead < 0 || lead > 1440) throw ApiError.badRequest('Noto\'g\'ri qiymat', 'INVALID_LEAD');
      data.minLeadMinutes = lead;
    }

    if (body.maxAdvanceDays !== undefined) {
      const days = toInt(body.maxAdvanceDays, 21);
      if (days < 1 || days > 90) throw ApiError.badRequest('1 dan 90 gacha bo\'lishi kerak', 'INVALID_ADVANCE');
      data.maxAdvanceDays = days;
    }

    if (body.cancelDeadlineHours !== undefined) {
      const hours = toInt(body.cancelDeadlineHours, 2);
      if (hours < 0 || hours > 48) throw ApiError.badRequest('0 dan 48 gacha bo\'lishi kerak', 'INVALID_DEADLINE');
      data.cancelDeadlineHours = hours;
    }

    if (body.autoComplete !== undefined) {
      data.autoComplete = toBool(body.autoComplete, true);
    }

    if (body.reminderHours !== undefined) {
      const hours = toInt(body.reminderHours, 2);
      if (hours < 0 || hours > 48) throw ApiError.badRequest('0 dan 48 gacha bo\'lishi kerak', 'INVALID_REMINDER');
      data.reminderHours = hours;
    }

    const settings = await SiteSettingModel.update(data);
    res.json({ ok: true, data: settings });
  }),

  // ─── Kunlik jadval (barberlar bo'yicha) ───────────────────────────
  getDaySchedule: asyncHandler(async (req, res) => {
    const date = req.query.date || todayStr();
    if (!isValidDateStr(date)) throw ApiError.badRequest('Sana formati noto\'g\'ri', 'INVALID_DATE');

    const [appointments, barbers, blocks, settings] = await Promise.all([
      AppointmentModel.listByDate(date),
      BarberModel.listAll(),
      TimeBlockModel.findForDate(date),
      SiteSettingModel.get(),
    ]);

    const weekday = weekdayOf(date);

    res.json({
      ok: true,
      data: {
        date,
        weekday,
        slotStep: settings.slotStep,
        barbers: barbers
          .filter((barber) => barber.isActive)
          .map((barber) => {
            const hour = barber.workingHours.find((item) => item.weekday === weekday);
            return {
              id: barber.id,
              name: barber.name,
              photoUrl: barber.photoUrl,
              isWorking: Boolean(hour && hour.isWorking),
              startTime: hour ? hour.startTime : null,
              endTime: hour ? hour.endTime : null,
            };
          }),
        blocks: blocks.map((block) => ({ ...block, date: fromDbDate(block.date) })),
        appointments: appointments.map(serializeAppointment),
      },
    });
  }),

  // ─── Tushum hisoboti ──────────────────────────────────────────────
  getReport: asyncHandler(async (req, res) => {
    const today = todayStr();
    const from = req.query.from || `${today.slice(0, 7)}-01`;
    const to = req.query.to || today;

    if (!isValidDateStr(from) || !isValidDateStr(to)) {
      throw ApiError.badRequest('Sana formati noto\'g\'ri', 'INVALID_DATE');
    }
    if (from > to) throw ApiError.badRequest('Boshlanish sanasi kattaroq', 'INVALID_RANGE');

    const report = await ReportService.build({ from, to });
    res.json({ ok: true, data: report });
  }),

  // ─── Statistika (oxirgi 14 kun) ───────────────────────────────────
  getStats: asyncHandler(async (_req, res) => {
    const today = todayStr();
    const from = addDays(today, -13);

    const rows = await prisma.appointment.findMany({
      where: { date: { gte: toDbDate(from), lte: toDbDate(today) }, status: { not: 'CANCELLED' } },
      select: { date: true, totalPrice: true },
    });

    const byDate = new Map();
    for (let offset = 0; offset < 14; offset += 1) {
      byDate.set(addDays(from, offset), { count: 0, revenue: 0 });
    }

    for (const row of rows) {
      const key = new Date(row.date).toISOString().slice(0, 10);
      const bucket = byDate.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += row.totalPrice;
      }
    }

    res.json({
      ok: true,
      data: Array.from(byDate.entries()).map(([date, value]) => ({ date, ...value })),
    });
  }),
};

module.exports = adminController;
