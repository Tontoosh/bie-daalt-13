# Бие даалт 13 — Personal Task Tracker

**F.CSM311 Программ хангамжийн бүтээлт**  
**AI-Assisted Software Construction**

## Проектийн тухай
Personal Task Tracker — task CRUD, due date, priority, label, search/filter бүхий REST API + Vanilla JS frontend.

## Хэсгүүд
| Хэсэг | Зам | Агуулга |
|-------|-----|---------|
| А — Plan | `partA/` | Архитектур, stack харьцуулалт, CLAUDE.md, ADR-001 |
| Б — Build | `partB/` | Эх код, тестүүд, slash commands |
| В — Reflect | `partC/` | AI Usage Report, ADR-002, Self-evaluation |

## Хурдан эхлэх
```bash
cd partB
npm install
npm run dev
# http://localhost:3000
```

## Stack
- Node.js v20 + Express v4
- SQLite (better-sqlite3)
- Vanilla HTML/CSS/JS
- Jest + Supertest

## Холбоос
- [Part А — Plan](partA/README.md)
- [Part Б — Build](partB/README.md)
- [CLAUDE.md](CLAUDE.md)
