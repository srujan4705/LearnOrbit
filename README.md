# LearnOrbit Local Backend Setup

This project now runs with:

- `Vite + React` for the frontend
- `Express` for the backend API
- `PostgreSQL` for the database
- `pgAdmin` for database creation and inspection

## 1. Prerequisites

Install these first:

1. `Node.js` 20+ or newer
2. `PostgreSQL` 14+ or newer
3. `pgAdmin 4`

## 2. Install Project Dependencies

From the project root run:

```bash
npm install
```

## 3. Create The Environment File

Copy `.env.example` to `.env` and update the values if needed.

```env
PORT=4000
APP_URL=http://localhost:5173
VITE_API_BASE_URL=/api

PGHOST=localhost
PGPORT=5432
PGDATABASE=learnorbit
PGUSER=postgres
PGPASSWORD=postgres

JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@learnorbit.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=LearnOrbit Admin

SEED_SAMPLE_DATA=true
```

## 4. Create The Database In pgAdmin

1. Open `pgAdmin 4`.
2. In the left sidebar, expand your PostgreSQL server.
3. Right-click `Databases`.
4. Click `Create` -> `Database...`
5. Enter `learnorbit` as the database name.
6. Keep the owner as your PostgreSQL user, usually `postgres`.
7. Click `Save`.

## 5. Run The SQL Schema In pgAdmin

The backend can auto-create the tables when it starts, but if you want to create them manually in pgAdmin:

1. Select the `learnorbit` database.
2. Right-click it and choose `Query Tool`.
3. Open the file [schema.sql](file:///c:/Users/pandi/github/LearnOrbit/backend/sql/schema.sql).
4. Copy the full SQL into the Query Tool.
5. Click the run button.

This creates:

- `users`
- `courses`
- `course_topics`
- `enrollments`
- `user_progress`
- `password_reset_tokens`

## 6. Start The App

Run both frontend and backend together:

```bash
npm run dev
```

This starts:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## 7. Admin Login

When the backend starts for the first time, it seeds an admin user automatically using the values from `.env`.

Default admin login:

- Email: `admin@learnorbit.com`
- Password: `Admin@123`

You can log in with that account and then:

- create courses
- add roadmap topics
- view learner progress
- test the full admin flow

## 8. How To Add Data Using Admin Login

After logging in as admin:

1. Open `Courses`
2. Click `New Course`
3. Fill the course details and save
4. Open the course roadmap
5. Add topics for each day and week
6. Log out
7. Register a learner account
8. Enroll in the course from `Browse Courses`
9. Submit daily progress from the learner dashboard

## 9. Password Reset Instructions

The local backend does not send real emails.

When a user submits `Forgot Password`:

1. The backend creates a reset token in the `password_reset_tokens` table.
2. The backend also prints the reset URL in the backend terminal.
3. Copy that URL and open it in the browser.
4. Set the new password.

You can also inspect the token from pgAdmin:

1. Open `learnorbit`
2. Open the `password_reset_tokens` table
3. Copy the latest `token`
4. Open:

```text
http://localhost:5173/reset-password?token=YOUR_TOKEN_HERE
```

## 10. Useful Commands

Run both apps:

```bash
npm run dev
```

Run only the backend:

```bash
npm run start:server
```

Build the frontend:

```bash
npm run build
```

Lint the code:

```bash
npm run lint
```

## 11. Notes

- Google login is disabled in this local backend version.
- Registration works with email and password.
- The backend keeps the existing frontend screens working through a compatibility client in [base44Client.js](file:///c:/Users/pandi/github/LearnOrbit/src/api/base44Client.js).
- The backend file is [server.js](file:///c:/Users/pandi/github/LearnOrbit/backend/server.js).
