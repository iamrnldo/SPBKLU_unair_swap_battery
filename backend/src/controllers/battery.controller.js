const crypto = require('crypto');
const QRCode = require('qrcode');
const Battery = require('../models/battery.model');
const Station = require('../models/station.model');
const ChargingSession = require('../models/charging.model');
const { sequelize } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const {
  placeCableInStationSlot,
  removeCableFromStationSlots,
  updateCableSlotStatus
} = require('../services/slot.service');

const VALID_STATUSES = ['ready', 'charging', 'in-use', 'faulty', 'idle'];

const generateQrToken = () => crypto.randomBytes(18).toString('hex');

const normalizeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const buildQrPayload = (cable) => ({
  v: 1,
  type: 'SPBKLU_CHARGER_POINT',
  cableId: cable.id,
  stationId: cable.currentStationId || null,
  token: cable.qrToken,
  name: cable.name || cable.id
});

const serializeCable = (cable) => {
  const value = typeof cable.toJSON === 'function' ? cable.toJSON() : cable;
  return {
    ...value,
    displayName: value.name || value.id,
    slotId: value.slotId || null,
    latitude: value.latitude === null || value.latitude === undefined ? null : Number(value.latitude),
    longitude: value.longitude === null || value.longitude === undefined ? null : Number(value.longitude),
    powerWatt: value.powerWatt || 2200,
    pricePerKwh: value.pricePerKwh || 2500
  };
};

const syncStationCoordinatesFromCablePoints = async (stationId) => {
  if (!stationId) return null;

  const station = await Station.findByPk(stationId);
  if (!station) return null;

  const cablePoints = await Battery.findAll({
    where: { currentStationId: stationId },
    attributes: ['latitude', 'longitude']
  });

  const validPoints = cablePoints
    .map((point) => ({
      latitude: Number(point.latitude),
      longitude: Number(point.longitude)
    }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

  if (validPoints.length === 0) {
    return station;
  }

  const avgLatitude = validPoints.reduce((sum, point) => sum + point.latitude, 0) / validPoints.length;
  const avgLongitude = validPoints.reduce((sum, point) => sum + point.longitude, 0) / validPoints.length;

  station.latitude = Number(avgLatitude.toFixed(8));
  station.longitude = Number(avgLongitude.toFixed(8));
  await station.save();

  return station;
};

const buildQrResponse = async (battery, message) => {
  if (!battery.qrToken) {
    battery.qrToken = generateQrToken();
    await battery.save();
  }

  const payload = buildQrPayload(battery);
  const qrString = JSON.stringify(payload);
  const qrImage = await QRCode.toDataURL(qrString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  return {
    message,
    data: {
      cable: serializeCable(battery),
      payload,
      qrString,
      qrImage
    }
  };
};

/**
 * Get all registered charging cable points list (Admin Only)
 */
const getAllBatteries = async (req, res, next) => {
  try {
    const batteries = await Battery.findAll({
      order: [['createdAt', 'DESC']]
    });
    return sendSuccess(res, 'Charging cable points list retrieved successfully', batteries.map(serializeCable));
  } catch (error) {
    next(error);
  }
};

/**
 * Get charging cable diagnostics/detail
 */
const getBatteryDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const battery = await Battery.findByPk(id);

    if (!battery) {
      return sendError(res, 'Charging cable point not found', 404);
    }

    return sendSuccess(res, 'Charging cable details retrieved', serializeCable(battery));
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new charging cable / connector point into the ecosystem.
 * This still writes to the legacy `batteries` table for compatibility.
 */
const createBattery = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      id,
      name,
      type,
      stateOfHealth,
      powerWatt,
      pricePerKwh,
      slotId,
      latitude,
      longitude,
      locationNote,
      currentStationId,
      stationId,
      status
    } = req.body;

    if (!id || !type) {
      await t.rollback();
      return sendError(res, 'Cable ID and connector type are required', 400);
    }

    const exists = await Battery.findByPk(id, { transaction: t });
    if (exists) {
      await t.rollback();
      return sendError(res, `Cable ID ${id} is already registered`, 400);
    }

    const selectedStationId = currentStationId || stationId || null;
    let station = null;
    if (selectedStationId) {
      station = await Station.findByPk(selectedStationId, { transaction: t });
      if (!station) {
        await t.rollback();
        return sendError(res, `Station ID ${selectedStationId} was not found`, 404);
      }
    }

    const parsedStatus = VALID_STATUSES.includes(status) ? status : (selectedStationId ? 'ready' : 'idle');

    const newBattery = await Battery.create({
      id,
      name: name || id,
      type,
      chargeLevel: 100,
      stateOfHealth: parseInt(stateOfHealth, 10) || 100,
      powerWatt: parseInt(powerWatt, 10) || 2200,
      pricePerKwh: parseInt(pricePerKwh, 10) || 2500,
      slotId: slotId ? parseInt(slotId, 10) : null,
      latitude: normalizeNumber(latitude, station?.latitude || null),
      longitude: normalizeNumber(longitude, station?.longitude || null),
      locationNote: locationNote || null,
      qrToken: generateQrToken(),
      currentStationId: null,
      currentUserId: null,
      status: parsedStatus
    }, { transaction: t });

    const placement = await placeCableInStationSlot({
      cable: newBattery,
      stationId: selectedStationId,
      slotId,
      status: parsedStatus,
      transaction: t
    });

    if (placement.error) {
      await t.rollback();
      return sendError(res, placement.error, placement.statusCode || 400);
    }

    await t.commit();

    // Station coordinates are derived from Peta QR Charger cable points.
    // If a station has multiple cable points, use their average as station location.
    await syncStationCoordinatesFromCablePoints(selectedStationId);
    await newBattery.reload();

    return sendSuccess(res, 'Charging cable point registered successfully', serializeCable(newBattery), 201);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Update charging cable point metadata/location/status (Admin Only).
 */
const updateBattery = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      name,
      type,
      stateOfHealth,
      powerWatt,
      pricePerKwh,
      slotId,
      latitude,
      longitude,
      locationNote,
      currentStationId,
      stationId,
      status
    } = req.body;

    const battery = await Battery.findByPk(id, { transaction: t, lock: true });
    if (!battery) {
      await t.rollback();
      return sendError(res, 'Charging cable point not found', 404);
    }

    const previousStationId = battery.currentStationId;
    const selectedStationId = currentStationId !== undefined ? currentStationId : stationId;
    const finalStationId = selectedStationId !== undefined ? (selectedStationId || null) : battery.currentStationId;

    if (finalStationId) {
      const station = await Station.findByPk(finalStationId, { transaction: t });
      if (!station) {
        await t.rollback();
        return sendError(res, `Station ID ${finalStationId} was not found`, 404);
      }
    }

    if (name !== undefined) battery.name = name || battery.id;
    if (type !== undefined) battery.type = type;
    if (stateOfHealth !== undefined) battery.stateOfHealth = parseInt(stateOfHealth, 10) || battery.stateOfHealth;
    if (powerWatt !== undefined) battery.powerWatt = parseInt(powerWatt, 10) || battery.powerWatt;
    if (pricePerKwh !== undefined) battery.pricePerKwh = parseInt(pricePerKwh, 10) || battery.pricePerKwh;
    if (latitude !== undefined) battery.latitude = normalizeNumber(latitude, battery.latitude);
    if (longitude !== undefined) battery.longitude = normalizeNumber(longitude, battery.longitude);
    if (locationNote !== undefined) battery.locationNote = locationNote || null;
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        await t.rollback();
        return sendError(res, 'Invalid cable status', 400);
      }
      battery.status = status;
      if (status !== 'charging' && status !== 'in-use') {
        battery.currentUserId = null;
      }
    }

    const finalStatus = battery.status;
    const placement = await placeCableInStationSlot({
      cable: battery,
      stationId: finalStationId,
      slotId: slotId !== undefined ? slotId : battery.slotId,
      status: finalStatus,
      transaction: t
    });

    if (placement.error) {
      await t.rollback();
      return sendError(res, placement.error, placement.statusCode || 400);
    }

    await t.commit();

    // Keep Stasiun SPBKLU coordinates synchronized with Peta QR Charger points.
    await syncStationCoordinatesFromCablePoints(previousStationId);
    await syncStationCoordinatesFromCablePoints(finalStationId);
    await battery.reload();

    return sendSuccess(res, 'Charging cable point updated successfully', serializeCable(battery));
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Delete charging cable point if unused (Admin Only).
 */
