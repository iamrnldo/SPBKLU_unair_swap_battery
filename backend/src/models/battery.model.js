const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Historically this table was named `batteries` because the first flow was
 * battery swapping. In the charging flow requested for SPBKLU, each record is
 * now treated as a registered charging cable / connector point that can be
 * placed on the admin map and encoded into a QR code for mobile users to scan.
 */
const Battery = sequelize.define('Battery', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true, // e.g. 'CBL-001' / legacy 'BT-101'
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false // e.g. 'Type 2 AC', 'CCS2 DC', legacy '60V/20Ah'
  },
  chargeLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    allowNull: false
  },
  stateOfHealth: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    allowNull: false
  },
  powerWatt: {
    type: DataTypes.INTEGER,
    defaultValue: 2200,
    allowNull: false
  },
  pricePerKwh: {
    type: DataTypes.INTEGER,
    defaultValue: 2500,
    allowNull: false
  },
  slotId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  locationNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  qrToken: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  currentStationId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'stations',
      key: 'id'
    }
  },
  currentUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('ready', 'charging', 'in-use', 'faulty', 'idle'),
    defaultValue: 'idle',
    allowNull: false
  }
}, {
  tableName: 'batteries'
});

module.exports = Battery;
