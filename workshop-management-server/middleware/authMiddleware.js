const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Not authorized to access this route (no user roles found)' });
    }

    const hasPermission = roles.some(role => req.user.roles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to access this route (insufficient role)' });
    }
    next();
  };
};

module.exports = { protect, authorize };