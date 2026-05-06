# Database Documentation — Personal Task Tracker

## 1. Ерөнхий мэдээлэл

- **DBMS:** MariaDB 11.8 (MySQL 8.0-тэй нийцтэй)
- **Engine:** InnoDB — transaction, FK, row-level lock дэмждэг
- **Charset:** utf8mb4 — emoji болон бүх Unicode тэмдэгтийг зөв хадгалдаг
- **Collation:** utf8mb4_unicode_ci — том/жижиг үсгийг ялгадаггүй харьцуулалт
- **Driver:** mysql2/promise — Node.js async/await дэмжлэгтэй
- **Connection:** Pool (connectionLimit: 10) — олон хүсэлтийг зэрэг боловсруулна

---

## 2. Холболтын тохиргоо

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=taskuser
DB_PASSWORD=taskpass123
DB_NAME=task_tracker
```

Connection pool нь дараах байдлаар ажилладаг:
- Хүсэлт ирэхэд pool-оос чөлөөт connection авна
- Хэрэв бүх connection завгүй бол дараалалд хүлээнэ (queueLimit: 0 = хязгааргүй)
- Хүсэлт дуусмагц connection pool-руу буцна — хаагддаггүй

---

## 3. Бүтэн Schema (27 хүснэгт)

### 3.1 AUTH LAYER

#### users
Системийн бүх хэрэглэгч. Нэвтрэлт, бүртгэл энд хадгалагдана.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK AUTO_INCREMENT | Давтагдашгүй ID |
| email | VARCHAR(255) UNIQUE NOT NULL | Нэвтрэх имэйл |
| username | VARCHAR(100) UNIQUE NOT NULL | Харагдах нэр |
| password_hash | VARCHAR(255) NOT NULL | bcrypt hash (cost=10) |
| avatar_url | VARCHAR(500) | Профайл зураг |
| is_active | TINYINT(1) DEFAULT 1 | Идэвхтэй эсэх |
| created_at | DATETIME DEFAULT NOW | Бүртгэсэн огноо |
| updated_at | DATETIME ON UPDATE NOW | Засварласан огноо |

**Index:** UNIQUE(email), UNIQUE(username)

**Аюулгүй байдал:**
- Password-г bcrypt-ээр hash хийнэ, plaintext хадгалдаггүй
- `verifyPassword()` функц bcrypt.compare() ашиглана
- API response-д `password_hash` багана хэзээ ч буцдаггүй

---

#### refresh_tokens
JWT refresh token-уудыг хадгалана. Access token дуусмагц шинэчлэхэд хэрэглэнэ.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| token_hash | VARCHAR(255) UNIQUE | Token-ийн hash |
| expires_at | DATETIME | Дуусах хугацаа |
| created_at | DATETIME DEFAULT NOW | |

**Index:** UNIQUE(token_hash), INDEX(user_id), INDEX(expires_at)

---

#### user_settings
Хэрэглэгч тус бүрийн тохиргоо. users-тэй 1:1 хамаарал.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| user_id | INT UNSIGNED PK FK→users CASCADE | |
| theme | ENUM('light','dark','system') DEFAULT 'system' | |
| language | VARCHAR(10) DEFAULT 'en' | |
| timezone | VARCHAR(60) DEFAULT 'UTC' | |
| week_starts_on | TINYINT(1) DEFAULT 1 | 0=Ням, 1=Даваа |
| notifications_enabled | TINYINT(1) DEFAULT 1 | |
| updated_at | DATETIME ON UPDATE NOW | |

---

### 3.2 PROJECT & TEAM LAYER

#### projects
Ажлын төсөл. Нэг хэрэглэгч олон төсөл үүсгэж болно.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| owner_id | INT UNSIGNED FK→users SET NULL | Эзэмшигч |
| name | VARCHAR(200) NOT NULL | Төслийн нэр |
| description | TEXT | Тайлбар |
| color | VARCHAR(20) DEFAULT '#6366f1' | Өнгөний код |
| is_archived | TINYINT(1) DEFAULT 0 | Архивласан эсэх |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

**Index:** INDEX(owner_id), INDEX(is_archived)

---

#### project_members
Төсөлд хэн хэдэн эрхтэй оролцох. M:N хамаарлын завсрын хүснэгт.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| project_id | INT UNSIGNED FK→projects CASCADE | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| role | ENUM('owner','editor','viewer') DEFAULT 'viewer' | Эрхийн түвшин |
| joined_at | DATETIME DEFAULT NOW | Нэмэгдсэн огноо |

**PK:** (project_id, user_id) — нэг хүн нэг төсөлд нэг л удаа байна
**Index:** INDEX(user_id)

**Эрхийн тайлбар:**
- `owner` — бүх эрхтэй, устгах, архивлах
- `editor` — task нэмэх, засах
- `viewer` — зөвхөн харах

---

### 3.3 TASK / TODO LAYER

#### labels
Task болон note-д наах шошго. Хэрэглэгч бүр өөрийн шошготой.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | Эзэмшигч |
| name | VARCHAR(100) NOT NULL | Шошгоны нэр |
| color | VARCHAR(20) DEFAULT '#6366f1' | |
| created_at | DATETIME DEFAULT NOW | |

**Index:** UNIQUE(user_id, name) — нэг хэрэглэгч нэр давхцуулж шошго үүсгэж болохгүй

---

#### tasks
Системийн үндсэн хүснэгт. Task бүр project-тэй (заавал биш), assignee-тэй байж болно.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| project_id | INT UNSIGNED FK→projects SET NULL | Харьяалах төсөл |
| assignee_id | INT UNSIGNED FK→users SET NULL | Хариуцах хэрэглэгч |
| created_by | INT UNSIGNED FK→users SET NULL | Үүсгэсэн хэрэглэгч |
| parent_task_id | INT UNSIGNED FK→tasks SET NULL | Дэд task (self-ref) |
| title | VARCHAR(500) NOT NULL | |
| description | TEXT | |
| status | ENUM('todo','in-progress','in-review','done','cancelled') DEFAULT 'todo' | |
| priority | ENUM('low','medium','high','urgent') DEFAULT 'medium' | |
| due_date | DATETIME | Хугацаа |
| position | INT UNSIGNED DEFAULT 0 | Drag-drop дараалал |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

**Index:**
- INDEX(project_id) — төслийн task-уудыг хурдан авна
- INDEX(assignee_id) — хэрэглэгчид оноогдсон task-уудыг хурдан авна
- INDEX(status) — filter хийхэд хурдан
- INDEX(priority) — filter хийхэд хурдан
- INDEX(due_date) — хугацаагаар эрэмбэлэхэд хурдан
- INDEX(parent_task_id) — дэд task-уудыг хурдан авна

**ON DELETE SET NULL:** assignee эсвэл project устахад task алдагдахгүй, зөвхөн холбоос тасарна.

---

#### task_labels
Task болон label-ийн M:N хамаарал.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| task_id | INT UNSIGNED FK→tasks CASCADE | |
| label_id | INT UNSIGNED FK→labels CASCADE | |

**PK:** (task_id, label_id)
**Index:** INDEX(label_id) — "энэ label-тэй task-уудыг ол" query-д хэрэгтэй. MySQL composite PK-ийн trailing column-д auto index байдаггүй тул гараар нэмсэн.

---

#### task_comments
Task дотор хэлэлцүүлэг хийх.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| task_id | INT UNSIGNED FK→tasks CASCADE | |
| user_id | INT UNSIGNED FK→users SET NULL | |
| body | TEXT NOT NULL | |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

**Index:** INDEX(task_id)

---

#### task_attachments
Task-д хавсаргасан файлууд.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| task_id | INT UNSIGNED FK→tasks CASCADE | |
| user_id | INT UNSIGNED FK→users SET NULL | |
| file_name | VARCHAR(255) NOT NULL | |
| file_url | VARCHAR(500) NOT NULL | |
| file_size | INT UNSIGNED DEFAULT 0 | Bytes |
| mime_type | VARCHAR(100) | |
| created_at | DATETIME DEFAULT NOW | |

**Index:** INDEX(task_id)

---

### 3.4 NOTES LAYER

#### notes
Notion-style баримт бичиг. FULLTEXT search дэмждэг.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| project_id | INT UNSIGNED FK→projects SET NULL | |
| title | VARCHAR(300) NOT NULL | |
| body | LONGTEXT | Том текст хадгалж болно |
| is_pinned | TINYINT(1) DEFAULT 0 | Тогтмол харуулах |
| is_archived | TINYINT(1) DEFAULT 0 | |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

**Index:**
- INDEX(user_id)
- INDEX(project_id)
- INDEX(user_id, is_pinned) — pinned note-уудыг эрэмбэлэхэд
- FULLTEXT(title, body) — бүтэн текст хайлт

**FULLTEXT search хэрэглэх:**
```sql
SELECT * FROM notes
WHERE user_id = ?
AND MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE)
```

---

#### note_labels
Note болон label-ийн M:N хамаарал.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| note_id | INT UNSIGNED FK→notes CASCADE | |
| label_id | INT UNSIGNED FK→labels CASCADE | |

**PK:** (note_id, label_id)

---

### 3.5 CALENDAR LAYER

#### calendar_events
Цаг товлол. Давтагдах тохиолдол (recurrence) дэмждэг.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| title | VARCHAR(300) NOT NULL | |
| description | TEXT | |
| start_at | DATETIME NOT NULL | |
| end_at | DATETIME NOT NULL | |
| is_all_day | TINYINT(1) DEFAULT 0 | |
| recurrence_rule | VARCHAR(200) | iCal RRULE формат |
| location | VARCHAR(300) | |
| color | VARCHAR(20) DEFAULT '#6366f1' | |
| is_cancelled | TINYINT(1) DEFAULT 0 | |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

**Index:**
- INDEX(user_id)
- INDEX(start_at), INDEX(end_at)
- INDEX(user_id, start_at, end_at) — сарын үзэгдлийг авах query-д

**Сарын үзэгдлийг авах query:**
```sql
SELECT * FROM calendar_events
WHERE user_id = ?
AND end_at >= '2026-05-01 00:00:00'
AND start_at <= '2026-05-31 23:59:59'
```

---

#### event_attendees
Үйл явдалд урьсан хүмүүс.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| event_id | INT UNSIGNED FK→calendar_events CASCADE | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| status | ENUM('pending','accepted','declined') DEFAULT 'pending' | |

**PK:** (event_id, user_id)

---

#### event_tasks
Үйл явдал болон task-ийн холбоос.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| event_id | INT UNSIGNED FK→calendar_events CASCADE | |
| task_id | INT UNSIGNED FK→tasks CASCADE | |

**PK:** (event_id, task_id)

---

### 3.6 HABIT TRACKER LAYER

#### habits
Өдөр/долоо хоног/сарын давтагдах зуршлын тодорхойлолт.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| name | VARCHAR(200) NOT NULL | |
| description | TEXT | |
| color | VARCHAR(20) DEFAULT '#6366f1' | |
| icon | VARCHAR(50) | Emoji эсвэл icon нэр |
| frequency | ENUM('daily','weekly','monthly') DEFAULT 'daily' | |
| target_count | TINYINT UNSIGNED DEFAULT 1 | Өдөрт хэдэн удаа |
| is_archived | TINYINT(1) DEFAULT 0 | |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

---

#### habit_logs
Зуршил бүрийн өдөр тутмын тэмдэглэл. Streak тооцоход хэрэглэнэ.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| habit_id | INT UNSIGNED FK→habits CASCADE | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| logged_on | DATE NOT NULL | Тэмдэглэсэн өдөр |
| count | TINYINT UNSIGNED DEFAULT 1 | Тухайн өдрийн тоо |
| note | VARCHAR(300) | |
| created_at | DATETIME DEFAULT NOW | |

**Index:** UNIQUE(habit_id, logged_on), INDEX(user_id, logged_on)

**UNIQUE(habit_id, logged_on):** нэг өдөрт нэг habit-д нэг л тэмдэглэл байна. Дахин нэмэхэд ON DUPLICATE KEY UPDATE ашиглана.

**Streak тооцоо (JavaScript):**
```js
// habit_logs-аас сүүлийн 365 өдрийн тэмдэглэлийг DESC эрэмбэлж авна
// Өнөөдрөөс эхлэн тасралтгүй дараалсан өдрийн тоог тоолно
for (let i = 0; i < logs.length; i++) {
  const expected = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
  if (logs[i].logged_on === expected) streak++;
  else break;
}
```

---

### 3.7 TIME TRACKING LAYER

#### time_entries
Task дээр зарцуулсан цагийн бүртгэл.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| task_id | INT UNSIGNED FK→tasks SET NULL | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| description | VARCHAR(300) | |
| started_at | DATETIME NOT NULL | |
| ended_at | DATETIME | NULL = timer ажиллаж байна |
| duration_s | INT UNSIGNED GENERATED STORED | Автомат тооцоо (секунд) |
| created_at | DATETIME DEFAULT NOW | |

**GENERATED STORED колонк:**
```sql
duration_s INT UNSIGNED AS (
  TIMESTAMPDIFF(SECOND, started_at, ended_at)
) STORED
```
App layer-т тооцоо хийхгүй — DB автоматаар тооцно. STORED тул disk-д хадгалагдана, дахин тооцохгүй.

---

#### focus_sessions
Pomodoro / гүнзгий ажиллах сессүүд.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| task_id | INT UNSIGNED FK→tasks SET NULL | |
| type | ENUM('focus','short_break','long_break') DEFAULT 'focus' | |
| duration_min | TINYINT UNSIGNED DEFAULT 25 | Минут |
| started_at | DATETIME NOT NULL | |
| ended_at | DATETIME | |
| was_completed | TINYINT(1) DEFAULT 0 | |
| created_at | DATETIME DEFAULT NOW | |

---

### 3.8 GOALS / OKR LAYER

#### goals
Том зорилго. Progress 0-100% хэмжилттэй.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| title | VARCHAR(300) NOT NULL | |
| description | TEXT | |
| status | ENUM('active','completed','abandoned') DEFAULT 'active' | |
| target_date | DATE | Зорилт огноо |
| progress | TINYINT UNSIGNED DEFAULT 0 | 0-100 |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

**Index:** INDEX(user_id), INDEX(user_id, status)

---

#### goal_milestones
Зорилгын дотоод алхам (checkpoint).

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| goal_id | INT UNSIGNED FK→goals CASCADE | |
| title | VARCHAR(300) NOT NULL | |
| is_done | TINYINT(1) DEFAULT 0 | |
| due_date | DATE | |
| position | INT UNSIGNED DEFAULT 0 | |
| created_at | DATETIME DEFAULT NOW | |

---

#### goal_tasks
Зорилго болон task-ийн холбоос.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| goal_id | INT UNSIGNED FK→goals CASCADE | |
| task_id | INT UNSIGNED FK→tasks CASCADE | |

**PK:** (goal_id, task_id)

---

### 3.9 SYSTEM LAYER

#### activity_logs
Бүх үйлдлийн аудит бүртгэл. JSON meta-г уян хатан өгөгдөл хадгалахад ашиглана.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users SET NULL | |
| action | VARCHAR(100) NOT NULL | 'task.created', 'user.login'… |
| entity_type | VARCHAR(50) NOT NULL | 'task', 'project'… |
| entity_id | INT UNSIGNED NOT NULL | Тухайн объектын ID |
| meta | JSON | Нэмэлт мэдээлэл |
| created_at | DATETIME DEFAULT NOW | |

**Index:** INDEX(user_id), INDEX(entity_type, entity_id), INDEX(created_at)

---

#### notifications
Хэрэглэгчдэд илгээх мэдэгдэл.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| type | VARCHAR(50) NOT NULL | 'task_due', 'comment'… |
| title | VARCHAR(200) NOT NULL | |
| body | TEXT | |
| is_read | TINYINT(1) DEFAULT 0 | |
| ref_type | VARCHAR(50) | 'task', 'event'… |
| ref_id | INT UNSIGNED | Холбоотой объектын ID |
| created_at | DATETIME DEFAULT NOW | |

**Index:** INDEX(user_id, is_read), INDEX(user_id, created_at)

---

#### reminders
Task эсвэл үйл явдалд тодорхой цагт сануулах.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| task_id | INT UNSIGNED FK→tasks CASCADE | |
| event_id | INT UNSIGNED FK→calendar_events CASCADE | |
| remind_at | DATETIME NOT NULL | Сануулах цаг |
| is_sent | TINYINT(1) DEFAULT 0 | Явуулсан эсэх |
| created_at | DATETIME DEFAULT NOW | |

**Index:** INDEX(user_id, remind_at, is_sent) — илгээгдээгүй, ирэх reminder-ийг хурдан авна

---

#### user_integrations
Google Calendar, Slack зэрэг гадаад системийн OAuth token.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| provider | VARCHAR(50) NOT NULL | 'google', 'slack'… |
| access_token | TEXT | Шифрлэж хадгалах нь зүйтэй |
| refresh_token | TEXT | |
| expires_at | DATETIME | |
| meta | JSON | |
| created_at | DATETIME DEFAULT NOW | |
| updated_at | DATETIME ON UPDATE NOW | |

**Index:** UNIQUE(user_id, provider)

---

#### pinned_items
Хэрэглэгч дурын объектыг (task, note, goal…) тогтмол харуулах жагсаалт.

| Багана | Төрөл | Тайлбар |
|--------|-------|---------|
| id | INT UNSIGNED PK | |
| user_id | INT UNSIGNED FK→users CASCADE | |
| entity_type | ENUM('task','note','event','goal','project') | |
| entity_id | INT UNSIGNED NOT NULL | |
| position | INT UNSIGNED DEFAULT 0 | |
| created_at | DATETIME DEFAULT NOW | |

**Index:** UNIQUE(user_id, entity_type, entity_id), INDEX(user_id, position)

---

## 4. Хүснэгтүүдийн харилцаа

```
users ──────────────────────────────────────────────────────────┐
  │                                                              │
  ├──< refresh_tokens (CASCADE)                                  │
  ├──1 user_settings (CASCADE)                                   │
  ├──< projects (owner_id SET NULL)                              │
  │     └──< project_members >── users                          │
  ├──< tasks (assignee_id, created_by SET NULL)                  │
  │     ├──< task_labels >── labels                              │
  │     ├──< task_comments                                       │
  │     ├──< task_attachments                                    │
  │     └──< tasks (parent_task_id — subtask)                    │
  ├──< labels                                                    │
  ├──< notes                                                     │
  │     └──< note_labels >── labels                             │
  ├──< calendar_events                                           │
  │     ├──< event_attendees >── users                          │
  │     └──< event_tasks >── tasks                              │
  ├──< habits                                                    │
  │     └──< habit_logs                                          │
  ├──< time_entries                                              │
  ├──< focus_sessions                                            │
  ├──< goals                                                     │
  │     ├──< goal_milestones                                     │
  │     └──< goal_tasks >── tasks                               │
  ├──< notifications                                             │
  ├──< reminders                                                 │
  ├──< activity_logs                                             │
  ├──< user_integrations                                         │
  └──< pinned_items                                              │
                                                                 │
  Хэрэглэгч устахад:                                             │
  CASCADE → тухайн хэрэглэгчийн бүх өгөгдөл устана             │
  SET NULL → task/note зэрэг хуваалцсан өгөгдөл хадгалагдана    │
