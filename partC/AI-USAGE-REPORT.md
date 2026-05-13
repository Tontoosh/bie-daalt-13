# AI Usage Report

## Тойм

Энэ бие даалтын зорилго нь AI-аар код "шууд бичүүлэх" биш, харин AI-тай хамтран ажиллахдаа spec гаргах, үүсгэсэн үр дүнг шалгах, алдааг илрүүлэх, өөрийн архитектурын шийдвэрийг хамгаалах дадал авах байсан. Миний сонгосон төсөл бол Personal Task Tracker. Эхний scope нь task CRUD, due date, priority, label, search/filter байсан боловч build явцад хэрэглэгч, төсөл, habit, note, goal, notification, time tracking зэрэг нэмэлт entity-тэй болж өргөжсөн. Энэ өргөтгөл нь шаардлагаас давсан боловч гол шалгуур болох 3-аас дээш feature, тест, API spec, session log, custom slash command-уудыг хангах зорилготой байсан.

AI-г би гурван үндсэн чиглэлд ашигласан. Нэгдүгээрт, төлөвлөлтийн үед stack харьцуулах, folder structure, Mermaid architecture diagram, ADR draft гаргахад ашигласан. Хоёрдугаарт, implementation үед Express route, controller, service, validation, Jest/Supertest test-ийн boilerplate үүсгэхэд ашигласан. Гуравдугаарт, review үед security, hallucination, SQL injection, XSS, test coverage, README/OpenAPI зөрүүг шалгахад ашигласан. Гэхдээ AI-аас гарсан бүх зүйлийг шууд зөв гэж үзээгүй. CLAUDE.md дээр no-go zone бичиж, SQL query бүрт prepared statement хэрэглэж байгаа эсэх, frontend дээр хэрэглэгчийн өгөгдлийг `innerHTML`-ээр оруулж байгаа эсэх, endpoint нь scope-тэй нийцэж байгаа эсэхийг гараар шалгасан.

## 1. Юуг AI хийсэн, юуг өөрөө хийсэн бэ?

Part A буюу Plan хэсэгт AI хамгийн ихээр эхний draft гаргахад тусалсан. Би Personal Task Tracker гэсэн сэдвийг сонгосон, feature-ийн хүрээг өөрөө тогтоосон. AI-аас Node.js/Express, Python/FastAPI, Go/Gin гэсэн гурван stack-ийн харьцуулалт гаргуулсан. Түүний дараа би 2 долоо хоногийн хугацаа, өөрийн JavaScript туршлага, frontend/backend нэг хэлтэй байх давуу талыг харгалзан Node.js + Express-ийг сонгосон. AI architecture diagram, module description, ADR-001 draft гаргасан боловч би scope, no-go zone, build command, test command, naming convention-уудыг өөрийн төслийн бодит бүтэцтэй тааруулж зассан.

Part B буюу Build хэсэгт AI route/controller/service-ийн эхний skeleton бичихэд хурдан тусалсан. Жишээ нь task CRUD дээр AI `taskService.js`, `taskController.js`, `taskRoutes.js` гэсэн гурван давхаргыг санал болгосон. Би энэ давхаргыг зөв гэж үзсэн учраас бүх feature дээр ижил pattern барьсан. Гэхдээ SQL query, validation, error status code, test setup зэргийг гараар шалгасан. Label feature дээр AI many-to-many `task_labels` table санал болгосон нь зөв байсан, харин scope-д байхгүй endpoint нэмэх гэж оролдсон тул хассан. Frontend дээр AI form, filter, dashboard-ийн DOM logic бичихэд тусалсан боловч XSS эрсдэлтэй `innerHTML` хэрэглэсэн хэсгийг би гараар зассан.

