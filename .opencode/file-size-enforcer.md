# File Size Enforcer

## Purpose
Enforce the ~200 lines per file convention across the JoltAPI codebase.

## Rule
No TypeScript/TSX file should exceed 200 lines. If a file approaches this limit, split it into smaller modules.

## How to Check
Run this PowerShell command to find oversized files:

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx -Path src,webview-ui/src | ForEach-Object { $lines = (Get-Content $_.FullName).Count; if ($lines -gt 200) { "$($_.FullName): $lines lines" } }
```

## Splitting Strategy
When a file exceeds 200 lines:

1. **Identify logical boundaries** — group related functions/constants together
2. **Extract to new files** — create focused modules (e.g., `httpErrors.ts`, `curlUtils.ts`)
3. **Re-export from original** — maintain backward compatibility with re-exports
4. **Update barrel files** — update `index.ts` exports
5. **Verify imports** — ensure all consumers still compile

## Examples from This Project
- `httpService.ts` (286 → 143 lines): Extracted `HttpError`, `classifyFetchError`, `buildUrl`, `redactUrl` to `httpErrors.ts`. Extracted `shellEscape`, `buildCurlCommand` to `curlUtils.ts`.
- `importService.ts` (249 → 38 lines): Extracted Postman converter to `importPostman.ts`, Insomnia converter to `importInsomnia.ts`.
- `RequestBuilder.tsx` (245 → 135 lines): Extracted `formatRequestHeaders` and header suggestions to `utils/requestHeaders.ts`.

## Files to Watch
- `src/services/` — HTTP and import logic tends to grow
- `webview-ui/src/components/` — Complex editors (BodyEditor, AuthEditor)
- `webview-ui/src/views/` — Main view orchestrators

## After Splitting
Always run `npm run lint` to verify TypeScript compiles cleanly.
