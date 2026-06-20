const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/battery.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Get all registered charging cable points (Requires Login & Admin Role)
router.get('/', verifyToken, isAdmin, batteryController.getAllBatteries);

// Generate/print QR code for a charging cable point (Requires Login & Admin Role)
router.get('/:id/qr', verifyToken, isAdmin, batteryController.getBatteryQr);
router.post('/:id/regenerate-qr', verifyToken, isAdmin, batteryController.regenerateBatteryQr);

// Get charging cable diagnostics or details by ID
router.get('/:id', verifyToken, batteryController.getBatteryDetail);

// Register/update/delete charging cable point (Requires Login & Admin Role)
router.post('/', verifyToken, isAdmin, batteryController.createBattery);
router.put('/:id', verifyToken, isAdmin, batteryController.updateBattery);
router.delete('/:id', verifyToken, isAdmin, batteryController.deleteBattery);

module.exports = router;
