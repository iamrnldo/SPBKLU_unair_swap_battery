const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Get statistics / metrics / dashboard charts (Requires Login & Admin Role)
router.get('/dashboard-stats', verifyToken, isAdmin, adminController.getDashboardStats);

// List all users in the system (Requires Login & Admin Role)
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);

// Create a new User/Admin (Requires Login & Admin Role)
router.post('/users', verifyToken, isAdmin, adminController.createUser);

// Update a User/Admin (Requires Login & Admin Role)
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser);

// Delete a User/Admin (Requires Login & Admin Role)
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);

module.exports = router;
