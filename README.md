<p align="center">
  <img src="media/demo.gif" alt="JoltAPI Demo" width="800" />
</p>

<p align="center">
  <img src="JoltIcon.png" alt="JoltAPI" width="96" height="96" />
</p>

<h1 align="center">JoltAPI</h1>

<p align="center">
  <strong>A REST API client for VS Code</strong><br />
  Build, send, and inspect HTTP requests without leaving the editor.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/vscode-%5E1.82.0-blue?logo=visual-studio-code" alt="VS Code" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/version-0.3.1-orange" alt="Version" />
  <a href="https://marketplace.visualstudio.com/items?itemName=S0nder.auditext"><img src="https://img.shields.io/badge/vscode-install-blue?logo=visual-studio-code" alt="VS Code Marketplace" /></a>
</p>

---

## What is JoltAPI?

JoltAPI gives you a Postman-like experience inside VS Code. Write requests with autocomplete, interpolate variables, organize into collections, and inspect responses — all powered by Node.js native `fetch` with zero runtime dependencies.

- Full HTTP method support (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Request builder with variable highlighting, autocomplete headers, and tabbed body editor
- Bearer, Basic Auth, and API Key presets
- Syntax-highlighted response viewer with status, timing, and size
- Variable interpolation with `{{double-brace}}` syntax
- Collections organized as workspace JSON files (VCS-friendly)
- Multi-tab request windows (up to 10) with rename/delete sync
- Import from Postman v2.1 and Insomnia
- Copy as cURL, request history, per-request proxy configuration
- Editor-like JSON body: Tab-to-indent, auto-closing brackets/quotes, and a one-click Format button

---

## Quick Start

```bash
git clone https://github.com/anomalyco/joltapi.git
cd joltapi
npm install && cd webview-ui && npm install && cd ..
npm run build
```

Open the folder in VS Code and press `F5` to launch the Extension Dev Host.

> **Important:** F5 only compiles TypeScript. Run `npm run build` first so the webview assets are up to date.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+J` / `Cmd+Shift+J` | Open JoltAPI |
| `Ctrl+Enter` / `Cmd+Enter` | Send request |
| `Ctrl+S` / `Cmd+S` | Save request to a collection (opens the save dialog) |
| `Tab` / `Shift+Tab` (in the body editor) | Indent / outdent — 4 spaces, or block-indents a multi-line selection |

### JSON Body Editor

The JSON body editor behaves like a lightweight code editor:
- **Tab-to-indent** — `Tab` inserts 4 spaces (or indents every line of a selection); `Shift+Tab` outdents.
- **Auto-close brackets/quotes** — typing `(`, `[`, `{`, `"`, or `'` inserts the matching closer with the cursor between them; typing the closer again types over it instead of duplicating it. Backspace between an empty pair (`(|)`) removes both at once.
- **Auto-indent on Enter** — new lines match the current line's indentation, add a level after an opening bracket, and splits an empty pair (`{|}`) onto three lines with the cursor indented in between.
- **Format button** — appears above the editor whenever the Body tab is set to JSON; pretty-prints the current JSON with 4-space indentation. Disabled while the JSON is invalid (fix the syntax error shown below the editor first).

---

## How It Works

Requests are built in a React webview panel and sent to the extension host via `postMessage`. The host resolves `{{variables}}`, executes the HTTP call with Node.js `fetch`, and posts the response back. Collections and variables live as plain JSON in `.joltapi/` inside your workspace.

```
Sidebar (collections, history, variables) ──► Extension Host ──► HTTP
                                                    │
Main Panel (request builder, response) ◄─────────────┘
```

---

## Storage

Everything lives in your workspace — human-readable, VCS-friendly:

```
<workspace>/.joltapi/
├── variables.json
└── collections/
    └── <name>.json
```

> Variables and auth values are stored in plain text. Do not store production credentials.

---

## Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `joltapi.timeout` | number | `30000` | Request timeout in milliseconds. |
| `joltapi.sslVerify` | boolean | `true` | Verify SSL certificates. Disable for self-signed certificates. |
| `joltapi.followRedirects` | boolean | `true` | Automatically follow HTTP redirects. |
| `joltapi.maxRedirects` | number | `5` | Maximum number of redirects to follow. |
| `joltapi.defaultHeaders` | array | `[]` | Default headers added to every request. |
| `joltapi.proxy.host` | string | `""` | Default proxy host. |
| `joltapi.proxy.port` | number | `0` | Default proxy port. |
| `joltapi.proxy.username` | string | `""` | Default proxy username. |
| `joltapi.historyLimit` | number | `50` | Maximum number of history entries to keep. |

> In untrusted workspaces, a repository's own `.vscode/settings.json` cannot override `joltapi.proxy.*` or `joltapi.defaultHeaders` — only your User/machine-level values apply. This prevents an untrusted repo from silently rerouting your requests through another proxy or injecting extra headers.

---

## Dev Workflow

```bash
npm run watch                     # Watch extension host TypeScript
cd webview-ui && npm run dev      # Watch webview build (in another terminal)

npm run build                     # One-shot: compile host + build webview
npm run lint                      # Type-check both projects
npm test                          # Run test suite
```

---

## Promo Video

The demo above was built with [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML-to-MP4, Apache 2.0). The composition lives in `joltapi-video/index.html`.

```bash
cd joltapi-video
npm install
npm run render    # outputs MP4 to renders/
```

> Requires Node.js 22+ and FFmpeg.

---

## License

MIT © JoltAPI — by [S0nder](https://github.com/moiseshernandez26)
