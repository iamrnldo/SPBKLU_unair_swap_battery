const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/battery.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Battery inventory management
router.get('/', verifyToken, isAdmin, batteryController.getAllBatteries);
router.get('/:id', verifyToken, batteryController.getBatteryDetail);
router.post('/', verifyToken, isAdmin, batteryController.createBattery);
router.put('/:id', verifyToken, isAdmin, batteryController.updateBattery);
router.delete('/:id', verifyToken, isAdmin, batteryController.deleteBattery);

module.exports = router;