Part C буюу Reflect хэсэгт AI-аас тайлангийн бүтэц, гол асуултуудыг марталгүй хамруулахад тусламж авсан. Гэхдээ энд бичигдсэн жишээнүүд нь build явцад үнэхээр гарсан зүйл дээр тулгуурласан: SQL injection, `pool.query`/`pool.execute` зөрүү, route scope creep, XSS, SQLite-ээс MySQL рүү шилжих шийдвэр. Өөрөөр хэлбэл AI текстийн хэлбэрийг цэгцлэхэд тусалсан ч туршлага, дүгнэлт, өөрийн суралцсан зүйлсийг би шалгаж нэг бүрчлэн баталгаажуулсан.

## 2. Hallucination-ийн 2+ жишээ

Эхний hallucination нь database driver-ийн API дээр гарсан. Төсөл `mysql2/promise` ашиглах үед prepared statement хийх зөв арга нь `pool.execute(sql, params)` байсан. Гэтэл AI зарим service function-д `pool.query()` ашиглаж болно гэж санал болгосон. Зарим нөхцөлд `query()` ажиллаж болох боловч манай convention болон SQL injection хамгаалалтын шаардлагад `execute()` илүү тохиромжтой. Би database module болон mysql2 documentation-ийн ашиглалтыг шалгаад бүх dynamic query-г `execute()` болгосон. Энэ нь жижиг syntax зөрүү мэт харагдавч аюулгүй байдлын хувьд чухал байсан.

Хоёр дахь hallucination нь route scope дээр гарсан. Label feature бичүүлэхэд AI `GET /api/labels/:id` endpoint нэмэх санал гаргасан. Гэвч PROJECT.md болон assignment-ийн minimum feature-д label detail endpoint шаардлагагүй байсан. Service function нь бүрэн бичигдээгүй, test ч байхгүй байсан тул энэ нь "бүрэн болгох" гэж оролдсон хийсвэр нэмэлт болсон. Би route list-ийг scope-тэй харьцуулж, энэ endpoint-ийг хассан. Энэ жишээ надад AI ихэвчлэн "магадгүй хэрэгтэй" feature нэмдэг, харин жижиг project дээр scope control илүү чухал гэдгийг харуулсан.

Гурав дахь hallucination нь tooling дээр гарсан. Эхний plan хэсэгт SQLite болон `better-sqlite3` сонгосон боловч build явцад орчны шаардлага, test database-ийн тусгаарлалт, олон table-тэй schema зэргээс шалтгаалан MySQL/MariaDB ашиглах нь илүү бодитой болсон. AI зарим README хэсэгт SQLite гэж үлдээсэн текстүүдийг автоматаар шинэчилж чадаагүй. Үүнийг grep хийж илрүүлсэн. Build-ийн бодит байдалтай нийцүүлэхийн тулд CLAUDE.md болон Part B README дээр MySQL/MariaDB гэж засаж, харин энэ өөрчлөлтийг ADR-002 дээр тусдаа архитектурын шийдвэр болгон тайлбарласан.

## 3. Security/license-ийн анхаарал

Security-ийн хамгийн тод жишээ нь SQL injection байсан. Task search query эхэндээ string interpolation ашиглах хэлбэртэй гарсан:

```js
sql += ` AND title LIKE '%${search}%'`;
```

Хэрэглэгч search input дээр `' OR 1=1 --` гэх мэт өгвөл query-ийн утга өөрчлөгдөх эрсдэлтэй. Би үүнийг prepared statement болгож зассан:

```js
sql += ' AND t.title LIKE ?';
params.push(`%${search}%`);
```

Энэ зарчим бүх service layer дээр давтагдсан. Dynamic value бүр SQL text-ээс тусдаа param болж дамжих ёстой. CLAUDE.md-д "raw string concatenation хориглоно" гэж бичсэн нь review хийхэд тодорхой checklist болсон.

