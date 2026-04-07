import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const COOKIE_NAME = 'authToken';

function hashPassword(password) {
  return crypto.createHmac('sha256', JWT_SECRET).update(password || '').digest('hex');
}

function createToken(user) {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
}

function safeRedirectPath(nextPath) {
  if (typeof nextPath !== 'string' || !nextPath.startsWith('/')) {
    return '/';
  }
  return nextPath;
}

export const loginPage = (req, res) => {
  res.render('login', {
    title: 'Login',
    year: new Date().getFullYear(),
    error: req.query.error || '',
    next: req.query.next || '/',
  });
};

export const signupPage = (req, res) => {
  res.render('signup', {
    title: 'Sign up',
    year: new Date().getFullYear(),
    error: req.query.error || '',
    next: req.query.next || '/',
  });
};

export const login = async (req, res) => {
  const { email, password, next } = req.body;
  const redirectTo = safeRedirectPath(next);

  if (!email || !password) {
    return res.render('login', {
      title: 'Login',
      year: new Date().getFullYear(),
      error: 'Email and password are required.',
      next: redirectTo,
    });
  }

  const user = await UserModel.findByEmail(email.trim().toLowerCase());
  if (!user || user.password !== hashPassword(password)) {
    return res.render('login', {
      title: 'Login',
      year: new Date().getFullYear(),
      error: 'Invalid email or password.',
      next: redirectTo,
    });
  }

  const token = createToken(user);
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax' });
  res.redirect(redirectTo);
};

export const signup = async (req, res) => {
  const { name, email, password, confirmPassword, next } = req.body;
  const redirectTo = safeRedirectPath(next);

  if (!name || !email || !password || !confirmPassword) {
    return res.render('signup', {
      title: 'Sign up',
      year: new Date().getFullYear(),
      error: 'Name, email, and password are required.',
      next: redirectTo,
    });
  }

  if (password !== confirmPassword) {
    return res.render('signup', {
      title: 'Sign up',
      year: new Date().getFullYear(),
      error: 'Passwords do not match.',
      next: redirectTo,
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await UserModel.findByEmail(normalizedEmail);
  if (existingUser) {
    return res.render('signup', {
      title: 'Sign up',
      year: new Date().getFullYear(),
      error: 'Email already registered.',
      next: redirectTo,
    });
  }

  const user = await UserModel.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashPassword(password),
    role: 'student',
  });

  const token = createToken(user);
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax' });
  res.redirect(redirectTo);
};

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/');
};
