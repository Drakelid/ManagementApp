/**
 * Authentication middleware
 */

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return res.redirect('/');
  }
  next();
};

// Add authentication data to response locals
const setAuthLocals = (req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
};

module.exports = {
  checkAuth,
  setAuthLocals
};
