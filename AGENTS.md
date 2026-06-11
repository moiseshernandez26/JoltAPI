# AGENTS.md — JoltAPI

> **Docs**: `docs/SPEC.md` (spec), `docs/handoff/` (session changes + patterns + future work).

## Documentation Rules

### Docs are LLM-private memory

`docs/SPEC.md` and `docs/handoff/` are the **LLM's private memory** — they log all session changes and architecture decisions. They are **gitignored** and should never be committed to the repository.

### Bootstrap from scratch if missing

If `docs/` does not exist, `docs/SPEC.md` is missing, or `docs/handoff/` is empty/missing, the LLM **MUST** generate them from scratch by:
1. Reading `AGENTS.md` for project conventions
2. Analyzing the full source tree (`src/` and `webview-ui/`) to understand architecture
3. Creating `docs/SPEC.md` with project overview, architecture, data models, message protocol, state management, and feature list
4. Creating `docs/handoff/00_OVERVIEW.md` with project overview and quick start
5. Creating `docs/handoff/01_CHANGES.md` as the first session log
6. Creating `docs/handoff/04_FUTURE.md` with initial "Implemented" items (bootstrapped docs)

The handoff files exist so any LLM can pick up exactly where the last one left off. If they're absent, the LLM starts fresh by analyzing the current codebase state.

### Every change must update docs

After completing any task, you **MUST** update all three:

1. **`docs/handoff/NN_CHANGES.md`** (use the latest session file, or create a new one) — Log what was done with file/line references
2. **`docs/SPEC.md`** — Update the spec if the change adds/modifies/removes features, models, messages, or architecture
3. **`docs/handoff/04_FUTURE.md`** — Remove item from "Pending" if implemented; add new items to "Implemented"

### Session file naming

New session handoffs use `NN_CHANGES.md` format. Keep files concise — if a session produces a large log, summarize the key changes in a one-paragraph summary at the top and put detailed logs below.

### LLM handoff rule

When another LLM continues this project:
1. It should read `docs/handoff/` to understand session history and current state
2. It should read `docs/SPEC.md` for architecture and feature reference
3. It should read `docs/handoff/04_FUTURE.md` for remaining work
4. It should follow the same documentation rules for any changes it makes

---

## Two Separate Projects

- **Extension host** (`/`): Node.js, compiled with `tsc` to `out/`. Entry: `src/extension.ts`.
- **Webview UI** (`webview-ui/`): React + Vite, built to `webview-ui/dist/`. Entry: `webview-ui/src/main.tsx`.

Each has its own `package.json`, `node_modules`, and `tsconfig`. Commands for the webview must run from `webview-ui/`.

## Quick Commands

```bash
# First time
npm install
cd webview-ui && npm install && cd ..

# Dev workflow (two terminals)
npm run watch                     # Terminal 1: watch extension TS
cd webview-ui && npm run dev      # Terminal 2: watch webview build

# One-shot build
npm run build                     # compiles host + builds webview
npm run compile                   # host TS only (tsc)
cd webview-ui && npm run build    # webview only (vite)

# Type checking
npm run lint                      # tsc --noEmit on both projects
cd webview-ui && npx tsc --noEmit # webview typecheck only

# Tests
npx tsc -p tsconfig.json; npx mocha --ui tdd "out/tests/**/*.test.js"
```

## F5 Debugging Gotcha

`preLaunchTask` in `.vscode/launch.json` only runs `npm: compile` (TypeScript). The **webview UI is NOT auto-built** before launch. You must run `cd webview-ui && npm run build` first, or F5 will load stale webview assets.

## Type Sharing Between Host and Webview

Types are **manually mirrored** — there is no shared package.

| Host | Webview mirror |
|------|---------------|
| `src/models/*.ts` | `webview-ui/src/types/messages.ts` |

When you change a model or message type in the host, you **must** update the same types in `webview-ui/src/types/messages.ts`. The files are NOT synced automatically. Getting out of sync causes webview `tsc` errors.

## Architecture

