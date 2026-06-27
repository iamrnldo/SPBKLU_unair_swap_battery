const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isUser } = require('../middlewares/auth.middleware');

// Fetch current user profile (Requires Login)
router.get('/profile', verifyToken, userController.getProfile);

// Fetch currently held active battery (Requires Login & Regular User Role)
router.get('/my-battery', verifyToken, isUser, userController.getMyBattery);

module.exports = router;
