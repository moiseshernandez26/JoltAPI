# Pre-Commit Secrets Check

## Purpose

Scan staged and unstaged changes for sensitive data patterns before committing. This prevents accidental exposure of API keys, tokens, passwords, internal paths, or personal information.

## When to use

Before every `git commit`. Run automatically or manually before staging.

## Check patterns

| Pattern | Regex | Rationale |
|---------|-------|-----------|
| Hardcoded passwords | `password\s*[:=]\s*['\"]\S+['\"]` | Credentials in source |
| API keys | `api[_-]?key\s*[:=]\s*['\"]\S+['\"]` | Service credentials |
| Bearer tokens | `Bearer\s+[A-Za-z0-9\-._~+/]{20,}` | Auth tokens |
| JWT tokens | `eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+` | JWT in code |
| Private keys | `-----BEGIN (RSA|EC|OPENSSH|DSA) PRIVATE KEY-----` | Key material |
| Internal paths | `C:\\Users\\` or `/home/` followed by username | Personal filesystem paths |
| Internal IPs | `192\.168\.\d{1,3}\.\d{1,3}` or `10\.\d{1,3}\.\d{1,3}\.\d{1,3}` | Internal network |
| Connection strings | `mongodb://.*@` or `postgres://.*@` | Database credentials |
| GitHub tokens | `gh[pousr]_[A-Za-z0-9_]{36,}` | GitHub PATs |

## False positives to ignore

- UI placeholder strings like `'Enter bearer token'`
- Variable names like `_token` (VS Code API parameter)
- Warning messages about plaintext storage
- Template strings like `{{HOST}}`
- TypeScript type definitions
- Test fixtures with dummy data

## Execution

```powershell
# Before committing, run:
git diff --cached --unified=0 | Select-String -Pattern "..."
git diff --unified=0 | Select-String -Pattern "..."
```

If ANY match is found (excluding known false positives), **BLOCK the commit** and ask the user for confirmation.

## Boundary

- Only scan files that would be committed (tracked files, not gitignored)
- Skip binary files
- Skip `docs/` directory (gitignored, LLM-private memory)
- Skip `node_modules/` (gitignored)
- The `.opencode/` directory itself is NOT gitignored but contains no secrets