```
Sidebar Webview (React + Zustand)
  │  postMessage({ command, payload })
  ▼
providers/sidebarProvider.ts  →  handles openInPanel directly,
  │                               routes others to messageHandlers
  │
  ▼
panels/messageHandlers.ts →  routes by command string
  │
  ├── handlers/sendRequestHandler.ts  → interpolate + httpService.executeRequest()
  ├── handlers/collectionHandler.ts   → load/save/delete/rename/move collections
  ├── handlers/variableHandler.ts    → load/save variables
  ├── handlers/historyHandler.ts    → history via globalState
  ├── handlers/importExportHandler.ts → import/export
  ├── handlers/settingsHandler.ts    → settings + dialogs
  ├── handlers/curlHandler.ts        → copy as cURL
  └── handlers/interpolation.ts      → shared interpolateTemplate

Main Panel Webview (React + Zustand)
  ▲  postMessage({ command, payload })
  │
panels/webviewPanel.ts   →  delegates to messageHandlers
```

**Cross-webview state sync**: After any mutation (save/delete collection, save/delete variables, save request, etc.), `notifyChanged()` calls `broadcastRefresh()` in `extension.ts`, which pushes fresh `collectionsLoaded`, `variablesLoaded` to BOTH webviews via `SidebarProvider.sendToSidebar()` and `JoltApiPanel.sendToWebview()`.

**Message loss prevention**: `webview-ui/src/api/bridge.ts` registers `window.addEventListener('message')` at module level (before React mounts) with a `_pending` buffer array. Messages arriving before `onMessage()` is called by React's `useEffect` are queued and flushed immediately when the handler registers. This guarantees zero message loss for cold-started panels. Each webview gets its own copy of `bridge.ts` via the shared `global.js` chunk.

**Key rule**: All HTTP logic lives in `services/httpService.ts`. All persistence lives in `services/storageService.ts`. Never inline fetch calls or file I/O in command handlers or UI.

## Conventions

- **Interfaces**: `I` prefix (`IHttpRequest`, `IVariable`, `ICollection`)
- **Files**: `camelCase.ts` modules, `PascalCase.tsx` React components
- **Line limit**: ~200 lines per file; split if larger
- **`any`**: forbidden unless commented with justification
- **User strings**: all in `src/utils/strings.ts` (in practice, many are inline)
- **Error logging**: use shared `logError()` from `src/utils/logger.ts` — do not inline `console.error`
- **Strict TypeScript**: `"strict": true` in both `tsconfig.json` files

## State Management

Webview uses **Zustand** with dedicated stores per domain:
- `requestStore` — current request form state (isDirty, loadRequest, resetRequest)
- `responseStore` — last response
- `collectionStore` — loaded collections (for SaveRequestDialog dropdown)
- `variableStore` — flat variable list (for interpolation)
- `tabStore` — multi-tab state: `tabs: IRequestTab[]`, `activeTabIndex`, `addTab`, `addPrepopulatedTab(name, method, url)`, `removeTab`, `setActiveTab`, `updateTab`, `closeAllTabs`, `closeOtherTabs`

Sidebar uses its own store:
- `sidebarStore` — collections, history, variables, activeTab sidebar tab, expandedCollections, isLoading

Sidebar tabs are `'collections' | 'history' | 'variables'`.

## HTTP Engine Quirks

- Uses Node.js **native `fetch`** (undici, available in Node 18+)
- Proxy and SSL toggle use `require('undici')` dynamically — there are **no `undici` types installed**, so these functions return `unknown`
- Timeout uses `AbortController` + `setTimeout` (not `AbortSignal.timeout()` because `@types/node` version expects 2 args)
- `buildCurlCommand()` uses `shellEscape()` with single-quote wrapping — do not revert to ad-hoc escaping
- `redactUrl()` strips query param values before any log output

## Variable Interpolation

Happens at **send time** in `handlers/sendRequestHandler.ts`. The `interpolateTemplate` function in `handlers/interpolation.ts` does the actual `{{var}}` replacement. Variables are flat key-value pairs stored in `.joltapi/variables.json` — there is no "environments" concept.

## Storage

