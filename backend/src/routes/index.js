const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const stationRoutes = require('./station.routes');
const batteryRoutes = require('./battery.routes');
const transactionRoutes = require('./transaction.routes');
const paymentRoutes = require('./payment.routes');

// Route configurations
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/stations', stationRoutes);
router.use('/batteries', batteryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
