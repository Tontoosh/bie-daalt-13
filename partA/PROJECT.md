# PROJECT.md — Personal Task Tracker

## Сонгосон сэдэв
**Personal Task Tracker** (Сонголт #2)

## Товч тайлбар
Хэрэглэгч өөрийн өдөр тутмын ажлуудаа удирдах боломжтой веб апп. Task бүр нь гарчиг, тайлбар, дуусах хугацаа, тэргүүлэх дараалал (priority), label/tag-уудтай байна. Хэрэглэгч task-уудаа хайж, шүүж, засварлаж болно.

## Scope (Хамрах хүрээ)

### Багтсан (In Scope)
- Task CRUD (Create, Read, Update, Delete)
- Due date — хугацаа тогтоох, хугацаа дуусах анхааруулга (visual)
- Priority — Low / Medium / High / Urgent
- Label/Tag — нэг task олон label-тэй байж болно
- Search — гарчиг, тайлбараар хайх
- Filter — priority, label, status (todo/in-progress/done), due date-аар шүүх
- REST API (Node.js + Express)
- Хялбар frontend (Vanilla HTML/CSS/JS)
- SQLite өгөгдлийн сан

### Орхигдсон (Out of Scope)
- Хэрэглэгчийн нэвтрэх/бүртгэл (authentication)
- Олон хэрэглэгч дэмжлэг
- Мэдэгдэл (push notification / email)
- Mobile app
- Cloud deploy

## Үндсэн Feature-үүд (≥3)
1. **Task Management** — task үүсгэх, харах, засах, устгах
2. **Priority & Due Date** — тэргүүлэх дараалал тогтоох, хугацаа тавих
3. **Label & Filter** — label үүсгэж, task шүүж харах
4. **Search** — гарчиг болон тайлбараар хайлт хийх
5. **Status Tracking** — todo → in-progress → done гэсэн статус шилжилт

## Зорилго
AI workflow (Spec → Generate → Review → Integrate) ашиглан бодит жижиг проект хэрэгжүүлж, AI-тай хамтран ажиллах туршлага олж авах.