```

---

## 5. SQL Injection хамгаалалт

Бүх query-д prepared statement ашиглана. Raw string concatenation **ХОРИГЛОНО**.

```js
// ❌ БУРУУ — SQL injection-д өртөмтгий
const sql = `SELECT * FROM tasks WHERE title = '${title}'`;

// ✅ ЗӨВ — prepared statement
const [rows] = await pool.execute('SELECT * FROM tasks WHERE title = ?', [title]);
```

`mysql2` driver нь параметрийг автоматаар escape хийдэг тул injection боломжгүй.

---

## 6. Async/Await загвар

`better-sqlite3` (synchronous) → `mysql2/promise` (asynchronous) шилжилт:

```js
// Synchronous (хуучин)
const rows = db.prepare('SELECT * FROM tasks').all();

// Asynchronous (одоо)
const [rows] = await pool.execute('SELECT * FROM tasks');
// mysql2 нь [rows, fields] гэсэн array буцаана
// Зөвхөн rows хэрэгтэй тул [rows] destructuring хэрэглэнэ

// Нэг мөр авахад:
const [[row]] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
// Эхний []: rows array
// Дотоод []: rows[0] нь тухайн мөр

// INSERT хийсний дараа:
const [result] = await pool.execute('INSERT INTO tasks ...', [...]);
result.insertId      // шинэ мөрийн ID
result.affectedRows  // нөлөөлсөн мөрийн тоо
```

---

## 7. Connection Pool ажиллагаа

```
Хүсэлт 1  ──→ Pool (10 connection) ──→ Connection A → Query → Release
Хүсэлт 2  ──→                      ──→ Connection B → Query → Release
Хүсэлт 3  ──→                      ──→ Connection C → Query → Release
...
Хүсэлт 11 ──→ Хүлээлтийн дараалал (бүх connection завгүй бол хүлээнэ)
```

Schema init хийхдээ тусад нь connection авч, дараа нь буцааж өгнө:
```js
const conn = await getPool().getConnection();
try {
  await conn.execute(`CREATE TABLE IF NOT EXISTS ...`);
} finally {
  conn.release(); // заавал буцаана
}
```

---

## 8. Database Size Бууруулах Стратегиуд

### 8.1 Яагаад өснө вэ?

| Хүснэгт | Өсөлтийн шалтгаан |
|---------|-------------------|
| tasks | Хэрэглэгч бүр × task бүр |
| activity_logs | Үйлдэл бүрт нэг мөр нэмэгдэнэ |
| notifications | Мэдэгдэл бүрт нэг мөр |
| habit_logs | Өдөр бүр × habit бүр |
| time_entries | Timer ажиллуулах бүрт |

### 8.2 Archiving (архивлалт)

Дууссан task-ийг тусдаа хүснэгтэд зөөнэ. Үндсэн хүснэгт жижиг хэвээр байна.

```sql
-- tasks_archive хүснэгт (tasks-тай яг ижил бүтэц)
CREATE TABLE tasks_archive LIKE tasks;

