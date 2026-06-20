const { sequelize } = require('../config/db');
const User = require('./user.model');
const Station = require('./station.model');
const Battery = require('./battery.model');
const Transaction = require('./transaction.model');
const TopUpTransaction = require('./topup.model');
const ChargingSession = require('./charging.model');

// --- Associations / Relationships ---

// 1. User <-> Battery
// A user can rent or carry a battery (nullable)
User.hasMany(Battery, { foreignKey: 'currentUserId', as: 'batteries' });
Battery.belongsTo(User, { foreignKey: 'currentUserId', as: 'user' });

// 2. Station <-> Battery
// A station can house multiple batteries (nullable)
Station.hasMany(Battery, { foreignKey: 'currentStationId', as: 'batteries' });
Battery.belongsTo(Station, { foreignKey: 'currentStationId', as: 'station' });

// 3. User <-> Transaction
// A user has many transactions
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 4. Station <-> Transaction
// A station is associated with many transactions
Station.hasMany(Transaction, { foreignKey: 'stationId', as: 'transactions' });
Transaction.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

// 5. User <-> TopUpTransaction
// A user can create many wallet top-up payments
User.hasMany(TopUpTransaction, { foreignKey: 'userId', as: 'topups' });
TopUpTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 6. Charging session relationships
// A charging session is created from a user scanning a charging cable QR.
User.hasMany(ChargingSession, { foreignKey: 'userId', as: 'chargingSessions' });
ChargingSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Battery.hasMany(ChargingSession, { foreignKey: 'cableId', as: 'chargingSessions' });
ChargingSession.belongsTo(Battery, { foreignKey: 'cableId', as: 'cable' });
Station.hasMany(ChargingSession, { foreignKey: 'stationId', as: 'chargingSessions' });
ChargingSession.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

module.exports = {
  sequelize,
  User,
  Station,
  Battery,
  Transaction,
  TopUpTransaction,
  ChargingSession
};
