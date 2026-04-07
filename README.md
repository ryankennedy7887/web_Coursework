# web_Coursework

Getting Started
Prerequisites
Node.js (LTS version recommended)

npm

Installation
bash
# Clone this repository
git clone https://github.com/ryankennedy7887/web_Coursework.git
cd web_Coursework

# Install dependencies
npm install
Seeding the Database
This project uses NeDB with a seed script to create sample users, courses, sessions, and bookings.

npm run seed
After seeding, the app will have demo data suitable for development, testing, and demonstration.

Running the Application
# Start the app
npm start

# Or run with auto‑reload in development
npm run dev
By default, the server listens on port 3000 (configurable via PORT in .env).

Visit:

http://localhost:3000/ – home page

http://localhost:3000/courses – course listings

http://localhost:3000/account – account view

http://localhost:3000/admin – organiser dashboard

A health endpoint is also exposed at:

http://localhost:3000/health

Features:
- Course browsing
- Home page showing upcoming / featured courses.
- Full course listing with search and filters (level, type, drop‑in).
- Detailed course pages with descriptions, dates, and associated sessions.
- Session scheduling
- Per‑course list of sessions with start/end times.
- Capacity, booked count, and remaining spaces displayed.
- Booking workflow
- Book an entire course or a single session.

Central booking service:
- Validates user and target course/session.
- Prevents duplicate active bookings.
- Enforces capacity constraints.
- Assigns statuses such as CONFIRMED, PENDING, and CANCELLED.
- Booking confirmation page with booking ID, status, and key details.
- Booking cancellation endpoint that updates booking status and session counts.

User‑facing pages:
- Home, course list, course detail, course booking, session booking.
- Booking confirmation.
- Login and signup pages (for coursework‑level auth flows).
- Basic account view.
- Organiser dashboard summarising courses and participants.

Architecture:
- Layered, MVC‑inspired design:
- Models (NeDB): users, courses, sessions, bookings.
- Services: booking logic centralised in bookingService.
- Controllers: route handlers + view models.
- Routes: auth, views, courses, sessions, bookings.
- Views: Mustache templates with shared partials.
- Single CSS stylesheet for a consistent, simple UI.