- `variables.json` → `<workspace>/.joltapi/variables.json`
- Collections → `<workspace>/.joltapi/collections/<name>.json`
- History → `globalState` with key `joltapi.history`
- All plain JSON, no encryption. The UI shows a warning in `VariablesEditor` and `AuthEditor`.

## Security Notes

- **`dangerouslySetInnerHTML`** is used in `UrlBar`, `HighlightedTextarea`, `ResponseBody`. Each calls `escapeHtml()` BEFORE injecting any HTML. The pattern is: escape → syntax-highlight regex → inject. Do not change this order.
- **JSON highlighting** uses inline `<span style="color:#...">` — NOT CSS classes. The `.jk-key` / `.jk-string` classes were removed because VS Code theme variables resolved inconsistently. Use inline styles for any new syntax highlighting.
- **CSP** is enforced in `webviewPanel.ts` with a per-session nonce. `style-src 'unsafe-inline'` is required for React inline styles.
- **Nonce** uses `crypto.randomUUID()` — do not revert to `Math.random()`.
- **postMessage origin** is validated in `bridge.ts` (`event.origin.startsWith('vscode-webview://')`).
- **cURL commands** use `shellEscape()` with single-quote wrapping in `httpService.ts`. Never use ad-hoc double-quote escaping.
- **Logging** uses `redactUrl()` to strip query param values before output. Never log raw URLs.
- **Sensitive fields** (bearer token, API key value, basic password) use `type="password"`. Do not change to `type="text"`.

## UI Patterns

- **Overlay components** (`UrlBar`, `HighlightedTextarea`): backdrop `<div>` with highlighted HTML behind a transparent `<input>`/`<textarea>`. Both layers share identical font, padding, and sizing. The foreground element has `color: transparent` and `backgroundColor: transparent`.
- **Placeholder handling**: only the native input/textarea shows the placeholder attribute. The backdrop renders nothing when value is empty (`hasContent` guard).
- **Query params sync**: `requestStore.setQueryParams()` calls `rebuildUrl()` to update the URL in real time. Enabled params appear as `?key=value`; disabled/removed params disappear.
- **Request headers display**: `formatRequestHeaders()` in `RequestBuilder.tsx` reconstructs all headers client-side (Host from URL, auth headers, Content-Type, User-Agent, Accept, etc.) with variable interpolation. Sensitive auth values are redacted (`***`).
- **Keyboard shortcut**: Ctrl+Enter / Cmd+Enter sends the current request from anywhere in the webview. Listener registered in `MainView.tsx` via `useEffect` keydown.
- **Error display**: errors from the extension host are shown in a red box in the response area. Do NOT call `clearResponse()` on error — it causes flicker. Dismiss independently.

## VSIX Packaging

`.vscodeignore` includes `out/` for packaging. The compiled JS is needed in the VSIX.

## Adding a New Command/Message

1. Add the message type to BOTH `src/models/messages.ts` AND `webview-ui/src/types/messages.ts`
2. Add a handler function in the appropriate `src/panels/handlers/<domain>.ts` and wire it in `messageHandlers.ts`
3. Send from the webview via `useSendMessage()` hook
4. Listen for responses via `useMessageListener()` hook, update stores as needed
5. If the mutation affects data visible in the sidebar, call `notifyChanged()` so `broadcastRefresh` pushes fresh state to both webviews

## Zustand Patterns

- Always use `getState()` inside message listeners and event callbacks — React hook closures (`useStore(s => s.xxx)`) are stale by one render. Use hook values only for rendering (JSX).
- `addPrepopulatedTab(name, method, url)` in `tabStore` creates a tab with data pre-populated atomically. Prefer this over `addTab()` + `updateTab()` when opening requests.
- After closing the active tab, always `loadRequest()` the new active tab's data to prevent stale data propagation.

## When a File Is Getting Too Long

- Panel lifecycle → `panels/webviewPanel.ts`
- Message routing → `panels/messageHandlers.ts` (routes to handlers/)
- Request builder → `views/RequestBuilder.tsx`
- Response viewer → `views/ResponseView.tsx`
- Key-value editor → `components/KeyValueEditor.tsx` + `components/AutocompleteInput.tsx`
- Consider extracting handler groups into `panels/handlers/<domain>.ts`