const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Battery = sequelize.define('Battery', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
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
    defaultValue: 0,
    allowNull: false
  },
  pricePerKwh: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
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
