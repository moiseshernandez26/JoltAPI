import React, { useState } from 'react';
import { useCollectionStore, useRequestStore } from '../store';
import { useSendMessage } from '../hooks';
import { generateRequestName } from '../utils/requestUtils';
import type { ICollectionRequest } from '../types';

interface SaveRequestDialogProps {
  onClose: () => void;
}

export const SaveRequestDialog: React.FC<SaveRequestDialogProps> = ({ onClose }) => {
  const collections = useCollectionStore((s) => s.collections);
  const currentRequest = useRequestStore((s) => s.currentRequest);
  const addRequestToCollection = useCollectionStore((s) => s.addRequestToCollection);
  const sendMessage = useSendMessage();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    collections.length > 0 ? collections[0].id : '',
  );
  const [requestName, setRequestName] = useState(() => {
    const generated = generateRequestName(currentRequest);
    return generated || 'Untitled Request';
  });

  const handleSave = (): void => {
    if (!selectedCollectionId) {return;}
    const collection = collections.find((c) => c.id === selectedCollectionId);
    if (!collection) {return;}

    const now = Date.now();
    const requestToSave: ICollectionRequest = {
      id: crypto.randomUUID(),
      name: requestName.trim() || 'Untitled Request',
      request: { ...currentRequest },
      createdAt: now,
      updatedAt: now,
    };

    sendMessage({
      command: 'saveRequest',
      payload: { collectionId: selectedCollectionId, request: requestToSave },
    });

    addRequestToCollection(selectedCollectionId, requestToSave);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>Save Request</h3>

        <label style={styles.label}>Request Name</label>
        <input
          type="text"
          value={requestName}
          onChange={(e) => setRequestName(e.target.value)}
          style={styles.input}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {handleSave();}
            if (e.key === 'Escape') {onClose();}
          }}
        />

        <label style={styles.label}>Collection</label>
        <select
          value={selectedCollectionId}
          onChange={(e) => setSelectedCollectionId(e.target.value)}
          style={styles.select}
        >
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {collections.length === 0 && (
          <p style={styles.hint}>No collections yet. Create one in the Collections tab first.</p>
        )}

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!selectedCollectionId || collections.length === 0}
            style={styles.saveBtn}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  dialog: {
    backgroundColor: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '4px',
    padding: '20px',
    minWidth: '320px',
    maxWidth: '400px',
  },
  title: {
    fontSize: '14px', fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
    marginBottom: '16px',
  },
  label: {
    display: 'block', fontSize: '11px', fontWeight: 'bold',
    color: 'var(--vscode-descriptionForeground)',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  input: {
    width: '100%', padding: '6px 8px', marginBottom: '12px',
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px', fontSize: '13px',
  },
  select: {
    width: '100%', padding: '6px 8px', marginBottom: '12px',
    backgroundColor: 'var(--vscode-dropdown-background)',
    color: 'var(--vscode-dropdown-foreground)',
    border: '1px solid var(--vscode-dropdown-border)',
    borderRadius: '2px', fontSize: '13px',
  },
  hint: {
    fontSize: '11px', color: 'var(--vscode-errorForeground)',
    fontStyle: 'italic', marginBottom: '12px',
  },
  actions: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px',
  },
  cancelBtn: {
    padding: '6px 16px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px',
  },
  saveBtn: {
    padding: '6px 16px',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px',
    fontWeight: 'bold',
  },
};