# Contributing to JoltAPI

## Getting Started

### Prerequisites
- Node.js 18+ (bundled with VS Code 1.82+)
- npm 9+
- VS Code 1.82+

### Setup
```bash
git clone <repo-url>
cd joltapi
npm install
cd webview-ui && npm install && cd ..
```

### Development Build
```bash
# Terminal 1: Watch and compile extension host TypeScript
npm run watch

# Terminal 2: Build webview UI (React + Vite)
cd webview-ui && npm run dev
```

### Debugging
1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. In the new VS Code window, press `Ctrl+Shift+J` (`Cmd+Shift+J` on Mac) to open JoltAPI
4. Use the **Debug Console** in the original VS Code window to see extension host logs
5. Right-click in the JoltAPI Webview → **Inspect** to open Chrome DevTools for the UI

### Running Tests
```bash
npm test
```

## Project Structure

```
joltapi/
├── src/                  # Extension host (Node.js process)
│   ├── extension.ts      # Entry point — activates/deactivates only
│   ├── commands/         # VS Code registered commands
│   ├── panels/           # Webview panel lifecycle + message handlers
│   ├── services/         # Business logic (http, storage, environments)
│   ├── models/           # TypeScript interfaces
│   ├── types/            # Utility types
│   └── utils/            # Constants, strings, validators, formatters
├── webview-ui/           # Separate React + Vite project
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── views/        # Top-level page views
│   │   ├── hooks/        # Custom React hooks
│   │   ├── store/        # Zustand state stores
│   │   ├── api/          # postMessage bridge
│   │   └── types/        # Shared types (mirror of src/models/)
│   └── vite.config.ts
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
    └── SPEC.md           # Full specification
```

## How to Add a New Command

1. **Define the message type** in `src/models/messages.ts` (and mirror in `webview-ui/src/types/messages.ts`)
2. **Add a handler** in `src/panels/messageHandlers.ts`
3. **Wire the UI** — send the message from a component using `useSendMessage()`
4. **Add a store action** if state needs to be updated on response

## How to Add a New UI Feature

1. Create a component in `webview-ui/src/components/`
2. Export it from `webview-ui/src/components/index.ts`
3. Import and use it in `MainView.tsx` or a sub-view
4. Use Zustand stores for local state, `useSendMessage()` for extension communication

## Code Style

- **Files**: `camelCase.ts` for modules, `PascalCase.tsx` for React components
- **Interfaces**: `I` prefix (e.g., `IHttpRequest`)
- **One responsibility per file**, target ~200 lines max
- **No JSX outside of `.tsx` files**
- **Strict TypeScript** (`"strict": true`), no `any` without comment
- **All user-facing strings** belong in `src/utils/strings.ts`

## Build & Release

```bash
npm run build          # Compile extension host + build webview
npm run vscode:prepublish  # Called by vsce before packaging
```

To create a `.vsix`:
```bash
npm install -g @vscode/vsce
vsce package
```
