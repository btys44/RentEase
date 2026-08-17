const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT sent in the Authorization header ("Bearer <token>").
 * Attaches the decoded payload { id, role, name, email } to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

/**
 * Restricts a route to one or more roles.
 * Usage: requireRole('LANDLORD'), requireRole('LANDLORD', 'CARETAKER')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
