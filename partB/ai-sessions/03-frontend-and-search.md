# AI Session 03 — Frontend (Vanilla JS) + Search Feature

**Огноо:** 2026-05-06  
**Зорилго:** REST API-тай холбогдох хялбар HTML/CSS/JS frontend, full-text search хэрэгжүүлэх

---

## Session-ийн товч

### Би юу асуусан
"Task tracker API-д хялбар Vanilla JS + HTML/CSS frontend бүтээхэд туслаач. Шаардлага: task жагсаалт, task үүсгэх форм, status/priority filter, хайлтын input. Framework, bundler хэрэггүй. Зүгээр fetch() ашиглаж localhost:3000 рүү хандана."

### Claude юу үүсгэсэн
- `public/index.html` — нэвтрэх/бүртгэх auth хуудас
- `public/dashboard.html` — үндсэн task dashboard
- `public/style.css` — цэвэрхэн орчин үеийн CSS (~300 мөр)
- `public/app.js` — fetch() wrapper-ууд, DOM удирдлага, state

### Би юу шалгаж зассан

**Засвар 1 — Task харуулахад XSS эмзэглэл**  
Claude task гарчиг харуулахад ингэж үүсгэсэн:
```js
taskEl.innerHTML = `<h3>${task.title}</h3>`;
```
Хэрэв task title нь `<script>alert(1)</script>` агуулбал ажиллах XSS эмзэглэл. Дараахаар солисон:
```js
const h3 = document.createElement('h3');
h3.textContent = task.title;
taskEl.appendChild(h3);
```

**Засвар 2 — Search debounce байхгүй**  
AI `input` event handler дотор дарах товч бүрт API request явуулдаг байсан. Хайлтын input-д энэ нь шаардлагагүй ачаалал үүсгэнэ. `setTimeout`/`clearTimeout` ашиглан 300ms debounce нэмсэн.

**Засвар 3 — Error handling байхгүй**  
`fetch()` дуудлага бүрт `.catch()` байгаагүй. Сүлжээний алдаа нь чимээгүй орхигддог байсан. UI-д алдааны мэдэгдэл харуулах ерөнхий catch нэмсэн.

### Аюулгүй байдлын тэмдэглэл
Frontend localStorage-д юу ч хадгалдаггүй (token, хэрэглэгчийн өгөгдөл байхгүй) — энэ нь frontend-д authentication хэрэгжүүлэхгүй гэсэн проектийн scope-оос гадуур шийдвэртэй нийцнэ. Backend `/api/users/login` endpoint байгаа боловч dashboard одоохондоо auth шаарддаггүй.

### Юу сайн ажилласан
- CSS чанартай, анхнаасаа mobile-responsive байсан
- Filter dropdown-ууд API query param-уудтай зөв холбогдсон
- Vanilla fetch() API ашиглалт зөв байсан (зохиомол method байгаагүй)

### Performance тэмдэглэл
Claude `AbortController`-ийг хийгдэж буй search request-ийг цуцлахад ашиглахыг санал болгосон бөгөөд үүнийг хэвээр үлдээсэн.

---

## Гол сургамж
AI UI boilerplate-д хүчтэй боловч XSS гэх мэт аюулгүй байдлын үндэс алдаг. Хэрэглэгчийн өгөгдлийг HTML руу дүрсэлдэг газар бүрийг гараар шалгах шаардлагатай. `innerHTML`-ийн оронд `textContent` анхдагчаар ашиглана.
