const { sequelize } = require('../config/db');
const User = require('./user.model');
const Station = require('./station.model');
const Battery = require('./battery.model');
const Transaction = require('./transaction.model');

// --- Associations / Relationships ---

// 1. User <-> Battery
// A user can carry a battery (nullable)
User.hasMany(Battery, { foreignKey: 'currentUserId', as: 'batteries' });
Battery.belongsTo(User, { foreignKey: 'currentUserId', as: 'user' });

// 2. Station <-> Battery
// A station can house multiple batteries (nullable)
Station.hasMany(Battery, { foreignKey: 'currentStationId', as: 'batteries' });
Battery.belongsTo(Station, { foreignKey: 'currentStationId', as: 'station' });

// 3. User <-> Transaction
// A user has many swap orders/transactions
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 4. Station <-> Transaction
// A station is associated with many swap orders/transactions
Station.hasMany(Transaction, { foreignKey: 'stationId', as: 'transactions' });
Transaction.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

module.exports = {
  sequelize,
  User,
  Station,
  Battery,
  Transaction
};