Frontend security дээр XSS эрсдэл гарсан. AI task title, note content, label name зэрэг хэрэглэгчийн өгөгдлийг card дээр харуулахдаа `innerHTML` ашиглах санал гаргасан. Хэрэв хэрэглэгч `<img src=x onerror=alert(1)>` гэх мэт өгөгдөл оруулбал browser HTML гэж тайлбарлаж ажиллуулж болно. Би DOM үүсгэхдээ `document.createElement()` болон `textContent` ашигласан. Энэ нь илүү урт код боловч security-ийн хувьд зөв. Бага хэмжээний vanilla JS project дээр ч энэ дүрэм чухал гэдгийг ойлгосон.

License тал дээр AI-аас гарсан кодонд гаднын proprietary snippet шууд хуулсан эсэхийг би шалгах шаардлагатай гэж үзсэн. Төсөлд зөвхөн нийтлэг npm package-ууд (`express`, `mysql2`, `bcrypt`, `jest`, `supertest`) ашигласан. AI санал болгосон package бүрийг package.json-д нэмэхээс өмнө хэрэгтэй эсэхийг бодсон. Жишээ нь `express-validator` санал гарсан боловч төсөлд custom validator аль хэдийн байсан тул нэмээгүй. Ингэснээр dependency surface бага хэвээр үлдсэн.

## 4. Юуг AI-аар хурдан хийсэн бэ?

AI хамгийн их цаг хэмнэсэн хэсэг бол boilerplate болон test case-ийн эхний хувилбар байсан. Express project дээр route, controller, service гэсэн давхарга олон entity дээр давтагддаг. Нэг feature дээр pattern тогтсоны дараа AI-аар дараагийн feature-ийн skeleton гаргуулахад хурдан байсан. Жишээ нь habits, goals, notes, notifications, time entries зэрэг feature-үүд дээр үндсэн CRUD structure, request validation, response shape, Supertest test-ийн эхний жагсаалтыг хурдан гаргасан.

Мөн documentation дээр AI хурдан тусалсан. README-ийн build/run/test хэсэг, OpenAPI endpoint-ийн table, AI session log-ийн товч хураангуйг гаргахад их цаг хэмнэсэн. Гэхдээ documentation-г AI-аар бичүүлэхэд бодит кодтой зөрөх эрсдэл өндөр байдаг. Тиймээс endpoint path, command, environment variable, database нэр зэргийг файлуудтай тулгаж зассан.

Custom slash command-уудыг үүсгэхэд AI сайн байсан. `/review`, `/test`, `/docs`, `/commit`, `/security`, `/refactor` командууд нь workflow-ийн тодорхой алхмуудыг сануулах зориулалттай. Эдгээр нь зөвхөн assignment-ийн checklist хангах биш, өөрөө давтан ашиглах review checklist болсон.

## 5. Юуг AI-аар удаан хийсэн бэ?

AI-аар удаан болсон хэсэг нь project-ийн бодит context ихсэх үед гарсан зөрүүг засах ажил байсан. Эхэндээ task tracker жижиг байсан ч дараа нь олон entity-тэй болсон. Энэ үед AI зарим хуучин assumption буюу SQLite, auth out of scope, цөөн table гэсэн ойлголтоо хадгалж үлдсэн. Үүнийг засахын тулд grep хийж, README, ADR, CLAUDE.md, DATABASE.md зэрэг файлуудыг тулгах шаардлагатай болсон.

Мөн AI заримдаа нэг асуудлыг засахдаа хэт том refactor санал болгодог. Жишээ нь validation сайжруулахад шинэ package нэмэх, controller давхаргыг бүрэн дахин бичих, generic repository abstraction үүсгэх гэх мэт. Жижиг assignment дээр ийм refactor нь risk нэмнэ. Би existing pattern-ийг хадгалахыг илүүд үзсэн. Энэ нь "AI санал болговол заавал хийх" биш, харин төсөлд тохирох хамгийн жижиг өөрчлөлтийг сонгох ёстой гэдгийг ойлгуулсан.

