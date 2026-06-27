const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { verifyToken, isUser, isAdmin } = require('../middlewares/auth.middleware');

// App-based swap order flow (User selects battery, pays QRIS, then station releases battery)
router.post('/swap-order', verifyToken, isUser, transactionController.createSwapOrder);
router.get('/swap-order/active', verifyToken, isUser, transactionController.getMyActiveSwapOrder);
router.get('/swap-order/:transactionId', verifyToken, isUser, transactionController.getSwapOrderStatus);
router.post('/swap-order/:transactionId/simulate', verifyToken, isUser, transactionController.simulateSwapPayment);

// Legacy immediate swap transaction (kept for fallback/demo)
router.post('/swap', verifyToken, isUser, transactionController.swapBattery);

// Get my own swap history (Requires Login & Regular User Role)
router.get('/my-history', verifyToken, isUser, transactionController.getMyHistory);

// Get all swap history (Requires Login & Admin Role)
router.get('/all', verifyToken, isAdmin, transactionController.getAllTransactions);

module.exports = router;
