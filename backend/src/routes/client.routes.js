'use strict';

const express = require('express');
const bookingController = require('../controllers/bookingController');
const { clientAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Barcha mijoz yo'llari Telegram autentifikatsiyasidan o'tadi
router.use(clientAuth);

// Profil
router.get('/me', bookingController.getMe);
router.patch('/me', bookingController.updateMe);

// Xizmatlar
router.get('/services', bookingController.listServices);
router.get('/services/popular', bookingController.listPopularServices);
router.get('/services/:id', bookingController.getService);

// Barberlar
router.get('/barbers', bookingController.listBarbers);
router.get('/barbers/:id', bookingController.getBarber);

// Bo'sh vaqtlar
router.get('/availability/dates', bookingController.getAvailableDates);
router.get('/availability/slots', bookingController.getAvailableSlots);

// Bronlar
router.get('/appointments', bookingController.listMyAppointments);
router.post('/appointments', bookingController.createAppointment);
router.post('/appointments/:id/cancel', bookingController.cancelAppointment);
router.post('/appointments/:id/on-the-way', bookingController.markOnTheWay);

module.exports = router;
