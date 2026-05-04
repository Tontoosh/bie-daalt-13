# CLAUDE.md — Personal Task Tracker

## Проектийн тойм
Personal Task Tracker — Node.js/Express REST API + Vanilla JS frontend + SQLite.
Код нь `partB/src/` дотор байна.

## Build & Run Commands

```bash
# Суулгах
cd partB && npm install

# Dev server (nodemon)
npm run dev

# Production
npm start

# Тест (Jest + Supertest)
npm test
npm run test:coverage

# Lint
npm run lint
```

## Директор бүтэц
```
partB/src/
  index.js          — Express app, middleware тохируулга
  routes/           — URL routing
  controllers/      — HTTP layer (request/response)
  services/         — Business logic, DB queries
  middleware/       — validator, error handler
  db/database.js    — SQLite init, connection
partB/public/       — Static frontend files
partB/tests/        — Jest тест файлууд
.claude/commands/   — Custom slash commands
```

## Code Conventions

### JavaScript
- ES2022+ (async/await, optional chaining, nullish coalescing)
- CommonJS (`require`/`module.exports`) — ESM биш
- 2 space indent
- Single quotes нь string literal-д
- Semicolon: заавал бичнэ
- Arrow function нь callback-д, named function нь controller/service-д

### Нэрлэлт
- File: `camelCase.js`
- Function/variable: `camelCase`
- Constant: `UPPER_SNAKE_CASE`
- DB column: `snake_case`
- Route: `/api/kebab-case`

### Error handling
- Controller-д try/catch — service layer error-ийг дамжуулна
- `next(err)` Express error middleware рүү дамжуулна
- HTTP status code: 400 (validation), 404 (not found), 500 (server error)

### Database
- `better-sqlite3` — synchronous, async/await хэрэглэхгүй
- Prepared statement заавал ашиглана — SQL injection хамгаалалт
- Schema init: `src/db/database.js`-д `initSchema()` функц

## Testing Standards
- Jest + Supertest
- Test файл нэр: `*.test.js`
- In-memory SQLite тест тус бүрд (`':memory:'`)
- Mock: external service-д, DB-д биш
- Coverage target: ≥70% (lines)

## No-Go Zones (Хориглосон)
- SQL-д raw string concatenation **ХОРИГЛОНО** — prepared statement заавал
- `eval()` хэрэглэх **ХОРИГЛОНО**
- `require('child_process')` хэрэглэх **ХОРИГЛОНО** (зохих шалтгаангүй бол)
- `console.log` production code-д **ХОРИГЛОНО** — logger ашиглана
- `process.env` шууд ашиглах биш — config module-ээр
- Password/secret-ийг code-д hardcode **ХОРИГЛОНО**
- `*` glob import биш — тодорхой import хэрэглэнэ
- Test-д `describe.only` / `it.only` commit хийх **ХОРИГЛОНО**

## AI Session Guidelines
- AI үүсгэсэн code бүрийг review хийнэ
- SQL query бүрийг injection-д шалгана
- AI-ийн санал болгосон package нэр npm-д бодитоор байгааг шалгана
- Hallucination байж болох тул API/library docs-ийг баталгаажуулна

## Git Workflow
- Branch: `main` болон `feature/*`
- Commit format: Conventional Commits
  - `feat: `, `fix: `, `docs: `, `test: `, `refactor: `, `chore: `
- AI-тай хийсэн commit-д: `Co-Authored-By: Claude <noreply@anthropic.com>`
- Push хийхийн өмнө `npm test` pass болсон байна
