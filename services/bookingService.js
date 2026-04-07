import { CourseModel } from '../models/courseModel.js';
import { SessionModel } from '../models/sessionModel.js';
import { BookingModel } from '../models/bookingModel.js';
import { UserModel } from '../models/userModel.js';

const isSessionFull = (session) => (session.bookedCount ?? 0) >= (session.capacity ?? 0);

const makeError = (message, code) => {
  const err = new Error(message);
  err.code = code;
  return err;
};

export async function bookCourseForUser(userId, courseId) {
  if (!userId) {
    throw makeError('User is required to make a booking', 'USER_REQUIRED');
  }

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw makeError('Course not found', 'COURSE_NOT_FOUND');
  }

  const existingCourseBooking = await BookingModel.findActiveCourseBooking(userId, courseId);
  if (existingCourseBooking) {
    throw makeError('You already have an active booking for this course', 'DUPLICATE_BOOKING');
  }

  const sessions = await SessionModel.listByCourse(courseId);
  if (!sessions.length) {
    throw makeError('Course has no sessions', 'NO_SESSIONS');
  }

  const alreadyBookedSession = await Promise.all(
    sessions.map((s) => BookingModel.findActiveSessionBooking(userId, s._id))
  );

  if (alreadyBookedSession.some(Boolean)) {
    throw makeError(
      'You already have an active booking for one or more sessions on this course',
      'DUPLICATE_BOOKING'
    );
  }

  const canConfirm = sessions.every((s) => !isSessionFull(s));
  const status = canConfirm ? 'CONFIRMED' : 'PENDING';

  if (canConfirm) {
    for (const session of sessions) {
      await SessionModel.incrementBookedCount(session._id, 1);
    }
  }

  const user = await UserModel.findById(userId);
  return BookingModel.create({
    userId,
    userName: user?.name || user?.email || userId,
    userEmail: user?.email || '',
    courseId,
    type: 'COURSE',
    sessionIds: sessions.map((s) => s._id),
    status,
  });
}

export async function bookSessionForUser(userId, sessionId) {
  if (!userId) {
    throw makeError('User is required to make a booking', 'USER_REQUIRED');
  }

  const session = await SessionModel.findById(sessionId);
  if (!session) {
    throw makeError('Session not found', 'SESSION_NOT_FOUND');
  }

  const course = await CourseModel.findById(session.courseId);
  if (!course) {
    throw makeError('Course not found', 'COURSE_NOT_FOUND');
  }

  const existingSessionBooking = await BookingModel.findActiveSessionBooking(userId, sessionId);
  if (existingSessionBooking) {
    throw makeError('You already have an active booking for this session', 'DUPLICATE_BOOKING');
  }

  const existingCourseBooking = await BookingModel.findActiveCourseBooking(userId, course._id);
  if (existingCourseBooking) {
    throw makeError(
      'You already have a course booking that includes this session',
      'DUPLICATE_BOOKING'
    );
  }

  if (!course.allowDropIn && course.type === 'WEEKLY_BLOCK') {
    throw makeError('Drop-in not allowed for this course', 'DROPIN_NOT_ALLOWED');
  }

  const status = isSessionFull(session) ? 'PENDING' : 'CONFIRMED';

  if (status === 'CONFIRMED') {
    await SessionModel.incrementBookedCount(session._id, 1);
  }

  const user = await UserModel.findById(userId);
  return BookingModel.create({
    userId,
    userName: user?.name || user?.email || userId,
    userEmail: user?.email || '',
    courseId: course._id,
    type: 'SESSION',
    sessionIds: [session._id],
    status,
  });
}