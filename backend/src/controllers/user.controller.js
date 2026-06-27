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
      role: user.role
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
  getMyBattery
};
