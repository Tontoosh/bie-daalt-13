# Personal Task Tracker — README (Draft)

> Анхаарна уу: Энэ нь Part А-ийн draft README. Эцсийн хувилбар partB/README.md-д байна.

## Тухай
Personal Task Tracker нь хэрэглэгч өөрийн өдөр тутмын ажлуудаа удирдах хялбар веб апп юм. Task-ууд нь гарчиг, тайлбар, дуусах хугацаа, тэргүүлэх дараалал, label-уудтай байна.

## Stack
- **Backend**: Node.js v20+ + Express v4
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla HTML5 / CSS3 / JavaScript (ES2022)
- **Testing**: Jest + Supertest
- **API Docs**: OpenAPI 3.0 (swagger-ui-express)

## Хурдан эхлэх

### Шаардлага
- Node.js v20 эсвэл дээш
- npm v9 эсвэл дээш

### Суулгах
```bash
cd partB
npm install
```

### Ажиллуулах
```bash
# Development mode (hot-reload)
npm run dev

# Production mode
npm start
```

Апп `http://localhost:3000` дээр нээгдэнэ.

### Тест ажиллуулах
```bash
npm test              # бүх тест
npm test -- --watch   # watch mode
npm run test:coverage # coverage тайлан
```

## Директор бүтэц
```
partB/
├── src/
│   ├── index.js              # Entry point
│   ├── routes/
│   │   ├── tasks.js
│   │   └── labels.js
│   ├── controllers/
│   │   ├── taskController.js
│   │   └── labelController.js
│   ├── services/
│   │   ├── taskService.js
│   │   └── labelService.js
│   ├── middleware/
│   │   └── validator.js
│   └── db/
│       └── database.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── tests/
│   ├── tasks.test.js
│   └── labels.test.js
├── package.json
└── openapi.yaml
```

## API Endpoints (товч)
| Method | URL | Тайлбар |
|--------|-----|---------|
| GET | `/api/tasks` | Task жагсаах |
| POST | `/api/tasks` | Task үүсгэх |
| PUT | `/api/tasks/:id` | Task засах |
| DELETE | `/api/tasks/:id` | Task устгах |
| PATCH | `/api/tasks/:id/status` | Статус өөрчлөх |
| GET | `/api/labels` | Label жагсаах |
| POST | `/api/labels` | Label үүсгэх |

Дэлгэрэнгүй: `http://localhost:3000/api-docs` (Swagger UI)
