import { initDb, usersDb, coursesDb, sessionsDb, bookingsDb } from '../models/_db.js';
import { CourseModel } from '../models/courseModel.js';
import { SessionModel } from '../models/sessionModel.js';
import { UserModel } from '../models/userModel.js';

const iso = (d) => new Date(d).toISOString();

async function wipeAll() {
  await Promise.all([
    usersDb.remove({}, { multi: true }),
    coursesDb.remove({}, { multi: true }),
    sessionsDb.remove({}, { multi: true }),
    bookingsDb.remove({}, { multi: true }),
  ]);
}

async function ensureUsers() {
  const student = await UserModel.create({ name: 'Fiona', email: 'fiona@student.local', role: 'student' });
  const organiser = await UserModel.create({ name: 'Demo Organiser', email: 'organiser@yoga.local', role: 'organiser' });
  const instructor1 = await UserModel.create({ name: 'Ava', email: 'ava@yoga.local', role: 'instructor' });
  const instructor2 = await UserModel.create({ name: 'Ben', email: 'ben@yoga.local', role: 'instructor' });
  return { student, organiser, instructor1, instructor2 };
}

async function createCourse(title, level, type, allowDropIn, startDate, endDate, instructorId, count, firstDate, durationMins, gapDays, description) {
  const course = await CourseModel.create({ title, level, type, allowDropIn, startDate, endDate, instructorId, description, sessionIds: [] });
  const sessions = [];
  let current = new Date(firstDate);
  for (let i = 0; i < count; i++) {
    const end = new Date(current.getTime() + durationMins * 60000);
    const s = await SessionModel.create({ courseId: course._id, startDateTime: iso(current), endDateTime: iso(end), capacity: 18, bookedCount: 0 });
    sessions.push(s);
    current = new Date(current.getTime() + gapDays * 86400000);
  }
  await CourseModel.update(course._id, { sessionIds: sessions.map((s) => s._id) });
  return { course, sessions };
}

async function run() {
  await initDb();
  await wipeAll();
  const { instructor1, instructor2 } = await ensureUsers();
  await createCourse('Winter Mindfulness Workshop', 'beginner', 'WEEKEND_WORKSHOP', false, '2026-01-10', '2026-01-11', instructor1._id, 5, '2026-01-10T09:00:00', 60, 0.08, 'Two days of breath, posture alignment, and meditation.');
  await createCourse('12-Week Vinyasa Flow', 'intermediate', 'WEEKLY_BLOCK', true, '2026-02-02', '2026-04-20', instructor2._id, 12, '2026-02-02T18:30:00', 75, 7, 'Progressive sequences building strength and flexibility.');
  console.log('Seed complete');
}

run().catch((err) => { console.error(err); process.exit(1); });