-- 90 хоногоос хуучин, дууссан task-ийг зөөх
INSERT INTO tasks_archive
  SELECT * FROM tasks
  WHERE status IN ('done', 'cancelled')
  AND updated_at < NOW() - INTERVAL 90 DAY;

DELETE FROM tasks
  WHERE status IN ('done', 'cancelled')
  AND updated_at < NOW() - INTERVAL 90 DAY;
```

### 8.3 TTL (Time To Live)

Автомат устгал. Хуучин, ашиггүй өгөгдлийг устгана.

```sql
-- 30 хоногоос хуучин notifications
DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL 30 DAY;

-- 90 хоногоос хуучин activity_logs
DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL 90 DAY;

-- Хэрэглэгч бүрт хамгийн сүүлийн 200 notification-г хадгала
DELETE n FROM notifications n
  LEFT JOIN (
    SELECT id FROM notifications
    WHERE user_id = n.user_id
    ORDER BY created_at DESC
    LIMIT 200
  ) keep ON n.id = keep.id
  WHERE keep.id IS NULL;
```

### 8.4 InnoDB Compression

InnoDB хүснэгтийг шахна. 40-60% disk зай хэмнэнэ. Query хурд бага зэрэг буурна.

```sql
-- Их хэмжээний текст хадгалдаг хүснэгтэд хэрэглэнэ
ALTER TABLE tasks         ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;
ALTER TABLE notes         ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;
ALTER TABLE activity_logs ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;
ALTER TABLE notifications ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;

