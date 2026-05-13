# Self-Evaluation

## 1. Хэрэв шалгалт өнөөдөр болбол би энэ кодыг өөрөө бичиж чадах уу?

**Хэсэгчлэн.** Route, controller, service гэсэн үндсэн Express бүтэц, task CRUD, label CRUD, search/filter, validation, prepared statement ашигласан SQL query-г би өөрөө бичиж чадна. Мөн Jest + Supertest ашиглан endpoint test бичих үндсэн аргачлалыг ойлгосон.

Харин project бүхэлдээ олон entity-тэй болсон тул бүх feature-ийг нэг дор AI-гүйгээр яг одоогийн хэмжээнд хурдан бичихэд цаг их орно. Ялангуяа MySQL schema-ийн бүх foreign key, cascade, test teardown order, frontend-ийн олон page-ийн DOM logic зэрэгт лавлагаа харах шаардлагатай. Гэхдээ code flow-г уншаад тайлбарлах, bug гарвал аль давхаргад хайхаа тодорхойлох чадвар нэмэгдсэн.

## 2. Дахин хийнэ гэвэл юуг өөрөөр хийх вэ?

Эхнээсээ scope-оо илүү хатуу барина. Assignment-д 3-5 feature хангалттай байсан тул users, projects, habits, goals, notifications, time tracking зэрэг олон feature нэмэхээс өмнө minimum pass checklist-ээ бүрэн дуусгах байсан. Ингэвэл documentation drift, test database setup, frontend complexity бага байх байлаа.

Мөн Part A дээр stack сонголтоо илүү уян хатан бичих байсан. Эхэнд SQLite гэж шийдсэн ч build дээр MySQL руу шилжсэн. Энэ нь зөв шийдвэр байж болох ч README, ADR, architecture document-уудыг нэг дор шинэчлэх шаардлага үүсгэсэн. Дараагийн удаа "initial plan" болон "final implementation decision" гэсэн хоёр түвшинг анхнаасаа тусад нь тэмдэглэнэ.

## 3. Энэ туршлагаас юу сурсан бэ?

AI хурд өгдөг ч инженерийн хариуцлагыг орлохгүй гэдгийг сурсан. AI route, service, test, documentation хурдан үүсгэнэ. Гэхдээ SQL injection, XSS, буруу package usage, scope creep, хуучирсан documentation зэрэг эрсдэлийг хүн өөрөө шалгах ёстой.

Мөн CLAUDE.md шиг project-specific convention файл хэрэгтэйг ойлгосон. No-go zone тодорхой байвал AI-ийн output-ийг review хийхэд илүү амар. Эцэст нь, commit history болон session log нь зөвхөн formal requirement биш, өөрийн хийсэн шийдвэрүүдийг эргэн тайлбарлах нотолгоо болдог гэдгийг ойлголоо.
