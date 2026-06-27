const { sequelize } = require('../config/db');
const Battery = require('../models/battery.model');
const Station = require('../models/station.model');
const { sendSuccess, sendError } = require('../utils/response');
const {
  placeBatteryInStationSlot,
  removeBatteryFromStationSlots
} = require('../services/slot.service');

const VALID_STATUSES = ['ready', 'charging', 'in-use', 'faulty', 'idle'];

const normalizeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const serializeBattery = (battery) => {
  const value = typeof battery.toJSON === 'function' ? battery.toJSON() : battery;
  return {
    ...value,
    displayName: value.name || value.id,
    slotId: value.slotId || null,
    latitude: value.latitude === null || value.latitude === undefined ? null : Number(value.latitude),
    longitude: value.longitude === null || value.longitude === undefined ? null : Number(value.longitude)
  };
};

const syncStationCoordinatesFromBatteries = async (stationId) => {
  if (!stationId) return null;

  const station = await Station.findByPk(stationId);
  if (!station) return null;

  const batteryPoints = await Battery.findAll({
    where: { currentStationId: stationId },
    attributes: ['latitude', 'longitude']
  });

  const validPoints = batteryPoints
    .map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude) }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

  if (validPoints.length === 0) return station;

  const avgLatitude = validPoints.reduce((sum, point) => sum + point.latitude, 0) / validPoints.length;
  const avgLongitude = validPoints.reduce((sum, point) => sum + point.longitude, 0) / validPoints.length;

  station.latitude = Number(avgLatitude.toFixed(8));
  station.longitude = Number(avgLongitude.toFixed(8));
  await station.save();

  return station;
};

const getAllBatteries = async (req, res, next) => {
  try {
    const batteries = await Battery.findAll({ order: [['createdAt', 'DESC']] });
    return sendSuccess(res, 'Batteries list retrieved successfully', batteries.map(serializeBattery));
  } catch (error) {
    next(error);
  }
};

const getBatteryDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const battery = await Battery.findByPk(id);

    if (!battery) return sendError(res, 'Battery not found', 404);

    return sendSuccess(res, 'Battery details retrieved', serializeBattery(battery));
  } catch (error) {
    next(error);
  }
};

const createBattery = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      id,
      name,
      type,
      chargeLevel,
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
      return sendError(res, 'Battery ID and type are required', 400);
    }

    const exists = await Battery.findByPk(id, { transaction: t });
    if (exists) {
      await t.rollback();
      return sendError(res, `Battery ID ${id} is already registered`, 400);
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
      chargeLevel: parseInt(chargeLevel, 10) || 100,
      stateOfHealth: parseInt(stateOfHealth, 10) || 100,
      powerWatt: parseInt(powerWatt, 10) || 0,
      pricePerKwh: parseInt(pricePerKwh, 10) || 0,
      slotId: slotId ? parseInt(slotId, 10) : null,
      latitude: normalizeNumber(latitude, station?.latitude || null),
      longitude: normalizeNumber(longitude, station?.longitude || null),
      locationNote: locationNote || null,
      currentStationId: null,
      currentUserId: null,
      status: parsedStatus
    }, { transaction: t });

    const placement = await placeBatteryInStationSlot({
      battery: newBattery,
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
    await syncStationCoordinatesFromBatteries(selectedStationId);
    await newBattery.reload();

    return sendSuccess(res, 'Battery registered successfully', serializeBattery(newBattery), 201);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updateBattery = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      name,
      type,
      chargeLevel,
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
      return sendError(res, 'Battery not found', 404);
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
    if (chargeLevel !== undefined) battery.chargeLevel = parseInt(chargeLevel, 10) || battery.chargeLevel;
    if (stateOfHealth !== undefined) battery.stateOfHealth = parseInt(stateOfHealth, 10) || battery.stateOfHealth;
    if (powerWatt !== undefined) battery.powerWatt = parseInt(powerWatt, 10) || 0;
    if (pricePerKwh !== undefined) battery.pricePerKwh = parseInt(pricePerKwh, 10) || 0;
    if (latitude !== undefined) battery.latitude = normalizeNumber(latitude, battery.latitude);
    if (longitude !== undefined) battery.longitude = normalizeNumber(longitude, battery.longitude);
    if (locationNote !== undefined) battery.locationNote = locationNote || null;
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        await t.rollback();
        return sendError(res, 'Invalid battery status', 400);
      }
      battery.status = status;
      if (status !== 'in-use') battery.currentUserId = null;
    }

    const placement = await placeBatteryInStationSlot({
      battery,
      stationId: finalStationId,
      slotId: slotId !== undefined ? slotId : battery.slotId,
      status: battery.status,
      transaction: t
    });

    if (placement.error) {
      await t.rollback();
      return sendError(res, placement.error, placement.statusCode || 400);
    }

    await t.commit();
    await syncStationCoordinatesFromBatteries(previousStationId);
    await syncStationCoordinatesFromBatteries(finalStationId);
    await battery.reload();

    return sendSuccess(res, 'Battery updated successfully', serializeBattery(battery));
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const deleteBattery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const battery = await Battery.findByPk(id);
    if (!battery) return sendError(res, 'Battery not found', 404);

    const previousStationId = battery.currentStationId;
    await removeBatteryFromStationSlots(battery.id);
    await battery.destroy();
    await syncStationCoordinatesFromBatteries(previousStationId);

    return sendSuccess(res, 'Battery deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBatteries,
  getBatteryDetail,
  createBattery,
  updateBattery,
  deleteBattery
};
