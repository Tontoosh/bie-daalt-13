# AI Session 02 — Label Feature + Task Filter

**Огноо:** 2026-05-06  
**Зорилго:** Label CRUD, task-т label холбох, label-аар шүүх боломж хэрэгжүүлэх

---

## Session-ийн товч

### Би юу асуусан
"Task tracker-д label систем хэрэгтэй байна. Хэрэглэгч нэр болон өнгөтэй label үүсгэж болно. Label-ийг task-д оноож эсвэл авч болно. Task-уудыг label-аар шүүж харах боломжтой байх ёстой. Integration test ч үүсгэж өгөөч."

### Claude юу үүсгэсэн
- `src/services/labelService.js` — createLabel, getAllLabels, deleteLabel
- `src/controllers/labelController.js`
- `src/routes/labelRoutes.js`
- `taskService.js`-д assignLabel, removeLabel, getTaskLabels нэмсэн
- `taskRoutes.js`-д POST /tasks/:id/labels болон DELETE /tasks/:id/labels/:labelId нэмсэн
- `tests/labels.test.js` — 4 тест

### Би юу шалгаж зассан

**Засвар 1 — Байхгүй npm package санал болгосон**  
Claude `express-validator` package нэмэхийг санал болгосон. Package npm-д бодитоор байгаа ч Claude ашигласан import синтакс буруу байсан:
```js
// Claude санал болгосон (буруу)
const { body, validationResult } = require('express-validator');
```
Проект аль хэдийн `middleware/validator.js` custom файлтай тул нийцтэй байлгаж, express-validator import-ыг хаясан.

**Засвар 2 — Cascade тест дутуу**  
DELETE /labels/:id-ийн үүсгэсэн тест label устгахад task_label join row-уудыг ч устгаж байгааг шалгаагүй байсан. FK ON DELETE CASCADE end-to-end ажиллаж байгааг батлахын тулд тест кейсийг гараар нэмсэн.

**Засвар 3 — Color validation байхгүй**  
Claude `color` талбарыг баталгаажуулаагүй. Validator middleware-д hex өнгийн regex шалгалт нэмсэн: `/^#[0-9a-fA-F]{6}$/.test(color)`

### Hallucination илрүүлсэн
Claude үүсгэсэн router-т `GET /api/labels/:id` route нэмсэн боловч энэ endpoint PROJECT.md-ийн scope-д байгаагүй бөгөөд service функц ч байгаагүй. Тавиагүй scope creep-ийг хасан устгасан.

### Юу сайн ажилласан
- Many-to-many join table design (task_labels) эхний удаад зөв байсан
- INSERT IGNORE pattern label оноохдоо idempotent байлгах сайн санал байсан

---

## Гол сургамж
AI "бүрэн байлгах" гэж хамрах хүрээнээс гадуур нэмэлт route үүсгэдэг. Нэмэхийн өмнө үүсгэгдсэн route бүрийг PROJECT.md-ийн scope-тэй харьцуулж шалгана.
