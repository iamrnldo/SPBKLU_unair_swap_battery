const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Welcome Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to SPBKLU API Server',
    version: '1.0.0',
    documentation: 'Refer to API documentation for details'
  });
});

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
