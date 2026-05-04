# AI Planning Session — Part А

**Огноо:** 2026-05-03  
**Хэрэгсэл:** Claude Code (claude-sonnet-4-6)  
**Зорилго:** Проектийн сэдэв, stack, архитектур тодорхойлох

---

## Session 1: Сэдэв болон Stack сонголт

**Миний асуулт:**
> "Personal task tracker хийхэд Node.js+Express+SQLite, Python+FastAPI+SQLite, эсвэл Go+Gin+SQLite-аас аль stack нь 2 долоо хоногийн хугацаанд хамгийн тохиромжтой вэ? Frontend нь Vanilla JS байна."

**Claude-ийн хариу (товч):**
- Node.js/Express — frontend болон backend хоёулаа JS, хурдан dev, better-sqlite3 synchronous
- Python/FastAPI — auto OpenAPI generation давуу тал, гэхдээ 2 хэл зэрэг
- Go/Gin — performance хамгийн өндөр, гэхдээ суралцах зардал их
- **Зөвлөмж:** Node.js — цаг хязгаарлалт, нэгдмэл хэл, AI code quality

**Миний шийдвэр:** Node.js + Express + SQLite сонгосон. Claude-ийн зөвлөмжтэй нийцсэн.

---

## Session 2: Архитектур тодорхойлох

**Миний асуулт:**
> "Personal task tracker-т хэдэн layer хэрэгтэй вэ? Controller, Service давхарга хэрэгтэй юу, эсвэл хэтэрхий their?"

**Claude-ийн хариу (товч):**
- 3 layer (Router → Controller → Service → DB) нь жижиг проектэд бага overkill мэт боловч AI-assisted development-д тэс давуу тал:
  - AI тест бичихэд Service layer-ийг тусад нь тест хийж болно
  - Controller нь thin байна — HTTP-ийн тухай л мэдэнэ
  - Service нь business logic-ийг агуулна
- Зөвлөмж: Controller + Service хуваалтыг ашигла

**Шийдвэр:** Controller/Service хуваалт хийнэ. Hallucination шалгалт: Express middleware chain талаар Claude "req.locals" гэж алдаатай дурдсан — `res.locals` мөн гэж зассан.

---

## Session 3: Өгөгдлийн загвар

**Миний асуулт:**
> "Task-Label харилцаа many-to-many байх уу? Label-г JSON array-аар tasks table-д хадгалах уу?"

**Claude-ийн хариу (товч):**
- JSON array (denormalized) → хайлт хийхэд хэцүү, SQLite-д `json_each` хэрэгтэй болно
- Many-to-many join table → хайлт хялбар, index дэмжинэ
- **Зөвлөмж:** `task_labels` join table ашигла

**Шийдвэр:** `tasks`, `labels`, `task_labels` — 3 хүснэгт. Claude-ийн зөвлөмж зөв байсан.

---

## Session 4: CLAUDE.md бүтэц

**Миний асуулт:**
> "CLAUDE.md-д ямар зүйл бичих хэрэгтэй вэ? No-go zones талаар жишээ өгнө үү."

**Claude-ийн хариу (товч):**
- Build commands, directory structure, code conventions
- No-go zones: SQL injection (raw string concat), eval(), hardcoded secrets
- AI session guidelines: generated code review, SQL check, package existence verify

**Шийдвэр:** Claude-ийн бүтцийг ашиглаж CLAUDE.md үүсгэсэн. Security no-go zones-ийг OWASP Top 10-тэй уялдуулсан.

---

## Ерөнхий дүгнэлт

| Асуулт | AI зөв байсан уу? |
|--------|------------------|
| Stack сонголт | Тийм — Node.js зөвлөмж зохих байсан |
| Layer architecture | Тийм — Controller/Service хуваалт зөв |
| Data model | Тийм — join table зөв зөвлөмж |
| `req.locals` алдаа | Үгүй — `res.locals` байх ёстой (засав) |

**Hallucination тэмдэглэл:** `req.locals` гэж буруу дурдсаныг баталгаажуулж `res.locals` гэж засав.
