const Station = require('../models/station.model');

const toInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const cloneSlots = (slots) => (Array.isArray(slots) ? slots.map((slot) => ({ ...slot })) : []);

const emptySlot = (slot) => ({
  slotId: slot.slotId,
  batteryId: null,
  status: 'empty',
  chargeLevel: 0,
  cableName: null,
  connectorType: null,
  powerWatt: null,
  pricePerKwh: null
});

const statusToSlotStatus = (status) => {
  switch (status) {
    case 'ready':
      return 'ready';
    case 'charging':
      return 'charging';
    case 'in-use':
      return 'in-use';
    case 'faulty':
      return 'faulty';
    case 'idle':
      return 'idle';
    default:
      return 'ready';
  }
};

const buildPlacedSlot = (slot, cable, status = null) => ({
  ...slot,
  batteryId: cable.id,
  status: statusToSlotStatus(status || cable.status || 'ready'),
  chargeLevel: cable.chargeLevel || 100,
  cableName: cable.name || cable.id,
  connectorType: cable.type || null,
  powerWatt: cable.powerWatt || null,
  pricePerKwh: cable.pricePerKwh || null
});

const findCableSlotInStation = (station, cableId) => {
  const slots = cloneSlots(station?.slots);
  const index = slots.findIndex((slot) => slot.batteryId === cableId);
  if (index === -1) return { slots, index: -1, slot: null };
  return { slots, index, slot: slots[index] };
};

const removeCableFromStationSlots = async (cableId, options = {}) => {
  if (!cableId) return;

  const stations = await Station.findAll(options.transaction ? { transaction: options.transaction } : undefined);

  for (const station of stations) {
    const slots = cloneSlots(station.slots);
    let changed = false;

    const updatedSlots = slots.map((slot) => {
      if (slot.batteryId === cableId) {
        changed = true;
        return emptySlot(slot);
      }
      return slot;
    });

    if (changed) {
      station.slots = updatedSlots;
      await station.save(options.transaction ? { transaction: options.transaction } : undefined);
    }
  }
};

const getFirstAvailableSlotId = (station, cableId = null) => {
  const slots = cloneSlots(station?.slots);
  const sameCableSlot = slots.find((slot) => cableId && slot.batteryId === cableId);
  if (sameCableSlot) return sameCableSlot.slotId;

  const empty = slots.find((slot) => !slot.batteryId || slot.status === 'empty');
  return empty?.slotId || null;
};

const placeCableInStationSlot = async ({ cable, stationId, slotId = null, status = null, transaction = null }) => {
  if (!cable?.id) {
    return { error: 'Cable data is required', statusCode: 400 };
  }

  await removeCableFromStationSlots(cable.id, { transaction });

  if (!stationId) {
    cable.currentStationId = null;
    cable.slotId = null;
    await cable.save(transaction ? { transaction } : undefined);
    return { station: null, slotId: null };
  }

  const station = await Station.findByPk(stationId, transaction ? { transaction } : undefined);
  if (!station) {
    return { error: `Station ID ${stationId} was not found`, statusCode: 404 };
  }

  const slots = cloneSlots(station.slots);
  if (slots.length === 0) {
    return { error: `Station ${stationId} does not have any slot configured`, statusCode: 400 };
  }

  const desiredSlotId = toInteger(slotId) || getFirstAvailableSlotId(station, cable.id);
  if (!desiredSlotId) {
    return { error: `Tidak ada slot kosong pada stasiun ${stationId}`, statusCode: 409 };
  }

  const slotIndex = slots.findIndex((slot) => parseInt(slot.slotId, 10) === desiredSlotId);
  if (slotIndex === -1) {
    return { error: `Slot ${desiredSlotId} tidak ditemukan pada stasiun ${stationId}`, statusCode: 400 };
  }

  const targetSlot = slots[slotIndex];
  if (targetSlot.batteryId && targetSlot.batteryId !== cable.id) {
    return { error: `Slot ${desiredSlotId} sudah ditempati oleh kabel ${targetSlot.batteryId}`, statusCode: 409 };
  }

  slots[slotIndex] = buildPlacedSlot(targetSlot, cable, status);
  station.slots = slots;
  await station.save(transaction ? { transaction } : undefined);

  cable.currentStationId = stationId;
  cable.slotId = desiredSlotId;
  if (status) cable.status = status;
  await cable.save(transaction ? { transaction } : undefined);

  return { station, slotId: desiredSlotId };
};

const updateCableSlotStatus = async ({ cable, status = null, transaction = null }) => {
  if (!cable?.id || !cable.currentStationId) return null;

  const station = await Station.findByPk(cable.currentStationId, transaction ? { transaction } : undefined);
  if (!station) return null;

  const { slots, index } = findCableSlotInStation(station, cable.id);
  if (index === -1) return null;

  slots[index] = buildPlacedSlot(slots[index], cable, status || cable.status);
  station.slots = slots;
  await station.save(transaction ? { transaction } : undefined);

  return station;
};

module.exports = {
  emptySlot,
  getFirstAvailableSlotId,
  placeCableInStationSlot,
  removeCableFromStationSlots,
  updateCableSlotStatus
};
