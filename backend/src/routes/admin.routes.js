'use strict';

const express = require('express');
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Ochiq: kirish
router.post('/auth/login', adminController.login);

// Quyidagi barcha yo'llar token talab qiladi
router.use(adminAuth);

router.get('/auth/me', adminController.me);

// Dashboard
router.get('/dashboard', adminController.getDashboard);
router.get('/stats', adminController.getStats);
router.get('/schedule', adminController.getDaySchedule);

// Bronlar
router.get('/appointments', adminController.listAppointments);
router.patch('/appointments/:id/status', adminController.updateAppointmentStatus);
router.delete('/appointments/:id', adminController.deleteAppointment);

// Barberlar
router.get('/barbers', adminController.listBarbers);
router.post('/barbers', adminController.createBarber);
router.patch('/barbers/:id', adminController.updateBarber);
router.delete('/barbers/:id', adminController.deleteBarber);

// Ish jadvali
router.get('/barbers/:id/working-hours', adminController.getWorkingHours);
router.put('/barbers/:id/working-hours', adminController.updateWorkingHours);

// Xizmatlar
router.get('/services', adminController.listServices);
router.post('/services', adminController.createService);
router.patch('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Mijozlar
router.get('/users', adminController.listUsers);

// Sozlamalar
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

module.exports = router;
