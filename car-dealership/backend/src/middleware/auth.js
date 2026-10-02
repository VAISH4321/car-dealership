const { verifyToken } = require('../utils/jwt');

/**
 * Verifies the Bearer token on the request and attaches the decoded
 * { id, email, role } payload to req.user. Rejects with 401 otherwise.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Must be used AFTER authenticate(). Rejects with 403 if the caller
 * is not an ADMIN.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }
  return next();
}

module.exports = { authenticate, requireAdmin };
