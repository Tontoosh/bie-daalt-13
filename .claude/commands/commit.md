Draft a Conventional Commits message for the changes I describe or for the current `git diff --staged`.

Format:
```
<type>(<scope>): <short summary>

<body — optional, 72 char wrap>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:** feat, fix, docs, test, refactor, chore, perf, ci
**Scope:** task, label, user, note, db, frontend, config, test, deps

Rules:
- Summary: imperative mood, no period, ≤72 chars
- Body: explain WHY, not WHAT (what is in the diff)
- Always append the Co-Authored-By trailer when AI helped write the code
- If the change is trivial (typo, comment), omit the body

Return the ready-to-copy commit message inside a code block.
