/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Only return stack trace in development environment
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  errorHandler
};
