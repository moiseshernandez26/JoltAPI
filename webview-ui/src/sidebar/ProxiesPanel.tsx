import React, { useState } from 'react';
import { useSidebarStore } from './sidebarStore';
import { useSendMessage } from '../hooks/useSendMessage';
import { ProxyForm } from './ProxyForm';
import type { IProxyProfile } from '../types';

/**
 * Saved proxies, shared by every request. A request picks one by name in its Proxy tab —
 * editing a proxy here changes it for all requests that reference it.
 */
export const ProxiesPanel: React.FC = () => {
  const proxies = useSidebarStore((s) => s.proxies);
  const sendMessage = useSendMessage();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /**
   * Every mutation rewrites the whole list, so it must start from the store's CURRENT
   * value — not the `proxies` captured by this render. Two deletes clicked before the
   * host's `proxiesLoaded` broadcast lands would otherwise both build off the same stale
   * array and the second write would resurrect what the first one removed.
   */
  const save = (mutate: (current: IProxyProfile[]) => IProxyProfile[]): void => {
    const profiles = mutate(useSidebarStore.getState().proxies);
    // Keep the local list in step immediately; the broadcast confirms it moments later.
    useSidebarStore.getState().setProxies(profiles);
    sendMessage({ command: 'saveProxies', payload: { proxies: { profiles } } });
  };

  const handleAdd = (profile: IProxyProfile): void => {
    save((current) => [...current, profile]);
    setAddOpen(false);
  };

  const handleUpdate = (profile: IProxyProfile): void => {
    save((current) => current.map((p) => (p.id === profile.id ? profile : p)));
    setEditingId(null);
  };

  const handleDelete = (id: string): void => {
    save((current) => current.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div style={styles.header}>
        <button onClick={() => { setAddOpen(!addOpen); setEditingId(null); }} style={styles.addBtn}>
          + Add Proxy
        </button>
        <button
          onClick={() => sendMessage({ command: 'loadProxies', payload: undefined })}
          style={styles.refreshBtn}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div style={styles.warning}>
        ⚠ Proxy credentials are stored in plain text in <code>.joltapi/proxies.json</code>. Do not
        store production credentials here.
      </div>

      {addOpen && <ProxyForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />}

      {proxies.length === 0 && !addOpen && (
        <div style={styles.empty}>
          No proxies yet. Add one here, then pick it from the Proxy tab of any request.
        </div>
      )}

      {proxies.map((p) =>
        editingId === p.id ? (
          <ProxyForm
            key={p.id}
            initial={p}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={p.id} style={styles.row}>
            <div
              style={styles.info}
              onClick={() => { setEditingId(p.id); setAddOpen(false); }}
              title="Click to edit"
            >
              <span style={styles.name}>{p.name}</span>
              <span style={styles.address}>{p.host}:{p.port}</span>
              {p.auth?.username && <span style={styles.authBadge}>auth</span>}
            </div>
            <button onClick={() => handleDelete(p.id)} style={styles.deleteBtn} title="Delete">
              ✕
            </button>
          </div>
        ),
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    padding: '4px 8px',
    gap: '4px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  addBtn: {
    flex: 1,
    padding: '4px 8px',
    fontSize: '11px',
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '4px 8px',
    background: 'none',
    border: 'none',
    color: 'var(--vscode-sideBarTitle-foreground)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  warning: {
    padding: '6px 8px',
    fontSize: '9px',
    color: 'var(--vscode-descriptionForeground)',
    borderBottom: '1px solid var(--vscode-panel-border)',
    lineHeight: 1.4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 8px',
    gap: '4px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  name: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#9cdcfe',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  address: {
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  authBadge: {
    fontSize: '8px',
    padding: '1px 4px',
    borderRadius: '2px',
    color: 'var(--vscode-descriptionForeground)',
    border: '1px solid var(--vscode-panel-border)',
    flexShrink: 0,
  },
  deleteBtn: {
    padding: '0 3px',
    background: 'none',
    border: 'none',
    color: 'var(--vscode-descriptionForeground)',
    cursor: 'pointer',
    fontSize: '10px',
    flexShrink: 0,
  },
  empty: {
    padding: '12px 8px',
    fontSize: '11px',
    color: 'var(--vscode-descriptionForeground)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
};
