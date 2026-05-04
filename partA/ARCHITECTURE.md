# ARCHITECTURE.md — Personal Task Tracker

## Системийн архитектур

### Давхаргын диаграм (Layer Diagram)

```mermaid
graph TD
    subgraph Frontend["Frontend (Browser)"]
        UI[HTML/CSS/JS UI]
        API_CLIENT[Fetch API Client]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        ROUTER[Express Router]
        subgraph Controllers
            TC[Task Controller]
            LC[Label Controller]
        end
        subgraph Services
            TS[Task Service]
            LS[Label Service]
        end
        VALIDATOR[Input Validator]
    end

    subgraph Database["Data Layer"]
        DB[(SQLite DB)]
        SCHEMA[Schema: tasks, labels, task_labels]
    end

    UI --> API_CLIENT
    API_CLIENT -->|REST HTTP| ROUTER
    ROUTER --> TC
    ROUTER --> LC
    TC --> VALIDATOR
    LC --> VALIDATOR
    TC --> TS
    LC --> LS
    TS --> DB
    LS --> DB
    DB --- SCHEMA
```

### Өгөгдлийн урсгал (Data Flow)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend JS
    participant E as Express API
    participant S as Service Layer
    participant D as SQLite

    U->>F: Task үүсгэх товч дарна
    F->>E: POST /api/tasks (JSON body)
    E->>E: Input validate
    E->>S: taskService.create(data)
    S->>D: INSERT INTO tasks ...
    D-->>S: insertId
    S-->>E: { id, title, ... }
    E-->>F: 201 Created (JSON)
    F-->>U: UI шинэчлэгдэнэ
```

### Өгөгдлийн загвар (Data Model)

```mermaid
erDiagram
    TASKS {
        int id PK
        string title
        string description
        string status
        string priority
        datetime due_date
        datetime created_at
        datetime updated_at
    }
    LABELS {
        int id PK
        string name
        string color
    }
    TASK_LABELS {
        int task_id FK
        int label_id FK
    }

    TASKS ||--o{ TASK_LABELS : "has"
    LABELS ||--o{ TASK_LABELS : "tagged to"
```

## Module тайлбар

| Module | Зам | Үүрэг |
|--------|-----|-------|
| Entry point | `src/index.js` | Express app эхлүүлэх, port listen |
| Router | `src/routes/` | URL → Controller холбох |
| Task Controller | `src/controllers/taskController.js` | HTTP request/response зохицуулах |
| Label Controller | `src/controllers/labelController.js` | Label CRUD |
| Task Service | `src/services/taskService.js` | Business logic, DB query |
| Label Service | `src/services/labelService.js` | Label business logic |
| DB | `src/db/database.js` | SQLite connection, schema init |
| Validator | `src/middleware/validator.js` | Input validation middleware |
| Frontend | `public/` | Static HTML, CSS, JS |

## API Endpoint-үүд

| Method | URL | Үйлдэл |
|--------|-----|--------|
| GET | `/api/tasks` | Бүх task жагсаах (filter/search дэмжинэ) |
| POST | `/api/tasks` | Шинэ task үүсгэх |
| GET | `/api/tasks/:id` | Нэг task харах |
| PUT | `/api/tasks/:id` | Task засах |
| DELETE | `/api/tasks/:id` | Task устгах |
| PATCH | `/api/tasks/:id/status` | Статус өөрчлөх |
| GET | `/api/labels` | Бүх label жагсаах |
| POST | `/api/labels` | Шинэ label үүсгэх |
| DELETE | `/api/labels/:id` | Label устгах |
