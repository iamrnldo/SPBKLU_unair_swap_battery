const { sequelize } = require('../config/db');
const config = require('../config/config');
const User = require('../models/user.model');
const Battery = require('../models/battery.model');
const Station = require('../models/station.model');
const ChargingSession = require('../models/charging.model');
const { sendSuccess, sendError } = require('../utils/response');
const { updateCableSlotStatus } = require('../services/slot.service');

const ACTIVE_CABLE_STATUSES = ['ready', 'idle'];

const parseInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseQrPayload = (body = {}) => {
  if (body.payload && typeof body.payload === 'object') {
    return body.payload;
  }

  if (body.qrString && typeof body.qrString === 'string') {
    const trimmed = body.qrString.trim();

    try {
      return JSON.parse(trimmed);
    } catch (error) {
      // Fallback for future QR formats: spbklu://charge?cableId=...&token=...
      try {
        const url = new URL(trimmed);
        return {
          type: 'SPBKLU_CHARGER_POINT',
          cableId: url.searchParams.get('cableId') || url.searchParams.get('cable_id'),
          token: url.searchParams.get('token')
        };
      } catch (_) {
        return null;
      }
    }
  }

  if (body.cableId && body.token) {
    return {
      type: 'SPBKLU_CHARGER_POINT',
      cableId: body.cableId,
      token: body.token
    };
  }

  return null;
};

const loadCableWithStation = async (cableId, transaction = null) => {
  const cable = await Battery.findByPk(cableId, transaction ? { transaction, lock: true } : undefined);
  if (!cable) return { cable: null, station: null };

  const station = cable.currentStationId
    ? await Station.findByPk(cable.currentStationId, transaction ? { transaction } : undefined)
    : null;

  return { cable, station };
};

const validateCablePayload = async (payload, transaction = null) => {
  if (!payload || payload.type !== 'SPBKLU_CHARGER_POINT' || !payload.cableId || !payload.token) {
    return { error: 'QR Code tidak valid untuk SPBKLU charging point', statusCode: 400 };
  }

  const { cable, station } = await loadCableWithStation(payload.cableId, transaction);
  if (!cable) {
    return { error: 'Kabel charger dari QR tidak ditemukan', statusCode: 404 };
  }

  if (!cable.qrToken || payload.token !== cable.qrToken) {
    return { error: 'Token QR Code sudah tidak valid. Silakan scan QR terbaru di unit SPBKLU.', statusCode: 400 };
  }

  if (cable.status === 'faulty') {
    return { error: 'Kabel charger sedang bermasalah dan tidak dapat digunakan', statusCode: 400 };
  }

  if (!ACTIVE_CABLE_STATUSES.includes(cable.status)) {
    return { error: `Kabel charger sedang ${cable.status} dan belum tersedia`, statusCode: 409 };
  }

  if (station && station.status !== 'active') {
    return { error: 'Stasiun SPBKLU sedang tidak aktif atau maintenance', statusCode: 400 };
  }

  return { cable, station };
};

const serializeCable = (cable, station = null) => {
  if (!cable) return null;
  const value = typeof cable.toJSON === 'function' ? cable.toJSON() : cable;

  return {
    id: value.id,
    name: value.name || value.id,
    type: value.type,
    status: value.status,
    powerWatt: value.powerWatt || 2200,
    pricePerKwh: value.pricePerKwh || config.charging.defaultPricePerKwh,
    latitude: value.latitude === null || value.latitude === undefined ? null : Number(value.latitude),
    longitude: value.longitude === null || value.longitude === undefined ? null : Number(value.longitude),
    locationNote: value.locationNote || null,
    stationId: value.currentStationId || null,
    stationName: station?.name || null,
    stationAddress: station?.address || null
  };
};

