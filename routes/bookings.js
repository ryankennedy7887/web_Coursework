// routes/bookings.js
import express from 'express';
import {
  bookCourse,
  bookSession,
  cancelBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

router.post('/course', bookCourse);
router.post('/session', bookSession);
router.post('/:bookingId/cancel', cancelBooking);

export default router;