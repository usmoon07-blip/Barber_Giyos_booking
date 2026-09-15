'use strict';

const { fromDbDate } = require('./time');

/** Bronni frontend uchun qulay ko'rinishga keltiradi. */
function serializeAppointment(appointment) {
  if (!appointment) return null;

  return {
    id: appointment.id,
    date: fromDbDate(appointment.date),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    totalPrice: appointment.totalPrice,
    status: appointment.status,
    note: appointment.note,
    onTheWayAt: appointment.onTheWayAt,
    createdAt: appointment.createdAt,
    barber: appointment.barber
      ? {
          id: appointment.barber.id,
          name: appointment.barber.name,
          photoUrl: appointment.barber.photoUrl,
        }
      : null,
    service: appointment.service
      ? {
          id: appointment.service.id,
          name: appointment.service.name,
          nameRu: appointment.service.nameRu,
          imageUrl: appointment.service.imageUrl,
          duration: appointment.service.duration,
          price: appointment.service.price,
        }
      : null,
    user: appointment.user
      ? {
          id: appointment.user.id,
          telegramId: appointment.user.telegramId,
          firstName: appointment.user.firstName,
          lastName: appointment.user.lastName,
          username: appointment.user.username,
          phone: appointment.user.phone,
          language: appointment.user.language,
        }
      : null,
  };
}

/** Mijoz ma'lumotlari. */
function serializeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    telegramId: user.telegramId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: user.phone,
    language: user.language,
    photoUrl: user.photoUrl,
    nameCustom: user.nameCustom,
    createdAt: user.createdAt,
  };
}

module.exports = { serializeAppointment, serializeUser };
