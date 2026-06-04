exports.isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  req.flash('error', 'Please login to continue');
  res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Admin access required');
  res.redirect('/dashboard');
};

exports.isManagerOrAdmin = (req, res, next) => {
  if (req.session.user && ['admin', 'store_manager'].includes(req.session.user.role)) return next();
  req.flash('error', 'Manager or Admin access required');
  res.redirect('/dashboard');
};
