import { BookingModel } from '../models/bookingModel.js';
import { SessionModel } from '../models/sessionModel.js';
import { bookCourseForUser, bookSessionForUser } from '../services/bookingService.js';

export const bookCourse = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { courseId } = req.body;
    const booking = await bookCourseForUser(userId, courseId);
    res.status(201).json({ booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const bookSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { sessionId } = req.body;
    const booking = await bookSessionForUser(userId, sessionId);
    res.status(201).json({ booking });
  } catch (err) {
    const status =
      err.code === 'DROPIN_NOT_ALLOWED'
        ? 400
        : err.code === 'SESSION_NOT_FOUND'
        ? 404
        : 500;
    res.status(status).json({ error: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookingId = req.params.id || req.params.bookingId;
    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== userId && req.user.role !== 'organiser') {
      return res.status(403).json({ error: 'Not allowed to cancel this booking' });
    }

    if (booking.status === 'CANCELLED') return res.json({ booking });

    if (booking.status === 'CONFIRMED') {
      for (const sid of booking.sessionIds || []) {
        await SessionModel.incrementBookedCount(sid, -1);
      }
    }

    const updated = await BookingModel.cancel(bookingId);
    res.json({ booking: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};