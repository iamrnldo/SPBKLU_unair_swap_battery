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
  slotId: {
    type: DataTypes.INTEGER,
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
  fee: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  totalPayment: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentNumber: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  releasedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  releaseCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
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
