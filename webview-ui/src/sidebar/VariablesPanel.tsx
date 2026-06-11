import React, { useState } from 'react';
import { useSidebarStore } from './sidebarStore';
import { useSendMessage } from '../hooks/useSendMessage';
import type { IVariable, IVariableSet } from '../types';

export const VariablesPanel: React.FC = () => {
  const variables = useSidebarStore((s) => s.variables);
  const sendMessage = useSendMessage();
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  const handleAdd = (): void => {
    if (!newKey.trim()) { return; }
    const updated: IVariable[] = [
      ...variables,
      {
        id: crypto.randomUUID(),
        key: newKey.trim(),
        value: newValue,
        enabled: true,
      },
    ];
    saveAndRefresh(updated);
    setNewKey('');
    setNewValue('');
    setAddOpen(false);
  };

  const handleToggle = (id: string): void => {
    const updated = variables.map((v) =>
      v.id === id ? { ...v, enabled: !v.enabled } : v,
    );
    saveAndRefresh(updated);
  };

  const handleDelete = (id: string): void => {
    const updated = variables.filter((v) => v.id !== id);
    saveAndRefresh(updated);
  };

  const handleStartEdit = (v: IVariable): void => {
    setEditingId(v.id);
    setEditKey(v.key);
    setEditValue(v.value);
  };

  const handleSaveEdit = (): void => {
    if (!editKey.trim() || !editingId) { return; }
    const updated = variables.map((v) =>
      v.id === editingId ? { ...v, key: editKey.trim(), value: editValue } : v,
    );
    saveAndRefresh(updated);
    setEditingId(null);
  };

  const saveAndRefresh = (vars: IVariable[]): void => {
    const variableSet: IVariableSet = { variables: vars };
    sendMessage({ command: 'saveVariables', payload: { variables: variableSet } });
  };

  const enabledVars = variables.filter((v) => v.enabled);
  const disabledVars = variables.filter((v) => !v.enabled);

  return (
    <div>
      <div style={styles.header}>
        <button
          onClick={() => setAddOpen(!addOpen)}
          style={styles.addBtn}
        >
          + Add Variable
        </button>
        <button
          onClick={() => sendMessage({ command: 'loadVariables', payload: undefined })}
          style={styles.refreshBtn}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div style={styles.warning}>
        ⚠ Variables are stored in plain text on disk. Do not store production credentials here.
      </div>

      {addOpen && (
        <div style={styles.addForm}>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { handleAdd(); } }}
            placeholder="Variable name"
            style={styles.input}
            autoFocus
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { handleAdd(); } }}
            placeholder="Value"
            style={styles.input}
          />
          <div style={styles.formActions}>
            <button onClick={handleAdd} style={styles.smallBtn}>✓</button>
            <button onClick={() => { setAddOpen(false); setNewKey(''); setNewValue(''); }} style={styles.smallBtn}>✗</button>
          </div>
        </div>
      )}

      {variables.length === 0 && (
        <div style={styles.empty}>No variables. Use {'{{'}variable{'}}'} in your URLs, headers, and body.</div>
      )}

      {[...enabledVars, ...disabledVars].map((v) => (
        <div key={v.id} style={{
          ...styles.varRow,
          opacity: v.enabled ? 1 : 0.5,
        }}>
          {editingId === v.id ? (
            <div style={styles.editForm}>
              <input
                type="text"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleSaveEdit(); } }}
                style={styles.inputSm}
                autoFocus
              />
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleSaveEdit(); } }}
                style={styles.inputSm}
              />
              <button onClick={handleSaveEdit} style={styles.smallBtn}>✓</button>
              <button onClick={() => setEditingId(null)} style={styles.smallBtn}>✗</button>
            </div>
          ) : (
            <>
              <div
                style={styles.varInfo}
                onClick={() => handleStartEdit(v)}
                title="Click to edit"
              >
                <span
                  style={styles.toggle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(v.id);
                  }}
                  title={v.enabled ? 'Disable' : 'Enable'}
                >
                  {v.enabled ? '●' : '○'}
                </span>
                <span style={styles.varKey}>{v.key}</span>
                <span style={styles.varValue}>{maskValue(v.value)}</span>
              </div>
              <button
                onClick={() => handleDelete(v.id)}
                style={styles.deleteBtn}
                title="Delete"
              >
                ✕
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

function maskValue(value: string): string {
  if (!value) { return ''; }
  if (value.length <= 8) { return '*'.repeat(value.length); }
  return value.slice(0, 3) + '*'.repeat(Math.min(value.length - 3, 6));
}

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
  addForm: {
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  input: {
    padding: '3px 6px',
    fontSize: '11px',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
  },
  formActions: {
    display: 'flex',
    gap: '4px',
  },
  smallBtn: {
    padding: '2px 6px',
    fontSize: '11px',
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  editForm: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    flex: 1,
  },
  inputSm: {
    flex: 1,
    padding: '2px 4px',
    fontSize: '10px',
    minWidth: 0,
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
  },
  varRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    gap: '4px',
  },
  varInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  toggle: {
    fontSize: '8px',
    cursor: 'pointer',
    flexShrink: 0,
    color: 'var(--vscode-textLink-foreground)',
  },
  varKey: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#9cdcfe',
    flexShrink: 0,
  },
  varValue: {
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
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
    textAlign: 'center' as const,
  },
};
