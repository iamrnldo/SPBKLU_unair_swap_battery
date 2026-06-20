const User = require('../models/user.model');
const Battery = require('../models/battery.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get Profile of logged in user
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'Profile retrieved successfully', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Top up user balance/saldo
 */
const topUpBalance = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return sendError(res, 'Invalid top-up amount', 400);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Increment balance
    user.balance += parseInt(amount);
    await user.save();

    return sendSuccess(res, 'Balance topped up successfully', {
      userId: user.id,
      name: user.name,
      newBalance: user.balance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch currently carried active battery (Mobile user)
 */
const getMyBattery = async (req, res, next) => {
  try {
    const battery = await Battery.findOne({
      where: { currentUserId: req.user.id }
    });
    return sendSuccess(res, 'Active battery retrieved successfully', battery);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  topUpBalance,
  getMyBattery
};
