import { CourseModel } from '../models/courseModel.js';
import { SessionModel } from '../models/sessionModel.js';
import { BookingModel } from '../models/bookingModel.js';
import { UserModel } from '../models/userModel.js';
import { bookCourseForUser, bookSessionForUser } from '../services/bookingService.js';
import { coursesListPage } from './coursesListController.js';

function redirectToLogin(req, res) {
  const nextPath = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/auth/login?next=${nextPath}`);
}

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtDateOnly = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const homePage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const cards = await Promise.all(
      courses.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          allowDropInText: c.allowDropIn ? 'Drop-in available' : 'Course booking only',
          startDate: c.startDate ? fmtDateOnly(c.startDate) : '',
          endDate: c.endDate ? fmtDateOnly(c.endDate) : '',
          nextSession: sessions[0] ? fmtDate(sessions[0].startDateTime) : 'TBA',
          sessionsCount: sessions.length,
          description: c.description,
        };
      })
    );

    res.render('home', {
      title: 'Yoga Courses',
      year: new Date().getFullYear(),
      hasCourses: cards.length > 0,
      courses: cards,
    });
  } catch (err) {
    next(err);
  }
};

export { coursesListPage };

export const courseDetailPage = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Course not found',
        year: new Date().getFullYear(),
      });
    }

    const sessions = await SessionModel.listByCourse(course._id);

    res.render('course', {
      title: course.title,
      year: new Date().getFullYear(),
      hasSessions: sessions.length > 0,
      course: {
        id: course._id,
        title: course.title,
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        allowDropInText: course.allowDropIn ? 'Yes' : 'No',
        startDate: fmtDateOnly(course.startDate),
        endDate: fmtDateOnly(course.endDate),
        description: course.description,
      },
      sessions: sessions.map((s) => ({
        id: s._id,
        start: fmtDate(s.startDateTime),
        end: fmtDate(s.endDateTime),
        capacity: s.capacity,
        booked: s.bookedCount ?? 0,
        remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const courseBookPage = async (req, res, next) => {
  if (!req.user) {
    return redirectToLogin(req, res);
  }

  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Course not found',
        year: new Date().getFullYear(),
      });
    }

    const sessions = await SessionModel.listByCourse(course._id);

    res.render('course_book', {
      title: `Book ${course.title}`,
      year: new Date().getFullYear(),
      user: req.user,
      course: {
        ...course,
        id: course._id,
        startDate: fmtDateOnly(course.startDate),
        endDate: fmtDateOnly(course.endDate),
        allowDropInText: course.allowDropIn ? 'Yes' : 'No',
      },
      sessionsCount: sessions.length,
      hasSessions: sessions.length > 0,
      action: `/courses/${course._id}/book`,
      sessions: sessions.map((s) => ({
        id: s._id,
        start: fmtDate(s.startDateTime),
        end: fmtDate(s.endDateTime),
        remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const sessionBookPage = async (req, res, next) => {
  if (!req.user) {
    return redirectToLogin(req, res);
  }

  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Session not found',
        year: new Date().getFullYear(),
      });
    }

    const course = await CourseModel.findById(session.courseId);

    res.render('course_book', {
      title: 'Book Session',
      year: new Date().getFullYear(),
      user: req.user,
      course: {
        ...course,
        id: course._id,
        startDate: fmtDateOnly(course.startDate),
        endDate: fmtDateOnly(course.endDate),
        allowDropInText: course.allowDropIn ? 'Yes' : 'No',
      },
      sessionsCount: 1,
      hasSessions: true,
      sessions: [
        {
          id: session._id,
          start: fmtDate(session.startDateTime),
          end: fmtDate(session.endDateTime),
          remaining: Math.max(0, (session.capacity ?? 0) - (session.bookedCount ?? 0)),
        },
      ],
      action: `/sessions/${session._id}/book`,
      isSessionBooking: true,
    });
  } catch (err) {
    next(err);
  }
};

export const postBookCourse = async (req, res) => {
  if (!req.user) {
    return redirectToLogin(req, res);
  }

  try {
    const booking = await bookCourseForUser(req.user._id, req.params.id);
    res.redirect(`/booking-confirmation/${booking._id}?status=${booking.status}`);
  } catch (err) {
    res.status(400).render('error', {
      title: 'Booking failed',
      message: err.message,
      year: new Date().getFullYear(),
    });
  }
};

export const postBookSession = async (req, res) => {
  if (!req.user) {
    return redirectToLogin(req, res);
  }

  try {
    const booking = await bookSessionForUser(req.user._id, req.params.id);
    res.redirect(`/booking-confirmation/${booking._id}?status=${booking.status}`);
  } catch (err) {
    res.status(400).render('error', {
      title: 'Booking failed',
      message: err.message,
      year: new Date().getFullYear(),
    });
  }
};

export const bookingConfirmationPage = async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Booking not found',
        year: new Date().getFullYear(),
      });
    }

    res.render('booking_confirmation', {
      title: 'Booking confirmation',
      year: new Date().getFullYear(),
      booking: {
        ...booking,
        id: booking._id,
        status: req.query.status || booking.status,
        createdAt: booking.createdAt ? fmtDate(booking.createdAt) : '',
      },
      isCancelled: (req.query.status || booking.status) === 'CANCELLED',
      isConfirmed: (req.query.status || booking.status) === 'CONFIRMED',
      isPending: (req.query.status || booking.status) === 'PENDING',
    });
  } catch (err) {
    next(err);
  }
};

export const accountPage = async (req, res, next) => {
  if (!req.user) {
    return redirectToLogin(req, res);
  }

  try {
    const bookings = await BookingModel.listByUser(req.user._id);
    const bookingRows = await Promise.all(
      bookings.map(async (booking) => {
        const course = await CourseModel.findById(booking.courseId);
        return {
          id: booking._id,
          status: booking.status,
          type: booking.type,
          courseTitle: course?.title || 'Unknown course',
          sessionsCount: booking.sessionIds?.length || 0,
          createdAt: booking.createdAt ? fmtDate(booking.createdAt) : '',
        };
      })
    );

    res.render('account', {
      title: 'My account',
      year: new Date().getFullYear(),
      user: req.user,
      hasBookings: bookingRows.length > 0,
      bookings: bookingRows,
    });
  } catch (err) {
    next(err);
  }
};

export const organiserDashboardPage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();

    const rows = await Promise.all(
      courses.map(async (course) => {
        const bookings = await BookingModel.listByCourse(course._id);
        const names = await Promise.all(
          bookings.map(async (b) => {
            if (b.userName) return b.userName;
            const user = await UserModel.findById(b.userId);
            return user?.name || user?.email || b.userId || 'Unknown user';
          })
        );

        return {
          title: course.title,
          level: course.level,
          type: course.type,
          bookingsCount: bookings.length,
          participants: names.length ? names.join(', ') : 'No current participants',
        };
      })
    );

    res.render('admin', {
      title: 'Organiser dashboard',
      year: new Date().getFullYear(),
      hasCourses: rows.length > 0,
      courses: rows,
      isOrganiser: req.user?.role === 'organiser',
    });
  } catch (err) {
    next(err);
  }
};

export {
  homePage as homeView,
  coursesListPage as coursesView,
  courseDetailPage as courseView,
  courseBookPage as courseBookView,
  sessionBookPage as sessionBookView,
  bookingConfirmationPage as bookingConfirmationView,
  accountPage as accountView,
  organiserDashboardPage as adminView,
};
