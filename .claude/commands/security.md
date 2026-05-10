Run an OWASP Top 10 (2021) security audit on the file or endpoint I specify.

Check each category and give a PASS / FAIL / N/A verdict with evidence:

| # | Category | Status | Evidence |
|---|----------|--------|----------|
| A01 | Broken Access Control | ? | |
| A02 | Cryptographic Failures | ? | |
| A03 | Injection (SQL, NoSQL, OS) | ? | |
| A04 | Insecure Design | ? | |
| A05 | Security Misconfiguration | ? | |
| A06 | Vulnerable Components | ? | |
| A07 | Auth & Session Failures | ? | |
| A08 | Software Integrity Failures | ? | |
| A09 | Logging & Monitoring Failures | ? | |
| A10 | SSRF | ? | |

For each FAIL:
- Quote the exact code line(s)
- Explain the attack vector
- Give a concrete fix (code snippet if short)

Also verify CLAUDE.md no-go zones are respected:
- No raw SQL string concatenation
- No eval()
- No hardcoded secrets
- No console.log in production paths
