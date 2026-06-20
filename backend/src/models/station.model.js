const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true, // e.g. 'ST-001'
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  },
  /**
   * PostgreSQL JSONB column to store array of slots.
   * Example: 
   * [
   *   { "slotId": 1, "batteryId": "BT-101", "status": "ready", "chargeLevel": 100 },
   *   { "slotId": 2, "batteryId": null, "status": "empty", "chargeLevel": 0 }
   * ]
   */
  slots: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  }
}, {
  tableName: 'stations'
});

module.exports = Station;
