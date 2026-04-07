export function attachDemoUser(req, res, next) {
  req.user = {
    _id: 'demo-organiser',
    name: 'Demo Organiser',
    email: 'demo@example.com',
    role: 'organiser',
  };
  res.locals.user = req.user;
  res.locals.year = new Date().getFullYear();
  next();
}