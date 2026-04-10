const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Protect — valid JWT required
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied — no token', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated — contact admin', code: 'DEACTIVATED' });
    }

    req.user = user;
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      message: expired ? 'Session expired — please login again' : 'Invalid token',
      code:    expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
};

// Admin only — must be logged in AND isAdmin === true
const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required', code: 'FORBIDDEN' });
  }
  next();
};

module.exports = { protect, adminOnly };