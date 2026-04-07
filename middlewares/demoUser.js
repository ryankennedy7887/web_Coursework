import { UserModel } from '../models/userModel.js';

export const attachDemoUser = async (req, res, next) => {
  try {
    const role = req.query.as === 'organiser' ? 'organiser' : 'student';
    const email = role === 'organiser' ? 'organiser@yoga.local' : 'fiona@student.local';
    let user = await UserModel.findByEmail(email);
    if (!user) {
      user = await UserModel.create({
        name: role === 'organiser' ? 'Demo Organiser' : 'Fiona',
        email,
        role,
      });
    }
    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
