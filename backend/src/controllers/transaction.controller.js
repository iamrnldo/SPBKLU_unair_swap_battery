const QRCode = require('qrcode');
const { sequelize } = require('../config/db');
const config = require('../config/config');
const User = require('../models/user.model');
const Station = require('../models/station.model');
const Battery = require('../models/battery.model');
const Transaction = require('../models/transaction.model');
const { sendSuccess, sendError } = require('../utils/response');
const pakasirService = require('../services/pakasir.service');

const SWAP_COST = parseInt(process.env.SWAP_COST || '10000', 10);

const generateSwapOrderId = (userId) => {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SWAP-${userId}-${Date.now()}-${random}`;
};

const generateReleaseCode = () => `REL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const cloneSlots = (slots) => (Array.isArray(slots) ? slots.map((slot) => ({ ...slot })) : []);

const serializeSwapOrder = (transaction, extra = {}) => {
  const value = typeof transaction.toJSON === 'function' ? transaction.toJSON() : transaction;
  return {
    transactionId: value.transactionId,
    userId: value.userId,
    userName: value.userName,
    stationId: value.stationId,
    stationName: value.stationName,
    slotId: value.slotId,
    emptyBatteryId: value.emptyBatteryId,
    fullBatteryId: value.fullBatteryId,
    cost: value.cost,
    fee: value.fee || 0,
    totalPayment: value.totalPayment || value.cost,
    paymentMethod: value.paymentMethod,
    status: value.status,
    expiredAt: value.expiredAt,
    paidAt: value.paidAt,
    releasedAt: value.releasedAt,
    releaseCode: value.releaseCode,
    timestamp: value.timestamp,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    ...extra
  };
};

const serializeSwapOrderWithPaymentQr = async (transaction, extra = {}) => {
  const data = serializeSwapOrder(transaction, extra);

  if (transaction?.status === 'pending' && transaction.paymentNumber) {
    data.qrString = transaction.paymentNumber;
    data.qrImage = await QRCode.toDataURL(transaction.paymentNumber, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    data.checkoutUrl = pakasirService.buildCheckoutUrl({
      orderId: transaction.transactionId,
      amount: transaction.cost
    });
  }

  return data;
};

const releaseReservedSlot = async (transaction, dbTx = null) => {
  if (!transaction) return;

  const station = await Station.findByPk(transaction.stationId, dbTx ? { transaction: dbTx, lock: true } : undefined);
  if (!station) return;

  const slots = cloneSlots(station.slots);
  const slotIndex = slots.findIndex((slot) => parseInt(slot.slotId, 10) === parseInt(transaction.slotId, 10));

  if (slotIndex !== -1 && slots[slotIndex].batteryId === transaction.fullBatteryId && slots[slotIndex].status === 'reserved') {
    slots[slotIndex] = {
      ...slots[slotIndex],
      status: 'ready',
      reservedBy: null,
      reservedTransactionId: null,
      reservedAt: null
    };
    station.slots = slots;
    await station.save(dbTx ? { transaction: dbTx } : undefined);
  }
};

const completePaidSwapOrder = async ({ transactionId, completedAt = null }) => {
  const dbTx = await sequelize.transaction();

  try {
    const transaction = await Transaction.findByPk(transactionId, {
      transaction: dbTx,
      lock: true
    });

    if (!transaction) {
      await dbTx.rollback();
      return { transaction: null, completed: false };
    }

    if (transaction.status === 'completed') {
      await dbTx.commit();
      return { transaction, completed: false };
    }

    if (transaction.status !== 'pending') {
      await dbTx.rollback();
      throw new Error(`Swap order cannot be completed from status ${transaction.status}`);
    }

    const user = await User.findByPk(transaction.userId, { transaction: dbTx, lock: true });
    const station = await Station.findByPk(transaction.stationId, { transaction: dbTx, lock: true });
    const emptyBattery = await Battery.findByPk(transaction.emptyBatteryId, { transaction: dbTx, lock: true });
    const fullBattery = await Battery.findByPk(transaction.fullBatteryId, { transaction: dbTx, lock: true });

    if (!user || !station || !emptyBattery || !fullBattery) {
      await dbTx.rollback();
      throw new Error('Swap order data is incomplete');
    }

    const slots = cloneSlots(station.slots);
    const slotIndex = slots.findIndex((slot) => parseInt(slot.slotId, 10) === parseInt(transaction.slotId, 10));
    if (slotIndex === -1) {
      await dbTx.rollback();
      throw new Error('Selected station slot was not found');
    }

    const targetSlot = slots[slotIndex];
    if (targetSlot.batteryId !== transaction.fullBatteryId) {
      await dbTx.rollback();
      throw new Error('Selected slot battery has changed. Please contact admin.');
    }

    // Release the full battery to user and put the depleted battery into the slot.
    fullBattery.currentUserId = user.id;
    fullBattery.currentStationId = null;
    fullBattery.status = 'in-use';
    await fullBattery.save({ transaction: dbTx });

    emptyBattery.currentUserId = null;
    emptyBattery.currentStationId = station.id;
    emptyBattery.chargeLevel = Math.min(emptyBattery.chargeLevel || 10, 10);
    emptyBattery.status = 'charging';
    await emptyBattery.save({ transaction: dbTx });

    const releaseCode = transaction.releaseCode || generateReleaseCode();
    slots[slotIndex] = {
      slotId: targetSlot.slotId,
      batteryId: emptyBattery.id,
      status: 'charging',
      chargeLevel: emptyBattery.chargeLevel,
      releasedBatteryId: fullBattery.id,
      releasedAt: new Date().toISOString(),
      releaseCode,
      reservedBy: null,
      reservedTransactionId: null,
      reservedAt: null
    };
    station.slots = slots;
    await station.save({ transaction: dbTx });

    transaction.status = 'completed';
    transaction.paidAt = completedAt ? new Date(completedAt) : new Date();
    transaction.releasedAt = new Date();
    transaction.releaseCode = releaseCode;
    transaction.timestamp = new Date();
    await transaction.save({ transaction: dbTx });

    await dbTx.commit();
    return { transaction, completed: true, releaseCode };
  } catch (error) {
    await dbTx.rollback();
    throw error;
  }
};

/**
 * Create app-based battery swap order.
 * User chooses station + ready full battery slot, receives Pakasir QRIS payment.
 */
const createSwapOrder = async (req, res, next) => {
  const dbTx = await sequelize.transaction();

  try {
    const { stationId, slotId, emptyBatteryId } = req.body;
    const userId = req.user.id;

    if (!stationId || !slotId || !emptyBatteryId) {
      await dbTx.rollback();
      return sendError(res, 'Station ID, Slot ID, and depleted Battery ID are required', 400);
    }

    const user = await User.findByPk(userId, { transaction: dbTx, lock: true });
    if (!user) {
      await dbTx.rollback();
      return sendError(res, 'User not found', 404);
    }

    const activeOrder = await Transaction.findOne({
      where: { userId, status: 'pending' },
      transaction: dbTx,
      lock: true
    });
    if (activeOrder) {
      await dbTx.rollback();
      return sendError(res, 'Anda masih memiliki pesanan swap yang belum dibayar.', 409, {
        order: serializeSwapOrder(activeOrder)
      });
    }

    const station = await Station.findByPk(stationId, { transaction: dbTx, lock: true });
    if (!station) {
      await dbTx.rollback();
      return sendError(res, 'Station not found', 404);
    }
    if (station.status !== 'active') {
      await dbTx.rollback();
      return sendError(res, 'Station is currently offline or in maintenance', 400);
    }

    const slots = cloneSlots(station.slots);
    const slotIndex = slots.findIndex((slot) => parseInt(slot.slotId, 10) === parseInt(slotId, 10));
    if (slotIndex === -1) {
      await dbTx.rollback();
      return sendError(res, 'Invalid slot ID for this station', 400);
    }

    const targetSlot = slots[slotIndex];
    if (targetSlot.status !== 'ready' || !targetSlot.batteryId) {
      await dbTx.rollback();
      return sendError(res, 'Selected slot battery is not ready or already reserved', 400);
    }

    const fullBattery = await Battery.findByPk(targetSlot.batteryId, { transaction: dbTx, lock: true });
    if (!fullBattery || fullBattery.status !== 'ready') {
      await dbTx.rollback();
      return sendError(res, 'Selected full battery is not ready', 400);
    }

    const emptyBattery = await Battery.findByPk(emptyBatteryId, { transaction: dbTx, lock: true });
    if (!emptyBattery) {
      await dbTx.rollback();
      return sendError(res, `Depleted battery ID ${emptyBatteryId} is not registered`, 404);
    }
    if (emptyBattery.currentUserId && emptyBattery.currentUserId !== user.id) {
      await dbTx.rollback();
      return sendError(res, 'Depleted battery is registered to another user', 403);
    }

    const transactionId = generateSwapOrderId(user.id);
    const payment = await pakasirService.createQrisTransaction({ orderId: transactionId, amount: SWAP_COST });
    const qrImage = await QRCode.toDataURL(payment.payment_number, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const newTransaction = await Transaction.create({
      transactionId,
      userId: user.id,
      userName: user.name,
      stationId: station.id,
      stationName: station.name,
      slotId: parseInt(slotId, 10),
      emptyBatteryId,
      fullBatteryId: fullBattery.id,
      cost: payment.amount || SWAP_COST,
      fee: payment.fee || 0,
      totalPayment: payment.total_payment || payment.amount || SWAP_COST,
      paymentMethod: payment.payment_method || 'qris',
      paymentNumber: payment.payment_number,
      expiredAt: payment.expired_at ? new Date(payment.expired_at) : null,
      status: 'pending',
      timestamp: new Date()
    }, { transaction: dbTx });

    slots[slotIndex] = {
      ...targetSlot,
      status: 'reserved',
      reservedBy: user.id,
      reservedTransactionId: transactionId,
      reservedAt: new Date().toISOString()
    };
    station.slots = slots;
    await station.save({ transaction: dbTx });

    await dbTx.commit();

    return sendSuccess(res, 'Swap order created. Please complete QRIS payment.', serializeSwapOrder(newTransaction, {
      qrString: payment.payment_number,
      qrImage,
      checkoutUrl: pakasirService.buildCheckoutUrl({ orderId: transactionId, amount: SWAP_COST })
    }), 201);
  } catch (error) {
    await dbTx.rollback();
    next(error);
  }
};

const getSwapOrderStatus = async (req, res, next) => {
  try {
    const order = await Transaction.findOne({
      where: {
        transactionId: req.params.transactionId,
        userId: req.user.id
      }
    });

    if (!order) {
      return sendError(res, 'Swap order not found', 404);
    }

    if (order.status === 'pending') {
      const remoteTransaction = await pakasirService.getTransactionDetail({
        orderId: order.transactionId,
        amount: order.cost
      });

      if (remoteTransaction?.status === 'completed') {
        const result = await completePaidSwapOrder({
          transactionId: order.transactionId,
          completedAt: remoteTransaction.completed_at
        });
        await result.transaction.reload();
        return sendSuccess(res, 'Swap payment completed and battery released', serializeSwapOrder(result.transaction, {
          remoteStatus: remoteTransaction.status,
          released: true
        }));
      }

      if (order.expiredAt && new Date(order.expiredAt).getTime() <= Date.now()) {
        const dbTx = await sequelize.transaction();
        try {
          const lockedOrder = await Transaction.findByPk(order.transactionId, { transaction: dbTx, lock: true });
          if (lockedOrder && lockedOrder.status === 'pending') {
            lockedOrder.status = 'failed';
            await lockedOrder.save({ transaction: dbTx });
            await releaseReservedSlot(lockedOrder, dbTx);
          }
          await dbTx.commit();
          await order.reload();
        } catch (error) {
          await dbTx.rollback();
          throw error;
        }
      }
    }

    return sendSuccess(res, 'Swap order status retrieved successfully', await serializeSwapOrderWithPaymentQr(order));
  } catch (error) {
    next(error);
  }
};

const getMyActiveSwapOrder = async (req, res, next) => {
  try {
    const order = await Transaction.findOne({
      where: { userId: req.user.id, status: 'pending' },
      order: [['createdAt', 'DESC']]
    });

    return sendSuccess(res, order ? 'Active swap order found' : 'No active swap order', order ? await serializeSwapOrderWithPaymentQr(order) : null);
  } catch (error) {
    next(error);
  }
};

const simulateSwapPayment = async (req, res, next) => {
  try {
    if (config.env !== 'development') {
      return sendError(res, 'Payment simulation is only available in development mode', 403);
    }

    const order = await Transaction.findOne({
      where: {
        transactionId: req.params.transactionId,
        userId: req.user.id,
        status: 'pending'
      }
    });

    if (!order) {
      return sendError(res, 'Pending swap order not found', 404);
    }

    await pakasirService.simulatePayment({ orderId: order.transactionId, amount: order.cost });
    const result = await completePaidSwapOrder({ transactionId: order.transactionId });
    await result.transaction.reload();

    return sendSuccess(res, 'Sandbox payment simulated. Battery released.', serializeSwapOrder(result.transaction, {
      released: true
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy direct swap retained for fallback/demo.
 */
const swapBattery = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { stationId, slotId, emptyBatteryId } = req.body;
    const userId = req.user.id;

    if (!stationId || !slotId || !emptyBatteryId) {
      await t.rollback();
      return sendError(res, 'Station ID, Slot ID, and empty Battery ID are required', 400);
    }

    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return sendError(res, 'User not found', 404);
    }


    const station = await Station.findByPk(stationId, { transaction: t });
    if (!station) {
      await t.rollback();
      return sendError(res, 'Station not found', 404);
    }
    if (station.status !== 'active') {
      await t.rollback();
      return sendError(res, 'Station is currently offline or in maintenance', 400);
    }

    const slots = cloneSlots(station.slots);
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
    const emptyBattery = await Battery.findByPk(emptyBatteryId, { transaction: t });
    const fullBattery = await Battery.findByPk(fullBatteryId, { transaction: t });
    if (!emptyBattery || !fullBattery) {
      await t.rollback();
      return sendError(res, 'Battery data not found', 404);
    }


    emptyBattery.currentUserId = null;
    emptyBattery.currentStationId = stationId;
    emptyBattery.chargeLevel = 10;
    emptyBattery.status = 'charging';
    await emptyBattery.save({ transaction: t });

    fullBattery.currentUserId = userId;
    fullBattery.currentStationId = null;
    fullBattery.status = 'in-use';
    await fullBattery.save({ transaction: t });

    slots[slotIndex] = {
      slotId: targetSlot.slotId,
      batteryId: emptyBatteryId,
      status: 'charging',
      chargeLevel: 10
    };
    station.slots = slots;
    await station.save({ transaction: t });

    const transactionId = `TXN-${Date.now()}`;
    const newTransaction = await Transaction.create({
      transactionId,
      userId: user.id,
      userName: user.name,
      stationId: station.id,
      stationName: station.name,
      slotId: parseInt(slotId, 10),
      emptyBatteryId,
      fullBatteryId,
      cost: SWAP_COST,
      totalPayment: SWAP_COST,
      status: 'completed',
      timestamp: new Date()
    }, { transaction: t });

    await t.commit();

    return sendSuccess(res, 'Battery swapping transaction successful!', {
      transaction: newTransaction
    }, 200);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};


const handlePakasirWebhook = async (req, res, next) => {
  try {
    const { amount, order_id: orderId, project, status, completed_at: completedAt } = req.body;

    if (!orderId || !amount || !project || !status) {
      return sendError(res, 'Invalid Pakasir webhook payload', 400);
    }

    if (project !== config.pakasir.project) {
      return sendError(res, 'Invalid Pakasir project', 400);
    }

    const swapOrder = await Transaction.findByPk(orderId);
    if (!swapOrder) {
      return sendError(res, 'Swap order not found', 404);
    }

    if (parseInt(amount, 10) !== swapOrder.cost) {
      return sendError(res, 'Webhook amount does not match local swap order amount', 400);
    }

    if (status !== 'completed') {
      if (['failed', 'cancelled', 'expired'].includes(status) && swapOrder.status === 'pending') {
        swapOrder.status = 'failed';
        await swapOrder.save();
        await releaseReservedSlot(swapOrder);
      }

      return sendSuccess(res, 'Swap webhook received but payment is not completed', {
        transactionId: swapOrder.transactionId,
        status: swapOrder.status
      });
    }

    if (config.pakasir.webhookVerify) {
      const remoteTransaction = await pakasirService.getTransactionDetail({
        orderId: swapOrder.transactionId,
        amount: swapOrder.cost
      });

      if (remoteTransaction?.status !== 'completed') {
        return sendError(res, 'Pakasir swap transaction detail is not completed yet', 409);
      }
    }

    const result = await completePaidSwapOrder({
      transactionId: swapOrder.transactionId,
      completedAt
    });

    return sendSuccess(res, result.completed ? 'Swap payment completed and battery released' : 'Swap payment was already completed', {
      transactionId: result.transaction.transactionId,
      status: result.transaction.status,
      released: true
    });
  } catch (error) {
    next(error);
  }
};

const getMyHistory = async (req, res, next) => {
  try {
    const history = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['timestamp', 'DESC']]
    });
    return sendSuccess(res, 'User swap history retrieved successfully', history.map((item) => serializeSwapOrder(item)));
  } catch (error) {
    next(error);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['timestamp', 'DESC']]
    });
    return sendSuccess(res, 'All system transactions retrieved successfully', transactions.map((item) => serializeSwapOrder(item)));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSwapOrder,
  getSwapOrderStatus,
  getMyActiveSwapOrder,
  simulateSwapPayment,
  completePaidSwapOrder,
  releaseReservedSlot,
  handlePakasirWebhook,
  swapBattery,
  getMyHistory,
  getAllTransactions
};
