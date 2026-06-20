const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { verifyToken, isUser, isAdmin } = require('../middlewares/auth.middleware');

// Perform a battery swap transaction (Requires Login & Regular User Role)
router.post('/swap', verifyToken, isUser, transactionController.swapBattery);

// Get my own swap history (Requires Login & Regular User Role)
router.get('/my-history', verifyToken, isUser, transactionController.getMyHistory);

// Get all swap history (Requires Login & Admin Role)
router.get('/all', verifyToken, isAdmin, transactionController.getAllTransactions);

module.exports = router;
