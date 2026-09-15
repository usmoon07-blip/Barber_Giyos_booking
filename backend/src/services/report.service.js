'use strict';

const { prisma } = require('../database/connection');
const BarberModel = require('../models/Barber');
const ServiceModel = require('../models/Service');
const { toDbDate, fromDbDate, todayStr, addDays } = require('../utils/time');

/**
 * Tushum hisoboti.
 *
 * Tushunchalar:
 *  - "Bajarilgan ish"   — holati YAKUNLANGAN bo'lgan bronlar summasi
 *  - "Qabul qilingan pul" — to'landi deb belgilangan bronlar (naqd / karta)
 *  - "Kutilayotgan"     — tasdiqlangan, lekin hali bajarilmagan bronlar
 */

function emptyBucket() {
  return {
    count: 0,
    completedCount: 0,
    cancelledCount: 0,
    noShowCount: 0,
    pendingCount: 0,
    completedRevenue: 0,
    paidTotal: 0,
    cash: 0,
    card: 0,
    unpaidCompleted: 0,
    expected: 0,
  };
}

function addToBucket(bucket, appointment) {
  bucket.count += 1;

  if (appointment.status === 'CANCELLED') {
    bucket.cancelledCount += 1;
    return;
  }

  // Kelmagan mijoz tushum ham, kutilayotgan pul ham emas
  if (appointment.status === 'NO_SHOW') {
    bucket.noShowCount += 1;
    return;
  }

  if (appointment.status === 'COMPLETED') {
    bucket.completedCount += 1;
    bucket.completedRevenue += appointment.totalPrice;
    if (!appointment.isPaid) bucket.unpaidCompleted += appointment.totalPrice;
  } else {
    bucket.pendingCount += 1;
    if (!appointment.isPaid) bucket.expected += appointment.totalPrice;
  }

  if (appointment.isPaid) {
    bucket.paidTotal += appointment.totalPrice;
    if (appointment.paymentMethod === 'CARD') bucket.card += appointment.totalPrice;
    else bucket.cash += appointment.totalPrice;
  }
}

const ReportService = {
  /** Berilgan sana oralig'i uchun to'liq hisobot. */
  async build({ from, to }) {
    const rows = await prisma.appointment.findMany({
      where: { date: { gte: toDbDate(from), lte: toDbDate(to) } },
      select: {
        date: true,
        status: true,
        isPaid: true,
        paymentMethod: true,
        totalPrice: true,
        barberId: true,
        serviceId: true,
      },
      orderBy: { date: 'asc' },
    });

    const [barbers, services] = await Promise.all([BarberModel.listAll(), ServiceModel.listAll()]);
    const barberNames = new Map(barbers.map((barber) => [barber.id, barber.name]));
    const serviceNames = new Map(services.map((service) => [service.id, service.name]));

    const totals = emptyBucket();
    const byDay = new Map();
    const byBarber = new Map();
    const byService = new Map();

    // Oraliqdagi barcha kunlar (bron bo'lmagan kunlar ham ko'rinsin)
    for (let date = from; date <= to; date = addDays(date, 1)) {
      byDay.set(date, emptyBucket());
    }

    for (const row of rows) {
      const dateStr = fromDbDate(row.date);

      addToBucket(totals, row);

      if (!byDay.has(dateStr)) byDay.set(dateStr, emptyBucket());
      addToBucket(byDay.get(dateStr), row);

      if (!byBarber.has(row.barberId)) byBarber.set(row.barberId, emptyBucket());
      addToBucket(byBarber.get(row.barberId), row);

      if (!byService.has(row.serviceId)) byService.set(row.serviceId, emptyBucket());
      addToBucket(byService.get(row.serviceId), row);
    }

    const avgCheck = totals.completedCount
      ? Math.round(totals.completedRevenue / totals.completedCount)
      : 0;

    return {
      from,
      to,
      totals: { ...totals, avgCheck },
      byDay: Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, bucket]) => ({ date, ...bucket })),
      byBarber: Array.from(byBarber.entries())
        .map(([barberId, bucket]) => ({
          barberId,
          name: barberNames.get(barberId) || '—',
          ...bucket,
        }))
        .sort((a, b) => b.completedRevenue - a.completedRevenue),
      byService: Array.from(byService.entries())
        .map(([serviceId, bucket]) => ({
          serviceId,
          name: serviceNames.get(serviceId) || '—',
          ...bucket,
        }))
        .sort((a, b) => b.completedRevenue - a.completedRevenue),
    };
  },

  /** Dashboard uchun qisqa raqamlar: bugun va shu oy. */
  async quickTotals() {
    const today = todayStr();
    const monthStart = `${today.slice(0, 7)}-01`;

    const [todayReport, monthReport] = await Promise.all([
      ReportService.build({ from: today, to: today }),
      ReportService.build({ from: monthStart, to: today }),
    ]);

    return { today: todayReport.totals, month: monthReport.totals };
  },
};

module.exports = ReportService;
