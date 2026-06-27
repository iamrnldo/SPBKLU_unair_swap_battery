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
  batteryName: null,
  batteryType: null
});

const statusToSlotStatus = (status) => {
  switch (status) {
    case 'ready': return 'ready';
    case 'charging': return 'charging';
    case 'in-use': return 'in-use';
    case 'faulty': return 'faulty';
    case 'idle': return 'idle';
    default: return 'ready';
  }
};

const buildPlacedSlot = (slot, battery, status = null) => ({
  ...slot,
  batteryId: battery.id,
  status: statusToSlotStatus(status || battery.status || 'ready'),
  chargeLevel: battery.chargeLevel || 100,
  batteryName: battery.name || battery.id,
  batteryType: battery.type || null
});

const findBatterySlotInStation = (station, batteryId) => {
  const slots = cloneSlots(station?.slots);
  const index = slots.findIndex((slot) => slot.batteryId === batteryId);
  if (index === -1) return { slots, index: -1, slot: null };
  return { slots, index, slot: slots[index] };
};

const removeBatteryFromStationSlots = async (batteryId, options = {}) => {
  if (!batteryId) return;

  const stations = await Station.findAll(options.transaction ? { transaction: options.transaction } : undefined);

  for (const station of stations) {
    const slots = cloneSlots(station.slots);
    let changed = false;

    const updatedSlots = slots.map((slot) => {
      if (slot.batteryId === batteryId) {
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

const getFirstAvailableSlotId = (station, batteryId = null) => {
  const slots = cloneSlots(station?.slots);
  const sameBatterySlot = slots.find((slot) => batteryId && slot.batteryId === batteryId);
  if (sameBatterySlot) return sameBatterySlot.slotId;

  const empty = slots.find((slot) => !slot.batteryId || slot.status === 'empty');
  return empty?.slotId || null;
};

const placeBatteryInStationSlot = async ({ battery, stationId, slotId = null, status = null, transaction = null }) => {
  if (!battery?.id) {
    return { error: 'Battery data is required', statusCode: 400 };
  }

  await removeBatteryFromStationSlots(battery.id, { transaction });

  if (!stationId) {
    battery.currentStationId = null;
    battery.slotId = null;
    await battery.save(transaction ? { transaction } : undefined);
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

  const desiredSlotId = toInteger(slotId) || getFirstAvailableSlotId(station, battery.id);
  if (!desiredSlotId) {
    return { error: `Tidak ada slot kosong pada stasiun ${stationId}`, statusCode: 409 };
  }

  const slotIndex = slots.findIndex((slot) => parseInt(slot.slotId, 10) === desiredSlotId);
  if (slotIndex === -1) {
    return { error: `Slot ${desiredSlotId} tidak ditemukan pada stasiun ${stationId}`, statusCode: 400 };
  }

  const targetSlot = slots[slotIndex];
  if (targetSlot.batteryId && targetSlot.batteryId !== battery.id) {
    return { error: `Slot ${desiredSlotId} sudah ditempati oleh baterai ${targetSlot.batteryId}`, statusCode: 409 };
  }

  slots[slotIndex] = buildPlacedSlot(targetSlot, battery, status);
  station.slots = slots;
  await station.save(transaction ? { transaction } : undefined);

  battery.currentStationId = stationId;
  battery.slotId = desiredSlotId;
  if (status) battery.status = status;
  await battery.save(transaction ? { transaction } : undefined);

  return { station, slotId: desiredSlotId };
};

const updateBatterySlotStatus = async ({ battery, status = null, transaction = null }) => {
  if (!battery?.id || !battery.currentStationId) return null;

  const station = await Station.findByPk(battery.currentStationId, transaction ? { transaction } : undefined);
  if (!station) return null;

  const { slots, index } = findBatterySlotInStation(station, battery.id);
  if (index === -1) return null;

  slots[index] = buildPlacedSlot(slots[index], battery, status || battery.status);
  station.slots = slots;
  await station.save(transaction ? { transaction } : undefined);

  return station;
};

module.exports = {
  emptySlot,
  getFirstAvailableSlotId,
  placeBatteryInStationSlot,
  removeBatteryFromStationSlots,
  updateBatterySlotStatus
};
