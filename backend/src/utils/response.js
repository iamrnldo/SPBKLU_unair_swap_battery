/**
 * Standard utility for sending unified JSON responses
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

const sendError = (res, message, statusCode = 500, errorDetails = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    details: errorDetails
  });
};

module.exports = {
  sendSuccess,
  sendError
};
