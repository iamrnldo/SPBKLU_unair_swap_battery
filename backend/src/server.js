require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

// Set port
const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();
    
    // Start listening on all network interfaces (0.0.0.0) so physical mobile devices can connect
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=========================================`);
      console.log(`  SPBKLU Backend Server Running!`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Port: ${PORT}`);
      console.log(`  URL: http://127.0.0.1:${PORT} (Local)`);
      console.log(`  Network: http://192.168.1.93:${PORT} (Wi-Fi)`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