-- KEY_BLOCK_SIZE утгууд:
-- 4  → хамгийн их шахалт, query удаан
-- 8  → тэнцвэртэй (ихэнх тохиолдолд хамгийн зохимжтой)
-- 16 → бага шахалт, query хурдан
```

### 8.5 Partitioning (маш том системд)

`tasks` хүснэгтийг жилээр хуваана. Хуучин partition-г DROP хийх нь DELETE-ээс мянга дахин хурдан.

```sql
ALTER TABLE tasks
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION pfuture VALUES LESS THAN MAXVALUE
);

-- 2024-ийн бүх өгөгдлийг нэг командаар устга
ALTER TABLE tasks DROP PARTITION p2024;

-- Шинэ partition нэмэх
ALTER TABLE tasks REORGANIZE PARTITION pfuture INTO (
  PARTITION p2027 VALUES LESS THAN (2028),
  PARTITION pfuture VALUES LESS THAN MAXVALUE
);
```

### 8.6 Cleanup Service (хэрэгжүүлсэн)

```js
// src/services/cleanupService.js
async function runCleanup() {
  const pool = getPool();

  // 30 хоногоос хуучин notifications устга
  await pool.execute(
    'DELETE FROM notifications WHERE created_at < NOW() - INTERVAL 30 DAY'
  );

  // 90 хоногоос хуучин activity_logs устга
  await pool.execute(
    'DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL 90 DAY'
  );

  // Дууссан task-ийг archive хийх
  await pool.execute(`
    INSERT IGNORE INTO tasks_archive
    SELECT * FROM tasks
    WHERE status IN ('done','cancelled')
    AND updated_at < NOW() - INTERVAL 90 DAY
  `);
  await pool.execute(`
    DELETE FROM tasks
    WHERE status IN ('done','cancelled')
    AND updated_at < NOW() - INTERVAL 90 DAY
  `);
}
```

### 8.7 Хэмжээний тооцоо

Нэг хэрэглэгч, нэг жил идэвхтэй ажиллавал:

| Хүснэгт | Жилийн мөрийн тоо | Тооцоолсон хэмжээ |
|---------|-----------------|-----------------|
| tasks | ~500 | ~500 KB |
| habit_logs | 365 өдөр × 5 habit = 1,825 | ~180 KB |
| time_entries | ~250 | ~50 KB |
| notifications | ~1,000 | ~200 KB |
| activity_logs | ~5,000 | ~2 MB |
| **Нийт** | | **~3 MB / хэрэглэгч / жил** |

TTL cleanup хийвэл: ~0.5 MB / хэрэглэгч / жил болно.

---

## 9. Index Стратеги

### Байгаа index-ийн учир шалтгаан

```sql
-- tasks хүснэгтийн index-ууд:

