const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * Verifies the JWT, then confirms the account still exists and is active.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  try {
    const account = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true },
    });
    if (!account) {
      return res.status(401).json({ message: 'This account no longer exists.' });
    }
    if (!account.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

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