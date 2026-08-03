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
  <img src="https://img.shields.io/badge/version-0.6.0-orange" alt="Version" />
  <a href="https://marketplace.visualstudio.com/items?itemName=S0nder.auditext"><img src="https://img.shields.io/badge/vscode-install-blue?logo=visual-studio-code" alt="VS Code Marketplace" /></a>
</p>

---

## What is JoltAPI?

JoltAPI gives you a Postman-like experience inside VS Code. Write requests with autocomplete, interpolate variables, organize into collections, and inspect responses — all powered by Node.js native `fetch` with zero runtime dependencies.

- Full HTTP method support (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Request builder with variable highlighting, autocomplete headers, and tabbed body editor
- Bearer, Basic Auth, and API Key presets — masked by default, with a show/hide toggle so you can proofread a long token
- Per-request timeout, SSL verification, and redirect limits
- Syntax-highlighted response viewer with status, timing, and size
- Variable interpolation with `{{double-brace}}` syntax
- Collections organized as workspace JSON files (VCS-friendly)
- Multi-tab request windows (up to 10) with rename/delete sync
- Import from Postman v2.1 and Insomnia
- **Reusable proxies** — save named proxy configurations once, then pick one per request from a dropdown
- Copy as cURL (proxy flags included) and request history
- Editor-like body editor: Tab-to-indent, auto-closing brackets/quotes, HTML/XML tag closing, and a one-click JSON Format button
- Works in virtual workspaces (github.dev and other file-system providers)

---

## Quick Start

```bash
git clone https://github.com/anomalyco/joltapi.git
cd joltapi
npm install && cd webview-ui && npm install && cd ..
npm run build
```

Open the folder in VS Code and press `F5` to launch the Extension Dev Host.

> **Important:** F5 only bundles the extension host. Run `npm run build` first so the webview assets are up to date.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+J` / `Cmd+Shift+J` | Open JoltAPI |
| `Ctrl+Enter` / `Cmd+Enter` | Send request |
| `Ctrl+S` / `Cmd+S` | Save request to a collection (opens the save dialog) |
| `Tab` / `Shift+Tab` (in the body editor) | Indent / outdent — 4 spaces, or block-indents a multi-line selection |

### Body Editor

The body editor behaves like a lightweight code editor:
- **Tab-to-indent** — `Tab` inserts 4 spaces (or indents every line of a selection); `Shift+Tab` outdents.
- **Auto-close brackets/quotes** — typing `(`, `[`, `{`, `"`, or `'` inserts the matching closer with the cursor between them; typing the closer again types over it instead of duplicating it. Backspace between an empty pair (`(|)`) removes both at once.
- **Auto-indent on Enter** — new lines match the current line's indentation, add a level after an opening bracket, and splits an empty pair (`{|}`) onto three lines with the cursor indented in between.
- **Format button** — appears above the editor whenever the Body tab is set to JSON; pretty-prints the current JSON with 4-space indentation. Disabled while the JSON is invalid (fix the syntax error shown below the editor first).
- **HTML/XML tag closing** — in a raw body set to `application/xml`, `text/xml`, or `text/html`, typing `>` at the end of an opening tag inserts the matching closer: `<user` + `>` → `<user>|</user>`. Closing tags, self-closing tags (`<br />`), comments, declarations, and HTML void elements (`<br>`, `<img>`, …) are left alone.

### Sidebar

The JoltAPI sidebar has four tabs:

| Tab | What it holds |
|-----|---------------|
| **Collections** | Saved requests, grouped into collections. Right-click to rename, move, or delete. |
| **History** | Recent requests with one-click replay. |
| **Variables** | Flat `{{key}}` → value list used to interpolate URLs, headers, body, and auth. |
| **Proxies** | Named proxy configurations shared by every request. |

---

## Proxies

Proxies are defined **once** and reused. Instead of retyping a host, port, and credentials on every request, you save a named proxy in the sidebar and pick it from a dropdown wherever you need it.

**Create one** — open the sidebar's **Proxies** tab → **+ Add Proxy**, then fill in:

| Field | Notes |
|-------|-------|
| Name | What shows up in the request dropdown (e.g. `Corporate`, `Staging tunnel`). |
| Host | Hostname or IP only. Paste `http://proxy.example.com:8080/` and JoltAPI strips the scheme and moves the port into the Port field for you. A path, spaces, or `user@host` are rejected with an inline error. |
| Port | 1–65535. The **Add proxy** button stays disabled until name, host, and port are all valid. |
| Username / Password | Optional. Sent as proxy auth; the password is masked with an eye button to reveal it. A password requires a username. |

Click a saved proxy to edit it, or the **✕** to delete it.

**Use one** — open any request's **Proxy** tab and pick it from the dropdown. `No proxy — send directly` is the default. The selected proxy's address and auth are shown underneath so you can confirm what the request will actually go through.

Because a request stores only a *reference* to the proxy, editing a proxy's host or port instantly applies to every request using it. Delete a proxy that requests still point to and those requests show a **Missing proxy — deleted** warning; sending one fails with a clear error rather than silently going out direct. The same holds if a proxy can't be applied for any other reason — JoltAPI aborts the request instead of quietly sending it unproxied.

Proxies are stored in `.joltapi/proxies.json` alongside your collections and variables, so they travel with the workspace. When you **export** a collection, the proxies its requests use are bundled into the `.joltapi.json` file **without their credentials**, and importing recreates any your workspace doesn't already have — so a shared collection works out of the box, and you only re-enter the password.

> **Upgrading from 0.4.0 or earlier?** Requests saved with the old inline per-request proxy keep working — their Proxy tab shows the old settings read-only, and picking a saved proxy migrates them.

---

## Per-Request Settings

Each request's **Settings** tab overrides the workspace defaults for that request alone:

| Setting | Effect |
|---------|--------|
| Timeout | Seconds to wait before aborting. Defaults to `joltapi.timeout`. |
| Verify SSL certificates | Turn off to accept a self-signed certificate. A warning is shown while it's off — responses can be intercepted or forged. |
| Follow redirects | When off, the 3xx response itself is returned instead of the redirect target. |
| Max redirects | How many hops to follow before stopping. |

Redirects are followed by JoltAPI itself, which means: your hop limit is respected, `POST` becomes `GET` on 301/302/303 (matching browsers and curl), and **`Authorization`/`Cookie` headers are dropped when a redirect crosses to a different origin** — the redirect target is chosen by the remote server, so forwarding credentials there would hand your token to a host you never named.

---

## How It Works

Requests are built in a React webview panel and sent to the extension host via `postMessage`. The host resolves `{{variables}}`, looks up the request's saved proxy, executes the HTTP call with Node.js `fetch`, and posts the response back. Collections, variables, and proxies live as plain JSON in `.joltapi/` inside your workspace.

```
Sidebar (collections, history, variables, proxies) ──► Extension Host ──► HTTP
                                                            │
Main Panel (request builder, response) ◄─────────────────────┘
```

Any change made in one webview (saving a proxy, renaming a request) is broadcast to both, so the sidebar and the request panel never drift apart.

---

## Storage

Everything lives in your workspace — human-readable, VCS-friendly:

```
<workspace>/.joltapi/
├── variables.json
├── proxies.json
└── collections/
    └── <name>.json
```

> Variables, auth values, and proxy credentials are stored in plain text. Do not store production credentials.

All reads and writes go through VS Code's file-system API, so JoltAPI also works in virtual workspaces (github.dev and other file-system providers).

---

## Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `joltapi.timeout` | number | `30000` | Default request timeout in milliseconds. Override per request in its Settings tab. |
| `joltapi.sslVerify` | boolean | `true` | Verify SSL certificates. Disable for self-signed certificates. |
| `joltapi.followRedirects` | boolean | `true` | Automatically follow HTTP redirects. |
| `joltapi.maxRedirects` | number | `5` | Maximum number of redirects to follow. |
| `joltapi.defaultHeaders` | array | `[]` | Default headers added to every request. |
| `joltapi.proxy.host` | string | `""` | Imported once per workspace into a saved proxy profile named `Workspace default`; manage proxies in the sidebar's Proxies tab. |
| `joltapi.proxy.port` | number | `0` | Port for the imported profile. Both host and port must be set for the import to happen. |
| `joltapi.proxy.username` | string | `""` | Username for the imported profile. The password is never stored in settings — add it in the Proxies tab. |
| `joltapi.historyLimit` | number | `50` | Maximum number of history entries to keep. |

> In untrusted workspaces, a repository's own `.vscode/settings.json` cannot override `joltapi.proxy.*` or `joltapi.defaultHeaders` — only your User/machine-level values apply. This prevents an untrusted repo from injecting extra headers or seeding a proxy profile that would reroute your requests.

---

## Dev Workflow

```bash
npm run watch                     # Rebuild the host bundle on change (esbuild)
cd webview-ui && npm run dev      # Watch webview build (in another terminal)

npm run build                     # One-shot: bundle host + build webview
npm run lint                      # Type-check both projects
npm test                          # Unit tests (host + webview)
npm run test:integration          # Real VS Code integration tests (downloads VS Code once)
```

The extension host is bundled with esbuild into a single `out/extension.js`. `undici` stays
external and ships in `node_modules` — bundling it would break the `.wasm` lookup its HTTP
parser does relative to its own directory, silently disabling proxy and SSL-bypass support.

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