INDEX idx_task_status (status)
-- "todo task-уудыг харуул" гэх filter query-д

INDEX idx_task_priority (priority)
-- "urgent task-уудыг харуул" гэх filter query-д

INDEX idx_task_due_date (due_date)
-- "өнөөдөр дуусах task-уудыг ол" query-д

INDEX idx_task_assignee (assignee_id)
-- "Батад оноогдсон task-уудыг харуул" query-д

INDEX idx_task_project (project_id)
-- Төслийн task-уудыг авах query-д

-- Composite index (хамтдаа ашиглагдах column-д):
INDEX idx_notif_user_read (user_id, is_read)
-- WHERE user_id = ? AND is_read = 0 → хоёр column-г нэг дор ашиглана
```

### Index хэзээ хэрэгтэй вэ?

- WHERE дотор байнга ашиглагддаг column
- JOIN-ийн ON дотор байдаг column (FK)
- ORDER BY дотор байдаг column
- Олон хүснэгтийн хооронд JOIN хийгддэг column

### Index хэзээ хэрэггүй вэ?

- Ховор query-д ашиглагддаг column
- Boolean (TINYINT 0/1) — 2 л утга байдаг тул index тус болохгүй
- Маш бага мөртэй хүснэгт — full scan нь index-ээс хурдан байж болно

---

## 10. ON DELETE гэж юу вэ?

Foreign key устах үед дагаж хийгдэх үйлдэл.

| Дүрэм | Тайлбар | Манай системд хаана |
|-------|---------|---------------------|
| CASCADE | Parent устахад child автоматаар устна | user → notifications, habits, projects |
| SET NULL | Parent устахад child-ийн FK NULL болно | task → assignee_id (хэрэглэгч устсан ч task хадгалагдана) |
| RESTRICT | Child байгаа бол parent устгахыг хориглоно | (ашиглаагүй) |

```sql
-- Жишээ:
-- Хэрэглэгч устах үед түүний notification-ууд автомат устна (CASCADE)
CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
  REFERENCES users(id) ON DELETE CASCADE

