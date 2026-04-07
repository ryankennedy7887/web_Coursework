import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const COOKIE_NAME = 'authToken';

export async function attachAuthUser(req, res, next) {
  req.user = undefined;
  res.locals.user = undefined;

  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(payload.id);
    if (user) {
      req.user = user;
      res.locals.user = user;
    }
  } catch (err) {
    // ignore invalid token
  }

  return next();
}
