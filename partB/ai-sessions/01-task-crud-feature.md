# AI Session 01 — Task CRUD Feature-ийн хэрэгжилт

**Огноо:** 2026-05-05  
**Зорилго:** Task CRUD endpoint-уудыг (POST, GET, PATCH, DELETE) filter/search-тэй хамт хэрэгжүүлэх

---

## Session-ийн товч

### Би юу асуусан
"Task-ийн REST API endpoint хэрэгжүүлэхэд туслаач. Шаардлага: title, description, priority, due_date-тэй task үүсгэх; status болон priority-аар шүүж харах; title-аар хайх; update болон delete хийх."

### Claude юу үүсгэсэн
- `src/services/taskService.js` — getAllTasks, getTaskById, createTask, updateTask, deleteTask
- `src/controllers/taskController.js` — HTTP layer, service рүү дамжуулдаг
- `src/routes/taskRoutes.js` — GET, POST, PATCH/:id, DELETE/:id бүхий Express router

### Би юу шалгаж зассан

**Засвар 1 — SQL injection эрсдэл илрүүлсэн**  
Claude эхлээд search query-г ингэж үүсгэсэн:
```js
sql += ` AND title LIKE '%${search}%'`
```
Энэ нь string concatenation — SQL injection эмзэглэл. Prepared statement болгон засав:
```js
sql += ' AND t.title LIKE ?';
params.push(`%${search}%`);
```

**Засвар 2 — mysql2 синтаксийн hallucination**  
Claude `pool.query()` ашигласан, гэтэл энэ проект `mysql2/promise` хэрэглэдэг бөгөөд prepared statement-д `pool.execute()` шаардлагатай. Бүх дуудлагыг `execute()` болгон засав.

**Засвар 3 — Error status code дутуу**  
Service `new Error('not found')` хаясан боловч `.status` байгаагүй. Error middleware зөв HTTP код буцаахын тулд `err.status = 404` нэмсэн.

### Юу сайн ажилласан
- Controller → service → DB бүтэц эхний удаад зөв гарсан
- Middleware дахь validation logic хатуу байсан — title дутуу болон буруу enum утгыг зөв барьсан

### Тест үүсгэхэд хэрэглэсэн prompt
"Tasks API-д Jest + Supertest integration test бич. Дараахыг хамруул: хоосон GET, defaults-тэй create, title дутуу үед 400, буруу status үед 400, id-аар GET, id олдохгүй үед 404, status-ийн PATCH, DELETE, байхгүй task-ийг delete хийхэд 404."

---

## Гол сургамж
AI boilerplate-д хурдан боловч проект-тэй холбоотой заншлыг (pool.execute vs pool.query) алддаг. Үүсгэсэн SQL бүрийг commit хийхийн өмнө CLAUDE.md-ийн no-go zone-уудтай харьцуулж шалгана.
