# Dead Code Detector

## Purpose
Identify and remove unused code after major refactors (like the sidebar migration).

## When to Run
- After removing UI components (e.g., sidebar → native views)
- After changing architecture patterns
- Before major releases

## Detection Strategy

### 1. Store Analysis
Check each Zustand store for:
- State fields never read by any component
- Actions never called outside the store definition
- Entire stores with zero external imports

### 2. Component Analysis
Check for:
- Components imported but never rendered
- Props passed but never used
- Event handlers defined but never attached

### 3. Import Analysis
Use grep to find orphaned imports:
```powershell
# Find files that import something never used
Select-String -Pattern "import.*from" -Path "src/**/*.ts","webview-ui/src/**/*.tsx" | ForEach-Object { $_.Line }
```

### 4. Message Protocol Analysis
Check for:
- Message types defined but never sent
- Message handlers that never receive their command
- Response types that no component listens for

## Known Dead Code Patterns in JoltAPI

### After Sidebar Migration (Session 4)
- `uiStore.ts` — sidebar visibility/tab state (replaced by native VS Code sidebar)
- `historyStore.ts` — history entries stored but never displayed in webview
- Store members: `selectedCollectionId`, `selectedRequestId`, `selectCollection`, `selectRequest`, `removeRequestFromCollection`, `moveRequest` in collectionStore
- Store members: `setVariables`, `isEditing`, `setIsEditing` in variableStore
- Store members: `isLoading`, `activeResponseTab`, `setLoading`, `setActiveResponseTab`, `clearResponse` in responseStore
- Store member: `setProxy` in requestStore

### How to Verify Before Deleting
1. Grep for all references to the symbol
2. Check if it's used in JSX/TSX rendering
3. Check if it's called in event handlers
4. Check if it's part of a public API (re-exported from barrel)

## Safe Deletion Checklist
- [ ] No imports of the symbol outside its file
- [ ] No references in JSX/TSX
- [ ] No calls in event handlers or effects
- [ ] Not re-exported from barrel files
- [ ] Tests still pass after removal
- [ ] `npm run lint` passes

## Commands to Run After Cleanup
```bash
npm run lint          # TypeScript compilation
npm run test          # All tests
```