-- Assignee устах үед task хадгалагдана, assignee_id NULL болно (SET NULL)
CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id)
  REFERENCES users(id) ON DELETE SET NULL
```

---

## 11. Migration ажиллуулах

```bash
# Database үүсгэх (нэг удаа)
sudo mysql -e "CREATE DATABASE IF NOT EXISTS task_tracker;"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS task_tracker_test;"
sudo mysql -e "GRANT ALL ON task_tracker.* TO 'taskuser'@'localhost';"
sudo mysql -e "GRANT ALL ON task_tracker_test.* TO 'taskuser'@'localhost';"

# Schema үүсгэх
cd partB && npm run migrate

# Бүх table харах
sudo mysql task_tracker -e "SHOW TABLES;"

# Table-ийн бүтэц харах
sudo mysql task_tracker -e "DESCRIBE tasks;"

# Хэмжээ харах
sudo mysql -e "
  SELECT table_name, table_rows,
    ROUND(data_length/1024/1024,2) AS data_MB,
    ROUND(index_length/1024/1024,2) AS index_MB
  FROM information_schema.tables
  WHERE table_schema = 'task_tracker'
  ORDER BY data_length DESC;
"
```

---

## 12. Test Database

Тест нь `task_tracker_test` database ашиглана. `.env.test` файлаар тохируулна.

```
DB_NAME=task_tracker_test
NODE_ENV=test
```

Test дуусмагц `TRUNCATE` командаар бүх өгөгдлийг цэвэрлэнэ:

```js
// tests/helpers/mysqlTestHelper.js
await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
await pool.execute('TRUNCATE TABLE task_labels');
await pool.execute('TRUNCATE TABLE tasks');
await pool.execute('TRUNCATE TABLE labels');
await pool.execute('TRUNCATE TABLE users');
await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
```

`TRUNCATE` нь `DELETE FROM` -аас хурдан учир нь:
- Row-by-row устгахгүй
- Auto-increment тоолуурыг 1-ээс дахин эхлүүлнэ
- Transaction log бичихгүй

---

## 13. Хамгийн Түгээмэл Query-ууд

```sql
-- Хэрэглэгчийн бүх task (assignee нэртэй)
SELECT t.*, u.username as assignee_name
FROM tasks t
LEFT JOIN users u ON u.id = t.assignee_id
WHERE t.created_by = ?
ORDER BY t.created_at DESC;

-- Төслийн гишүүд
SELECT u.id, u.username, u.email, pm.role, pm.joined_at
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = ?;

-- Сарын calendar events
SELECT * FROM calendar_events
WHERE user_id = ?
AND end_at >= ? AND start_at <= ?
ORDER BY start_at;

-- Habit streak тооцоо
SELECT logged_on FROM habit_logs
WHERE habit_id = ?
ORDER BY logged_on DESC
LIMIT 365;

-- Хэрэглэгчийн уншаагүй notification тоо
SELECT COUNT(*) as count FROM notifications
WHERE user_id = ? AND is_read = 0;

-- Хэрэглэгч хайх
SELECT id, username, email FROM users
WHERE email LIKE ? OR username LIKE ?
LIMIT 10;
```
