Review the current file or the files I specify for security and robustness issues.

Check each of the following and report findings:

**Security (OWASP Top 10 focus)**
- SQL injection: all DB queries use prepared statements / parameterized queries?
- Input validation: all user-supplied values validated before use?
- Error messages: no stack traces or internal paths leaked to the client?
- Secrets: no hardcoded passwords, API keys, or tokens?
- Dependency risks: any imported packages with known CVEs?

**Robustness**
- Are all async functions wrapped in try/catch or handled with next(err)?
- Do 404 paths (missing resources) return proper status codes?
- Are edge cases handled — empty string, null, 0, very long input?
- Does the code respect the CLAUDE.md no-go zones?

**Output format**
Return a markdown list grouped by severity: CRITICAL → HIGH → MEDIUM → LOW → OK.
For each finding include: location (file:line), what the issue is, and a one-line fix suggestion.
If no issues found in a category, write "✓ OK".