const serializeSession = (session) => {
  const value = typeof session.toJSON === 'function' ? session.toJSON() : session;
  return {
    sessionId: value.sessionId,
    userId: value.userId,
    userName: value.userName,
    cableId: value.cableId,
    cableName: value.cableName,
    stationId: value.stationId,
    stationName: value.stationName,
    amount: value.amount,
    requestedWatt: value.requestedWatt,
    estimatedKwh: Number(value.estimatedKwh || 0),
    pricePerKwh: value.pricePerKwh,
    status: value.status,
    startedAt: value.startedAt,
    completedAt: value.completedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const calculateChargingRequest = ({ amount, requestedWatt, pricePerKwh }) => {
  let parsedAmount = parseInteger(amount);
  let parsedWatt = parseInteger(requestedWatt);

  if (!parsedAmount && !parsedWatt) {
    return { error: 'Masukkan nominal Rupiah atau target watt pengisian' };
  }

  if (parsedWatt > 0 && parsedAmount <= 0) {
    parsedAmount = Math.ceil((parsedWatt / 1000) * pricePerKwh);
  }

  if (parsedAmount > 0 && parsedWatt <= 0) {
    parsedWatt = Math.floor((parsedAmount / pricePerKwh) * 1000);
  }

  if (parsedAmount < config.charging.minAmount) {
    return { error: `Minimum transaksi charging adalah IDR ${config.charging.minAmount.toLocaleString('id-ID')}` };
  }

  if (config.charging.amountStep > 1 && parsedAmount % config.charging.amountStep !== 0) {
    return { error: `Nominal charging harus kelipatan IDR ${config.charging.amountStep.toLocaleString('id-ID')}` };
  }

  return {
    amount: parsedAmount,
    requestedWatt: parsedWatt,
    estimatedKwh: Number((parsedWatt / 1000).toFixed(3))
  };
};

const generateSessionId = (userId) => {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CHG-${userId}-${Date.now()}-${random}`;
};

/**
 * GET /api/charging/active
 * Restore the currently active charging session after the mobile app is
 * minimized, killed, or reopened.
 */
const getActiveChargingSession = async (req, res, next) => {
  try {
    const session = await ChargingSession.findOne({
      where: {
        userId: req.user.id,
        status: 'charging'
      },
      order: [['startedAt', 'DESC']]
    });

    if (!session) {
      return sendSuccess(res, 'No active charging session', null);
    }

    const user = await User.findByPk(req.user.id);
    const cable = await Battery.findByPk(session.cableId);
    const station = cable?.currentStationId
      ? await Station.findByPk(cable.currentStationId)
      : (session.stationId ? await Station.findByPk(session.stationId) : null);

    return sendSuccess(res, 'Active charging session retrieved successfully', {
      session: serializeSession(session),
      cable: serializeCable(cable, station),
      remainingBalance: user?.balance || 0,
      restored: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/charging/scan
 * Validate an admin-generated charging cable QR and return cable/pricing details.
 */
const validateChargingQr = async (req, res, next) => {
  try {
    const payload = parseQrPayload(req.body);
    const result = await validateCablePayload(payload);

    if (result.error) {
      return sendError(res, result.error, result.statusCode || 400);
    }

    return sendSuccess(res, 'QR charging point valid', {
      cable: serializeCable(result.cable, result.station),
      pricing: {
        minAmount: config.charging.minAmount,
        amountStep: config.charging.amountStep,
        pricePerKwh: result.cable.pricePerKwh || config.charging.defaultPricePerKwh
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/charging/start
 * Debit wallet balance and start a charging session after QR validation.
 */
const startCharging = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const payload = parseQrPayload(req.body);
    const result = await validateCablePayload(payload, t);

    if (result.error) {
      await t.rollback();
      return sendError(res, result.error, result.statusCode || 400);
    }

    const user = await User.findByPk(req.user.id, { transaction: t, lock: true });
    if (!user) {
      await t.rollback();
      return sendError(res, 'User not found', 404);
    }

    const existingActiveSession = await ChargingSession.findOne({
      where: {
        userId: user.id,
        status: 'charging'
      },
      transaction: t,
      lock: true
    });

    if (existingActiveSession) {
      await t.rollback();
      return sendError(res, 'Anda masih memiliki sesi charging aktif. Selesaikan sesi tersebut sebelum memulai charging baru.', 409, {
        session: serializeSession(existingActiveSession)
      });
    }

    const cable = result.cable;
    const station = result.station;
    const pricePerKwh = cable.pricePerKwh || config.charging.defaultPricePerKwh;
    const chargingRequest = calculateChargingRequest({
      amount: req.body.amount,
      requestedWatt: req.body.requestedWatt,
      pricePerKwh
    });

    if (chargingRequest.error) {
      await t.rollback();
      return sendError(res, chargingRequest.error, 400);
    }

    if (user.balance < chargingRequest.amount) {
      await t.rollback();
      return sendError(res, `Saldo tidak cukup. Dibutuhkan ${chargingRequest.amount.toLocaleString('id-ID')} rupiah.`, 402);
    }

    user.balance -= chargingRequest.amount;
    await user.save({ transaction: t });

    cable.status = 'charging';
    cable.currentUserId = user.id;
    await cable.save({ transaction: t });
    await updateCableSlotStatus({ cable, status: 'charging', transaction: t });

    const session = await ChargingSession.create({
      sessionId: generateSessionId(user.id),
      userId: user.id,
      userName: user.name,
      cableId: cable.id,
      cableName: cable.name || cable.id,
      stationId: station?.id || cable.currentStationId || null,
      stationName: station?.name || null,
      amount: chargingRequest.amount,
      requestedWatt: chargingRequest.requestedWatt,
      estimatedKwh: chargingRequest.estimatedKwh,
      pricePerKwh,
      qrTokenSnapshot: cable.qrToken,
      status: 'charging',
      startedAt: new Date()
    }, { transaction: t });

    await t.commit();

    return sendSuccess(res, 'Charging session started successfully', {
      session: serializeSession(session),
      cable: serializeCable(cable, station),
      remainingBalance: user.balance
    }, 201);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * POST /api/charging/:sessionId/complete
 * Demo/manual completion endpoint. In real IoT integration this would be called
 * by charging hardware when target watt is reached.
 */
const completeCharging = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const session = await ChargingSession.findOne({
      where: {
        sessionId: req.params.sessionId,
        userId: req.user.id
      },
      transaction: t,
      lock: true
    });

    if (!session) {
      await t.rollback();
      return sendError(res, 'Charging session not found', 404);
    }

    if (session.status === 'completed') {
      await t.commit();
      return sendSuccess(res, 'Charging session already completed', {
        session: serializeSession(session)
      });
    }

    if (session.status !== 'charging') {
      await t.rollback();
      return sendError(res, `Charging session cannot be completed from status ${session.status}`, 400);
    }

    const cable = await Battery.findByPk(session.cableId, { transaction: t, lock: true });
    let station = null;

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save({ transaction: t });

    if (cable) {
      cable.status = 'ready';
      cable.currentUserId = null;
      await cable.save({ transaction: t });
      await updateCableSlotStatus({ cable, status: 'ready', transaction: t });
      station = cable.currentStationId ? await Station.findByPk(cable.currentStationId, { transaction: t }) : null;
    }

    await t.commit();

    return sendSuccess(res, 'Charging session completed successfully', {
      session: serializeSession(session),
      cable: serializeCable(cable, station)
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const getMyChargingHistory = async (req, res, next) => {
  try {
    const sessions = await ChargingSession.findAll({
      where: { userId: req.user.id },
      order: [['startedAt', 'DESC']]
    });

    return sendSuccess(res, 'Charging history retrieved successfully', sessions.map(serializeSession));
  } catch (error) {
    next(error);
  }
};

const getAllChargingSessions = async (req, res, next) => {
  try {
    const sessions = await ChargingSession.findAll({
      order: [['startedAt', 'DESC']]
    });

    return sendSuccess(res, 'All charging sessions retrieved successfully', sessions.map(serializeSession));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveChargingSession,
  validateChargingQr,
  startCharging,
  completeCharging,
  getMyChargingHistory,
  getAllChargingSessions
};
