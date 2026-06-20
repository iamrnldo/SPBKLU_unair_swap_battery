const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Wallet top-up payment record.
 *
 * The actual QRIS payment is created in Pakasir and this table is used to keep
 * the local order state so the user's balance can be credited exactly once
 * after Pakasir confirms payment completion.
 */
const TopUpTransaction = sequelize.define('TopUpTransaction', {
  orderId: {
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
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  fee: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  totalPayment: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'qris',
    allowNull: false
  },
  paymentNumber: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'expired'),
    defaultValue: 'pending',
    allowNull: false
  },
  expiredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'topup_transactions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = TopUpTransaction;
