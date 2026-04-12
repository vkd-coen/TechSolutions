const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT stored in the httpOnly cookie.
// httpOnly cookies cannot be read by JavaScript — they are immune to XSS token theft.
const protect = async (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — please log in' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admins only' });
};

module.exports = { protect, adminOnly };