Test failure debug дээр AI заримдаа алдааны үндэс болсон environment асуудлыг code bug гэж андуурах магадлалтай. MySQL service асаагүй эсвэл `.env.test` тохироогүй үед бүх test `AggregateError` дээр унадаг. Ийм үед эхлээд DB connection, user permission, database exists эсэхийг шалгах хэрэгтэй. Шууд service code засах нь буруу.

## 6. Skill atrophy эрсдэлийг яаж зохицуулсан бэ?

AI ашиглахад хамгийн том эрсдэл нь өөрөө бичих чадвар сулрах явдал. Үүнийг багасгахын тулд би хэд хэдэн дүрэм барьсан. Нэгдүгээрт, AI үүсгэсэн code бүрийг уншиж, route → controller → service → database flow-г өөрөө тайлбарлаж чадах хүртэл commit хийхгүй байхыг зорьсон. Хоёрдугаарт, SQL query, validation, error handling зэрэг хэсгийг гараар шалгасан. Гуравдугаарт, session log дээр "AI юу хийсэн, би юу зассан" гэдгийг бичсэн. Ингэснээр би зөвхөн үр дүн биш, шийдвэрийн шалтгааныг санаж үлдсэн.

AI байхгүй цаг гаргахын тулд зарим test case болон жижиг bug fix-ийг өөрөө бичсэн. Жишээ нь cascade delete тест, hex color validation, XSS засвар, error status code нэмэх зэрэг нь AI-ийн эхний draft-аас хойш миний хийсэн review-oriented ажил байсан. Энэ төрлийн жижиг боловч чухал засварууд нь project-ийг ойлгоход илүү тусалсан.

Мөн би өөрийгөө шалгахын тулд "энэ endpoint-ийг цаасан дээр зурвал ямар дарааллаар ажиллах вэ?" гэсэн асуултыг ашигласан. Жишээ нь task үүсгэх request ирэхэд Express route эхэлж ажиллана, controller request body-г авч validation хийлгэнэ, service prepared statement-тай INSERT query ажиллуулна, database insert id буцаана, controller JSON response илгээнэ. Энэ дарааллыг AI-гүйгээр тайлбарлаж чадвал би тухайн feature-ийг үнэхээр ойлгосон гэж үзсэн. Харин тайлбарлаж чадахгүй байвал код ажиллаж байсан ч дахин уншсан.

Test бичих үед ч адилхан арга хэрэглэсэн. AI-аар test skeleton гаргуулсны дараа би assertion бүр юу баталж байгааг шалгасан. Жишээ нь 400 status шалгах нь зөвхөн error буцсан эсэх биш, validation middleware үнэхээр controller-оос өмнө ажиллаж байгаа эсэхийг батална. 404 test нь service layer missing row-г зөв error status болгон хувиргаж байгаа эсэхийг харуулна. Cascade delete test нь database schema болон service behavior хоёр зэрэг зөв байгааг батална. Ингэж test-ийг механик requirement биш, ойлголтоо шалгах хэрэгсэл болгосон.

Эцэст нь би AI-д хэт найдахгүй байх нэг practical дүрэм тогтоосон: AI санал болгосон шинэ package, шинэ abstraction, шинэ endpoint бүрийг шууд авахгүй. Эхлээд "энэ assignment-ийн pass шалгуурт хэрэгтэй юу, existing pattern эвдэх үү, test бичих боломжтой юу" гэж шалгана. Энэ нь хурд багасгаж байгаа мэт боловч дараа нь debug хийх хугацааг хэмнэсэн.

Дүгнэж хэлбэл, AI production benefit өгсөн: хурдан scaffold, олон test case, documentation, review checklist. Гэхдээ AI-г хянахгүй бол hallucination, security issue, scope creep, documentation drift үүсдэг. Энэ бие даалтаас би AI-тай ажиллах хамгийн зөв байр суурь бол "үүсгэсэн бүхнийг итгэх" биш, харин "AI-г хурдны хэрэгсэл болгож, инженерийн шийдвэрийг өөрөө хариуцах" гэдгийг сурсан.
