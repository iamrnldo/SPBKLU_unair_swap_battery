const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  transactionId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stationId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'stations',
      key: 'id'
    }
  },
  stationName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emptyBatteryId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fullBatteryId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cost: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'completed',
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'transactions'
});

module.exports = Transaction;
