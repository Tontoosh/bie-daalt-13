Generate documentation for the file or function I specify.

Produce two outputs:

**1. JSDoc comments** (insert directly above each exported function)
- `@param` for every parameter with type and description
- `@returns` with type and what it represents
- `@throws` for every thrown error with its `.status` code
- One-sentence description — what it does, not how

**2. README section** (markdown, paste into partB/README.md under the relevant heading)
- Endpoint table (Method | Path | Body | Response) for route files
- Function signature + purpose for service files
- No implementation details — only the public contract

Keep comments under 5 lines per function. Do not describe what the code obviously does from reading it.
