// routes/views.js
import express from 'express';
import {
  homeView,
  coursesView,
  courseView,
  courseBookView,
  postBookCourse,
  sessionBookView,
  postBookSession,
  bookingConfirmationView,
  accountView,
  adminView,
} from '../controllers/viewsController.js';

const router = express.Router();

router.get('/', homeView);
router.get('/courses', coursesView);
router.get('/courses/:id/book', courseBookView);
router.post('/courses/:id/book', postBookCourse);
router.get('/courses/:id', courseView);
router.get('/sessions/:id/book', sessionBookView);
router.post('/sessions/:id/book', postBookSession);
router.get('/booking-confirmation/:id', bookingConfirmationView);
router.get('/account', accountView);
router.get('/admin', adminView);

export default router;