# Part B — Build: Personal Task Tracker

Node.js/Express REST API + Vanilla JS frontend + MySQL. Task CRUD, label, search, filter хэрэгжүүлсэн.

## Технологийн стек

| Давхарга | Хэрэгсэл |
|----------|----------|
| Runtime | Node.js 20 (CommonJS) |
| Framework | Express 4 |
| Database | MySQL 8 / MariaDB 10 |
| ORM | mysql2/promise (raw SQL + prepared statements) |
| Testing | Jest 29 + Supertest |
| Linting | ESLint 8 |
| Frontend | Vanilla HTML/CSS/JS (fetch API) |

## Суулгах ба ажиллуулах

```bash
# 1. Хамаарлуудыг суулгах
npm install

# 2. Орчны тохиргоо
cp .env.example .env
# .env файлыг засварлаж DB_HOST, DB_USER, DB_PASSWORD, DB_NAME тохируул

# 3. Schema үүсгэх (auto: server эхлэхэд хийгддэг)
npm start

# 4. Dev горим (nodemon-тэй)
npm run dev
```

Default URL: `http://localhost:3000`  
Frontend: браузерт `http://localhost:3000` нээх

## Тест

```bash
# Тест database тохируул (.env.test файлд)
cp .env.example .env.test
# DB_NAME=task_tracker_test болгох

# Тест ажиллуулах
npm test

# Coverage тайлантай
npm run test:coverage

# Lint шалгах
npm run lint
```

Тест нь `.env.test` доторх тусдаа MySQL database ашиглана. Тест бүрийн дараа таблицуудыг цэвэрлэнэ.

## Директорийн бүтэц

```
src/
  index.js            — Express app, middleware, server
  config/index.js     — Орчны тохиргоог нэгтгэсэн
  db/database.js      — MySQL pool, schema init (27 хүснэгт)
  routes/             — URL routing (нэг файл = нэг entity)
  controllers/        — HTTP давхарга (req/res, next)
  services/           — Business logic, DB query
  middleware/
    errorHandler.js   — Express error middleware
    validator.js      — Input validation helper
  utils/logger.js     — Console wrapper (prod-д нуугдана)
public/
  index.html          — Login/Register хуудас
  dashboard.html      — Task dashboard
  style.css           — UI стиль
  app.js              — Frontend JS (fetch, DOM)
tests/
  tasks.test.js       — Task CRUD (8 тест)
  labels.test.js      — Label CRUD + cascade (4 тест)
  users.test.js       — Register/Login/Auth (8 тест)
  helpers/mysqlTestHelper.js — Test DB setup/teardown
```

## Үндсэн API Endpoints

Бүрэн тодорхойлолтыг `openapi.yaml`-с харна.

### Tasks
| Method | Path | Тайлбар |
|--------|------|---------|
| GET | `/api/tasks` | Жагсаалт. `?status=`, `?priority=`, `?search=` дэмжинэ |
| POST | `/api/tasks` | Шинэ task үүсгэх |
| GET | `/api/tasks/:id` | Нэг task |
| PATCH | `/api/tasks/:id` | Task засах |
| DELETE | `/api/tasks/:id` | Task устгах |
| POST | `/api/tasks/:id/labels` | Label оноох |
| DELETE | `/api/tasks/:id/labels/:labelId` | Label авах |
| GET | `/api/tasks/:id/labels` | Task-ийн label-уудыг харах |

### Labels
| Method | Path | Тайлбар |
|--------|------|---------|
| GET | `/api/labels` | Бүх label |
| POST | `/api/labels` | Шинэ label (name, color) |
| DELETE | `/api/labels/:id` | Label устгах (task_labels cascade) |

### Users
| Method | Path | Тайлбар |
|--------|------|---------|
| POST | `/api/users/register` | Бүртгүүлэх (email, username, password) |
| POST | `/api/users/login` | Нэвтрэх |
| GET | `/api/users/:id` | Хэрэглэгч харах |

## Feature-үүд

1. **Task Management** — CRUD, status (todo → in-progress → done), priority (low/medium/high/urgent)
2. **Due Date** — хугацаа тогтоох, dashboard-д визуал тэмдэглэгдэнэ
3. **Label & Filter** — label үүсгэж task-д оноох, label/status/priority-аар шүүх
4. **Search** — гарчгаар хайх (LIKE query)
5. **Status Tracking** — todo → in-progress → in-review → done → cancelled

## AI Session Logs

`ai-sessions/` фолдерт 3 session хадгалсан:
- `01-task-crud-feature.md` — Task CRUD хэрэгжилт, SQL injection засвар
- `02-labels-and-filter.md` — Label систем, cascade тест, hallucination жишээ
- `03-frontend-and-search.md` — Frontend, XSS засвар, debounce

## Custom Slash Commands

`.claude/commands/` фолдерт 6 команд хадгалсан:
- `/review` — Security + robustness шалгалт
- `/test` — Jest + Supertest тест үүсгэх
- `/docs` — JSDoc + README хэсэг
- `/commit` — Conventional Commits мессеж
- `/security` — OWASP Top 10 аудит
- `/refactor` — Clean architecture refactor
