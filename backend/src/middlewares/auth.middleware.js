const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware to verify JWT token and inject user data
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // Store decoded token data in request
    next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token.'
    });
  }
};

/**
 * Middleware to check if the user is an Admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access forbidden. Admins only.'
    });
  }
  next();
};

/**
 * Middleware to check if the user is a Mobile/Regular User
 */
const isUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      status: 'error',
      message: 'Access forbidden. Regular users only.'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isUser
};
