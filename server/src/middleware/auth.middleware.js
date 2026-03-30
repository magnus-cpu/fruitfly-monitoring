import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    if (user?.role === 'user') {
      user.role = 'manager';
    }
    req.user = user;
    next();
  });
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const normalizedRole = req.user?.role === 'user' ? 'manager' : req.user?.role;

    if (!roles.includes(normalizedRole)) {
      return res.status(403).json({ 
        message: `Role ${normalizedRole} is not allowed to access this resource`
      });
    }
    next();
  };
};

// src/middleware/auth.middleware.js
export const requireAdmin = authorizeRoles('admin');
export const requireManager = authorizeRoles('manager');
export const requireWritableFarmAccess = (req, res, next) => {
  if (req.user?.role === 'viewer') {
    return res.status(403).json({
      message: 'Viewer accounts have read-only access to farm data'
    });
  }

  next();
};
