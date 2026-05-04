# STACK-COMPARISON.md — Stack Харьцуулалт

## Харьцуулсан 3 Stack

### Stack 1: Node.js + Express + SQLite
| Шинж | Үнэлгээ |
|------|---------|
| Хурд (dev speed) | ★★★★★ — JS нэг хэл, frontend/backend дундаа |
| Суралцах зардал | ★★★★★ — аль хэдийн мэддэг |
| Ecosystem | ★★★★☆ — npm маш том |
| Performance | ★★★☆☆ — single-threaded, жижиг проектэд хангалттай |
| Deployment | ★★★★☆ — Node anywhere ажиллана |
| SQLite интеграц | ★★★★★ — better-sqlite3, хялбар |
| Testing | ★★★★☆ — Jest, Supertest |

**Давуу тал:**
- Frontend болон backend хоёулаа JavaScript → context switch байхгүй
- npm ecosystem маш том, хэрэгтэй бүх package бэлэн
- better-sqlite3 нь synchronous — async complexity байхгүй
- Express нь энгийн, over-engineered биш

**Сул тал:**
- Single-threaded — CPU-intensive ажилд тохиромжгүй
- Type safety байхгүй (TypeScript ашиглавал давхар зардал)

---

### Stack 2: Python + FastAPI + SQLite
| Шинж | Үнэлгээ |
|------|---------|
| Хурд (dev speed) | ★★★★☆ — Python уншихад хялбар |
| Суралцах зардал | ★★★☆☆ — async/await, Pydantic schema шинэ |
| Ecosystem | ★★★★★ — pip маш том |
| Performance | ★★★★☆ — async IO дэмжинэ |
| Deployment | ★★★☆☆ — Python environment manage хэцүү |
| SQLite интеграц | ★★★★☆ — sqlite3 built-in, SQLAlchemy дэмжинэ |
| Testing | ★★★★☆ — pytest |

**Давуу тал:**
- FastAPI нь OpenAPI spec автоматаар үүсгэнэ
- Pydantic-аар input validation хялбар
- Type hints нь code quality сайжруулна

**Сул тал:**
- Frontend JavaScript байхад backend Python — хоёр хэл зэрэг ашиглах
- Virtual environment (venv) тохируулах нэмэлт алхам
- Async pattern суралцах шаардлагатай

---

### Stack 3: Go + Gin + SQLite
| Шинж | Үнэлгээ |
|------|---------|
| Хурд (dev speed) | ★★★☆☆ — verbose syntax |
| Суралцах зардал | ★★☆☆☆ — шинэ хэл, concept олон |
| Ecosystem | ★★★☆☆ — growing but smaller |
| Performance | ★★★★★ — compiled, very fast |
| Deployment | ★★★★★ — single binary |
| SQLite интеграц | ★★★☆☆ — cgo dependency бий |
| Testing | ★★★★☆ — built-in testing package |

**Давуу тал:**
- Маш хурдан performance
- Single binary deploy
- Strong typing

**Сул тал:**
- Go хэл шинэ — суралцах зардал өндөр
- Boilerplate код их
- cgo (SQLite) нь cross-compilation хэцүү болгоно
- 2 долоо хоногийн хугацаанд шинэ хэл сурж проект хийх эрсдэлтэй

---

## Сонгосон Stack: **Node.js + Express + SQLite**

### Сонгосон үндэслэл

1. **Хэлний нэгдмэл байдал** — Frontend болон backend хоёулаа JavaScript. Контекст солих хугацаа хэмнэгдэж, нэг ухаалаг тогтолцоонд ажиллана.

2. **Цаг хугацааны хязгаарлалт** — 2 долоо хоног. Node.js/Express аль хэдийн мэддэг учраас шинэ хэл сурахад цаг зарцуулахгүйгээр архитектур, AI workflow дээр анхаарлаа төвлөрүүлж чадна.

3. **better-sqlite3** — Synchronous SQLite driver. Жижиг проектэд async complexity нэмэхгүйгээр хялбар интеграц хийнэ.

4. **Jest + Supertest** — Unit болон integration тест маш хялбар бичигдэнэ. Шаардлагатай ≥10 тестийг хурдан хэрэгжүүлнэ.

5. **AI-тай ажиллахад тохиромжтой** — Claude Code нь Node.js/Express-д маш их train хийгдсэн тул code generation, review чанар өндөр байна.

### AI харьцуулалтын session товч
Claude-тай дараах асуултыг хэлэлцсэн:
- "Personal task tracker-т хамгийн тохиромжтой stack аль вэ?"
- Claude: Node.js/Express болон Python/FastAPI хоёрыг санал болгосон, Go-г performance-д зориулагдсан учраас энэ хэмжээний проектэд хэт их гэж дурдсан.
- Миний шийдвэр: Node.js — хэлний нэгдмэл байдал, цаг хязгаарлалт, AI code quality.
