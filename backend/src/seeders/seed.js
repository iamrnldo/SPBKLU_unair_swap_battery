const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Station = require('../models/station.model');
const Battery = require('../models/battery.model');
const Transaction = require('../models/transaction.model');

const seedData = async () => {
  try {
    // 1. Check if users table already has data
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeder...');
      return;
    }

    console.log('Seeding initial SPBKLU database data...');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('adminpassword', salt);
    const userPassword = await bcrypt.hash('userpassword', salt);

    // Seed Users
    const adminUser = await User.create({
      name: 'Admin SPBKLU',
      email: 'admin@spbklu.com',
      password: adminPassword,
      role: 'admin',
      balance: 0
    });

    const regularUser = await User.create({
      name: 'Budi Santoso',
      email: 'budi@gmail.com',
      password: userPassword,
      role: 'user',
      balance: 50000
    });

    console.log('✔ Users seeded successfully!');

    // Seed Stations
    const stations = await Station.bulkCreate([
      {
        id: 'ST-001',
        name: 'SPBKLU Sudirman Center',
        address: 'Jl. Jenderal Sudirman No. 21, Jakarta Selatan',
        latitude: -6.2141,
        longitude: 106.8166,
        status: 'active',
        slots: [
          { slotId: 1, batteryId: 'BT-101', status: 'ready', chargeLevel: 100 },
          { slotId: 2, batteryId: 'BT-102', status: 'charging', chargeLevel: 65 },
          { slotId: 3, batteryId: 'BT-103', status: 'ready', chargeLevel: 98 },
          { slotId: 4, batteryId: null, status: 'empty', chargeLevel: 0 }
        ]
      },
      {
        id: 'ST-002',
        name: 'SPBKLU Kuningan Eco',
        address: 'Jl. HR Rasuna Said No. 5, Jakarta Selatan',
        latitude: -6.2234,
        longitude: 106.8294,
        status: 'active',
        slots: [
          { slotId: 1, batteryId: 'BT-201', status: 'ready', chargeLevel: 100 },
          { slotId: 2, batteryId: null, status: 'empty', chargeLevel: 0 },
          { slotId: 3, batteryId: 'BT-202', status: 'charging', chargeLevel: 40 },
          { slotId: 4, batteryId: 'BT-203', status: 'ready', chargeLevel: 95 }
        ]
      },
      {
        id: 'ST-003',
        name: 'SPBKLU Thamrin Junction',
        address: 'Jl. MH Thamrin No. 12, Jakarta Pusat',
        latitude: -6.1895,
        longitude: 106.8219,
        status: 'maintenance',
        slots: [
          { slotId: 1, batteryId: 'BT-301', status: 'faulty', chargeLevel: 12 },
          { slotId: 2, batteryId: 'BT-302', status: 'faulty', chargeLevel: 50 }
        ]
      }
    ]);

    console.log('✔ Stations seeded successfully!');

    // Seed Batteries
    const batteries = await Battery.bulkCreate([
      { id: 'BT-101', type: '60V/20Ah', chargeLevel: 100, stateOfHealth: 98, currentStationId: 'ST-001', currentUserId: null, status: 'ready' },
      { id: 'BT-102', type: '60V/20Ah', chargeLevel: 65, stateOfHealth: 95, currentStationId: 'ST-001', currentUserId: null, status: 'charging' },
      { id: 'BT-103', type: '60V/20Ah', chargeLevel: 98, stateOfHealth: 92, currentStationId: 'ST-001', currentUserId: null, status: 'ready' },
      { id: 'BT-201', type: '60V/24Ah', chargeLevel: 100, stateOfHealth: 99, currentStationId: 'ST-002', currentUserId: null, status: 'ready' },
      { id: 'BT-202', type: '60V/24Ah', chargeLevel: 40, stateOfHealth: 94, currentStationId: 'ST-002', currentUserId: null, status: 'charging' },
      { id: 'BT-203', type: '60V/24Ah', chargeLevel: 95, stateOfHealth: 91, currentStationId: 'ST-002', currentUserId: null, status: 'ready' },
      { id: 'BT-301', type: '60V/20Ah', chargeLevel: 12, stateOfHealth: 81, currentStationId: 'ST-003', currentUserId: null, status: 'faulty' },
      { id: 'BT-302', type: '60V/20Ah', chargeLevel: 50, stateOfHealth: 88, currentStationId: 'ST-003', currentUserId: null, status: 'faulty' },
      { id: 'BT-901', type: '60V/24Ah', chargeLevel: 25, stateOfHealth: 97, currentStationId: null, currentUserId: regularUser.id, status: 'in-use' }
    ]);

    console.log('✔ Batteries seeded successfully!');

    // Seed Transactions
    await Transaction.bulkCreate([
      {
        transactionId: 'TXN-1001',
        userId: regularUser.id,
        userName: regularUser.name,
        stationId: 'ST-001',
        stationName: 'SPBKLU Sudirman Center',
        emptyBatteryId: 'BT-102',
        fullBatteryId: 'BT-101',
        cost: 10000,
        timestamp: '2026-05-29T10:15:30.000Z',
        status: 'completed'
      },
      {
        transactionId: 'TXN-1002',
        userId: regularUser.id,
        userName: regularUser.name,
        stationId: 'ST-002',
        stationName: 'SPBKLU Kuningan Eco',
        emptyBatteryId: 'BT-202',
        fullBatteryId: 'BT-201',
        cost: 10000,
        timestamp: '2026-05-30T08:30:00.000Z',
        status: 'completed'
      }
    ]);

    console.log('✔ Transactions seeded successfully!');
    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Failed to seed database:', error.message);
  }
};

module.exports = { seedData };
