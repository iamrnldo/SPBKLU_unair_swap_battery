const express = require('express');
const router = express.Router();
const topupController = require('../controllers/topup.controller');

// Public endpoint for Pakasir payment notifications.
// Configure this URL in Pakasir project dashboard:
// POST {BACKEND_BASE_URL}/api/payments/pakasir/webhook
router.post('/pakasir/webhook', topupController.handlePakasirWebhook);

module.exports = router;
