import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mustacheExpress from 'mustache-express';
import path from 'path';
import { fileURLToPath } from 'url';
import courseRoutes from './routes/courses.js';
import sessionRoutes from './routes/sessions.js';
import bookingRoutes from './routes/bookings.js';
import viewRoutes from './routes/views.js';
import { attachDemoUser } from './middlewares/demoUser.js';
import { initDb } from './models/_db.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const app = express();

app.engine('mustache', mustacheExpress(path.join(__dirname, 'views/partials'), '.mustache'));
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(attachDemoUser);
app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/courses', courseRoutes);
app.use('/sessions', sessionRoutes);
app.use('/bookings', bookingRoutes);
app.use('/', viewRoutes);
app.use((req, res) => res.status(404).type('text/plain').send('404 Not found.'));
app.use((err, req, res, next) => { console.error(err); res.status(500).type('text/plain').send('Internal Server Error.'); });

if (process.env.NODE_ENV !== 'test') {
  await initDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Yoga booking running on http://localhost:${PORT}`));
}
