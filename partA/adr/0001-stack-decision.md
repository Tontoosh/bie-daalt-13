# ADR-001: Stack сонголт — Node.js + Express + SQLite

**Огноо:** 2026-05-03  
**Статус:** Accepted  
**Зохиогч:** Оюутан (AI-тай хамтран)

---

## Нөхцөл байдал (Context)

Personal Task Tracker веб апп хөгжүүлэхийн тулд backend framework, database сонгох шаардлагатай болсон. Дараах хязгаарлалтууд байна:
- Хугацаа: 2 долоо хоног
- Нэг хүний проект
- AI workflow (Spec → Generate → Review → Integrate) ашиглах
- ≥3 feature, ≥10 unit test шаардлага
- Deployment хийхгүй — local development хангалттай

## Авч үзсэн хувилбарууд (Considered Options)

1. **Node.js + Express + SQLite** ← *Сонгосон*
2. **Python + FastAPI + SQLite**
3. **Go + Gin + SQLite**

## Шийдвэр (Decision)

**Node.js v20 + Express v4 + SQLite (better-sqlite3)** сонгосон.

## Үндэслэл (Rationale)

### Node.js + Express сонгосон шалтгаан

**1. Хэлний нэгдмэл байдал**  
Frontend (Vanilla JS) болон backend хоёулаа JavaScript. Нэг хэлний орчинд ажиллах нь:
- Хувьсагч, функцийн нэрлэлт дундаа нийцтэй
- Context switch (Python ↔ JS) байхгүй
- Shared utility function боломжтой

**2. Цаг хугацааны хязгаарлалт**  
2 долоо хоног богино хугацаанд шинэ хэл (Go) сурахад цаг зарцуулахгүйгээр architecture болон AI workflow-д анхаарлаа төвлөрүүлнэ.

**3. AI code generation чанар**  
Claude Code нь Node.js/Express-д маш их training data-тай. Code generation, review, debug-ийн чанар бусдаасаа илүү байна гэж дүгнэсэн.

**4. better-sqlite3 давуу тал**  
Synchronous API нь async/await complexity-г арилгана. Жижиг проектэд энэ нь хурд болон хялбар байдлыг өгнө. Тест тус бүрд `:memory:` DB ашиглах боломжтой.

**5. Jest + Supertest**  
≥10 тест бичих шаардлагыг Jest + Supertest хослолоор хялбар хэрэгжүүлнэ. Express app-г шууд test хийж болно.

### Python/FastAPI-г орхисон шалтгаан
- Frontend JS + Backend Python → 2 хэл зэрэг
- Pydantic, async pattern суралцах нэмэлт цаг зардал
- venv environment manage нэмэлт complexity

### Go/Gin-г орхисон шалтгаан
- Шинэ хэл — 2 долоо хоногт сурах эрсдэлтэй
- Verbose boilerplate код
- cgo (SQLite) нь build environment-д нөлөөлнэ

## Үр дагавар (Consequences)

**Эерэг:**
- Хурдан хөгжүүлэлт — аль хэдийн мэддэг хэрэгслүүд
- AI code quality өндөр
- Simple sync DB layer

**Сөрөг:**
- Python/FastAPI-ийн built-in OpenAPI auto-generation алга → swagger-jsdoc ашиглана
- Single-threaded Node.js — (энэ проектэд хамаагүй)
- TypeScript байхгүй → тест болон validation-д илүү анхаарна

## Холбогдох ADR
- ADR-002 (partC-д): Build явцад гарсан нэмэлт шийдвэр
