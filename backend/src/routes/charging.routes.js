const express = require('express');
const router = express.Router();
const chargingController = require('../controllers/charging.controller');
const { verifyToken, isUser, isAdmin } = require('../middlewares/auth.middleware');

// User Android APK flow: scan admin-generated QR, input nominal/watt, start charging.
router.get('/active', verifyToken, isUser, chargingController.getActiveChargingSession);
router.post('/scan', verifyToken, isUser, chargingController.validateChargingQr);
router.post('/start', verifyToken, isUser, chargingController.startCharging);
router.post('/:sessionId/complete', verifyToken, isUser, chargingController.completeCharging);
router.get('/my-history', verifyToken, isUser, chargingController.getMyChargingHistory);

// Admin reporting helper.
router.get('/all', verifyToken, isAdmin, chargingController.getAllChargingSessions);

module.exports = router;
