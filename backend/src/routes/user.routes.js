const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const topupController = require('../controllers/topup.controller');
const { verifyToken, isUser } = require('../middlewares/auth.middleware');

// Fetch current user profile (Requires Login)
router.get('/profile', verifyToken, userController.getProfile);

// Fetch currently held active battery (Requires Login & Regular User Role)
router.get('/my-battery', verifyToken, isUser, userController.getMyBattery);

// QRIS wallet top-up via Pakasir (Requires Login & Regular User Role)
router.post('/topup', verifyToken, isUser, topupController.createTopUp);
router.get('/topups', verifyToken, isUser, topupController.getMyTopUps);
router.get('/topup/:orderId', verifyToken, isUser, topupController.getTopUpStatus);
router.post('/topup/:orderId/cancel', verifyToken, isUser, topupController.cancelTopUp);
router.post('/topup/:orderId/simulate', verifyToken, isUser, topupController.simulateTopUpPayment);

module.exports = router;
