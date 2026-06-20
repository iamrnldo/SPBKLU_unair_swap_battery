const { sequelize } = require('../config/db');
const User = require('../models/user.model');
const Station = require('../models/station.model');
const Battery = require('../models/battery.model');
const Transaction = require('../models/transaction.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Perform standard battery swapping operation with database transactions
 * POST /api/transactions/swap
 */
const swapBattery = async (req, res, next) => {
  // Start a Sequelize Transaction to ensure ACID properties during swapping
  const t = await sequelize.transaction();

  try {
    const { stationId, slotId, emptyBatteryId } = req.body;
    const userId = req.user.id;

    if (!stationId || !slotId || !emptyBatteryId) {
      await t.rollback();
      return sendError(res, 'Station ID, Slot ID, and empty Battery ID are required', 400);
    }

    // 1. Fetch User and check balance
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return sendError(res, 'User not found', 404);
    }

    const swapCost = 10000; // Flat fee 10,000 IDR for swapping battery
    if (user.balance < swapCost) {
      await t.rollback();
      return sendError(res, 'Insufficient balance. Swapping fee is IDR 10,000.', 402);
    }

    // 2. Fetch Station and find Slot
    const station = await Station.findByPk(stationId, { transaction: t });
    if (!station) {
      await t.rollback();
      return sendError(res, 'Station not found', 404);
    }
    if (station.status !== 'active') {
      await t.rollback();
      return sendError(res, 'Station is currently offline or in maintenance', 400);
    }

    // Slots is stored as JSONB array, let's find the requested slot
    const slots = [...station.slots];
    const slotIndex = slots.findIndex(s => s.slotId === parseInt(slotId));
    if (slotIndex === -1) {
      await t.rollback();
      return sendError(res, 'Invalid slot ID for this station', 400);
    }

    const targetSlot = slots[slotIndex];
    if (targetSlot.status !== 'ready' || !targetSlot.batteryId) {
      await t.rollback();
      return sendError(res, 'Selected slot battery is not fully charged or ready', 400);
    }

    const fullBatteryId = targetSlot.batteryId;

    // 3. Fetch both batteries involved to check validity
    const emptyBattery = await Battery.findByPk(emptyBatteryId, { transaction: t });
    if (!emptyBattery) {
      await t.rollback();
      return sendError(res, `Empty Battery ID ${emptyBatteryId} is not registered in the system`, 404);
    }

    const fullBattery = await Battery.findByPk(fullBatteryId, { transaction: t });
    if (!fullBattery) {
      await t.rollback();
      return sendError(res, `Full Battery ID ${fullBatteryId} is not registered in the system`, 404);
    }

    // 4. Update Database States inside Transaction
    
    // A. Deduct user balance
    user.balance -= swapCost;
    await user.save({ transaction: t });

    // B. Update empty battery (Now stored at station)
    emptyBattery.currentUserId = null;
    emptyBattery.currentStationId = stationId;
    emptyBattery.chargeLevel = 10; // Set as low/swapped charge level
    emptyBattery.status = 'charging';
    await emptyBattery.save({ transaction: t });

    // C. Update full battery (Now in use by user)
    fullBattery.currentUserId = userId;
    fullBattery.currentStationId = null;
    fullBattery.status = 'in-use';
    await fullBattery.save({ transaction: t });

    // D. Update Station Slot (Empty battery is placed in, starts charging)
    slots[slotIndex] = {
      slotId: targetSlot.slotId,
      batteryId: emptyBatteryId,
      status: 'charging',
      chargeLevel: 10
    };
    
    // Re-assign and save the JSONB column
    station.slots = slots;
    await station.save({ transaction: t });

    // E. Record Transaction log
    const transactionId = `TXN-${Date.now()}`;
    const newTransaction = await Transaction.create({
      transactionId,
      userId: user.id,
      userName: user.name,
      stationId: station.id,
      stationName: station.name,
      emptyBatteryId,
      fullBatteryId,
      cost: swapCost,
      status: 'completed',
      timestamp: new Date()
    }, { transaction: t });

    // Commit Transaction!
    await t.commit();

    return sendSuccess(res, 'Battery swapping transaction successful!', {
      transaction: newTransaction,
      remainingBalance: user.balance
    }, 200);

  } catch (error) {
    // Rollback changes on database error
    await t.rollback();
    next(error);
  }
};

/**
 * Get logged-in user swap transaction history
 */
const getMyHistory = async (req, res, next) => {
  try {
    const history = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['timestamp', 'DESC']]
    });
    return sendSuccess(res, 'User swap history retrieved successfully', history);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all system transaction history (Admin Only)
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['timestamp', 'DESC']]
    });
    return sendSuccess(res, 'All system transactions retrieved successfully', transactions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  swapBattery,
  getMyHistory,
  getAllTransactions
};
