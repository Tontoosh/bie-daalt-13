# Part B - Build

Personal Task Tracker-ийн Express REST API, MySQL schema, Jest/Supertest tests, Vanilla JS frontend.

## Setup

```bash
npm install
cp .env.example .env
npm run migrate
npm start
```

Default URL: `http://localhost:3000`

## Test

```bash
npm test
npm run lint
```

Тест нь `.env.test` доторх MySQL database ашиглана.

## API

- `POST /api/users/register`, `POST /api/users/login`
- `/api/tasks` - task CRUD, filter by `status`, `priority`, `search`
- `/api/labels` - label CRUD
- `/api/projects`, `/api/notes`, `/api/calendar`, `/api/habits`, `/api/goals`, `/api/time`, `/api/notifications`, `/api/settings`

## Frontend

- `public/index.html` - login/register
- `public/dashboard.html` - tasks, labels, projects, notes, calendar, habits, goals, time, notifications, settings
