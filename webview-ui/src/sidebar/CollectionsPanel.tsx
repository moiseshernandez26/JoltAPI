import React, { useState, useCallback, useEffect } from 'react';
import { useSidebarStore } from './sidebarStore';
import { useSendMessage } from '../hooks/useSendMessage';
import type { ICollection, IHttpRequest, ICollectionRequest } from '../types';

interface ContextMenu {
  x: number;
  y: number;
  type: 'collection' | 'request';
  collectionId: string;
  requestId?: string;
  isDefault?: boolean;
}

export const CollectionsPanel: React.FC = () => {
  const collections = useSidebarStore((s) => s.collections);
  const expandedCollections = useSidebarStore((s) => s.expandedCollections);
  const toggleCollection = useSidebarStore((s) => s.toggleCollection);
  const isLoading = useSidebarStore((s) => s.isLoading);
  const sendMessage = useSendMessage();
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [moveTarget, setMoveTarget] = useState<{ requestId: string; fromId: string } | null>(null);

  useEffect(() => {
    const close = (): void => { setContextMenu(null); setMoveTarget(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleOpenRequest = useCallback((cr: ICollectionRequest): void => {
    const req: IHttpRequest = { ...cr.request, name: cr.name };
    sendMessage({ command: 'openInPanel', payload: { request: req } });
  }, [sendMessage]);

  const handleDeleteRequest = useCallback((collectionId: string, requestId: string): void => {
    sendMessage({ command: 'deleteRequest', payload: { collectionId, requestId } });
  }, [sendMessage]);

  const handleRenameRequest = useCallback((collectionId: string, requestId: string, currentName: string): void => {
    const newName = window.prompt('Rename request:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      sendMessage({ command: 'renameRequest', payload: { collectionId, requestId, newName: newName.trim() } });
    }
  }, [sendMessage]);

  const handleDeleteCollection = useCallback((collectionId: string): void => {
    sendMessage({ command: 'deleteCollection', payload: { collectionId } });
  }, [sendMessage]);

  const handleMoveRequest = useCallback((fromId: string, requestId: string, toId: string): void => {
    sendMessage({ command: 'moveRequest', payload: { fromCollectionId: fromId, toCollectionId: toId, requestId } });
    setMoveTarget(null);
  }, [sendMessage]);

  const handleAddCollection = useCallback((): void => {
    if (!newName.trim()) { return; }
    const now = Date.now();
    const collection: ICollection = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      requests: [],
      createdAt: now,
      updatedAt: now,
    };
    sendMessage({ command: 'saveCollection', payload: { collection } });
    setNewName('');
    setAddCollectionOpen(false);
  }, [newName, sendMessage]);

  const onCollectionContext = useCallback((e: React.MouseEvent, collectionId: string, isDefault: boolean): void => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'collection', collectionId, isDefault });
  }, []);

  const onRequestContext = useCallback((e: React.MouseEvent, collectionId: string, requestId: string): void => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'request', collectionId, requestId });
  }, []);

  if (isLoading && collections.length === 0) {
    return <div style={styles.empty}>Loading...</div>;
  }

  const targets = moveTarget
    ? collections.filter((c) => c.id !== moveTarget.fromId)
    : [];

  return (
    <div>
      <div style={styles.header}>
        <button
          onClick={() => setAddCollectionOpen(!addCollectionOpen)}
          style={styles.addBtn}
          title="New Collection"
        >
          + New Collection
        </button>
        <button
          onClick={() => sendMessage({ command: 'loadCollections', payload: undefined })}
          style={styles.refreshBtn}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {addCollectionOpen && (
        <div style={styles.inlineForm}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { handleAddCollection(); } }}
            placeholder="Collection name"
            style={styles.inlineInput}
            autoFocus
          />
          <button onClick={handleAddCollection} style={styles.inlineBtn}>✓</button>
          <button onClick={() => setAddCollectionOpen(false)} style={styles.inlineBtn}>✗</button>
        </div>
      )}

      {collections.length === 0 && !isLoading && (
        <div style={styles.empty}>No collections yet. Click "+ New Collection" to create one.</div>
      )}

      {collections.map((collection) => {
        const isExpanded = expandedCollections.has(collection.id);
        const isDefault = collection.name === 'Default';

        return (
          <div key={collection.id}>
            <div
              style={{
                ...styles.collectionRow,
                ...(contextMenu?.collectionId === collection.id ? styles.selectedRow : {}),
              }}
              onClick={() => toggleCollection(collection.id)}
              onContextMenu={(e) => onCollectionContext(e, collection.id, isDefault)}
            >
              <span style={styles.chevron}>{isExpanded ? '▾' : '▸'}</span>
              <span style={styles.folderIcon}>📁</span>
              <span style={styles.collectionName}>{collection.name}</span>
              <span style={styles.count}>({collection.requests.length})</span>
            </div>

            {isExpanded && collection.requests.map((cr) => (
              <div
                key={cr.id}
                style={{
                  ...styles.requestRow,
                  ...(contextMenu?.requestId === cr.id ? styles.selectedRow : {}),
                }}
                onClick={() => handleOpenRequest(cr)}
                onContextMenu={(e) => onRequestContext(e, collection.id, cr.id)}
                title={`${cr.request.method} ${cr.request.url}`}
              >
                <span style={{ ...styles.methodBadge, color: getMethodColor(cr.request.method) }}>
                  {cr.request.method}
                </span>
                <span style={styles.requestName}>{cr.name}</span>
              </div>
            ))}

            {isExpanded && collection.requests.length === 0 && (
              <div style={styles.emptyRequests}>No saved requests</div>
            )}
          </div>
        );
      })}

      {contextMenu && (
        <div style={{ ...styles.contextMenu, left: contextMenu.x, top: contextMenu.y }}>
          {contextMenu.type === 'request' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const cr = collections
                    .find((c) => c.id === contextMenu.collectionId)
                    ?.requests.find((r) => r.id === contextMenu.requestId);
                  handleRenameRequest(contextMenu.collectionId, contextMenu.requestId!, cr?.name || '');
                  setContextMenu(null);
                }}
                style={styles.menuItem}
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveTarget({ requestId: contextMenu.requestId!, fromId: contextMenu.collectionId });
                  setContextMenu(null);
                }}
                style={styles.menuItem}
              >
                Move to...
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRequest(contextMenu.collectionId, contextMenu.requestId!);
                  setContextMenu(null);
                }}
                style={styles.menuItemDanger}
              >
                Delete Request
              </button>
            </>
          )}
          {contextMenu.type === 'collection' && !contextMenu.isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCollection(contextMenu.collectionId);
                setContextMenu(null);
              }}
              style={styles.menuItemDanger}
            >
              Delete Collection
            </button>
          )}
        </div>
      )}

      {moveTarget && targets.length > 0 && (
        <div style={styles.moveOverlay} onClick={() => setMoveTarget(null)}>
          <div style={styles.moveModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.moveTitle}>Move request to:</div>
            {targets.map((c) => (
              <button
                key={c.id}
                onClick={() => handleMoveRequest(moveTarget.fromId, moveTarget.requestId, c.id)}
                style={styles.moveItem}
              >
                📁 {c.name}
              </button>
            ))}
            <button onClick={() => setMoveTarget(null)} style={styles.moveCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#61affe', POST: '#49cc90', PUT: '#fca130',
    PATCH: '#50e3c2', DELETE: '#f93e3e', HEAD: '#9012fe',
    OPTIONS: '#0d5aa7',
  };
  return colors[method] ?? '#888';
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex', padding: '4px 8px', gap: '4px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  addBtn: {
    flex: 1, padding: '4px 8px', fontSize: '11px',
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none', borderRadius: '2px', cursor: 'pointer',
  },
  refreshBtn: {
    padding: '4px 8px', background: 'none', border: 'none',
    color: 'var(--vscode-sideBarTitle-foreground)', cursor: 'pointer', fontSize: '14px',
  },
  inlineForm: { display: 'flex', padding: '4px 8px', gap: '4px' },
  inlineInput: {
    flex: 1, padding: '3px 6px', fontSize: '11px',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)', borderRadius: '2px',
  },
  inlineBtn: {
    padding: '3px 6px', background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '11px',
  },
  collectionRow: {
    display: 'flex', alignItems: 'center', padding: '3px 8px',
    cursor: 'pointer', gap: '2px', userSelect: 'none',
  },
  selectedRow: { background: 'var(--vscode-list-activeSelectionBackground)' },
  chevron: { fontSize: '10px', width: '12px', color: 'var(--vscode-sideBarTitle-foreground)' },
  folderIcon: { fontSize: '12px' },
  collectionName: {
    fontWeight: 600, fontSize: '11px', flex: 1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  count: { fontSize: '10px', color: 'var(--vscode-descriptionForeground)' },
  requestRow: {
    display: 'flex', alignItems: 'center', padding: '2px 8px 2px 28px',
    cursor: 'pointer', gap: '6px', userSelect: 'none',
  },
  methodBadge: { fontSize: '10px', fontWeight: 700, minWidth: '36px', flexShrink: 0 },
  requestName: {
    fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  contextMenu: {
    position: 'fixed', zIndex: 1000,
    background: 'var(--vscode-menu-background)',
    border: '1px solid var(--vscode-menu-border)',
    borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    minWidth: '130px', padding: '4px 0',
  },
  menuItem: {
    display: 'block', width: '100%', padding: '4px 12px', fontSize: '11px',
    border: 'none', background: 'none',
    color: 'var(--vscode-menu-foreground)',
    cursor: 'pointer', textAlign: 'left' as const,
  },
  menuItemDanger: {
    display: 'block', width: '100%', padding: '4px 12px', fontSize: '11px',
    border: 'none', background: 'none',
    color: 'var(--vscode-notificationsErrorIcon-foreground, #f14c4c)',
    cursor: 'pointer', textAlign: 'left' as const,
  },
  moveOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
  },
  moveModal: {
    background: 'var(--vscode-menu-background)',
    border: '1px solid var(--vscode-menu-border)',
    borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    minWidth: '160px', maxWidth: '220px',
    maxHeight: '60vh', overflow: 'auto', padding: '8px 0',
  },
  moveTitle: {
    padding: '4px 12px 8px', fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
    borderBottom: '1px solid var(--vscode-panel-border)',
    marginBottom: '4px',
  },
  moveItem: {
    display: 'block', width: '100%', padding: '6px 12px', fontSize: '11px',
    border: 'none', background: 'none',
    color: 'var(--vscode-menu-foreground)',
    cursor: 'pointer', textAlign: 'left' as const,
  },
  moveCancel: {
    display: 'block', width: '100%', padding: '6px 12px', fontSize: '11px',
    border: 'none', background: 'none',
    color: 'var(--vscode-descriptionForeground)',
    cursor: 'pointer', textAlign: 'left' as const,
    borderTop: '1px solid var(--vscode-panel-border)', marginTop: '4px', paddingTop: '8px',
  },
  empty: {
    padding: '12px 8px', fontSize: '11px',
    color: 'var(--vscode-descriptionForeground)', textAlign: 'center' as const,
  },
  emptyRequests: {
    padding: '2px 8px 2px 28px', fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)', fontStyle: 'italic',
  },
};
