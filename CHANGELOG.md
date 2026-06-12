# Changelog

All notable changes to JoltAPI are documented in this file.

## [0.3.2] — 2026-06-11

### Fixed
- **Critical: Blank panels after marketplace install** — `.vscodeignore` was excluding the built `webview-ui/dist/` folder, so no webview assets shipped in the VSIX. Both the sidebar and main panel rendered empty. Fixed with a negation pattern to preserve `dist/` while still excluding source.

## [0.3.1] — 2026-06-11

### Added
- **Rename Modal** — Proper `<input>` modal for renaming requests (replaces `window.prompt` which is blocked by webview CSP).
- **Move-to Modal** — `<select>` dropdown modal for moving requests between collections.
- **Active Request Highlight** — Currently-open request is highlighted in the Collections sidebar.
- **Tab Sync on Rename/Delete** — Tabs update name or auto-close when a collection request is renamed or deleted.
- **Demo Video** — 15-second showcase GIF on the README (built with HyperFrames).

### Fixed
- Proxy dispatcher overwrite when SSL verification was disabled (`httpService.ts`).
- Header key mutation during variable interpolation — old unresolved template keys now properly replaced.
- Variable highlight color now consistent (`#e0a030`) between URL bar and textarea.
- Zustand hook called inside JSX — moved to component top level per Rules of Hooks.
- Save dedup — removed redundant `collectionsLoaded` pushes; single source of truth via `broadcastRefresh`.

### Changed
- Icon redesigned — ⚡ white lightning bolt on blue gradient background.
- "Open App" button replaces "New Request" in sidebar. Reuses empty tabs instead of creating new ones.
- Tab close buttons use inline SVG × icon with hover CSS.

## [0.3.0] — 2026-06-11

### Added
- **Custom Webview Sidebar** — Single `WebviewViewProvider` hosting React sidebar with Collections, History, and Variables tabs (replaces 4 native TreeViews).
- **Multi-page Vite Build** — Panel + Sidebar from same project; shared `global.js` chunk.
- **`openInPanel` Protocol** — Sidebar-to-panel request opening via postMessage.
- **Cross-webview State Sync** — `broadcastRefresh` pushes collections/variables to both webviews after any mutation.
- **Right-click Context Menus** — Delete Collection, Move/Rename/Delete Request via native `onContextMenu`.
- **"+ Open App" Button** — Prominent button at top of sidebar opens main panel.
- **Promo Video** — Composition in `joltapi-video/`, rendered with HyperFrames.

### Removed
- 11 obsolete commands from `package.json` (refresh/add/delete/move/edit for native TreeViews).
- 9 dead files (~500 lines): TreeDataProviders, unused utils/barrels.

## [0.2.0] — 2026-06-09

### Added
- **Activity Bar Integration** — Bolt icon opens sidebar with native tree views.
- **Panel Tab Icon** — `JoltIcon.png` shown in the webview editor tab.
- **Multi-tab Request Windows** — Tab bar with up to 10 tabs, close buttons, Ctrl+Enter send.
- **Auto-create Default Collection** — Created on first launch if none exist.
- **Auto-generate Request Names** — Based on URL hostname (e.g., `jsonplaceholder`).
- **Move Requests** — Between collections via right-click context menu.
- **Auto-save to Default Collection** — Successful requests auto-saved.
- **Tab Dedup** — Opening a request already open in a tab switches to it instead of creating a duplicate.
- **Message Loss Prevention** — Module-level `window.addEventListener('message')` with `_pending` buffer guarantees zero message loss for cold-started panels.
- **Tab Active Border Animation** — Gradient flow on active tab using `repeating-linear-gradient`.

### Fixed
- 15 audit fixes: auto-save updates, default collection guard, cURL multipart `-F` flags, history truncation (10KB), sensitive header redaction, unresolved variable detection (URL + headers + body), isDirty warning, header case-insensitivity, Ctrl+Enter shortcut, logger dedup, dead code removal, accessibility, scroll preservation, emoji→chevron icons.

## [0.1.0] — 2026-06-07

### Added
- **HTTP Request Builder** — Method selector, URL input with `{{variable}}` visual highlighting (amber overlay), and Send button (Enter key).
- **Request Tabs** — Headers, Body (JSON / form-data / raw / none), Query Params, Auth.
- **Body Editor** — Syntax-highlighted JSON and raw text editing with inline token colors.
- **Auth Presets** — Bearer Token, Basic Auth, API Key (header or query param). Sensitive fields use `type="password"`.
- **Response Viewer** — Status/Time/Size bar with labels; tabbed Body and Headers views.
- **Response Body Highlighting** — JSON auto-detection with inline color tokens.
- **Variables** — Flat key-value list, auto-saved to `.joltapi/variables.json`. `{{var}}` interpolation in URL, headers, body, and auth.
- **Query Params Sync** — Params tab edits update the URL in real time; removing/disabling params removes them from the URL.
- **Request Headers Preview** — Reconstructed headers shown in response tab with variable interpolation.
- **Collections** — CRUD for collections and saved requests, persisted to `.joltapi/collections/`.
- **Import/Export** — Postman v2.1, Insomnia, and `.joltapi.json` formats.
- **Request History** — Sidebar panel with replay.
- **Proxy Support** — Per-request proxy via undici ProxyAgent; global defaults from VS Code settings.
- **SSL Toggle** — Disable SSL verification per-request or globally.
- **VS Code Settings** — timeout, sslVerify, followRedirects, maxRedirects, defaultHeaders, proxy, historyLimit.
- **Keyboard Shortcut** — `Ctrl+Shift+J` / `Cmd+Shift+J`.
- **CSP-Compliant Webview** — Nonce-based CSP with `crypto.randomUUID()`.
- **Error Handling** — Unresolved variable detection; structured logging with URL redaction.
- **Security** — `shellEscape()` for cURL commands; `redactUrl()` for log safety; postMessage origin validation.
