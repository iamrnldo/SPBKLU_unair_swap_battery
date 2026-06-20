const Station = require('../models/station.model');
const Battery = require('../models/battery.model');
const Transaction = require('../models/transaction.model');
const ChargingSession = require('../models/charging.model');
const { sendSuccess, sendError } = require('../utils/response');

const VALID_STATION_STATUSES = ['active', 'maintenance', 'inactive'];

const normalizeCoordinate = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Get all stations
 */
const getAllStations = async (req, res, next) => {
  try {
    const stations = await Station.findAll({ order: [['createdAt', 'DESC']] });
    return sendSuccess(res, 'Stations retrieved successfully', stations);
  } catch (error) {
    next(error);
  }
};

/**
 * Get station detail by ID
 */
const getStationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const station = await Station.findByPk(id);

    if (!station) {
      return sendError(res, 'Station not found', 404);
    }

    return sendSuccess(res, 'Station detail retrieved successfully', station);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new SPBKLU station (Admin Only)
 */
const createStation = async (req, res, next) => {
  try {
    const { id, name, address, latitude, longitude, slotCount, status } = req.body;

    if (!id || !name || !address) {
      return sendError(res, 'Station ID, name, and address are required', 400);
    }

    const stationExists = await Station.findByPk(id);
    if (stationExists) {
      return sendError(res, `Station with ID ${id} already exists`, 400);
    }

    // Create empty slots structure in JSONB format
    const slots = [];
    const count = parseInt(slotCount, 10) || 4;
    for (let i = 1; i <= count; i++) {
      slots.push({
        slotId: i,
        batteryId: null,
        status: 'empty',
        chargeLevel: 0
      });
    }

    const newStation = await Station.create({
      id,
      name,
      address,
      latitude: normalizeCoordinate(latitude, 0.0),
      longitude: normalizeCoordinate(longitude, 0.0),
      status: VALID_STATION_STATUSES.includes(status) ? status : 'active',
      slots
    });

    return sendSuccess(res, 'Station created successfully', newStation, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a station (Admin Only).
 * Used by admin to edit station profile and change operational status.
 */
const updateStation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, status, slots } = req.body;

    const station = await Station.findByPk(id);
    if (!station) {
      return sendError(res, 'Station not found', 404);
    }

    if (name !== undefined) station.name = name;
    if (address !== undefined) station.address = address;
    if (latitude !== undefined) station.latitude = normalizeCoordinate(latitude, station.latitude);
    if (longitude !== undefined) station.longitude = normalizeCoordinate(longitude, station.longitude);
    if (status !== undefined) {
      if (!VALID_STATION_STATUSES.includes(status)) {
        return sendError(res, 'Invalid station status', 400);
      }
      station.status = status;
    }
    if (Array.isArray(slots)) station.slots = slots;

    await station.save();

    return sendSuccess(res, 'Station updated successfully', station);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a station (Admin Only).
 * Historical legacy swap transactions keep a strict station FK, so stations with
 * legacy history cannot be deleted safely. Use status `inactive` instead.
 */
const deleteStation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const station = await Station.findByPk(id);
    if (!station) {
      return sendError(res, 'Station not found', 404);
    }

    const legacyTransactionCount = await Transaction.count({ where: { stationId: id } });
    if (legacyTransactionCount > 0) {
      return sendError(res, 'Stasiun memiliki riwayat transaksi legacy. Ubah status menjadi inactive jika tidak digunakan.', 409);
    }

    const activeChargingCount = await ChargingSession.count({ where: { stationId: id, status: 'charging' } });
    if (activeChargingCount > 0) {
      return sendError(res, 'Stasiun masih memiliki sesi charging aktif.', 409);
    }

    // Detach registered charging cable points from this station first.
    await Battery.update({ currentStationId: null, status: 'idle' }, { where: { currentStationId: id } });
    await ChargingSession.update({ stationId: null }, { where: { stationId: id } });

    await station.destroy();

    return sendSuccess(res, 'Station deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStations,
  getStationDetail,
  createStation,
  updateStation,
  deleteStation
};