const deleteBattery = async (req, res, next) => {
  try {
    const { id } = req.params;

    const battery = await Battery.findByPk(id);
    if (!battery) {
      return sendError(res, 'Charging cable point not found', 404);
    }

    const activeSessionCount = await ChargingSession.count({
      where: { cableId: id, status: 'charging' }
    });
    if (activeSessionCount > 0) {
      return sendError(res, 'Kabel charger masih memiliki sesi charging aktif.', 409);
    }

    const historyCount = await ChargingSession.count({ where: { cableId: id } });
    if (historyCount > 0) {
      return sendError(res, 'Kabel charger memiliki riwayat charging. Ubah status menjadi faulty/idle jika tidak digunakan.', 409);
    }

    const previousStationId = battery.currentStationId;
    await removeCableFromStationSlots(battery.id);
    await battery.destroy();
    await syncStationCoordinatesFromCablePoints(previousStationId);

    return sendSuccess(res, 'Charging cable point deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate QR code for a registered charging cable point.
 * The QR payload is JSON so the Android app can parse it after scanning.
 */
const getBatteryQr = async (req, res, next) => {
  try {
    const { id } = req.params;
    const battery = await Battery.findByPk(id);

    if (!battery) {
      return sendError(res, 'Charging cable point not found', 404);
    }

    const qr = await buildQrResponse(battery, 'Charging cable QR code generated successfully');
    return sendSuccess(res, qr.message, qr.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Rotate QR token when an old printed QR needs to be invalidated.
 */
const regenerateBatteryQr = async (req, res, next) => {
  try {
    const { id } = req.params;
    const battery = await Battery.findByPk(id);

    if (!battery) {
      return sendError(res, 'Charging cable point not found', 404);
    }

    battery.qrToken = generateQrToken();
    await battery.save();

    const qr = await buildQrResponse(battery, 'Charging cable QR token regenerated successfully');
    return sendSuccess(res, qr.message, qr.data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBatteries,
  getBatteryDetail,
  createBattery,
  updateBattery,
  deleteBattery,
  getBatteryQr,
  regenerateBatteryQr
};
