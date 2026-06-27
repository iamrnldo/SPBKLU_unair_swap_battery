const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Station = require('../models/station.model');
const Battery = require('../models/battery.model');
const Transaction = require('../models/transaction.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get dashboard stats for Admin
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Perform database count queries
    const totalUsers = await User.count({ where: { role: 'user' } });
    const totalStations = await Station.count();
    const totalBatteries = await Battery.count();
    const totalTransactions = await Transaction.count();
    
    // Calculate total revenue from completed swap orders
    const totalRevenue = await Transaction.sum('cost', { where: { status: 'completed' } }) || 0;

    const operationalRate = "99.2%"; // KPI simulation

    return sendSuccess(res, 'Admin statistics fetched successfully', {
      statistics: {
        totalUsers,
        totalStations,
        totalBatteries,
        totalTransactions,
        operationalRate,
        revenueThisMonth: totalRevenue
      },
      chartData: {
        monthlyTransactions: [12, 28, 48, 62, 98, totalTransactions],
        monthlyRevenue: [120000, 280000, 480000, 620000, 980000, totalRevenue]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all registered users list
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    return sendSuccess(res, 'Users list retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new User or Admin (Admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, 'Name, email, password, and role are required', 400);
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return sendError(res, 'Email already registered', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return sendSuccess(res, 'User created successfully', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing User or Admin (Admin only)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if email unique if changed
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        return sendError(res, 'Email already in use by another account', 400);
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return sendSuccess(res, 'User updated successfully', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a User (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return sendError(res, 'Akses ditolak. Anda tidak bisa menghapus akun Anda sendiri.', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Delete associated batteries dependencies first (nullify currentUserId on those batteries)
    await Battery.update({ currentUserId: null, status: 'idle' }, { where: { currentUserId: id } });

    await user.destroy();

    return sendSuccess(res, 'User deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
