const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Skip authentication when testing with Postman (if ?skipAuth=true&role=<role>&id=<id>)
    if (req.query.skipAuth === 'true') {
      const role = req.query.role || 'buyer'; // Default to 'buyer' if not specified
      if (!['buyer', 'seller', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified for testing'
        });
      }
      const id = req.query.id; // Get id from query, no default
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID is required in query when skipAuth is true'
        });
      }
      req.user = {
        id: id,
        role: role,
        name: 'Test'
      };
      return next();
    }


    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user from payload
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'unknown'}) is not allowed to access this resource`
      });
    }
    next();
  };
};

// Middleware to check seller role
const isSeller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Seller role required.',
    });
  }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
};

// Middleware to check buyer role
const isBuyer = (req, res, next) => {
  if (req.user && req.user.role === 'buyer') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Buyer role required.',
    });
  }
};

module.exports = {
  authMiddleware,
  authorizeRoles,
  isSeller,
  isAdmin,
  isBuyer
};