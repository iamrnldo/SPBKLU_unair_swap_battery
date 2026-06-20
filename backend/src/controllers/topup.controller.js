const QRCode = require('qrcode');
const { sequelize } = require('../config/db');
const config = require('../config/config');
const User = require('../models/user.model');
const TopUpTransaction = require('../models/topup.model');
const { sendSuccess, sendError } = require('../utils/response');
const pakasirService = require('../services/pakasir.service');

const normalizeAmount = (value) => {
  const amount = parseInt(value, 10);
  return Number.isFinite(amount) ? amount : 0;
};

const validateTopUpAmount = (amount) => {
  if (!amount || amount < config.pakasir.topupMinAmount) {
    return `Minimum top-up adalah IDR ${config.pakasir.topupMinAmount.toLocaleString('id-ID')}`;
  }

  if (amount > config.pakasir.topupMaxAmount) {
    return `Maksimum top-up adalah IDR ${config.pakasir.topupMaxAmount.toLocaleString('id-ID')}`;
  }

  if (config.pakasir.topupStepAmount > 1 && amount % config.pakasir.topupStepAmount !== 0) {
    return `Nominal top-up harus kelipatan IDR ${config.pakasir.topupStepAmount.toLocaleString('id-ID')}`;
  }

  return null;
};

const generateOrderId = (userId) => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TOPUP-${userId}-${Date.now()}-${random}`;
};

const getClientBaseUrl = (req) => {
  const configured = process.env.USER_APP_URL || process.env.FRONTEND_URL;
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/$/, '');
  }

  const origin = req.headers.origin;
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/$/, '');
  }

  return null;
};

const serializeTopUp = (topup, extra = {}) => {
  const value = typeof topup.toJSON === 'function' ? topup.toJSON() : topup;

  return {
    orderId: value.orderId,
    amount: value.amount,
    fee: value.fee,
    totalPayment: value.totalPayment,
    paymentMethod: value.paymentMethod,
    status: value.status,
    expiredAt: value.expiredAt,
    completedAt: value.completedAt,
    cancelledAt: value.cancelledAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    checkoutUrl: pakasirService.buildCheckoutUrl({ orderId: value.orderId, amount: value.amount }),
    ...extra
  };
};

const creditCompletedTopUp = async ({ orderId, completedAt = null }) => {
  const dbTx = await sequelize.transaction();

  try {
    const lockedTopUp = await TopUpTransaction.findByPk(orderId, {
      transaction: dbTx,
      lock: true
    });

    if (!lockedTopUp) {
      await dbTx.rollback();
      return { topup: null, credited: false, user: null };
    }

    const user = await User.findByPk(lockedTopUp.userId, {
      transaction: dbTx,
      lock: true
    });

    if (!user) {
      await dbTx.rollback();
      throw new Error('User for top-up order not found');
    }

    if (lockedTopUp.status === 'completed') {
      await dbTx.commit();
      return { topup: lockedTopUp, credited: false, user };
    }

    user.balance += lockedTopUp.amount;
    lockedTopUp.status = 'completed';
    lockedTopUp.completedAt = completedAt ? new Date(completedAt) : new Date();

    await user.save({ transaction: dbTx });
    await lockedTopUp.save({ transaction: dbTx });
    await dbTx.commit();

    return { topup: lockedTopUp, credited: true, user };
  } catch (error) {
    await dbTx.rollback();
    throw error;
  }
};

const markExpiredIfNeeded = async (topup) => {
  if (!topup || topup.status !== 'pending' || !topup.expiredAt) {
    return topup;
  }

  if (new Date(topup.expiredAt).getTime() <= Date.now()) {
    topup.status = 'expired';
    await topup.save();
  }

  return topup;
};

const syncTopUpWithPakasir = async (topup) => {
  if (!topup || topup.status !== 'pending') {
    return { topup, remoteTransaction: null, credited: false, user: null };
  }

  const remoteTransaction = await pakasirService.getTransactionDetail({
    orderId: topup.orderId,
    amount: topup.amount
  });

  if (remoteTransaction?.status === 'completed') {
    const result = await creditCompletedTopUp({
      orderId: topup.orderId,
      completedAt: remoteTransaction.completed_at
    });
    return { ...result, remoteTransaction };
  }

  await markExpiredIfNeeded(topup);
  return { topup, remoteTransaction, credited: false, user: null };
};

/**
 * POST /api/users/topup
 * Create a Pakasir QRIS top-up payment for the logged-in user.
 */
const createTopUp = async (req, res, next) => {
  try {
    const amount = normalizeAmount(req.body.amount);
    const amountError = validateTopUpAmount(amount);

    if (amountError) {
      return sendError(res, amountError, 400);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const orderId = generateOrderId(user.id);
    const payment = await pakasirService.createQrisTransaction({ orderId, amount });
    const qrImage = await QRCode.toDataURL(payment.payment_number, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const topup = await TopUpTransaction.create({
      orderId,
      userId: user.id,
      amount: payment.amount || amount,
      fee: payment.fee || 0,
      totalPayment: payment.total_payment || payment.amount || amount,
      paymentMethod: payment.payment_method || 'qris',
      paymentNumber: payment.payment_number,
      status: 'pending',
      expiredAt: payment.expired_at ? new Date(payment.expired_at) : null
    });

    const redirectBase = getClientBaseUrl(req);

    return sendSuccess(res, 'QRIS top-up payment created successfully', serializeTopUp(topup, {
      qrString: topup.paymentNumber,
      qrImage,
      checkoutUrl: pakasirService.buildCheckoutUrl({
        orderId: topup.orderId,
        amount: topup.amount,
        redirectUrl: redirectBase ? `${redirectBase}/profile` : null
      })
    }), 201);
  } catch (error) {
    if (error.message?.includes('PAKASIR_')) {
      return sendError(res, `Konfigurasi Pakasir belum lengkap: ${error.message}`, 500);
    }
    next(error);
  }
};

/**
 * GET /api/users/topup/:orderId
 * Check the local and remote Pakasir status of a top-up payment.
 */
const getTopUpStatus = async (req, res, next) => {
  try {
    const topup = await TopUpTransaction.findOne({
      where: {
        orderId: req.params.orderId,
        userId: req.user.id
      }
    });

    if (!topup) {
      return sendError(res, 'Top-up order not found', 404);
    }

    const result = await syncTopUpWithPakasir(topup);
    const latestTopUp = result.topup || topup;

    return sendSuccess(res, 'Top-up status retrieved successfully', serializeTopUp(latestTopUp, {
      credited: result.credited,
      newBalance: result.user?.balance,
      remoteStatus: result.remoteTransaction?.status || null
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/topups
 * Return current user's top-up history.
 */
const getMyTopUps = async (req, res, next) => {
  try {
    const topups = await TopUpTransaction.findAll({
      where: { userId: req.user.id },
      attributes: {
        exclude: ['paymentNumber']
      },
      order: [['createdAt', 'DESC']]
    });

    return sendSuccess(res, 'Top-up history retrieved successfully', topups.map((topup) => serializeTopUp(topup)));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/topup/:orderId/cancel
 * Cancel a pending Pakasir top-up payment.
 */
const cancelTopUp = async (req, res, next) => {
  try {
    const topup = await TopUpTransaction.findOne({
      where: {
        orderId: req.params.orderId,
        userId: req.user.id
      }
    });

    if (!topup) {
      return sendError(res, 'Top-up order not found', 404);
    }

    if (topup.status !== 'pending') {
      return sendError(res, 'Only pending top-up orders can be cancelled', 400);
    }

    await pakasirService.cancelTransaction({
      orderId: topup.orderId,
      amount: topup.amount
    });

    topup.status = 'cancelled';
    topup.cancelledAt = new Date();
    await topup.save();

    return sendSuccess(res, 'Top-up order cancelled successfully', serializeTopUp(topup));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/topup/:orderId/simulate
 * Development helper to trigger Pakasir sandbox payment simulation.
 */
const simulateTopUpPayment = async (req, res, next) => {
  try {
    if (config.env !== 'development') {
      return sendError(res, 'Payment simulation is only available in development mode', 403);
    }

    const topup = await TopUpTransaction.findOne({
      where: {
        orderId: req.params.orderId,
        userId: req.user.id
      }
    });

    if (!topup) {
      return sendError(res, 'Top-up order not found', 404);
    }

    if (topup.status !== 'pending') {
      return sendError(res, 'Only pending top-up orders can be simulated', 400);
    }

    await pakasirService.simulatePayment({
      orderId: topup.orderId,
      amount: topup.amount
    });

    const result = await syncTopUpWithPakasir(topup);

    return sendSuccess(res, 'Sandbox payment simulation processed', serializeTopUp(result.topup || topup, {
      credited: result.credited,
      newBalance: result.user?.balance,
      remoteStatus: result.remoteTransaction?.status || null
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/pakasir/webhook
 * Public Pakasir webhook endpoint. Pakasir sends here when payment completes.
 */
const handlePakasirWebhook = async (req, res, next) => {
  try {
    const { amount, order_id: orderId, project, status, completed_at: completedAt } = req.body;

    if (!orderId || !amount || !project || !status) {
      return sendError(res, 'Invalid Pakasir webhook payload', 400);
    }

    if (project !== config.pakasir.project) {
      return sendError(res, 'Invalid Pakasir project', 400);
    }

    const topup = await TopUpTransaction.findByPk(orderId);
    if (!topup) {
      return sendError(res, 'Top-up order not found', 404);
    }

    if (parseInt(amount, 10) !== topup.amount) {
      return sendError(res, 'Webhook amount does not match local top-up amount', 400);
    }

    if (status !== 'completed') {
      if (['failed', 'cancelled', 'expired'].includes(status) && topup.status === 'pending') {
        topup.status = status;
        await topup.save();
      }
      return sendSuccess(res, 'Webhook received but payment is not completed', serializeTopUp(topup));
    }

    if (config.pakasir.webhookVerify) {
      const remoteTransaction = await pakasirService.getTransactionDetail({
        orderId: topup.orderId,
        amount: topup.amount
      });

      if (remoteTransaction?.status !== 'completed') {
        return sendError(res, 'Pakasir transaction detail is not completed yet', 409);
      }
    }

    const result = await creditCompletedTopUp({
      orderId: topup.orderId,
      completedAt
    });

    return sendSuccess(res, result.credited ? 'Top-up completed and balance credited' : 'Top-up was already credited', {
      orderId: result.topup.orderId,
      status: result.topup.status,
      credited: result.credited
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTopUp,
  getTopUpStatus,
  getMyTopUps,
  cancelTopUp,
  simulateTopUpPayment,
  handlePakasirWebhook
};
