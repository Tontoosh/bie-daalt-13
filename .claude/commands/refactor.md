Refactor the code I specify, applying patterns from clean architecture and SOLID principles.

Apply the following where relevant:
- **Single Responsibility** — split functions that do more than one thing
- **DRY** — extract repeated logic into a shared utility; do not create abstractions for code used only once
- **Early return** — replace nested if/else with guard clauses
- **Named constants** — replace magic strings/numbers with named constants
- **Error propagation** — ensure all errors bubble up via `next(err)` in Express controllers
- **Thin controllers** — move business logic from controllers into service layer

Do NOT:
- Change public API contracts (route paths, response shapes)
- Add features or new functionality
- Add comments that explain what the code does (names should do that)
- Introduce abstractions for hypothetical future requirements

After refactoring, list:
1. What changed and why
2. What you deliberately left unchanged and why
3. Any technical debt still present that is out of scope
