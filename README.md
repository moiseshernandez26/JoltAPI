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
- Copy as cURL, request history, proxy support

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

A 15-second showcase video is built with [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML-to-MP4, Apache 2.0). The composition lives in `joltapi-video/index.html`.

```bash
cd joltapi-video
npm install
npm run render    # outputs MP4 to renders/
```

> Requires Node.js 22+ and FFmpeg.

---

## License

MIT © JoltAPI — by [S0nder](https://github.com/moiseshernandez26)
