import { CourseModel } from '../models/courseModel.js';
import { SessionModel } from '../models/sessionModel.js';

const fmtDateOnly = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBA';

function buildLink(req, page, pageSize) {
  const params = new URLSearchParams(req.query);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return `${req.path}?${params.toString()}`;
}

export const coursesListPage = async (req, res, next) => {
  try {
    const { level = '', type = '', dropin = '', q = '', page = '1', pageSize = '10' } = req.query;

    const filter = {};
    if (level) filter.level = level;
    if (type) filter.type = type;
    if (dropin === 'yes') filter.allowDropIn = true;
    if (dropin === 'no') filter.allowDropIn = false;

    let courses = await CourseModel.list(filter);

    const needle = q.trim().toLowerCase();
    if (needle) {
      courses = courses.filter(
        (c) =>
          c.title?.toLowerCase().includes(needle) ||
          c.description?.toLowerCase().includes(needle)
      );
    }

    courses.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, parseInt(pageSize, 10) || 10);
    const total = courses.length;
    const totalPages = Math.max(1, Math.ceil(total / ps));
    const pageItems = courses.slice((p - 1) * ps, (p - 1) * ps + ps);

    const cards = await Promise.all(
      pageItems.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const first = sessions[0];
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          allowDropInText: c.allowDropIn ? 'Yes' : 'No',
          startDate: fmtDateOnly(c.startDate),
          endDate: fmtDateOnly(c.endDate),
          nextSession: first ? fmtDateTime(first.startDateTime) : 'TBA',
          sessionsCount: sessions.length,
          description: c.description,
        };
      })
    );

    res.render('courses', {
      title: 'Courses',
      year: new Date().getFullYear(),
      filters: {
        level,
        type,
        dropin,
        q,
        dropinYes: dropin === 'yes',
        dropinNo: dropin === 'no',
      },
      hasCourses: cards.length > 0,
      courses: cards,
      pagination: {
        page: p,
        totalPages,
        hasPrev: p > 1,
        hasNext: p < totalPages,
        prevLink: p > 1 ? buildLink(req, p - 1, ps) : null,
        nextLink: p < totalPages ? buildLink(req, p + 1, ps) : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await CourseModel.list();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to retrieve courses' });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to retrieve course' });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to retrieve session' });
  }
};