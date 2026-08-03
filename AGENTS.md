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

- **Extension host** (`/`): Node.js, bundled with **esbuild** (`esbuild.js`) into a single `out/extension.js`. Entry: `src/extension.ts`. `tsc` is still the type-checker (`npm run lint`) and still compiles the test build to `out-test/`, but it no longer produces what ships.
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
npm run build                     # bundles host (esbuild) + builds webview (vite)
npm run compile                   # host bundle only → out/extension.js
npm run compile:production        # minified, no sourcemap (used by vscode:prepublish)
cd webview-ui && npm run build    # webview only (vite)

# Type checking
npm run lint                      # tsc --noEmit on both projects
cd webview-ui && npx tsc --noEmit # webview typecheck only

# Tests
npm run test:host        # pure-logic host tests: tsc → out-test/ + mocha (tests/unit, tests/integration/*.test.ts)
npm run test:webview     # webview-ui: vitest (webview-ui/tests/)
npm test                 # both of the above
npm run test:integration # REAL VS Code via @vscode/test-electron (tests/integration/*.itest.ts)
```

**Two different things are called "integration" here.** `tests/integration/*.test.ts` are plain
type/shape checks run by the normal mocha runner. `tests/integration/*.itest.ts` run *inside* a
downloaded VS Code with a live `vscode` API, launched by `tests/integration/runTests.ts` and
collected by `tests/integration/index.ts`. The `.itest.js` suffix is what keeps the two apart —
name a real integration test `*.test.ts` and the unit runner will try to load `vscode` outside
the host and blow up.

## F5 Debugging Gotcha

`preLaunchTask` in `.vscode/launch.json` only runs `npm: compile` (the esbuild host bundle). The **webview UI is NOT auto-built** before launch. You must run `cd webview-ui && npm run build` first, or F5 will load stale webview assets.

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
  ├── handlers/proxyHandler.ts       → load/save proxy profiles
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

**Cross-webview state sync**: After any mutation (save/delete collection, save/delete variables, save/delete proxy profile, save request, etc.), `notifyChanged()` calls `broadcastRefresh()` in `extension.ts`, which pushes fresh `collectionsLoaded`, `variablesLoaded`, `proxiesLoaded` to BOTH webviews via `SidebarProvider.sendToSidebar()` and `JoltApiPanel.sendToWebview()`.

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
- `requestStore` — current request form state (isDirty, loadRequest, resetRequest, setName)
- `responseStore` — last response
- `collectionStore` — loaded collections (for SaveRequestDialog dropdown)
- `variableStore` — flat variable list (for interpolation)
- `tabStore` — multi-tab state: `tabs: IRequestTab[]`, `activeTabIndex`, `addTab`, `addPrepopulatedTab(name, method, url)`, `removeTab`, `setActiveTab`, `updateTab`, `closeAllTabs`, `closeOtherTabs`. Tabs have a `fromCollection: boolean` flag — `true` for tabs opened from collections, `false` for manual tabs. This flag controls which tabs are auto-closed during rename/delete sync.

- `proxyStore` — saved proxy profiles (panel-side, feeds the request's proxy dropdown)

Sidebar uses its own store:
- `sidebarStore` — collections, history, variables, proxies, activeTab sidebar tab, expandedCollections, isLoading

Sidebar tabs are `'collections' | 'history' | 'variables' | 'proxies'`.
Request-builder tabs are `'params' | 'headers' | 'body' | 'auth' | 'proxy' | 'settings'`.

## HTTP Engine Quirks

- Uses Node.js **native `fetch`** (undici under the hood, available in Node 18+) for the actual request
- Proxy and SSL-verify-disable use `require('undici')` **dynamically at runtime** (not a static import) to construct a `ProxyAgent`/`Agent` dispatcher — the return type is manually cast to `unknown` rather than using undici's real types, so this stays a deliberate runtime dependency check, not a compile-time one
- Timeout uses `AbortController` + `setTimeout` (not `AbortSignal.timeout()` because `@types/node` version expects 2 args)
- **Redirects are followed manually** (`redirect: 'manual'` + a loop in `executeRequest`, helpers in `services/redirects.ts`). `fetch`'s own following can't honor `maxRedirects`, can't stop at the first hop, and can't strip credentials cross-origin. `nextRedirectStep()` owns the three rules that matter: relative `Location` resolution, POST→GET downgrade on 301/302/303, and dropping `Authorization`/`Cookie`/`Proxy-Authorization` when the origin changes (the redirect target is attacker-chosen, so forwarding a bearer token there is a real exfiltration path). The response's `requestUrl`/`requestMethod` report the *final* hop.
- `buildCurlCommand()` uses `shellEscape()` with single-quote wrapping — do not revert to ad-hoc escaping
- `redactUrl()` strips query param values before any log output
- **Gotcha — `undici` is a real `dependencies` entry AND needs its own `.vscodeignore` re-include:** it used to be `require()`d without being declared as a dependency at all, so it silently failed in every environment (confirmed via test — see `tests/unit/httpService.test.ts`) and proxy/SSL-bypass did nothing with no error shown. It's now in `package.json` `dependencies`, but `.vscodeignore`'s blanket `node_modules/**` exclusion still needs an explicit negation for it (scoped to `package.json`, `LICENSE`, `index.js`, `index-fetch.js`, `lib/**` — not the whole package, which also has unneeded `docs/`/`types/`/`scripts/`). If you ever touch `.vscodeignore` or bump/replace this dependency, verify with `npx @vscode/vsce ls | grep undici` — don't assume it's still shipping. See `docs/SPEC.md` §11.1.

## Variable Interpolation

Happens at **send time**, resolved by `resolveHttpRequest()` in `handlers/resolveRequest.ts` (called from both `sendRequestHandler.ts` and `curlHandler.ts`). The `interpolateTemplate` function in `handlers/interpolation.ts` does the actual `{{var}}` replacement. Variables are flat key-value pairs stored in `.joltapi/variables.json` — there is no "environments" concept.

**Gotcha — interpolate BEFORE URL-encoding, never after:** `URLSearchParams.append()` percent-encodes `{` and `}` (`{{token}}` → `%7B%7Btoken%7D%7D`). If you interpolate the fully-assembled URL string *after* query params have been appended, the `{{name}}` regex will never match the now-encoded text — the variable silently stays unresolved, and it won't even get flagged as "unresolved" if that same check also runs against the encoded URL (this was a real, shipped bug — see `docs/handoff/16_CHANGES.md` Bug 1). The correct pattern, used in `resolveRequest.ts`: interpolate each query-param/header/auth/body piece individually via the local `interp()` helper *before* it goes into `URLSearchParams` or the headers object, and collect the pre-encode result into `rawPieces` for `extractUnresolved()` to check. `resolveRequest.ts` is deliberately free of any `vscode` import (directly or transitively) so it stays unit-testable outside the extension host — don't reintroduce a dependency on `storageService.ts` or similar into it.

## Proxy Profiles

Proxies are **shared, not per-request**. `.joltapi/proxies.json` holds `IProxyProfile[]` (id, name, host, port, optional auth); an `IHttpRequest` only stores `proxyId`. The sidebar's Proxies tab owns CRUD (`ProxiesPanel` + `ProxyForm`), the request's Proxy tab is a pure selector (`ProxySelector`).

- **Resolution happens host-side** in `resolveRequest.ts`'s `resolveProxy()` — `sendRequestHandler` loads the profiles and passes them in, so `resolveRequest.ts` stays `vscode`-free. `curlHandler` passes them too, so a copied command carries `--proxy`/`--proxy-user` and reproduces what JoltAPI actually sends; a missing profile there is reported rather than yielding a command that silently goes direct.
- **Gotcha — nothing may silently fall back to "send direct".** There are two distinct paths and both must fail loudly, because a request the user routed through a proxy leaking out direct is the worst outcome this feature has:
  1. Deleted profile → `resolveHttpRequest` returns `missingProxyId`, `sendRequestHandler` posts `PROXY_NOT_FOUND` and does not send. `ProxySelector` mirrors it with a "Missing proxy — deleted" option + red warning.
  2. Unbuildable agent → `httpService.executeRequest` throws `PROXY_AGENT_FAILED` when `createProxyAgent()` returns `undefined` (bad host, undici missing). It used to just skip the dispatcher and send unproxied with only a `console.error`. Keep the `clearTimeout` before that throw or the abort timer leaks.
- **Host field validation lives in `webview-ui/src/utils/proxyHost.ts`** (`parseProxyHost` / `validateProxyHost` / `isValidPort`, unit-tested in `webview-ui/tests/proxyHost.test.ts`). A pasted `http://host:8080/` is split into host + port; a path/space/`@`/leftover colon is rejected with an inline error rather than silently mangled — that's what produced the malformed `http://host:8080:8080` URI and the silent direct send.
- **Legacy**: `IHttpRequest.proxy` (the inline 0.4.0 shape) is still honored when there's no `proxyId`, so old collections/history entries keep working. `setProxyId()` clears it, migrating the request. `ProxySelector` renders it as its own selected option (via the `LEGACY` sentinel) — never let the dropdown read "No proxy — send directly" for a request that will in fact be proxied. Don't drop this branch without a migration pass over saved collections.
- **`proxyStore.loaded`** exists so an empty `profiles` array during the startup round trip isn't mistaken for "the profile was deleted". Any new UI that reasons about a missing profile must check it.
- **Export/import**: `.joltapi.json` bundles the profiles its requests reference (`collectReferencedProxies`, **credentials stripped** — an export is a file people mail around), and `handleImportCollection` merges back only ids the workspace doesn't already have, so a local profile with credentials always wins.

## Storage

**Everything goes through `vscode.workspace.fs`, never Node's `fs`.** That is what makes
`capabilities.virtualWorkspaces.supported: true` honest — in a virtual workspace (github.dev,
FS providers) a URI has no usable `.fsPath`, so `fs` would fail while still working perfectly
on your local machine. `storageService.ts`, `exportService.ts`, and `importService.ts` are all
URI-based, and the file dialogs in `settingsHandler.ts` hand back `uri.toString()` rather than
`.fsPath`. `src/` has zero imports of `fs` or `path` — keep it that way.

- `proxies.json` → `<workspace>/.joltapi/proxies.json`
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
- **Sensitive fields** (bearer token, API key value, basic password, proxy password) use the shared `components/SecretInput.tsx` — a `type="password"` input with an eye button that flips to `type="text"` only while the user holds it revealed. Never ship a bare `type="text"` for a secret, and don't hand-roll a second toggle: reuse `SecretInput` so masking-by-default stays the invariant (its `revealed` state is per-instance and resets on remount, e.g. switching auth type). `ProxySelector` shows a selected proxy's password as `••••••`, never the value.
- **Workspace Trust**: `package.json` `capabilities.untrustedWorkspaces.restrictedConfigurations` lists `joltapi.proxy.host`, `joltapi.proxy.port`, `joltapi.proxy.username`, `joltapi.defaultHeaders`. Without this, an untrusted repo's own `.vscode/settings.json` could silently reroute a user's requests through an attacker proxy or inject extra headers (e.g. exfiltrating an `Authorization` value) into every request sent while that workspace is open — with no trust prompt involved, since none of these are code execution. If you add a new setting whose value flows into every outgoing request, add it to this list too.
- **Errors** from the 4 vscode-dependent handlers (`sendRequestHandler`, `collectionHandler`, `variableHandler`, `importExportHandler`) go through `logError()` in `utils/logger.ts`, which writes to both `console.error` and the "JoltAPI" Output Channel (`utils/outputChannel.ts`) — don't `console.error` directly in those files, use `logError()` so users can actually see it via View > Output. `httpService.ts` is the one exception: it stays free of any `vscode` import for unit testability and uses plain `console.error`.

## UI Patterns

- **Overlay components** (`UrlBar`, `HighlightedTextarea`): backdrop `<div>` with highlighted HTML behind a transparent `<input>`/`<textarea>`. Both layers share identical font, padding, and sizing. The foreground element has `color: transparent` and `backgroundColor: transparent`.
- **Placeholder handling**: only the native input/textarea shows the placeholder attribute. The backdrop renders nothing when value is empty (`hasContent` guard).
- **Query params sync**: `requestStore.setQueryParams()` calls `rebuildUrl()` to update the URL in real time. Enabled params appear as `?key=value`; disabled/removed params disappear.
- **Request headers display**: `formatRequestHeaders()` in `RequestBuilder.tsx` reconstructs all headers client-side (Host from URL, auth headers, Content-Type, User-Agent, Accept, etc.) with variable interpolation. Sensitive auth values are redacted (`***`).
- **Keyboard shortcuts**: Ctrl+Enter / Cmd+Enter sends the current request; Ctrl+S / Cmd+S opens the save-to-collection dialog. Both registered in the same document-level `keydown` listener in `MainView.tsx`'s `useEffect` — add new global webview shortcuts there, not as a second listener. Both call `e.preventDefault()` (required for Ctrl+S specifically, to stop the browser's native "Save Page" behavior inside the webview).
- **Error display**: errors from the extension host are shown in a red box in the response area. Do NOT call `clearResponse()` on error — it causes flicker. Dismiss independently.
- **Hiding a scrollbar without disabling scroll**: give the scrollable element a class (inline `<style>` tag, same pattern as `RequestTabBar.tsx`'s `.tabs-container`) with `scrollbar-width: none; -ms-overflow-style: none;` plus a `::-webkit-scrollbar { display: none; }` rule. Keep `overflowX/Y: auto` on the element itself — only the visual scrollbar is hidden, scrolling (wheel/trackpad/drag) still works.
- **JSON body Format button**: `BodyEditor.tsx` shows a "Format" button above the JSON `HighlightedTextarea`, disabled whenever `body.jsonBody` is empty or invalid (reuses the same `getJsonError()` check that drives the red error border). `JSON.stringify(parsed, null, 4)` — 4 spaces, matching `HighlightedTextarea`'s own `INDENT` constant used by Tab and auto-indent-on-Enter.

## VSIX Packaging

**The host ships as one bundled file.** `esbuild.js` produces `out/extension.js`; `vscode:prepublish` runs the minified `compile:production` variant, so no sourcemap ships. `undici` is deliberately `external` in the bundle — it loads its llhttp parser from `.wasm` files relative to its own `__dirname`, and bundling it would break that lookup and silently kill proxy + SSL-bypass support (the exact class of bug this repo shipped twice). It therefore still needs its `.vscodeignore` negations.

`.vscodeignore` includes `out/` for packaging (compiled JS is needed in the VSIX). Also excluded: `src/`, `webview-ui/` (except `webview-ui/dist/**`), `tests/`, `webview-ui/tests/`, most of `node_modules/` (except specific `undici` files — see HTTP Engine Quirks above), `docs/`, `.vscode/`, `.vscode-test/`, `tsconfig.json`, `tsconfig.src.json`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`.

Files that ship in the VSIX (visible on marketplace): `README.md`, `CHANGELOG.md`, `SUPPORT.md`, `JoltIcon.png`, `icon_activity.svg`, `package.json`, `LICENSE`, `media/` (demo GIF), `undici`'s runtime files under `node_modules/`.

**Gotcha — `CONTRIBUTING.md` does NOT ship despite not being in `.vscodeignore`:** `@vscode/vsce` has its own built-in default-ignore for a file literally named `CONTRIBUTING.md` (verified empirically — a copy under a different filename ships fine). This is `vsce`'s own behavior, not a misconfiguration here. Don't "fix" this by renaming the file — GitHub specifically recognizes the literal name `CONTRIBUTING.md` and shows a contributing-guide banner on the repo page, more valuable than Marketplace visibility for that one file.

**Before trusting any claim about what ships in the VSIX (including in this file or `docs/`), verify with `npx @vscode/vsce ls`** — a prior session's docs claimed `CONTRIBUTING.md` ships and that claim was wrong; it had apparently never been checked against real `vsce` output.

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
- `setName(name)` in `requestStore` updates only `currentRequest.name` without marking `isDirty`. Use this for programmatic name updates (e.g., rename sync) where user hasn't edited the name manually.
- **Gotcha — a tab's full request state lives on the tab, not just in `requestStore`:** `IRequestTab` has a `request: IHttpRequest` field holding that tab's complete headers/body/auth/queryParams/settings. `RequestTabBar.tsx`'s per-render `useEffect` (keyed on `currentRequest`) keeps `tabs[activeTabIndex].request` in sync with `requestStore.currentRequest` while a tab is active. **Any code that switches the active tab or active request must call `loadRequest(tab.request)` — never hand-build a partial `IHttpRequest` object** (e.g. `{ ...tab, headers: [], body: { type: 'none' } }`). Doing so silently discards everything but method/URL for that tab (this was a real, shipped bug — see `docs/handoff/16_CHANGES.md` Bug 2). For a brand-new empty tab, use `createDefaultRequest()` (exported from `requestStore.ts`) rather than writing out the default shape again.

## Tab sync on collections rename/delete

When `collectionsLoaded` arrives (after any collection mutation), `syncTabs()` in `MainView.tsx` synchronizes tabs:
1. **Rename sync**: Builds a `method::url` → `collectionRequest.name` map from all collections. If a tab's name differs from the collection, updates it. Also calls `requestStore.setName()` for the active tab to prevent the `useEffect` in `RequestTabBar` from overwriting the new name with the stale old one.
2. **Delete sync**: Filters out any tab where `fromCollection: true` AND its `method::url` is not found in any collection. If all tabs removed, creates a fresh default. If the active tab was removed, loads the new active tab's data.

The sync logic lives in `MainView.tsx` (not in `tabStore`) because it needs access to both `tabStore` and `requestStore` simultaneously.

## When a File Is Getting Too Long

- Panel lifecycle → `panels/webviewPanel.ts`
- Message routing → `panels/messageHandlers.ts` (routes to handlers/)
- Request builder → `views/RequestBuilder.tsx`
- Response viewer → `views/ResponseView.tsx`
- Key-value editor → `components/KeyValueEditor.tsx` + `components/AutocompleteInput.tsx`
- Consider extracting handler groups into `panels/handlers/<domain>.ts`
## Per-Request Settings

`SettingsEditor.tsx` (Settings tab) edits `IHttpRequest.settings` — timeout, sslVerify,
followRedirects, maxRedirects. All four are now genuinely honored end to end: `resolveRequest`
puts them on `IResolvedHttpRequest` and `httpService` acts on each one.

**Before adding a control here, check the host actually implements it.** `followRedirects` and
`maxRedirects` sat in the model since v0.1.0 with nothing reading them; shipping a UI for them
without first writing the redirect loop would have been a switch that does nothing. If a setting
isn't wired through `resolveRequest.ts` → `httpService.ts`, wire it first.

## Body Editor Auto-Close

Two different mechanisms live in `HighlightedTextarea.tsx`:
- `AUTO_CLOSE_PAIRS` + `computeAutoCloseInsertion` — fixed character pairs (brackets/quotes), any language.
- `computeTagClose` — HTML/XML tag closing on `>`, which needs real tag-name parsing and so is
  deliberately NOT a character pair. It bails out for closing tags, self-closing tags, comments,
  declarations, an already-closed tag, and — in `html` mode only — void elements like `<br>`.
  `xml` mode does close `<br>`, because XML has no void elements.

Both are pure functions exported for vitest; the component only wires them to `keydown`.
