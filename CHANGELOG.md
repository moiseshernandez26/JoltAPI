# Changelog

All notable changes to the JoltAPI extension are documented in this file.

## [0.1.0] — 2026-06-07

### Added
- **HTTP Request Builder** — Method selector, URL input with `{{variable}}` visual highlighting (amber overlay), and Send button (Enter key).
- **Request Tabs** — Headers, Body (JSON / form-data / raw / none), Query Params, Auth.
- **Body Editor** — Syntax-highlighted JSON and raw text editing with inline token colors.
- **Auth Presets** — Bearer Token, Basic Auth, API Key (header or query param). Sensitive fields use `type="password"`.
- **Response Viewer** — Status/Time/Size bar with labels; tabbed Body and Headers views.
- **Response Body Highlighting** — JSON auto-detection with inline color tokens (keys, strings, numbers, booleans).
- **Response Tabs** — Body (default) and Headers (response + request headers, collapsible).
- **Variables** — Flat key-value list in sidebar, auto-saved to `.joltapi/variables.json`. `{{var}}` interpolation in URL, headers, body, and auth.
- **Query Params Sync** — Params tab edits update the URL in real time; removing/disabling params removes them from the URL.
- **Request Headers Preview** — Reconstructed headers shown in response tab: Host, User-Agent, Accept, Content-Type, auth headers, user headers — all with variable interpolation.
- **Collections** — CRUD for collections and saved requests, persisted to `.joltapi/collections/`.
- **Import** — Postman v2.1, Insomnia, and `.joltapi.json` formats.
- **Export** — Collections to `.joltapi.json`.
- **Request History** — Sidebar panel with replay.
- **Proxy Support** — Per-request proxy via undici ProxyAgent; global defaults from VS Code settings.
- **SSL Toggle** — Disable SSL verification per-request or globally.
- **VS Code Settings** — timeout, sslVerify, followRedirects, maxRedirects, defaultHeaders, proxy, historyLimit.
- **Keyboard Shortcut** — `Ctrl+Shift+J` / `Cmd+Shift+J`.
- **CSP-Compliant Webview** — Nonce-based CSP with `crypto.randomUUID()`.
- **Error Handling** — Unresolved variable detection with clear error messages; errors displayed in response area; structured console logging with stack traces; URL query params redacted in logs.
- **Security** — `shellEscape()` for cURL commands; `redactUrl()` for log safety; postMessage origin validation; plaintext storage warnings in Variables and Auth editors.
- **Minimal Dependencies** — Zero runtime deps (extension host); React + Zustand + Vite (webview).

### Changed (from original design)
- Environments concept removed — replaced with flat variables (no SecretStorage, no environment switching).

