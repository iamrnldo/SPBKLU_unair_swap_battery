const { Sequelize } = require('sequelize');
const config = require('./config');

// Initialize Sequelize with PostgreSQL configurations
const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: config.env === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // Auto-adds createdAt and updatedAt
    underscored: true // database columns will be snake_case (e.g. created_at, user_id)
  }
});

const connectDB = async () => {
  try {
    console.log(`Connecting to PostgreSQL database: postgres://${config.db.user}:****@${config.db.host}:${config.db.port}/${config.db.name}`);
    await sequelize.authenticate();
    console.log('PostgreSQL database connected successfully via Sequelize!');
    
    // In development mode, synchronize models with database
    if (config.env === 'development') {
      console.log('Synchronizing database models...');
      // Note: { alter: true } is safe for development to update columns without deleting data. 
      // Avoid { force: true } unless you want to drop all tables on every restart.
      await sequelize.sync({ alter: true });
      console.log('All database models synchronized successfully.');
      
      // Dynamically require seeder to prevent circular imports
      const { seedData } = require('../seeders/seed');
      await seedData();
    }
    
    return true;
  } catch (error) {
    console.error('PostgreSQL database connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB
};
