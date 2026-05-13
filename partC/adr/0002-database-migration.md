# ADR-002: SQLite-ээс MySQL/MariaDB руу шилжих шийдвэр

**Огноо:** 2026-05-13  
**Статус:** Accepted  
**Зохиогч:** Оюутан (AI-тай хамтран review хийсэн)

## Context

Part A дээр анхны төлөвлөгөө Node.js + Express + SQLite байсан. Энэ нь жижиг task tracker-т тохиромжтой, setup энгийн, test хурдан гэсэн давуу талтай гэж үзсэн. Гэвч Build хэсэгт project scope өргөжиж, users, tasks, labels, projects, habits, notes, goals, notifications, time entries, settings зэрэг олон entity-тэй болсон. Foreign key, cascade delete, олон table truncate хийх test setup, тусдаа test database зэрэг шаардлага нэмэгдсэн.

Энэ үед SQLite хэвээр үлдэх боломж байсан ч MySQL/MariaDB ашиглавал production-той төстэй relational database орчин бүрдэж, prepared statement, permission, schema migration, test database isolation зэрэг сургалтын ач холбогдол илүү өндөр гэж дүгнэсэн.

## Decision

Backend database layer-ийг `better-sqlite3`-ээс `mysql2/promise` руу шилжүүлж, schema init болон service query-г async/await + prepared statement pattern-оор хэрэгжүүлсэн.

## Considered Options

1. **SQLite хэвээр үлдээх**  
   Setup энгийн, локал файл хангалттай. Гэхдээ project олон table-тэй болж, MySQL permission/test DB workflow сурах боломж багасна.

2. **MySQL/MariaDB руу шилжих**  
   Setup арай их боловч real relational database workflow, prepared statement, FK constraint, cascade behavior, separate test DB зэрэгт илүү тохиромжтой.

3. **ORM нэмэх**  
   Prisma эсвэл Sequelize ашиглаж болох байсан. Гэхдээ assignment-ийн гол зорилго AI workflow ба review тул нэмэлт abstraction нь SQL security-г харах боломжийг багасгана.

## Consequences

**Эерэг:**
- Service layer дээр SQL query-г ил тод харж review хийх боломжтой.
- `pool.execute(sql, params)` pattern ашигласнаар SQL injection хамгаалалт тодорхой болсон.
- Test environment тусдаа `.env.test` болон `task_tracker_test` database ашигладаг.
- Foreign key болон cascade behavior-г бодит MySQL engine дээр шалгах боломжтой.

**Сөрөг:**
- Test ажиллуулахын өмнө локал MySQL/MariaDB service, user, database тохирсон байх шаардлагатай.
- Part A дээрх эхний SQLite төлөвлөгөө build-ийн бодит implementation-тэй зөрсөн. Энэ зөрүүг build явцын архитектурын өөрчлөлт гэж энэ ADR дээр тэмдэглэв.
- Async database code нэмэгдсэн тул error handling болон connection close хийхэд илүү анхаарах хэрэгтэй болсон.

## AI Review Notes

AI эхэндээ SQLite төлөвлөгөөг хадгалсан README/ADR текстүүдийг автоматаар бүрэн шинэчилж чадаагүй. Мөн `mysql2/promise` дээр `pool.query()` ашиглаж болно гэж санал гарсан хэсэг байсан. Review хийхдээ `pool.execute()` ашиглах convention тогтоож, dynamic value бүрийг param-аар дамжуулах шийдвэр гаргасан.

## Outcome

Эцсийн build нь Node.js + Express + MySQL/MariaDB + Vanilla JS frontend болсон. Энэ өөрчлөлт нь анхны plan-аас өөр боловч project-ийн бодит өргөжилт, security review, test isolation-д илүү нийцсэн.
