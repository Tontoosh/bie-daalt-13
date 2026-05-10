Generate Jest + Supertest tests for the file or feature I describe.

Follow the testing pyramid:
- **Unit tests** — pure functions, service layer logic (mock DB when needed)
- **Integration tests** — HTTP endpoints via Supertest hitting the real test DB

For each test suite include:
1. Happy path — valid input, expected output
2. Edge cases — empty string, null, boundary values (e.g. title = 500 chars)
3. Error paths — missing required fields (400), not found (404), duplicates (409)
4. State isolation — each test must not depend on another test's data

Rules:
- Use `beforeAll` / `afterEach` from `tests/helpers/mysqlTestHelper.js`
- Require `.env.test` via dotenv at the top
- No `describe.only` or `it.only` in the committed file
- Test file name: `<feature>.test.js` in `tests/`

After generating, list which scenarios you did NOT cover and why.
